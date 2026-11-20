# Voice — o meu estilo de vídeo

> Este ficheiro define o **visual padrão** e o **tom de voz** de todos os shorts.
> É criado uma única vez com `/voice` (7 perguntas rápidas, ~15 min) e pode ser
> editado à mão a qualquer momento. O `/short-editing` lê-o sempre antes de editar.
>
> ⚠️ Estado: **valores por omissão** — ainda não foi personalizado. Corra `/voice`.

## 1. Aparência
Vídeo vertical 9:16 (1080×1920), a ocupar o ecrã todo. Pequeno zoom alternado
entre cortes para dar dinamismo.

## 2. Cor
Legendas brancas com contorno preto; a palavra que está a ser dita fica em amarelo.

## 3. Fontes
Letra grossa, sem serifa, fácil de ler no telemóvel.

## 4. Legendas
3 palavras de cada vez, em maiúsculas, um pouco abaixo do centro, longe dos
botões do Instagram.

## 5. Ritmo
Rápido: cortar silêncios, hesitações ("éé", "hum") e frases repetidas.

## 6. Chamada para ação (Instagram)
Nos últimos segundos aparece: "Segue para mais dicas" + @perfil. (Sem emojis no vídeo — ficam para o texto da publicação.)

## 7. Logotipos
- Marca pessoal: canto inferior direito, discreto.
- Ferramentas: quando digo o nome de uma ferramenta, o logótipo dela aparece no topo.

## Tom de voz (para o texto da publicação)
- Português de Portugal, tratamento por "tu", próximo e direto.
- Frases curtas. Primeira linha = gancho forte.
- Emojis: poucos (1–3), só quando acrescentam.
- Evitar: jargão técnico sem explicação, "clica no link da bio" repetido.
- Terminar com uma pergunta ou CTA + 3–5 hashtags relevantes.

## Glossário (corrigir sempre na transcrição)
Palavras que o reconhecimento de voz costuma errar (nomes, marcas, ferramentas):
- Claude, ChatGPT, Canva, CapCut, Instagram, Reels

## Palavras a cortar
Hesitações e bengalas a remover do vídeo: é, éé, hum, hmm, tipo, pronto, ok então

---

## Configuração (lida pelo programa)

Não mude os nomes das chaves. Cores em `#RRGGBB`. Caminhos relativos a `video-agent/`.

```yaml
aparencia:
  enquadramento: preencher      # preencher | desfocado
  zoom_alternado: 1.08          # 1 = desligado; 1.08 = zoom de 8% em cortes alternados
  fps: 30

cores:
  texto: "#FFFFFF"
  destaque: "#FFD400"           # palavra a ser dita
  contorno: "#000000"
  fundo_cta: "#FF3D6E"

fontes:
  legendas: "Montserrat ExtraBold"   # ponha o .ttf em video-agent/fonts/
  cta: "Montserrat ExtraBold"

legendas:
  palavras: 3                   # palavras por legenda
  maiusculas: true
  destacar_palavra: true
  tamanho: 86
  contorno: 6
  estilo: contorno              # contorno | caixa
  posicao: 0.68                 # 0 = topo, 1 = fundo (0.68 = abaixo do centro)

ritmo:
  cortar_silencios: true
  silencio_max: 0.35            # pausas maiores que isto (s) são cortadas
  margem: 0.08                  # folga antes/depois de cada fala (s)
  velocidade: 1.0               # 1.1 = 10% mais rápido

som:
  normalizar: true              # volume uniforme (-14 LUFS, padrão das redes)

cta:
  ativo: true
  texto: "Segue para mais dicas"   # sem emojis: o vídeo não os mostra
  instagram: "@o_teu_perfil"
  duracao: 2.5                  # segundos finais
  posicao: 0.42

logotipos:
  marca:
    ficheiro: brand/logo.png    # deixe vazio se não tiver
    canto: inferior-direito     # inferior-direito | inferior-esquerdo | superior-direito | superior-esquerdo
    tamanho: 0.14               # fração da largura
    opacidade: 0.9
    margem: 0.04
  ferramentas:                  # aparecem no topo quando a palavra é dita
    tamanho: 0.22
    duracao: 2.0
    lista: []
    # - nome: Canva
    #   ficheiro: brand/tools/canva.png
    #   palavras: [canva]
```
