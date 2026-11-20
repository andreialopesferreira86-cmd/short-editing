---
name: voice
description: Personaliza o visual padrão e o tom de voz dos shorts (7 perguntas rápidas, ~15 min, uma única vez) e grava tudo em video-agent/voice.md. Usar na primeira utilização, ou quando a pessoa quiser mudar cores, fontes, legendas, ritmo, CTA do Instagram ou logótipos.
---

# /voice — personalizar o estilo (uma única vez)

Objetivo: preencher `video-agent/voice.md` (texto + bloco ```yaml) com o estilo real
da pessoa, **validado visualmente sobre as próprias filmagens dela**.
Fala sempre em português. Uma pergunta de cada vez, curta. Se a pessoa disser
"tanto faz", fica o valor por omissão e segue.

## 0. Preparar (antes das perguntas)
1. Ler `video-agent/voice.md`.
2. Procurar uma filmagem em `video-agent/takes/` (o mais recente). Se não houver,
   pedir: "Larga um take qualquer (pode ser de teste) em `video-agent/takes/` —
   uso-o para te mostrar como fica." Pode continuar as perguntas enquanto isso.
3. Confirmar dependências: `ffmpeg -version` e `python3 -c "import yaml"`.
   Se faltar algo, dar o comando de instalação (ver `video-agent/README.md`).

## As 7 perguntas
Use a ferramenta de perguntas com opções (com "Outro" livre). Depois de cada
resposta, atualize o voice.md e, quando houver take, gere a pré-visualização:

```bash
python3 video-agent/scripts/short.py preview video-agent/takes/<take> --t 3
```
Mostre a imagem `video-agent/edits/_preview/preview.png` (Read) e pergunte se gosta.

1. **Aparência** — enquadramento `preencher` (ecrã todo) ou `desfocado`
   (vídeo inteiro com fundo desfocado); zoom alternado nos cortes (sim 1.08 / não 1).
2. **Cor** — cor do texto, da palavra em destaque e do fundo do CTA. Ofereça
   paletas prontas (ex.: branco+amarelo, branco+rosa #FF3D6E, preto+branco em caixa)
   ou as cores da marca dela (`#RRGGBB`).
3. **Fontes** — sugira 3 (ex.: Montserrat ExtraBold, Poppins Bold, Anton).
   A fonte tem de existir: peça o `.ttf` para `video-agent/fonts/` (Google Fonts →
   Download) ou use uma instalada (`fc-list : family`). Escreva o nome exato da família.
4. **Legendas** — palavras por legenda (1–3 dinâmico, 4–6 calmo), maiúsculas,
   destacar palavra dita, estilo `contorno` ou `caixa`, tamanho, posição
   (0.68 = abaixo do centro, fora dos botões do Instagram).
5. **Ritmo** — rápido (silencio_max 0.25, velocidade 1.1), normal (0.35, 1.0) ou
   calmo (0.7, 1.0). Que palavras/bengalas costuma dizer e quer cortar
   (→ secção "Palavras a cortar").
6. **Chamada para ação do Instagram** — texto final, @perfil, duração (2–3 s).
   Mostre com `preview … --cta`.
7. **Logótipos** — (a) logótipo da marca: pedir o PNG, guardar em
   `video-agent/brand/logo.png`, escolher canto/tamanho/opacidade;
   (b) **logótipos reais das ferramentas** que costuma referir (ex.: Canva, CapCut,
   ChatGPT): para cada uma, pedir o PNG oficial (transparente) → `video-agent/brand/tools/<nome>.png`
   e as palavras que o ativam. Mostre com `preview … --tool <palavra>`.
   Não invente nem desenhe logótipos de marcas — use só os ficheiros que a pessoa der.

## Tom de voz
No fim, 2–3 perguntas rápidas para a secção "Tom de voz" e "Glossário":
tratamento (tu/você), uso de emojis, palavras que evita, nomes/marcas que o
reconhecimento de voz costuma errar, hashtags habituais.

## Fechar
1. Tirar a linha "⚠️ Estado: valores por omissão" do voice.md.
2. Validar o YAML: `python3 -c "import sys;sys.path.insert(0,'video-agent/scripts');import short;print(short.load_voice()['legendas'])"`.
3. Gerar uma última pré-visualização e mostrá-la.
4. Commit + push (regra do CLAUDE.md): voice.md, brand/, fonts/.
5. Dizer: "Pronto! Agora grava um take, larga em `video-agent/takes/` e escreve `/short-editing`."
