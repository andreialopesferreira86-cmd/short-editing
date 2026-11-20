# Voice — Andreia Ferreira · Zome Braga

> Visual padrão e tom de voz de todos os shorts. Personalizado com /zome-voice em 2026-11-20.
> Pode ser editado à mão a qualquer momento. O /zome-short lê-o sempre antes de editar.
> Marca, cores e regras de design vêm também do "brain" (`projects/zome-braga/About.md`).

## 1. Aparência
Vídeo vertical 9:16 (1080×1920) a ocupar o ecrã todo, com um pequeno zoom alternado
a cada corte para dar dinamismo. Estilo da marca: **elegante, limpo e luminoso** —
nada pesado nem escuro.

## 2. Cor (cores oficiais da marca)
- **Electric Carmine** — Pantone 1925 C · CMYK 0/97/50/0 · RGB 255/8/79 · **#FF084F**
  → palavra que está a ser dita e o @ do Instagram. Só pequenos detalhes, nunca blocos grandes.
- **Dark Blue** — Pantone 539 C · CMYK 98/78/49/56 · RGB 2/36/57 · **#022439**
  → contorno das legendas e fundo do cartão do CTA.
- **Branco** #FFFFFF → texto das legendas.

## 3. Fontes
Montserrat ExtraBold (legendas e CTA). Colocar `Montserrat-ExtraBold.ttf` em
`video-agent/fonts/` (Google Fonts → Montserrat → Download).

## 4. Legendas
3 palavras de cada vez, em MAIÚSCULAS, a palavra dita em carmim, um pouco abaixo
do centro — sempre acima dos 35% de baixo, onde o Instagram põe a descrição, a música
e os botões.

**Zonas seguras do Reels** (nada importante aqui): 14% de cima, 35% de baixo, 6% de
cada lado.

## 5. Ritmo
Depende da fala de cada vídeo — o /zome-short escolhe:
- **normal**: corta as pausas (> 0,35 s). Para vídeos calmos, imóveis, explicações.
- **rapido**: corta todas as pausas (> 0,2 s) e acelera 8%. Para dicas, notícias,
  quando a fala já é dinâmica ou o vídeo passa dos 30 s.
Objetivo da marca: Reels de **15–30 s**, com gancho nos primeiros 2–3 s.

## Música de fundo
Piano suave com cordas ("Piano feutré"), baixinho, que se afasta quando falo e volta
nas pausas. Alternativa mais luminosa: "Bali calme" (kalimba e marimba). Ambas geradas
por código no brain — sem direitos de autor, o Instagram não silencia o vídeo.

## 6. Chamada para ação (Instagram @andreiaferreira_zome)
O texto final **varia de vídeo para vídeo** — o /zome-short escolhe o que melhor
encaixa no conteúdo, sem repetir o do vídeo anterior:
- Dicas / informação → "Guarda para mais tarde" ou "Partilha com quem precisa"
- Imóvel à venda → "Fala comigo no WhatsApp" ou "Partilha com quem procura casa"
- Pergunta / opinião → "Comenta QUERO" (ou a palavra-chave do vídeo)
- Crescer a conta → "Segue para mais dicas"
Sempre com o @andreiaferreira_zome por baixo. Sem emojis no vídeo.
Aparece no lugar das legendas nos últimos 2,5 s, para não tapar a cara.

## 7. Logótipos
Assinatura em duas peças separadas (o monograma AF não entra nos vídeos), como as molduras de canto da marca — simples e
equilibrada, nunca um logótipo grande por cima do vídeo. No topo, logo abaixo dos
14% reservados ao Instagram, para não ficar tapada pelo título "Reels", pela câmara,
pela descrição, pela música ou pelos botões:
- **Andreia Ferreira · Consultora Imobiliária** → canto **superior esquerdo**
- **Telefone** (963 609 184) **+ logótipo Zome** por baixo → canto **superior direito**

Cor automática peça a peça: **branco** sobre zonas escuras, **preto** sobre zonas
claras (`--logo carmim` para forçar uma cor). Sem logótipos de ferramentas por agora.

## Tom de voz (texto da publicação)
- Português de Portugal. Trata por **tu** nas dicas e conteúdos leves; por **você**
  quando fala com proprietários/compradores sobre um imóvel ou serviço. Nunca misturar
  na mesma publicação.
- Próxima, confiante, elegante. Frases curtas. 1.ª linha = gancho forte.
- **Alguns emojis, poucos** (2–3), só quando acrescentam (🏡 🔑 📍 ✨).
- Objetivo: partilhas e guardados — terminar com pergunta ou CTA.
- Antes das hashtags, sempre: `📲 WhatsApp: 963 609 184`
- 3–5 hashtags, escolhidas destas: #Braga #Zome #ComprarCasa #VenderCasa
  #ConsultoraImobiliaria #CreditoHabitacao #PrimeiraCasa #ImobiliarioBraga
  #DicasImobiliarias #InvestimentoImobiliario #AvaliacaoGratuita #Arrendamento

## Glossário (corrigir sempre na transcrição)
Andreia Ferreira, Zome, Braga, Guimarães, Idealista, Imovirtual, Euribor, IMT, IMI,
IMT Jovem, T0/T1/T2/T3/T4, CPCV, escritura, crédito habitação, garantia pública,
moradia, apartamento, m² (metros quadrados)

## Palavras a cortar
Hesitações: hum, hmm, ah, ahh, éé, eh, hã, ããã.
Também cortar falsos arranques e frases repetidas (fica a última versão completa).
Não cortar "é" quando é o verbo ser ("é muito fácil").

---

## Configuração (lida pelo programa)

Não mude os nomes das chaves. Cores em `#RRGGBB`. Caminhos relativos a `video-agent/`.

```yaml
aparencia:
  enquadramento: preencher      # preencher | desfocado
  zoom_alternado: 1.08          # 1 = desligado
  fps: 30

cores:
  texto: "#FFFFFF"
  destaque: "#FF084F"           # Electric Carmine
  contorno: "#022439"           # Dark Blue
  fundo_cta: "#022439"          # Dark Blue

fontes:
  legendas: "Montserrat ExtraBold"
  cta: "Montserrat ExtraBold"

legendas:
  palavras: 3
  maiusculas: true
  destacar_palavra: true
  tamanho: 84
  contorno: 6
  estilo: contorno              # contorno | caixa
  posicao: 0.60                 # 0 = topo, 1 = fundo — acima dos 35% de baixo (descrição, música, botões)

ritmo:                          # por omissão (= normal)
  cortar_silencios: true
  silencio_max: 0.35
  margem: 0.12                  # folga antes/depois da fala (s) — os cortes também procuram o silêncio real
  velocidade: 1.0

ritmos:                         # escolhidos por vídeo: render --ritmo rapido
  normal: {silencio_max: 0.35, velocidade: 1.0}
  rapido: {silencio_max: 0.25, margem: 0.1, velocidade: 1.08}

som:
  normalizar: true

musica:                         # música de fundo sem direitos de autor (gerada pelo brain)
  ficheiro: music/piano-feutre.mp3   # alternativa luminosa: music/bali.mp3
  volume_db: -17                # mais baixo = número mais negativo (ex.: -20)
  baixar_quando_fala: true      # a música baixa sozinha enquanto fala
  inicio: 0                     # segundo da música onde começa

cta:
  ativo: true
  texto: "Guarda para mais tarde"   # por omissão; o /zome-short escolhe por vídeo (--cta)
  opcoes:
    - "Guarda para mais tarde"
    - "Partilha com quem precisa"
    - "Partilha com quem procura casa"
    - "Fala comigo no WhatsApp"
    - "Comenta QUERO"
    - "Segue para mais dicas"
  instagram: "@andreiaferreira_zome"
  duracao: 2.5
  posicao: 0.555                # no lugar das legendas (abaixo da cara, acima dos 35% do Instagram)
  substitui_legendas: true      # nos últimos segundos, o CTA aparece em vez das legendas

logotipos:
  marca:
    cor: auto                   # auto | branco | preto | carmim | azul
    opacidade: 0.9
    margem: 0.065               # zona segura: 6% de cada lado
    margem_vertical: 0.09       # distância ao fundo (fração da altura)
    margem_topo: 0.145          # zona segura do Reels: 14% do topo livres (título "Reels", câmara)
    pecas:
      - ficheiro: brand/nome.png
        posicao: superior-esquerdo
        tamanho: 0.34           # fração da largura do ecrã
      - ficheiro: brand/telefone-zome.png   # número + logótipo Zome por baixo (alinhado à direita)
        posicao: superior-direito
        tamanho: 0.30
  ferramentas:
    tamanho: 0.22
    duracao: 2.0
    lista: []
```
