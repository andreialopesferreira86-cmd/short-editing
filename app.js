'use strict';

const $ = (id) => document.getElementById(id);
const video = $('video');
const canvas = $('canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const state = {
  loaded: false,
  start: 0,
  end: 0,
  fit: 'cover',
  zoom: 1,
  posX: 0.5,
  posY: 0.5,
  captions: [],
  exporting: false,
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

// ---------- Carregar vídeo ----------
$('fileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (video.src) URL.revokeObjectURL(video.src);
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
  $('seek').disabled = false;
  $('btnPlay').disabled = false;
  $('btnExport').disabled = false;
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

$('btnPlay').addEventListener('click', async () => {
  if (state.exporting) return;
  ensureAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume();
  if (video.paused) {
    if (video.currentTime < state.start || video.currentTime >= state.end - 0.05) {
      video.currentTime = state.start;
    }
    video.play();
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

// ---------- Legendas ----------
function addCaption(data = {}) {
  const t = video.currentTime || 0;
  const cap = {
    text: data.text ?? '',
    start: data.start ?? +t.toFixed(1),
    end: data.end ?? +Math.min(t + 3, video.duration || t + 3).toFixed(1),
    pos: data.pos ?? 'bottom',
    size: data.size ?? 72,
    color: data.color ?? '#ffffff',
  };
  state.captions.push(cap);

  const el = $('captionTpl').content.firstElementChild.cloneNode(true);
  const ta = el.querySelector('textarea');
  ta.value = cap.text;
  ta.addEventListener('input', () => (cap.text = ta.value));
  el.querySelectorAll('[data-k]').forEach((inp) => {
    const k = inp.dataset.k;
    inp.value = cap[k];
    const handler = () => {
      cap[k] = inp.type === 'number' ? parseFloat(inp.value) || 0 : inp.value;
    };
    inp.addEventListener('input', handler);
    inp.addEventListener('change', handler);
  });
  el.querySelector('.remove').addEventListener('click', () => {
    state.captions.splice(state.captions.indexOf(cap), 1);
    el.remove();
  });
  $('captions').appendChild(el);
  ta.focus();
}
$('addCaption').addEventListener('click', () => addCaption());

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
  const size = clamp(cap.size || 72, 20, 200);
  ctx.font = `800 ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = wrapLines(cap.text, W * 0.86);
  const lh = size * 1.2;
  const blockH = lines.length * lh;
  let y;
  if (cap.pos === 'top') y = H * 0.14;
  else if (cap.pos === 'center') y = H / 2 - blockH / 2 + lh / 2;
  else y = H * 0.80 - blockH + lh / 2;

  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.16;
  ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  ctx.fillStyle = cap.color;
  lines.forEach((ln, i) => {
    const yy = y + i * lh;
    ctx.strokeText(ln, W / 2, yy);
    ctx.fillText(ln, W / 2, yy);
  });
}

// ---------- Desenho ----------
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
    for (const cap of state.captions) {
      if (t >= cap.start && t <= cap.end) drawCaption(cap);
    }
  } else if (!state.loaded) {
    ctx.fillStyle = '#555';
    ctx.font = '600 56px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Carregue um vídeo', W / 2, H / 2);
  }

  // Parar no fim do corte durante a pré-visualização
  if (!state.exporting && !video.paused && video.currentTime >= state.end) {
    video.pause();
    video.currentTime = state.end;
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
  ['btnExport', 'btnPlay', 'seek', 'fileInput'].forEach((id) => ($(id).disabled = on));
}
