---
name: short-editing
description: Edita um take bruto (telemóvel, webcam, câmara) de video-agent/takes/ num short vertical pronto a publicar — corta silêncios e hesitações, enquadra 9:16, legendas animadas, logótipos, CTA do Instagram — seguindo video-agent/voice.md. Entrega short-<slug>.mp4, legendas .srt e o texto da publicação.
---

# /short-editing — do take ao short pronto

Fala sempre em português. Segue SEMPRE `video-agent/voice.md`.
Resultado: `video-agent/edits/short-<slug>/output/` com
`short-<slug>.mp4`, `short-<slug>.srt` e `post.md`.

## 1. Escolher o take
- Se a pessoa indicou um ficheiro, usa esse. Senão, o mais recente em
  `video-agent/takes/` que ainda não tenha pasta `edits/short-<slug>/output/*.mp4`.
- Sem takes: explicar "Grava um take e larga-o em `video-agent/takes/`" e parar.
- Se `voice.md` ainda diz "valores por omissão", avisar uma vez que pode correr
  `/voice` para personalizar — e continuar com os valores por omissão.
- `<slug>`: curto, minúsculas, com hífens, a partir do nome do ficheiro ou do tema.

## 2. Transcrever
```bash
python3 video-agent/scripts/short.py transcribe "video-agent/takes/<take>" --slug <slug>
```
(primeira vez descarrega o modelo Whisper; `--model medium` para mais precisão,
`--language en` para inglês). Se faltar o faster-whisper: `pip install -r video-agent/requirements.txt`.

## 3. Rever a transcrição (o passo mais importante)
Abrir `video-agent/edits/short-<slug>/transcript.json` e, com um pequeno script
Python (não editar à mão palavra a palavra):
- **Corrigir** palavras mal reconhecidas, usando o "Glossário" do voice.md
  (nomes, marcas, ferramentas) e o contexto. Mantém a pontuação final (`.`, `?`, `!`),
  que serve para quebrar as legendas.
- **Cortar** (`"del": true`) as "Palavras a cortar" do voice.md quando são
  hesitações, falsos arranques, e frases repetidas (fica a ÚLTIMA versão
  completa — normalmente a melhor tomada).
- Não alterar `s`/`e` (tempos).
Resumir à pessoa, em 2–4 linhas, o que foi corrigido e cortado.

## 4. Montar o vídeo
Antes de montar, decidir (e dizer numa linha porquê):
- **Ritmo** (`--ritmo`): ver "5. Ritmo" e `ritmos` no voice.md. Ex.: fala dinâmica,
  dicas/notícias ou vídeo > 30 s → `rapido`; imóvel, explicação calma → `normal`.
- **CTA** (`--cta "…"`): escolher de `cta.opcoes` o que encaixa no conteúdo (ver "6." no
  voice.md). Não repetir o CTA do vídeo anterior: ver `edits/short-*/meta.json` mais recente.
- **Logótipo**: automático (branco em vídeo escuro, preto em vídeo claro). Só usar
  `--logo branco|preto|carmim` se a verificação do passo 5 mostrar que não se lê bem.
```bash
python3 video-agent/scripts/short.py render --slug <slug> --ritmo <normal|rapido> --cta "<texto>"
```
Se o resultado passar dos 30 s com `normal`, repetir com `rapido` e/ou cortar mais
frases repetidas na transcrição (objetivo da marca: 15–30 s).

## 5. Verificar antes de entregar
Extrair 3 imagens (início, meio, fim) e olhar para elas (Read):
```bash
cd video-agent/edits/short-<slug> && D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 output/short-<slug>.mp4) \
  && for x in 1 $(python3 -c "print($D/2)") $(python3 -c "print($D-1)"); do ffmpeg -v error -y -ss $x -i output/short-<slug>.mp4 -frames:v 1 check-$x.png; done
```
Confirmar: legenda legível e dentro do ecrã, logótipo no canto,
CTA no fim, sem ecrã preto. Se algo falhar, ajustar e voltar ao passo 4.

## 6. Texto da publicação
Escrever `video-agent/edits/short-<slug>/output/post.md` com o **Tom de voz** do voice.md:
- 1ª linha: gancho forte (é o que aparece antes do "mais").
- 2–4 linhas curtas com o valor do vídeo (baseado na transcrição).
- CTA (alinhado com o CTA do vídeo) ou pergunta para comentários.
- 3–5 hashtags.
Também um título curto (para a capa) numa linha `Capa: …`.

## 7. Entregar
- Abrir o vídeo: `open <mp4>` (macOS) / `xdg-open` (Linux) / `start` (Windows), se possível.
- Mostrar: caminho do mp4, duração antes → depois, nº de cortes, caminho do .srt
  e o texto da publicação completo no chat (pronto a copiar).
- Commit + push (regra do CLAUDE.md): transcript.json, .srt, post.md
  (os .mp4 ficam fora do Git por serem grandes — já estão no .gitignore).
