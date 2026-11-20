# ✂️ Short Editing

Editor de vídeos curtos (Reels, TikTok, YouTube Shorts) que funciona **direto no navegador**.
Não precisa de instalar nada e os vídeos **não são enviados para nenhum servidor**.

## Funcionalidades

- **Cortar** o vídeo (início e fim, também a partir da posição atual)
- **Formato vertical 9:16** (1080×1920) com três modos:
  - Preencher (corta as laterais)
  - Ajustar com fundo desfocado
  - Ajustar com fundo preto
- **Zoom e posição** para escolher a parte do vídeo que aparece
- **Legendas automáticas** a partir da fala (modelo Whisper a correr no próprio navegador):
  - idiomas: português, inglês, espanhol, francês ou deteção automática
  - 3, 5 ou 8 palavras por legenda (ou frase inteira)
  - lista para **rever**: ouvir cada trecho (▶), **corrigir** texto e tempos, **apagar** (🗑)
  - na primeira utilização o modelo é descarregado (40–250 MB) e fica guardado no navegador
- **Textos manuais** e estilo das legendas (tamanho, cor, contorno ou caixa escura)
- **Logotipo** num canto (inferior direito por omissão), com tamanho, transparência e margem; fica memorizado para os próximos vídeos
- **Exportar** em MP4 (Chrome/Edge/Safari recentes) ou WebM, com áudio

## Como usar

1. Abra o `index.html` no navegador (ou ative o GitHub Pages — ver abaixo).
2. Escolha um vídeo.
3. Ajuste o corte, o enquadramento e os textos.
4. Clique em **Exportar vídeo**. A exportação acontece em tempo real.

## Publicar no GitHub Pages

No GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.
O editor ficará disponível em `https://<utilizador>.github.io/short-editing/`.
