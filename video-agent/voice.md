# Voice — Andreia Ferreira · Zome Braga

> Visual padrão e tom de voz de todos os shorts. Personalizado com `/voice` em 2026-11-20.
> Pode ser editado à mão a qualquer momento. O `/short-editing` lê-o sempre antes de editar.
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
do centro (longe dos botões do Instagram e do logótipo).

## 5. Ritmo
Depende da fala de cada vídeo — o `/short-editing` escolhe:
- **normal**: corta as pausas (> 0,35 s). Para vídeos calmos, imóveis, explicações.
- **rapido**: corta todas as pausas (> 0,2 s) e acelera 8%. Para dicas, notícias,
  quando a fala já é dinâmica ou o vídeo passa dos 30 s.
Objetivo da marca: Reels de **15–30 s**, com gancho nos primeiros 2–3 s.

## 6. Chamada para ação (Instagram @andreiaferreira_zome)
O texto final **varia de vídeo para vídeo** — o `/short-editing` escolhe o que melhor
encaixa no conteúdo, sem repetir o do vídeo anterior:
- Dicas / informação → "Guarda para mais tarde" ou "Partilha com quem precisa"
- Imóvel à venda → "Fala comigo no WhatsApp" ou "Partilha com quem procura casa"
- Pergunta / opinião → "Comenta QUERO" (ou a palavra-chave do vídeo)
- Crescer a conta → "Segue para mais dicas"
Sempre com o @andreiaferreira_zome por baixo. Sem emojis no vídeo.

## 7. Logótipos
Assinatura em duas peças separadas (o monograma AF não entra nos vídeos), como as molduras de canto da marca — simples e
equilibrada, nunca um logótipo grande por cima do vídeo:
- **Andreia Ferreira · Consultora Imobiliária** → canto **inferior esquerdo**
- **Telefone** (963 609 184) **+ logótipo Zome** por baixo → canto **inferior direito**

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
  posicao: 0.66                 # 0 = topo, 1 = fundo

ritmo:                          # por omissão (= normal)
  cortar_silencios: true
  silencio_max: 0.35
  margem: 0.08
  velocidade: 1.0

ritmos:                         # escolhidos por vídeo: render --ritmo rapido
  normal: {silencio_max: 0.35, velocidade: 1.0}
  rapido: {silencio_max: 0.2, margem: 0.06, velocidade: 1.08}

som:
  normalizar: true

cta:
  ativo: true
  texto: "Guarda para mais tarde"   # por omissão; o /short-editing escolhe por vídeo (--cta)
  opcoes:
    - "Guarda para mais tarde"
    - "Partilha com quem precisa"
    - "Partilha com quem procura casa"
    - "Fala comigo no WhatsApp"
    - "Comenta QUERO"
    - "Segue para mais dicas"
  instagram: "@andreiaferreira_zome"
  duracao: 2.5
  posicao: 0.40

logotipos:
  marca:
    cor: auto                   # auto | branco | preto | carmim | azul
    opacidade: 0.9
    margem: 0.05                # distância às laterais (fração da largura)
    margem_vertical: 0.11       # distância ao fundo (fração da altura)
    margem_topo: 0.06           # para peças no topo
    pecas:
      - ficheiro: brand/nome.png
        posicao: inferior-esquerdo
        tamanho: 0.34           # fração da largura do ecrã
      - ficheiro: brand/telefone-zome.png   # número + logótipo Zome por baixo (alinhado à direita)
        posicao: inferior-direito
        tamanho: 0.30
  ferramentas:
    tamanho: 0.22
    duracao: 2.0
    lista: []
```
