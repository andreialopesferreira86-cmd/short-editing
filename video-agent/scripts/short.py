#!/usr/bin/env python3
"""Agente de edição de shorts.

Subcomandos:
  transcribe <take> [--slug S]   transcreve com marcação de tempo por palavra
  render --slug S                corta, enquadra 9:16, legenda, logotipos, CTA -> mp4 + srt
  preview <take> [--t 3]         imagem de pré-visualização do estilo atual (voice.md)

Tudo é configurado em video-agent/voice.md (bloco ```yaml).
"""
from __future__ import annotations

import argparse
import copy
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]          # video-agent/
EDITS = ROOT / 'edits'
FONTS = ROOT / 'fonts'
W, H = 1080, 1920

DEFAULTS = {
    'aparencia': {'enquadramento': 'preencher', 'zoom_alternado': 1.0, 'fps': 30},
    'cores': {'texto': '#FFFFFF', 'destaque': '#FFD400', 'contorno': '#000000', 'fundo_cta': '#FF3D6E'},
    'fontes': {'legendas': 'Arial Black', 'cta': 'Arial Black'},
    'legendas': {'palavras': 3, 'maiusculas': True, 'destacar_palavra': True, 'tamanho': 86,
                 'contorno': 6, 'estilo': 'contorno', 'posicao': 0.68},
    'ritmo': {'cortar_silencios': True, 'silencio_max': 0.35, 'margem': 0.08, 'velocidade': 1.0},
    'som': {'normalizar': True},
    'cta': {'ativo': False, 'texto': '', 'opcoes': [], 'instagram': '', 'duracao': 2.5, 'posicao': 0.42},
    'ritmos': {},
    'logotipos': {
        'marca': {'ficheiro': '', 'canto': 'inferior-direito', 'tamanho': 0.14, 'opacidade': 0.9, 'margem': 0.04,
                  'margem_vertical': None},
        'ferramentas': {'tamanho': 0.22, 'duracao': 2.0, 'lista': []},
    },
}


# ---------------------------------------------------------------- utilidades
def die(msg: str) -> None:
    print(f'❌ {msg}', file=sys.stderr)
    sys.exit(1)


def merge(base: dict, over: dict) -> dict:
    out = copy.deepcopy(base)
    for k, v in (over or {}).items():
        out[k] = merge(out[k], v) if isinstance(v, dict) and isinstance(out.get(k), dict) else v
    return out


def load_voice() -> dict:
    import yaml
    path = ROOT / 'voice.md'
    if not path.exists():
        return copy.deepcopy(DEFAULTS)
    m = re.search(r'```yaml\n(.*?)```', path.read_text(encoding='utf-8'), re.S)
    return merge(DEFAULTS, yaml.safe_load(m.group(1)) if m else {})


def slugify(s: str) -> str:
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    s = re.sub(r'[^a-zA-Z0-9]+', '-', s).strip('-').lower()
    return s[:50] or 'video'


def norm_word(w: str) -> str:
    w = unicodedata.normalize('NFKD', w).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '', w)


def run(cmd: list[str], cwd: Path | None = None) -> None:
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-3000:], file=sys.stderr)
        die('o ffmpeg falhou (ver erro acima)')


def probe(path: Path) -> dict:
    r = subprocess.run(['ffprobe', '-v', 'error', '-print_format', 'json', '-show_streams',
                        '-show_format', str(path)], capture_output=True, text=True)
    if r.returncode != 0:
        die(f'não consegui ler o vídeo {path}')
    info = json.loads(r.stdout)
    v = next((s for s in info['streams'] if s['codec_type'] == 'video'), None)
    if not v:
        die('o ficheiro não tem vídeo')
    w, h = int(v['width']), int(v['height'])
    rot = int(v.get('tags', {}).get('rotate', 0) or 0)
    for sd in v.get('side_data_list', []):
        if 'rotation' in sd:
            rot = int(sd['rotation'])
    if abs(rot) % 180 == 90:               # vídeos de telemóvel gravados na vertical
        w, h = h, w
    return {
        'w': w, 'h': h,
        'dur': float(info['format'].get('duration') or v.get('duration') or 0),
        'audio': any(s['codec_type'] == 'audio' for s in info['streams']),
    }


def ass_color(hex_: str, alpha: int = 0) -> str:
    h = hex_.lstrip('#')
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f'&H{alpha:02X}{b}{g}{r}'.upper()


def ass_time(t: float) -> str:
    t = max(0.0, t)
    cs = int(round(t * 100))
    return f'{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}'


def srt_time(t: float) -> str:
    ms = int(round(max(0.0, t) * 1000))
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


def ass_escape(s: str) -> str:
    return s.replace('\\', '').replace('{', '(').replace('}', ')').replace('\n', ' ')


# ---------------------------------------------------------------- transcrição
def cmd_transcribe(a) -> None:
    take = Path(a.take).resolve()
    if not take.exists():
        die(f'não encontrei {take}')
    slug = a.slug or slugify(take.stem)
    work = EDITS / f'short-{slug}'
    work.mkdir(parents=True, exist_ok=True)
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        die('falta instalar: pip install -r video-agent/requirements.txt')
    print(f'🎙️  A transcrever {take.name} (modelo {a.model})…')
    model = WhisperModel(a.model, device='auto', compute_type='int8')
    segs, info = model.transcribe(str(take), language=a.language or None,
                                  word_timestamps=True, vad_filter=True)
    words = [{'w': w.word.strip(), 's': round(w.start, 3), 'e': round(w.end, 3)}
             for seg in segs for w in (seg.words or []) if w.word.strip()]
    data = {
        'take': str(take),
        'language': info.language,
        'nota': 'Corrija "w" se a palavra estiver errada. Ponha "del": true para cortar a palavra do vídeo.',
        'words': words,
    }
    (work / 'transcript.json').write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
    (work / 'texto.txt').write_text(' '.join(w['w'] for w in words), encoding='utf-8')
    print(f'✅ {len(words)} palavras → {work / "transcript.json"}')
    print(f'SLUG={slug}')


# ---------------------------------------------------------------- planeamento
def plan_segments(words: list[dict], dur: float, cfg: dict) -> list[tuple[float, float]]:
    r = cfg['ritmo']
    has_del = any(w.get('del') for w in words)
    if not r['cortar_silencios'] and not has_del:
        return [(0.0, dur)]
    margin, gap_max = float(r['margem']), float(r['silencio_max'])
    segs: list[list[float]] = []
    prev_kept = None
    cut_pending = False
    for w in words:
        if w.get('del'):
            cut_pending = True
            continue
        s, e = float(w['s']), float(w['e'])
        if prev_kept is None:
            segs.append([s - margin, e + margin])
        elif cut_pending or (r['cortar_silencios'] and s - prev_kept['e'] > gap_max):
            segs.append([s - margin, e + margin])
        else:
            segs[-1][1] = e + margin
        prev_kept, cut_pending = w, False
    out: list[list[float]] = []
    for s, e in segs:
        s, e = max(0.0, s), min(dur, e)
        if out and s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        elif e - s > 0.05:
            out.append([s, e])
    return [(round(s, 3), round(e, 3)) for s, e in out] or [(0.0, dur)]


def remap_words(words: list[dict], segs: list[tuple[float, float]], speed: float) -> list[dict]:
    out, offset = [], 0.0
    for i, (ss, se) in enumerate(segs):
        for w in words:
            if w.get('del'):
                continue
            mid = (w['s'] + w['e']) / 2
            if ss <= mid <= se:
                out.append({'w': w['w'], 'seg': i,
                            's': (offset + max(w['s'], ss) - ss) / speed,
                            'e': (offset + min(w['e'], se) - ss) / speed})
        offset += se - ss
    return out


def group_words(words: list[dict], n: int) -> list[list[dict]]:
    groups: list[list[dict]] = []
    cur: list[dict] = []
    for w in words:
        if cur and (len(cur) >= n or w['seg'] != cur[-1]['seg'] or w['s'] - cur[-1]['e'] > 0.6):
            groups.append(cur)
            cur = []
        cur.append(w)
        if re.search(r'[.!?…]$', w['w']):
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    return groups


def group_times(groups: list[list[dict]]) -> list[tuple[float, float]]:
    times = []
    for i, g in enumerate(groups):
        s, e = g[0]['s'], g[-1]['e']
        if i + 1 < len(groups) and groups[i + 1][0]['s'] - e < 0.4:
            e = groups[i + 1][0]['s']          # sem "piscar" entre legendas
        times.append((s, max(e, s + 0.2)))
    return times


# ---------------------------------------------------------------- legendas
def build_ass(groups, times, total: float, cfg: dict) -> str:
    L, C, F, cta = cfg['legendas'], cfg['cores'], cfg['fontes'], cfg['cta']
    box = L['estilo'] == 'caixa'
    margin_v = int(H * (1 - float(L['posicao'])))
    styles = [
        f"Style: Cap,{F['legendas']},{L['tamanho']},{ass_color(C['texto'])},{ass_color(C['destaque'])},"
        f"{ass_color(C['contorno'])},{ass_color('#000000', 0x60) if box else ass_color(C['contorno'], 0x80)},"
        f"-1,0,0,0,100,100,0,0,{3 if box else 1},{L['contorno']},{0 if box else 2},2,80,80,{margin_v},1",
        f"Style: CTA,{F['cta']},{int(L['tamanho'] * 0.9)},{ass_color('#FFFFFF')},{ass_color('#FFFFFF')},"
        f"{ass_color(C['fundo_cta'])},{ass_color(C['fundo_cta'])},-1,0,0,0,100,100,0,0,3,24,0,5,90,90,0,1",
    ]
    ev = []
    hl = ass_color(C['destaque'])
    up = (lambda s: s.upper()) if L['maiusculas'] else (lambda s: s)
    cap_end = total
    for g, (gs, ge) in zip(groups, times):
        if gs >= cap_end:
            continue
        ge = min(ge, cap_end)
        texts = [ass_escape(up(w['w'])) for w in g]
        if L['destacar_palavra'] and len(g) > 1:
            for j, w in enumerate(g):
                s = gs if j == 0 else w['s']
                e = g[j + 1]['s'] if j + 1 < len(g) else ge
                if e <= s:
                    continue
                parts = [f'{{\\c{hl}&}}{t}{{\\r}}' if k == j else t for k, t in enumerate(texts)]
                ev.append(f"Dialogue: 0,{ass_time(s)},{ass_time(min(e, ge))},Cap,,0,0,0,,{' '.join(parts)}")
        else:
            ev.append(f"Dialogue: 0,{ass_time(gs)},{ass_time(ge)},Cap,,0,0,0,,{' '.join(texts)}")
    if cta['ativo'] and cta['texto']:
        y = int(H * float(cta['posicao']))
        txt = ass_escape(cta['texto'])
        if cta.get('instagram'):
            txt += f"\\N{{\\fs{int(L['tamanho'] * 0.7)}\\c{hl}&}}{ass_escape(cta['instagram'])}"
        ev.append(f"Dialogue: 1,{ass_time(max(0, total - float(cta['duracao'])))},{ass_time(total + 1)},CTA,,0,0,0,,"
                  f"{{\\pos({W // 2},{y})\\fad(200,0)\\t(0,180,\\fscx108\\fscy108)\\t(180,320,\\fscx100\\fscy100)}}{txt}")
    return ('[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 0\n'
            'ScaledBorderAndShadow: yes\n\n[V4+ Styles]\n'
            'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, '
            'Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, '
            'Alignment, MarginL, MarginR, MarginV, Encoding\n' + '\n'.join(styles) +
            '\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n' +
            '\n'.join(ev) + '\n')


def build_srt(groups, times) -> str:
    out = []
    for i, (g, (s, e)) in enumerate(zip(groups, times), 1):
        out.append(f"{i}\n{srt_time(s)} --> {srt_time(e)}\n{' '.join(w['w'] for w in g)}\n")
    return '\n'.join(out)


def tool_windows(words: list[dict], cfg: dict) -> list[tuple[Path, float, float]]:
    T = cfg['logotipos']['ferramentas']
    out = []
    for tool in T.get('lista') or []:
        f = ROOT / tool.get('ficheiro', '')
        keys = {norm_word(k) for k in tool.get('palavras') or [tool.get('nome', '')]}
        if not f.is_file():
            continue
        wins: list[list[float]] = []
        for w in words:
            if norm_word(w['w']) in keys:
                s, e = w['s'], w['s'] + float(T['duracao'])
                if wins and s <= wins[-1][1]:
                    wins[-1][1] = e
                else:
                    wins.append([s, e])
        out += [(f, s, e) for s, e in wins]
    return out


# ---------------------------------------------------------------- render
def build_and_run(take: Path, info: dict, segs, words_remapped, cfg: dict, work: Path,
                  out_file: Path, still: bool = False) -> None:
    A, R = cfg['aparencia'], cfg['ritmo']
    speed = float(R['velocidade'] or 1.0)
    audio = info['audio'] and not still
    total = sum(e - s for s, e in segs) / speed

    groups = group_words(words_remapped, int(cfg['legendas']['palavras']))
    times = group_times(groups)
    (work / 'captions.ass').write_text(build_ass(groups, times, total, cfg), encoding='utf-8')
    if not still:
        (work / 'captions.srt').write_text(build_srt(groups, times), encoding='utf-8')

    inputs = ['-i', str(take)]
    f: list[str] = []
    z = float(A.get('zoom_alternado') or 1.0)
    cw, ch = int(info['w'] / z) // 2 * 2, int(info['h'] / z) // 2 * 2
    labels = []
    for i, (s, e) in enumerate(segs):
        zoom = f',crop={cw}:{ch},scale={info["w"]}:{info["h"]}' if z > 1.001 and i % 2 == 1 else ''
        f.append(f'[0:v]trim=start={s}:end={e},setpts=PTS-STARTPTS{zoom},setsar=1[v{i}]')
        labels.append(f'[v{i}]')
        if audio:
            f.append(f'[0:a]atrim=start={s}:end={e},asetpts=PTS-STARTPTS[a{i}]')
            labels.append(f'[a{i}]')
    f.append(f"{''.join(labels)}concat=n={len(segs)}:v=1:a={1 if audio else 0}[vc]{'[ac]' if audio else ''}")

    v = 'vc'
    if abs(speed - 1) > 0.001:
        f.append(f'[{v}]setpts=PTS/{speed}[vs]')
        v = 'vs'
    if A['enquadramento'] == 'desfocado':
        f.append(f'[{v}]split[bg0][fg0]')
        f.append(f'[bg0]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},'
                 f'gblur=sigma=40,eq=brightness=-0.12[bg]')
        f.append(f'[fg0]scale={W}:{H}:force_original_aspect_ratio=decrease[fg]')
        f.append(f'[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1,fps={A["fps"]}[vf]')
    else:
        f.append(f'[{v}]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},'
                 f'setsar=1,fps={A["fps"]}[vf]')
    v = 'vf'

    # logótipos de ferramentas (no topo, quando são ditas)
    n_in = 1
    T = cfg['logotipos']['ferramentas']
    tw = int(W * float(T['tamanho'])) // 2 * 2
    for k, (path, s, e) in enumerate(tool_windows(words_remapped, cfg)):
        inputs += ['-loop', '1', '-i', str(path)]
        f.append(f'[{n_in}:v]scale={tw}:-1,format=rgba[t{k}]')
        f.append(f"[{v}][t{k}]overlay=(W-w)/2:{int(H * 0.12)}:shortest=1:"
                 f"enable='between(t,{s:.2f},{e:.2f})'[vt{k}]")
        v = f'vt{k}'
        n_in += 1

    # logótipo da marca
    M = cfg['logotipos']['marca']
    logo = ROOT / M['ficheiro'] if M.get('ficheiro') else None
    if logo and logo.is_file():
        inputs += ['-loop', '1', '-i', str(logo)]
        lw = int(W * float(M['tamanho'])) // 2 * 2
        m = int(W * float(M['margem']))
        mv = int(H * float(M['margem_vertical'])) if M.get('margem_vertical') is not None else m
        x = '(W-w)/2' if 'centro' in M['canto'] else (f'W-w-{m}' if 'direito' in M['canto'] else str(m))
        y = f'H-h-{mv}' if 'inferior' in M['canto'] else str(mv)
        f.append(f"[{n_in}:v]scale={lw}:-1,format=rgba,colorchannelmixer=aa={float(M['opacidade'])}[lg]")
        f.append(f'[{v}][lg]overlay={x}:{y}:shortest=1[vl]')
        v = 'vl'
        n_in += 1

    FONTS.mkdir(exist_ok=True)
    fontsdir = Path(os.path.relpath(FONTS, work)).as_posix()
    f.append(f"[{v}]ass=captions.ass:fontsdir='{fontsdir}'[vout]")

    maps = ['-map', '[vout]']
    if audio:
        af = f'[ac]'
        chain = []
        if abs(speed - 1) > 0.001:
            chain.append(f'atempo={speed}')
        if cfg['som']['normalizar']:
            chain.append('loudnorm=I=-14:TP=-1.5:LRA=11')
        chain.append('aresample=48000')
        f.append(f"{af}{','.join(chain)}[aout]")
        maps += ['-map', '[aout]']

    (work / 'filter.txt').write_text(';\n'.join(f), encoding='utf-8')
    cmd = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', *inputs,
           '-filter_complex_script', 'filter.txt', *maps]
    if still:
        cmd += ['-ss', '0.4', '-frames:v', '1', '-update', '1', str(out_file)]
    else:
        cmd += ['-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
                '-r', str(A['fps'])]
        if audio:
            cmd += ['-c:a', 'aac', '-b:a', '160k']
        cmd += ['-movflags', '+faststart', '-t', f'{total:.3f}', str(out_file)]
    run(cmd, cwd=work)


def bottom_brightness(take: Path, info: dict, t0: float = 0.0, t1: float | None = None) -> float:
    """Brilho médio (0-255) da zona do logótipo (fundo, ao centro) ao longo do vídeo."""
    t1 = t1 if t1 is not None else info['dur']
    step = max(0.5, (t1 - t0) / 12)
    r = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t0:.2f}', '-t', f'{max(0.5, t1 - t0):.2f}', '-i', str(take),
                        '-vf', f'fps=1/{step:.2f},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},'
                               f'crop={W // 2}:{H // 6}:{W // 4}:{int(H * 0.72)},signalstats,'
                               'metadata=print:key=lavfi.signalstats.YAVG:file=-',
                        '-f', 'null', '-'], capture_output=True, text=True)
    vals = [float(x.split('=')[1]) for x in r.stdout.split() if x.startswith('lavfi.signalstats.YAVG=')]
    return sum(vals) / len(vals) if vals else 0.0


def auto_logo(cfg: dict, a, take: Path, info: dict, t0=0.0, t1=None) -> None:
    """Escolhe logótipo branco (vídeo escuro) ou preto (vídeo claro), se houver as duas variantes."""
    M = cfg['logotipos']['marca']
    var = M.get('variantes') or {}
    if getattr(a, 'logo', None) or not ('branco' in var and 'preto' in var):
        return
    y = bottom_brightness(take, info, t0, t1)
    escolha = 'preto' if y > 130 else 'branco'
    M['ficheiro'] = var[escolha]
    print(f'🏷️  logótipo {escolha} (brilho do fundo {y:.0f}/255)')


def apply_overrides(cfg: dict, a) -> dict:
    if getattr(a, 'ritmo', None):
        preset = (cfg.get('ritmos') or {}).get(a.ritmo)
        if not preset:
            die(f"ritmo '{a.ritmo}' não existe no voice.md (opções: {', '.join(cfg.get('ritmos') or {})})")
        cfg['ritmo'] = merge(cfg['ritmo'], preset)
    if getattr(a, 'logo', None):
        var = (cfg['logotipos']['marca'].get('variantes') or {}).get(a.logo)
        if not var:
            die(f"variante de logótipo '{a.logo}' não existe no voice.md")
        cfg['logotipos']['marca']['ficheiro'] = var
    if getattr(a, 'cta', None):
        cfg['cta']['texto'] = a.cta
        cfg['cta']['ativo'] = True
    return cfg


def cmd_render(a) -> None:
    cfg = apply_overrides(load_voice(), a)
    work = EDITS / f'short-{a.slug}'
    tj = work / 'transcript.json'
    if not tj.exists():
        die(f'não encontrei {tj}. Corra primeiro: short.py transcribe <take> --slug {a.slug}')
    data = json.loads(tj.read_text(encoding='utf-8'))
    take = Path(data['take'])
    if not take.exists():
        die(f'o take original não existe: {take}')
    info = probe(take)
    auto_logo(cfg, a, take, info)
    segs = plan_segments(data['words'], info['dur'], cfg)
    speed = float(cfg['ritmo']['velocidade'] or 1.0)
    words = remap_words(data['words'], segs, speed)
    out_dir = work / 'output'
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f'short-{a.slug}.mp4'
    total = sum(e - s for s, e in segs) / speed
    print(f"🎬 ritmo: silêncio>{cfg['ritmo']['silencio_max']}s, velocidade {cfg['ritmo']['velocidade']} · CTA: {cfg['cta']['texto'] if cfg['cta']['ativo'] else '—'}")
    print(f'🎬 {len(segs)} cortes · {info["dur"]:.1f}s → {total:.1f}s')
    build_and_run(take, info, segs, words, cfg, work, out)
    shutil.copy(work / 'captions.srt', out_dir / f'short-{a.slug}.srt')
    (work / 'cortes.json').write_text(json.dumps(segs), encoding='utf-8')
    (work / 'meta.json').write_text(json.dumps({
        'cta': cfg['cta']['texto'] if cfg['cta']['ativo'] else None,
        'ritmo': getattr(a, 'ritmo', None) or 'normal',
        'logo': cfg['logotipos']['marca'].get('ficheiro'),
        'duracao_original': round(info['dur'], 2), 'duracao_final': round(total, 2), 'cortes': len(segs),
    }, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'✅ {out}')
    print(f'✅ {out_dir / f"short-{a.slug}.srt"}')


def cmd_preview(a) -> None:
    cfg = apply_overrides(load_voice(), a)
    take = Path(a.take).resolve()
    info = probe(take)
    t = min(float(a.t), max(0.0, info['dur'] - 0.2))
    auto_logo(cfg, a, take, info, t, t + 1.0)
    work = EDITS / '_preview'
    work.mkdir(parents=True, exist_ok=True)
    sample = (a.text or 'Assim ficam as tuas legendas').split()
    n = int(cfg['legendas']['palavras'])
    words = [{'w': w, 's': 0.0 if i < n else 99, 'e': 0.0 if i < n else 99, 'seg': 0}
             for i, w in enumerate(sample)]
    # primeira palavra "a ser dita" para mostrar o destaque
    for i, w in enumerate(words[:n]):
        w['s'] = w['e'] = 0.0 if i == 0 else 0.45
    cfg['cta']['ativo'] = a.cta is not None
    if a.cta is not None:
        cfg['cta']['duracao'] = 10
        words = []
    if a.tool:
        words.append({'w': a.tool, 's': 0.0, 'e': 0.01, 'seg': 0})
    cfg['som']['normalizar'] = False
    out = work / (a.out or 'preview.png')
    build_and_run(take, info, [(t, t + 1.0)], words, cfg, work, out, still=True)
    print(f'✅ {out}')


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest='cmd', required=True)
    t = sub.add_parser('transcribe')
    t.add_argument('take')
    t.add_argument('--slug')
    t.add_argument('--model', default='small', help='tiny | base | small | medium | large-v3')
    t.add_argument('--language', default='pt')
    r = sub.add_parser('render')
    r.add_argument('--slug', required=True)
    r.add_argument('--ritmo', help='nome de um ritmo do voice.md (ex.: rapido, normal)')
    r.add_argument('--logo', help='variante do logótipo (ex.: branco, preto)')
    r.add_argument('--cta', help='texto do CTA só para este vídeo (ex.: uma das cta.opcoes)')
    v = sub.add_parser('preview')
    v.add_argument('take')
    v.add_argument('--t', default=3.0, type=float, help='segundo do vídeo a usar')
    v.add_argument('--text', help='texto de exemplo da legenda')
    v.add_argument('--cta', nargs='?', const='', default=None, help='mostrar o CTA (opcional: texto)')
    v.add_argument('--logo', help='variante do logótipo (ex.: branco, preto)')
    v.add_argument('--tool', help='palavra de uma ferramenta para mostrar o seu logótipo')
    v.add_argument('--out')
    a = p.parse_args()
    {'transcribe': cmd_transcribe, 'render': cmd_render, 'preview': cmd_preview}[a.cmd](a)


if __name__ == '__main__':
    main()
