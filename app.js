'use strict';

const $ = (id) => document.getElementById(id);
const video = $('video');
const canvas = $('canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// Biblioteca que corre o modelo Whisper no navegador (carregada só quando é precisa)
const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2';

const state = {
  file: null,
  loaded: false,
  start: 0,
  end: 0,
  fit: 'cover',
  zoom: 1,
  posX: 0.5,
  posY: 0.5,
  captions: [],
  capStyle: { size: 72, color: '#ffffff', box: 'outline' },
  logo: null, // { img, corner, size, opacity, margin }
  exporting: false,
  previewEnd: null, // fim do trecho ao ouvir uma legenda
};

let audioCtx = null;
let audioDest = null;

// ---------- Utilidades ----------
const fmt = (s) => {
  s = Math.max(0, s || 0);
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const round1 = (v) => Math.round(v * 10) / 10;
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignorar */ } },
};

// ---------- Carregar vídeo ----------
$('fileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (video.src) URL.revokeObjectURL(video.src);
  state.file = file;
  video.src = URL.createObjectURL(file);
  $('fileInfo').textContent = `A carregar “${file.name}”…`;
});

video.addEventListener('loadedmetadata', () => {
  state.loaded = true;
  state.start = 0;
  state.end = video.duration;
  $('trimStart').value = 0;
  $('trimEnd').value = video.duration.toFixed(1);
  $('trimStart').max = $('trimEnd').max = video.duration;
  $('seek').max = video.duration;
  ['seek', 'btnPlay', 'btnExport', 'btnAsr'].forEach((id) => ($(id).disabled = false));
  $('fileInfo').textContent =
    `${video.videoWidth}×${video.videoHeight} · ${video.duration.toFixed(1)} s`;
  updateDuration();
  video.currentTime = 0;
});

video.addEventListener('error', () => {
  $('fileInfo').textContent = 'Não foi possível abrir este vídeo. Tente um ficheiro MP4 ou WebM.';
});

// ---------- Reprodução ----------
function ensureAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const src = audioCtx.createMediaElementSource(video);
  audioDest = audioCtx.createMediaStreamDestination();
  src.connect(audioCtx.destination);
  src.connect(audioDest);
}

async function playFrom(t, until = null) {
  ensureAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume();
  state.previewEnd = until;
  video.currentTime = t;
  await video.play();
}

$('btnPlay').addEventListener('click', () => {
  if (state.exporting) return;
  if (video.paused) {
    const t = video.currentTime < state.start || video.currentTime >= state.end - 0.05
      ? state.start : video.currentTime;
    playFrom(t);
  } else {
    video.pause();
  }
});
video.addEventListener('play', () => ($('btnPlay').textContent = '⏸ Pausar'));
video.addEventListener('pause', () => ($('btnPlay').textContent = '▶ Reproduzir'));

$('seek').addEventListener('input', (e) => {
  video.currentTime = parseFloat(e.target.value);
});

// ---------- Corte ----------
function updateDuration() {
  $('duration').textContent =
    `Duração final: ${(state.end - state.start).toFixed(1).replace('.', ',')} s`;
}
function setTrim(start, end) {
  const d = video.duration || 0;
  start = clamp(start, 0, d);
  end = clamp(end, 0, d);
  if (end <= start) end = Math.min(d, start + 0.1);
  state.start = start;
  state.end = end;
  $('trimStart').value = start.toFixed(1);
  $('trimEnd').value = end.toFixed(1);
  updateDuration();
}
$('trimStart').addEventListener('change', (e) => setTrim(parseFloat(e.target.value) || 0, state.end));
$('trimEnd').addEventListener('change', (e) => setTrim(state.start, parseFloat(e.target.value) || 0));
$('setStart').addEventListener('click', () => setTrim(video.currentTime, state.end));
$('setEnd').addEventListener('click', () => setTrim(state.start, video.currentTime));

// ---------- Enquadramento ----------
$('fitMode').addEventListener('change', (e) => (state.fit = e.target.value));
$('zoom').addEventListener('input', (e) => (state.zoom = parseFloat(e.target.value)));
$('posX').addEventListener('input', (e) => (state.posX = parseFloat(e.target.value)));
$('posY').addEventListener('input', (e) => (state.posY = parseFloat(e.target.value)));

// ---------- Legendas: lista para rever / editar / apagar ----------
function newCaption(data = {}) {
  const t = video.currentTime || 0;
  return {
    text: data.text ?? '',
    start: data.start ?? round1(t),
    end: data.end ?? round1(Math.min(t + 2, video.duration || t + 2)),
    pos: data.pos ?? 'bottom',
    el: null,
  };
}

function renderCaptionList() {
  state.captions.sort((a, b) => a.start - b.start);
  const box = $('captions');
  box.textContent = '';
  for (const cap of state.captions) {
    const el = $('captionTpl').content.firstElementChild.cloneNode(true);
    cap.el = el;
    const ta = el.querySelector('textarea');
    ta.value = cap.text;
    ta.addEventListener('input', () => (cap.text = ta.value));
    el.querySelectorAll('[data-k]').forEach((inp) => {
      const k = inp.dataset.k;
      inp.value = cap[k];
      inp.addEventListener('input', () => {
        cap[k] = inp.type === 'number' ? parseFloat(inp.value) || 0 : inp.value;
      });
    });
    // Reordenar quando um tempo de início muda
    el.querySelector('[data-k=start]').addEventListener('change', renderCaptionList);
    el.querySelector('.play').addEventListener('click', () => {
      if (state.loaded && !state.exporting) playFrom(cap.start, cap.end);
    });
    el.querySelector('.remove').addEventListener('click', () => {
      state.captions.splice(state.captions.indexOf(cap), 1);
      el.remove();
      updateCaptionCount();
    });
    box.appendChild(el);
  }
  updateCaptionCount();
}

function updateCaptionCount() {
  $('capCount').textContent = state.captions.length;
}

$('addCaption').addEventListener('click', () => {
  const cap = newCaption();
  state.captions.push(cap);
  renderCaptionList();
  cap.el.scrollIntoView({ block: 'nearest' });
  cap.el.querySelector('textarea').focus();
});

$('clearCaptions').addEventListener('click', () => {
  if (!state.captions.length) return;
  if (!confirm(`Apagar as ${state.captions.length} legendas?`)) return;
  state.captions = [];
  renderCaptionList();
});

// Estilo comum a todas as legendas (memorizado)
const savedStyle = store.get('capStyle');
if (savedStyle) Object.assign(state.capStyle, savedStyle);
$('capSize').value = state.capStyle.size;
$('capColor').value = state.capStyle.color;
$('capBox').value = state.capStyle.box;
for (const [id, k] of [['capSize', 'size'], ['capColor', 'color'], ['capBox', 'box']]) {
  $(id).addEventListener('input', () => {
    state.capStyle[k] = k === 'size' ? parseFloat($(id).value) || 72 : $(id).value;
    store.set('capStyle', state.capStyle);
  });
}

// ---------- Legendas automáticas (Whisper no navegador) ----------
async function extractAudio16k(file) {
  const buf = await file.arrayBuffer();
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const actx = new Offline(1, 16000, 16000);
  const audio = await actx.decodeAudioData(buf);
  if (audio.numberOfChannels === 1) return audio.getChannelData(0);
  // Misturar canais para mono
  const out = new Float32Array(audio.length);
  for (let c = 0; c < audio.numberOfChannels; c++) {
    const d = audio.getChannelData(c);
    for (let i = 0; i < d.length; i++) out[i] += d[i] / audio.numberOfChannels;
  }
  return out;
}

const WORKER_SRC = `
let pipe = null, pipeModel = null;
self.onmessage = async (e) => {
  const { model, language, audio, libUrl } = e.data;
  try {
    const { pipeline } = await import(libUrl);
    if (!pipe || pipeModel !== model) {
      pipe = await pipeline('automatic-speech-recognition', model, {
        dtype: 'q8',
        progress_callback: (p) => self.postMessage({ type: 'load', p }),
      });
      pipeModel = model;
    }
    self.postMessage({ type: 'transcribing' });
    const opts = { chunk_length_s: 30, stride_length_s: 5, return_timestamps: true, task: 'transcribe' };
    if (language) opts.language = language;
    const out = await pipe(audio, opts);
    self.postMessage({ type: 'done', out });
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err && err.message || err) });
  }
};`;

let asrWorker = null;
function getWorker() {
  if (!asrWorker) {
    const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
    asrWorker = new Worker(url, { type: 'module' });
  }
  return asrWorker;
}

function transcribe(audio, model, language, onStatus) {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    const files = {};
    w.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'load') {
        if (m.p.status === 'progress' && m.p.total) {
          files[m.p.file] = [m.p.loaded, m.p.total];
          let l = 0, t = 0;
          for (const [a, b] of Object.values(files)) { l += a; t += b; }
          onStatus(`A descarregar o modelo… ${Math.round((l / t) * 100)}%`, l / t);
        }
      } else if (m.type === 'transcribing') {
        onStatus('A transcrever o áudio… (pode demorar alguns minutos)', null);
      } else if (m.type === 'done') {
        resolve(m.out);
      } else if (m.type === 'error') {
        reject(new Error(m.message));
      }
    };
    w.onerror = (e) => reject(new Error(e.message || 'Erro no processamento'));
    w.postMessage({ model, language, audio, libUrl: TRANSFORMERS_URL }, [audio.buffer]);
  });
}

// Divide cada frase em legendas curtas, distribuindo o tempo pelo número de letras
function chunksToCaptions(chunks, wordsPer, duration) {
  const caps = [];
  chunks.forEach((ch, idx) => {
    const text = (ch.text || '').trim();
    if (!text) return;
    let [s, e] = ch.timestamp || [0, null];
    if (s == null) s = 0;
    if (e == null || e <= s) e = chunks[idx + 1]?.timestamp?.[0] ?? Math.min(duration, s + 3);
    const words = text.split(/\s+/);
    const groups = [];
    const n = wordsPer > 0 ? wordsPer : words.length;
    for (let i = 0; i < words.length; i += n) groups.push(words.slice(i, i + n).join(' '));
    const totalChars = groups.reduce((a, g) => a + g.length, 0) || 1;
    let t = s;
    for (const g of groups) {
      const d = (e - s) * (g.length / totalChars);
      caps.push(newCaption({ text: g, start: round1(t), end: round1(t + d) }));
      t += d;
    }
  });
  return caps;
}

$('btnAsr').addEventListener('click', async () => {
  if (!state.file || state.exporting) return;
  if (state.captions.length &&
      !confirm('Já existem legendas. As novas legendas automáticas vão substituí-las. Continuar?')) return;

  const info = $('asrInfo');
  const prog = $('asrProgress');
  const setStatus = (msg, p) => {
    info.textContent = msg;
    prog.hidden = false;
    if (p == null) prog.removeAttribute('value'); else prog.value = p;
  };
  $('btnAsr').disabled = true;
  try {
    setStatus('A extrair o áudio do vídeo…', null);
    const audio = await extractAudio16k(state.file);
    const out = await transcribe(audio, $('asrModel').value, $('asrLang').value, setStatus);
    const chunks = out.chunks?.length ? out.chunks : [{ text: out.text, timestamp: [0, video.duration] }];
    state.captions = chunksToCaptions(chunks, parseInt($('asrWords').value, 10), video.duration);
    renderCaptionList();
    info.textContent = state.captions.length
      ? `✅ ${state.captions.length} legendas criadas. Reveja-as na lista abaixo antes de exportar.`
      : 'Não foi detetada fala neste vídeo.';
  } catch (err) {
    console.error(err);
    info.textContent = `❌ Não foi possível gerar as legendas: ${err.message}. ` +
      'Verifique a ligação à internet (necessária na primeira vez) ou tente a precisão “Rápida”.';
  } finally {
    prog.hidden = true;
    $('btnAsr').disabled = false;
  }
});

// ---------- Logotipo ----------
function setLogo(src, settings = {}) {
  const img = new Image();
  img.onload = () => {
    state.logo = {
      img,
      corner: settings.corner ?? $('logoCorner').value,
      size: settings.size ?? parseFloat($('logoSize').value),
      opacity: settings.opacity ?? parseFloat($('logoOpacity').value),
      margin: settings.margin ?? parseFloat($('logoMargin').value),
    };
    $('logoCorner').value = state.logo.corner;
    $('logoSize').value = state.logo.size;
    $('logoOpacity').value = state.logo.opacity;
    $('logoMargin').value = state.logo.margin;
    $('logoControls').hidden = false;
    $('logoLabel').textContent = 'Trocar logotipo…';
  };
  img.src = src;
}

function saveLogo() {
  if (!state.logo) return store.del('logo');
  const { img, ...settings } = state.logo;
  store.set('logo', { src: img.src, ...settings });
}

$('logoInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    setLogo(reader.result);
    setTimeout(saveLogo, 100);
  };
  reader.readAsDataURL(file);
});

for (const [id, k] of [['logoCorner', 'corner'], ['logoSize', 'size'],
  ['logoOpacity', 'opacity'], ['logoMargin', 'margin']]) {
  $(id).addEventListener('input', () => {
    if (!state.logo) return;
    state.logo[k] = k === 'corner' ? $(id).value : parseFloat($(id).value);
    saveLogo();
  });
}

$('logoRemove').addEventListener('click', () => {
  state.logo = null;
  saveLogo();
  $('logoInput').value = '';
  $('logoControls').hidden = true;
  $('logoLabel').textContent = 'Escolher logotipo (PNG com fundo transparente é o ideal)…';
});

const savedLogo = store.get('logo');
if (savedLogo?.src) setLogo(savedLogo.src, savedLogo);

function drawLogo() {
  const L = state.logo;
  if (!L || !L.img.naturalWidth) return;
  const w = W * L.size;
  const h = w * (L.img.naturalHeight / L.img.naturalWidth);
  const m = W * L.margin;
  const x = L.corner.endsWith('r') ? W - w - m : m;
  const y = L.corner.startsWith('b') ? H - h - m : m;
  ctx.globalAlpha = L.opacity;
  ctx.drawImage(L.img, x, y, w, h);
  ctx.globalAlpha = 1;
}

// ---------- Desenho ----------
function wrapLines(text, maxWidth) {
  const out = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        out.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    out.push(line);
  }
  return out;
}

function drawCaption(cap) {
  if (!cap.text.trim()) return;
  const { size: rawSize, color, box } = state.capStyle;
  const size = clamp(rawSize || 72, 20, 200);
  ctx.font = `800 ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = wrapLines(cap.text, W * 0.84);
  const lh = size * 1.2;
  const blockH = lines.length * lh;
  let y;
  if (cap.pos === 'top') y = H * 0.14;
  else if (cap.pos === 'center') y = H / 2 - blockH / 2 + lh / 2;
  else y = H * 0.76 - blockH + lh / 2;

  if (box === 'box') {
    const maxW = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const pad = size * 0.35;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    const r = size * 0.25;
    const bx = W / 2 - maxW / 2 - pad, by = y - lh / 2 - pad / 2;
    const bw = maxW + pad * 2, bh = blockH + pad;
    if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, r); else ctx.rect(bx, by, bw, bh);
    ctx.fill();
  }
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.16;
  ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  ctx.fillStyle = color;
  lines.forEach((ln, i) => {
    const yy = y + i * lh;
    if (box === 'outline') ctx.strokeText(ln, W / 2, yy);
    ctx.fillText(ln, W / 2, yy);
  });
}

function drawVideo(mode, zoom, px, py, filter) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const base = mode === 'cover' ? Math.max(W / vw, H / vh) : Math.min(W / vw, H / vh);
  const s = base * zoom;
  const dw = vw * s;
  const dh = vh * s;
  // px/py = 0..1 escolhem que parte do vídeo fica visível quando é maior que o ecrã
  const dx = dw > W ? (W - dw) * px : (W - dw) / 2;
  const dy = dh > H ? (H - dh) * py : (H - dh) / 2;
  ctx.filter = filter || 'none';
  ctx.drawImage(video, dx, dy, dw, dh);
  ctx.filter = 'none';
}

let lastActive = null;
function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  if (state.loaded && video.readyState >= 2) {
    if (state.fit === 'blur') {
      drawVideo('cover', 1.1, 0.5, 0.5, 'blur(40px) brightness(0.7)');
      drawVideo('contain', state.zoom, state.posX, state.posY);
    } else {
      drawVideo(state.fit, state.zoom, state.posX, state.posY);
    }
    const t = video.currentTime;
    let active = null;
    for (const cap of state.captions) {
      if (t >= cap.start && t < cap.end) {
        drawCaption(cap);
        active = active || cap;
      }
    }
    drawLogo();

    // Destacar na lista a legenda que está no ecrã
    if (active !== lastActive) {
      lastActive?.el?.classList.remove('active');
      active?.el?.classList.add('active');
      if (active?.el && !video.paused && !state.exporting) active.el.scrollIntoView({ block: 'nearest' });
      lastActive = active;
    }
  } else if (!state.loaded) {
    ctx.fillStyle = '#555';
    ctx.font = '600 56px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Carregue um vídeo', W / 2, H / 2);
    drawLogo();
  }

  // Parar no fim do corte (ou do trecho de uma legenda) durante a pré-visualização
  if (!state.exporting && !video.paused) {
    const stopAt = state.previewEnd ?? state.end;
    if (video.currentTime >= stopAt) {
      video.pause();
      state.previewEnd = null;
    }
  }

  if (state.loaded) {
    if (document.activeElement !== $('seek')) $('seek').value = video.currentTime;
    $('time').textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
  }
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

// ---------- Exportar ----------
function pickMime() {
  const opts = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  return opts.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
}

function seekTo(t) {
  return new Promise((res) => {
    const done = () => { video.removeEventListener('seeked', done); res(); };
    video.addEventListener('seeked', done);
    video.currentTime = t;
  });
}

$('btnExport').addEventListener('click', async () => {
  if (!window.MediaRecorder || !canvas.captureStream) {
    alert('O seu navegador não suporta exportação. Use Chrome, Edge, Firefox ou Safari recente.');
    return;
  }
  ensureAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  const mime = pickMime();
  const ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
  const stream = new MediaStream([
    ...canvas.captureStream(30).getVideoTracks(),
    ...audioDest.stream.getAudioTracks(),
  ]);
  const rec = new MediaRecorder(stream, {
    mimeType: mime || undefined,
    videoBitsPerSecond: parseInt($('quality').value, 10),
  });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  state.exporting = true;
  state.previewEnd = null;
  setExportingUI(true);
  video.pause();
  await seekTo(state.start);

  const finished = new Promise((res) => (rec.onstop = res));
  rec.start(250);
  await video.play();

  await new Promise((res) => {
    const tick = () => {
      const p = (video.currentTime - state.start) / (state.end - state.start);
      $('progress').value = clamp(p, 0, 1);
      $('exportInfo').textContent = `A exportar… ${Math.round(clamp(p, 0, 1) * 100)}%`;
      if (video.currentTime >= state.end || video.ended) return res();
      requestAnimationFrame(tick);
    };
    tick();
  });

  video.pause();
  rec.stop();
  await finished;

  const blob = new Blob(chunks, { type: mime || 'video/webm' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `short-${Date.now()}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);

  state.exporting = false;
  setExportingUI(false);
  $('exportInfo').textContent =
    `Pronto! Ficheiro ${ext.toUpperCase()} (${(blob.size / 1e6).toFixed(1)} MB) descarregado.`;
});

function setExportingUI(on) {
  $('progress').hidden = !on;
  $('progress').value = 0;
  ['btnExport', 'btnPlay', 'seek', 'fileInput', 'btnAsr'].forEach((id) => ($(id).disabled = on));
}
