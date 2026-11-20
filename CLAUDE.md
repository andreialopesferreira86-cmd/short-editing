# Instruções do projeto

- Comunicar sempre em **português**.
- **Guardar sempre no GitHub**: depois de cada alteração, fazer commit e push
  para o repositório `andreialopesferreira86-cmd/short-editing`, sem precisar de perguntar.
- O projeto tem duas partes:
  1. Editor no navegador em HTML/CSS/JS puro (sem build): `index.html`, `style.css`, `app.js`.
  2. Agente de edição em `video-agent/` (Python + ffmpeg + faster-whisper), com as skills
     `/voice`, `/short-editing` e `/editing` em `.claude/skills/`. O estilo vive em `video-agent/voice.md`.
- Nunca fazer commit de vídeos (.mp4/.mov) — são grandes demais; ficam no `.gitignore`.
