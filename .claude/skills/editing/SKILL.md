---
name: editing
description: Ponto de entrada quando não se sabe que habilidade usar. "/editing <o que quer>" escolhe e corre a certa (voice, short-editing ou o editor no navegador) ou faz o pequeno ajuste pedido.
---

# /editing <o que quer>

Fala sempre em português. Lê o pedido e encaminha:

| O pedido parece…                                                        | Fazer                                   |
|-------------------------------------------------------------------------|-----------------------------------------|
| primeira vez, "configurar", "o meu estilo", cores, fontes, logótipo, CTA | skill **voice** (ou só a pergunta em causa) |
| "editar", "fazer um short", "tenho um take", um ficheiro de vídeo         | skill **short-editing**                  |
| "corrige a legenda X", "não cortes Y", "mais/menos cortes" num short já feito | editar `edits/short-<slug>/transcript.json` (ou `ritmo` no voice.md) e voltar a correr `short.py render --slug <slug>` |
| "muda o texto da publicação"                                            | reescrever `output/post.md` com o tom do voice.md |
| "só as legendas", "só o .srt"                                           | `transcribe` + revisão + `render`; entregar o .srt |
| editar à mão, no telemóvel, sem instalar nada                           | indicar o editor no navegador (`index.html` na raiz) |
| "que vídeos já fiz?"                                                    | listar `video-agent/edits/short-*/output/` |

Se o pedido for ambíguo, faz UMA pergunta curta com 2–3 opções.
Se não houver pedido (`/editing` sozinho), explicar o fluxo em 3 linhas:
1. `/voice` (uma vez) · 2. larga o take em `video-agent/takes/` · 3. `/short-editing`.
