# Instruções do projeto

- Comunicar sempre em **português**.
- **Guardar sempre no GitHub**: depois de cada alteração, fazer commit e push
  para o repositório `andreialopesferreira86-cmd/short-editing`, sem precisar de perguntar.
- O projeto tem duas partes:
  1. Editor no navegador em HTML/CSS/JS puro (sem build): `index.html`, `style.css`, `app.js`.
  2. Agente de edição em `video-agent/` (Python + ffmpeg + faster-whisper), com as skills
     /zome-voice, /zome-short e `/zome-editing` em `.claude/skills/`. O estilo vive em `video-agent/voice.md`.
- Também estão instaladas as skills do pacote **Melvynx/video-agent-skills** (`skills-lock.json`):
  /editing, /short-editing (estilo "papel" em ecrã dividido), /studio-setup, /studio-script,
  /publish, /codex-images, /broll, /clips, /steal, /vox, /outliers, /insta-audit, /short-translate.
  As skills próprias da Andreia (estilo Zome) são as `zome-*` — nunca as substituir nem apagar.
- `video-agent/voice.md` é partilhado: o bloco ```yaml no fim é lido pelo /zome-short.
  Antes de o /studio-setup reescrever o voice.md, guardar uma cópia e manter esse bloco.
- Nunca fazer commit de vídeos (.mp4/.mov) — são grandes demais; ficam no `.gitignore`.
