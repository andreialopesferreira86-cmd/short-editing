# 🎬 video-agent — shorts editados pelo Claude Code

Grava, larga o ficheiro numa pasta, escreve um comando — recebes o short pronto,
as legendas `.srt` e o texto da publicação.

## Instalar (uma vez)

1. **Claude Code** aberto nesta pasta do projeto.
2. **ffmpeg**
   - macOS: `brew install ffmpeg`
   - Windows: `winget install ffmpeg`
   - Linux: `sudo apt install ffmpeg`
3. **Python 3.9+** e as dependências:
   ```bash
   pip install -r video-agent/requirements.txt
   ```

## Usar

1. **`/voice`** — personaliza o visual padrão (7 perguntas rápidas: aparência, cor,
   fontes, legendas, ritmo, chamada para ação do Instagram, os logótipos reais das
   tuas ferramentas — vistos sobre as tuas próprias filmagens). ~15 min, uma única vez.
2. **Grava um take** (telemóvel, webcam, câmara) e larga-o em `video-agent/takes/`.
3. **`/short-editing`** — recebes:
   - `video-agent/edits/short-<slug>/output/short-<slug>.mp4` (aberto automaticamente)
   - `short-<slug>.srt` (legendas)
   - `post.md` (texto da publicação)

Não sabes qual usar? Escreve **`/editing <o que queres>`** e ele escolhe.

## O que o `/short-editing` faz

| Passo | Como |
|---|---|
| Transcreve | Whisper (faster-whisper), tempo de cada palavra, no teu computador |
| Revê | Claude corrige nomes/marcas (Glossário do voice.md) e marca hesitações/repetições para cortar |
| Corta | silêncios e palavras marcadas; zoom alternado entre cortes |
| Enquadra | 1080×1920, ecrã cheio ou fundo desfocado |
| Legenda | 1–N palavras, palavra dita em destaque, a tua fonte e cores |
| Logótipos | marca num canto; logótipo da ferramenta no topo quando a dizes |
| CTA | cartão final com o teu @ do Instagram |
| Som | volume normalizado para as redes (-14 LUFS) |

Corrigir depois: edita `edits/short-<slug>/transcript.json` (texto `w`, ou `"del": true`
para cortar) e corre `python3 video-agent/scripts/short.py render --slug <slug>`.

## Pastas

```
video-agent/
├── voice.md          ← o teu estilo (criado pelo /voice)
├── takes/            ← larga aqui as gravações (não vão para o GitHub)
├── edits/            ← resultados (os .mp4 não vão para o GitHub; .srt e textos sim)
├── brand/logo.png    ← o teu logótipo
├── brand/tools/      ← logótipos das ferramentas (PNG transparente)
├── fonts/            ← fontes .ttf (ex.: Montserrat do Google Fonts)
└── scripts/short.py  ← o motor (ffmpeg + whisper)
```
