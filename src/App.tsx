import { useEffect, useMemo, useState } from 'react'

type AttributeKey = 'vigor' | 'agilidade' | 'canalizacao' | 'determinacao' | 'astucia' | 'encanto'
type Theme = 'light' | 'dark'

type Attribute = {
  key: AttributeKey
  label: string
  short: string
  description: string
}

type Skill = {
  id: string
  label: string
  subtitle: string
  description: string
}

type Trait = {
  id: string
  label: string
  type: 'advantage' | 'disadvantage'
  subtitle: string
  description: string
  modifier?: {
    attribute: AttributeKey
    value: number
  }
}

type LineageGift = {
  court: string
  title: string
  description: string
  levels: Record<
    number,
    {
      name: string
      description: string
      effect: string
    }
  >
}

type CharacterSkill = {
  id: string
  level: number
}

type Character = {
  name: string
  court: string
  attributes: Record<AttributeKey, number>
  skills: CharacterSkill[]
  traits: string[]
  lineageGiftLevel: number
}

type DerivedAttribute = {
  label: string
  value: number
  formula: string
}

const INITIAL_XP = 1000
const MAX_CHARACTERS = 3
const ADVANTAGE_COST = 100
const MAX_ADVANTAGES = 3
const DISADVANTAGE_CREDIT_LIMIT = 2
const SHEETS_API_URL = '/api/sheets'
const PLAYER_ID_STORAGE_KEY = 'acowas-player-id'

const attributeLevelCosts: Record<number, number> = {
  1: 0,
  2: 40,
  3: 50,
  4: 60,
  5: 80,
}

const skillLevelCosts: Record<number, number> = {
  1: 20,
  2: 40,
  3: 50,
  4: 60,
  5: 80,
}

const lineageGiftLevelCosts: Record<number, number> = {
  1: 20,
  2: 40,
  3: 50,
  4: 60,
  5: 80,
}

const courts = [
  'Corte Noturna',
  'Corte Crepuscular',
  'Corte Diurna',
  'Corte Outonal',
  'Corte Primaveril',
  'Corte Invernal',
  'Corte Estival',
]

const attributes: Attribute[] = [
  {
    key: 'vigor',
    label: 'Vigor',
    short: 'VIG',
    description: 'Potência física, resistência corporal e capacidade de suportar ferimentos.',
  },
  {
    key: 'agilidade',
    label: 'Agilidade',
    short: 'AGI',
    description: 'Reflexos, precisão, velocidade e fluidez de movimento.',
  },
  {
    key: 'canalizacao',
    label: 'Canalização',
    short: 'CAN',
    description: 'Força mística para exteriorizar dons e manipular energia mágica.',
  },
  {
    key: 'determinacao',
    label: 'Determinação',
    short: 'DET',
    description: 'Vontade, foco, resistência mental e firmeza da alma.',
  },
  {
    key: 'astucia',
    label: 'Astúcia',
    short: 'AST',
    description: 'Leitura estratégica, percepção de padrões e raciocínio tático.',
  },
  {
    key: 'encanto',
    label: 'Encanto',
    short: 'ENC',
    description: 'Presença social, magnetismo, persuasão e autoridade.',
  },
]

const skills: Skill[] = [
  {
    id: 'combate',
    label: 'Combate',
    subtitle: 'Ataque físico',
    description: 'Usada para golpes com lâminas, armas, corpo a corpo, arcos e investidas físicas.',
  },
  {
    id: 'arcano',
    label: 'Arcano',
    subtitle: 'Ataque mágico',
    description: 'Exterioriza poder ofensivo: elementos, energia pura, rajadas, chamas e ataques místicos.',
  },
  {
    id: 'mentalismo',
    label: 'Mentalismo',
    subtitle: 'Manipulação psíquica',
    description: 'Lê pensamentos, projeta ilusões, confunde sentidos e interfere na mente alheia.',
  },
  {
    id: 'constricao',
    label: 'Constrição',
    subtitle: 'Imobilização e restrição',
    description: 'Contém alvos por agarres, submissões, amarras mágicas, sombras, raízes ou paralisia mental.',
  },
  {
    id: 'resistencia',
    label: 'Resistência',
    subtitle: 'Defesa geral',
    description: 'Defesa universal contra agressões físicas, mágicas, psíquicas ou elementais.',
  },
  {
    id: 'egide',
    label: 'Égide',
    subtitle: 'Guarda e proteção',
    description: 'Atrai ataques para si ou protege aliados, funcionando como técnica de guarda do grupo.',
  },
  {
    id: 'confluencia',
    label: 'Confluência',
    subtitle: 'Transferência de poder',
    description: 'Transfere energia ou dons de linhagem a um aliado por meio de ponte mística temporária.',
  },
  {
    id: 'regeneracao',
    label: 'Regeneração',
    subtitle: 'Cura e restauração',
    description: 'Restaura Vitalidade, neutraliza venenos e estabiliza ferimentos críticos.',
  },
  {
    id: 'intimidacao',
    label: 'Intimidação',
    subtitle: 'Social soberano',
    description: 'Subjuga pela presença, interroga, impõe autoridade e força recuos políticos ou militares.',
  },
  {
    id: 'magnetismo',
    label: 'Magnetismo',
    subtitle: 'Social sedutor',
    description: 'Persuade, negocia alianças, obtém segredos e conduz interações diplomáticas com charme.',
  },
  {
    id: 'atletismo',
    label: 'Atletismo',
    subtitle: 'Proezas físicas',
    description: 'Executa acrobacias, voos prolongados, escaladas, natação e feitos físicos extremos.',
  },
  {
    id: 'dissimulacao',
    label: 'Dissimulação',
    subtitle: 'Furtividade',
    description: 'Infiltra, oculta traços, escuta conversas e desaparece em meio ao caos.',
  },
  {
    id: 'sobrevivencia',
    label: 'Sobrevivência',
    subtitle: 'Rastreio e natureza',
    description: 'Rastreia criaturas, navega territórios hostis, caça e reconhece perigos naturais.',
  },
  {
    id: 'investigacao',
    label: 'Investigação',
    subtitle: 'Análise e percepção',
    description: 'Analisa cenas, identifica armadilhas, desvenda enigmas e percebe manipulações ocultas.',
  },
  {
    id: 'feiticaria',
    label: 'Feitiçaria',
    subtitle: 'Rituais e objetos',
    description: 'Realiza rituais, interpreta runas, compreende artefatos e neutraliza proteções mágicas.',
  },
]

const traits: Trait[] = [
  {
    id: 'robusto',
    label: 'Robusto',
    type: 'advantage',
    subtitle: 'Vantagem sistemática',
    description: 'Concede +2 em todos os testes ativos que envolvam Vigor.',
    modifier: { attribute: 'vigor', value: 2 },
  },
  {
    id: 'ligeiro',
    label: 'Ligeiro',
    type: 'advantage',
    subtitle: 'Vantagem sistemática',
    description: 'Concede +2 em todos os testes ativos que envolvam Agilidade.',
    modifier: { attribute: 'agilidade', value: 2 },
  },
  {
    id: 'intenso',
    label: 'Intenso',
    type: 'advantage',
    subtitle: 'Vantagem sistemática',
    description: 'Concede +2 em todos os testes ativos que envolvam Canalização.',
    modifier: { attribute: 'canalizacao', value: 2 },
  },
  {
    id: 'resoluto',
    label: 'Resoluto',
    type: 'advantage',
    subtitle: 'Vantagem sistemática',
    description: 'Concede +2 em todos os testes ativos que envolvam Determinação.',
    modifier: { attribute: 'determinacao', value: 2 },
  },
  {
    id: 'sagaz',
    label: 'Sagaz',
    type: 'advantage',
    subtitle: 'Vantagem sistemática',
    description: 'Concede +2 em todos os testes ativos que envolvam Astúcia.',
    modifier: { attribute: 'astucia', value: 2 },
  },
  {
    id: 'atraente',
    label: 'Atraente',
    type: 'advantage',
    subtitle: 'Vantagem sistemática',
    description: 'Concede +2 em todos os testes ativos que envolvam Encanto.',
    modifier: { attribute: 'encanto', value: 2 },
  },
  {
    id: 'atravessar',
    label: 'Atravessar',
    type: 'advantage',
    subtitle: 'Vantagem interpretativa',
    description: 'Permite teletransporte narrativo para locais familiares ou visualizados.',
  },
  {
    id: 'sifoes',
    label: 'Sifões de Poder',
    type: 'advantage',
    subtitle: 'Vantagem interpretativa',
    description: 'Permite controle mágico refinado, escudos, ferramentas místicas e construções de luz.',
  },
  {
    id: 'sentidos-predador',
    label: 'Sentidos de Predador',
    type: 'advantage',
    subtitle: 'Vantagem interpretativa',
    description: 'Ignora escuridão, rastreia por odores e detecta sinais fisiológicos sutis.',
  },
  {
    id: 'mestre-ilusoes',
    label: 'Mestre de Ilusões',
    type: 'advantage',
    subtitle: 'Vantagem interpretativa',
    description: 'Mantém disfarce visual passivo sobre si ou pequenos objetos.',
  },
  {
    id: 'voz-autoridade',
    label: 'Voz de Autoridade',
    type: 'advantage',
    subtitle: 'Vantagem interpretativa',
    description: 'Garante presença de comando e faz NPCs inferiores levarem sua palavra a sério.',
  },
  {
    id: 'vinculo-territorial',
    label: 'Vínculo Territorial',
    type: 'advantage',
    subtitle: 'Vantagem interpretativa',
    description: 'Recebe presságios quando seu território protegido é ameaçado.',
  },
  {
    id: 'muralha-mental',
    label: 'Muralha Mental',
    type: 'advantage',
    subtitle: 'Vantagem interpretativa',
    description: 'Bloqueia leituras passivas de mente, emoções e intenções.',
  },
  {
    id: 'laco-parceria',
    label: 'Laço de Parceria',
    type: 'advantage',
    subtitle: 'Vantagem interpretativa',
    description: 'Cria comunicação telepática privada e percepção emocional do parceiro.',
  },
  {
    id: 'debil',
    label: 'Débil',
    type: 'disadvantage',
    subtitle: 'Desvantagem sistemática',
    description: 'Impõe -2 em todos os testes que envolvam Vigor.',
    modifier: { attribute: 'vigor', value: -2 },
  },
  {
    id: 'vagaroso',
    label: 'Vagaroso',
    type: 'disadvantage',
    subtitle: 'Desvantagem sistemática',
    description: 'Impõe -2 em todos os testes que envolvam Agilidade.',
    modifier: { attribute: 'agilidade', value: -2 },
  },
  {
    id: 'minguante',
    label: 'Minguante',
    type: 'disadvantage',
    subtitle: 'Desvantagem sistemática',
    description: 'Impõe -2 em todos os testes que envolvam Canalização.',
    modifier: { attribute: 'canalizacao', value: -2 },
  },
  {
    id: 'apatico',
    label: 'Apático',
    type: 'disadvantage',
    subtitle: 'Desvantagem sistemática',
    description: 'Impõe -2 em todos os testes que envolvam Determinação.',
    modifier: { attribute: 'determinacao', value: -2 },
  },
  {
    id: 'ingenuo',
    label: 'Ingênuo',
    type: 'disadvantage',
    subtitle: 'Desvantagem sistemática',
    description: 'Impõe -2 em todos os testes que envolvam Astúcia.',
    modifier: { attribute: 'astucia', value: -2 },
  },
  {
    id: 'torpe',
    label: 'Torpe',
    type: 'disadvantage',
    subtitle: 'Desvantagem sistemática',
    description: 'Impõe -2 em todos os testes que envolvam Encanto.',
    modifier: { attribute: 'encanto', value: -2 },
  },
  {
    id: 'ancoragem-terrena',
    label: 'Ancoragem Terrena',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'Impede o uso de Atravessar, exigindo deslocamento físico.',
  },
  {
    id: 'magia-indomita',
    label: 'Magia Indômita',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'Torna usos utilitários da magia instáveis e perigosos em caso de falha.',
  },
  {
    id: 'alergia-freixo',
    label: 'Alergia ao Freixo',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'Freixo suprime cura e regeneração, deixando o personagem vulnerável.',
  },
  {
    id: 'tatuagem-contrato',
    label: 'Tatuagem de Contrato',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'Permite que o detentor do contrato force ações ou puna resistência.',
  },
  {
    id: 'instabilidade-magica',
    label: 'Instabilidade Mágica',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'Faz a magia escapar involuntariamente sob estresse.',
  },
  {
    id: 'cicatriz-territorial',
    label: 'Cicatriz Territorial',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'Causa agonia quando o território de origem é invadido ou corrompido.',
  },
  {
    id: 'assombrado-bogge',
    label: 'Assombrado pelo Bogge',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'Falhas críticas podem manifestar o Bogge como ameaça narrativa imediata.',
  },
  {
    id: 'eco-parceria',
    label: 'Eco de Parceria',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'Um laço perdido causa melancolia, dor e distração em momentos críticos.',
  },
]

const lineageGifts: LineageGift[] = [
  {
    court: 'Corte Primaveril',
    title: 'Dom da Mutação e do Crescimento',
    description: 'Poder de raízes, couraça viva, instinto predatório e florescimento vital.',
    levels: {
      1: {
        name: 'Vigor da Floresta',
        description: 'O sangue pulsa com a seiva de árvores ancestrais, endurecendo as fibras musculares.',
        effect: '+1 em Combate ou +1 em Vigor.',
      },
      2: {
        name: 'Florescer Vital',
        description: 'A vida irrompe onde o feérico pisa, fechando feridas ou envolvendo o personagem em magnetismo natural.',
        effect: '+20 de Vitalidade ou +2 em Encanto.',
      },
      3: {
        name: 'Raízes Constritoras',
        description: 'O solo atende ao comando, fazendo brotar amarras vegetais e espinhos que imobilizam e perfuram o alvo.',
        effect: '+30 de Dano de Constrição ou +3 em Sobrevivência.',
      },
      4: {
        name: 'Garra da Besta',
        description: 'O personagem inicia uma transição física onde garras e instintos de predador alfa assumem o controle total.',
        effect: '+4 em Letalidade ou +4 em Sobrevivência.',
      },
      5: {
        name: 'Avatar da Natureza',
        description: 'O imortal manifesta a autoridade de um Grão-Senhor, tornando-se uma força física ou social imparável perante a criação.',
        effect: '+5 em Vigor ou +5 em Encanto.',
      },
    },
  },
  {
    court: 'Corte Estival',
    title: 'Dom das Marés e das Tempestades',
    description: 'Magia oceânica de cura, fluidez, pressão abissal e fúria tempestuosa.',
    levels: {
      1: {
        name: 'Impulso das Ondas',
        description: 'O feérico sintoniza seus movimentos com o fluxo das marés, tornando suas ações fluidas e leves.',
        effect: '+1 em Agilidade ou +1 em Atletismo.',
      },
      2: {
        name: 'Maré Revigorante',
        description: 'A umidade ao redor torna-se um bálsamo que limpa feridas e remove o cansaço imediato.',
        effect: '+20 de Vitalidade ou +2 em Agilidade.',
      },
      3: {
        name: 'Pressão Abissal',
        description: 'O personagem dispara jatos de água sólida com o peso das fossas oceânicas, capaz de quebrar ossos.',
        effect: '+30 de Dano Arcano ou +3 em Atletismo.',
      },
      4: {
        name: 'Fúria do Mar',
        description: 'A eletricidade que precede a tempestade é convocada para açoitar múltiplos adversários simultaneamente.',
        effect: 'atinge até 3 alvos com Arcano ou +4 em Canalização.',
      },
      5: {
        name: 'Tsunami de Poder',
        description: 'Uma massa colossal de energia oceânica varre a cena, alterando a paisagem e obliterando qualquer oposição.',
        effect: '+50 de Dano Arcano ou +5 em Canalização.',
      },
    },
  },
  {
    court: 'Corte Outonal',
    title: 'Dom do Fogo e da Fúria',
    description: 'Chamas de comando, ameaça, explosão pirocinética e fúria purificadora.',
    levels: {
      1: {
        name: 'Presença Incendiária',
        description: 'O feérico emana um calor latente que faz o ar vibrar, impondo uma ameaça silenciosa ao ambiente.',
        effect: '+1 em Intimidação ou +1 em Canalização.',
      },
      2: {
        name: 'Chamas de Batalha',
        description: 'O fogo da linhagem flui para as lâminas, garantindo que cada golpe cauterize e exploda em brasas.',
        effect: '+2 em Letalidade ou +2 em Combate.',
      },
      3: {
        name: 'Cinzas ao Vento',
        description: 'Uma explosão pirocinética devora o oxigênio ao redor, forçando a submissão imediata dos sobreviventes.',
        effect: '+30 de Dano Arcano ou +3 em Intimidação.',
      },
      4: {
        name: 'Inferno de Folhas',
        description: 'O personagem torna-se o centro de um vórtice ardente que ataca em todas as direções como um vendaval.',
        effect: 'atinge até 3 alvos com Arcano ou +4 em Combate.',
      },
      5: {
        name: 'Labareda de Sangue',
        description: 'A fúria atinge o ápice místico onde o fogo torna-se branco, consumindo a própria essência vital do adversário.',
        effect: '+50 de Dano Arcano ou +5 em Combate.',
      },
    },
  },
  {
    court: 'Corte Invernal',
    title: 'Dom do Gelo e da Estagnação',
    description: 'Frio absoluto, couraça de gelo, paralisia, lâminas de neve e estagnação.',
    levels: {
      1: {
        name: 'Resiliência Gélida',
        description: 'Uma camada de geada emana dos poros, agindo como uma couraça que amortece impactos e anestesia a dor.',
        effect: '+1 em Resistência ou +1 em Vigor.',
      },
      2: {
        name: 'Prisão de Gelo',
        description: 'A umidade ao redor condensa-se instantaneamente para imobilizar os membros do oponente ou disparar projéteis de gelo.',
        effect: '+20 de Dano Arcano ou +2 em Constrição.',
      },
      3: {
        name: 'Coração de Rocha',
        description: 'O sangue corre lento como seiva congelada, conferindo uma força física e mental inabalável.',
        effect: '+3 em Vigor ou +3 em Determinação.',
      },
      4: {
        name: 'Vento Cortante',
        description: 'Uma nevasca envolve as mãos do feérico, transformando cada golpe em uma lâmina capaz de estilhaçar aço.',
        effect: '+4 em Letalidade ou +4 em Constrição.',
      },
      5: {
        name: 'Inverno Eterno',
        description: 'O personagem manifesta uma zona de frio absoluto onde o movimento cessa e a vida se interrompe sob seu comando.',
        effect: '+50 de Dano Arcano ou +5 em Resistência.',
      },
    },
  },
  {
    court: 'Corte Diurna',
    title: 'Dom da Luz e da Verdade',
    description: 'Luz solar, revelação, purificação, clareza intelectual e restauração.',
    levels: {
      1: {
        name: 'Luz da Verdade',
        description: 'O feérico emana um brilho que limpa o ar e aguça os sentidos para enxergar além das aparências comuns.',
        effect: '+1 em Investigação ou +1 em Astúcia.',
      },
      2: {
        name: 'Fulgor Vital',
        description: 'O calor do sol flui para as veias, acelerando a biologia imortal para fechar feridas ou repelir agressões.',
        effect: '+20 de Vitalidade ou +2 em Resistência.',
      },
      3: {
        name: 'Helianto Devastador',
        description: 'O poder solar é focado como uma lente, incinerando o que toca ou potencializando estudos e rituais complexos.',
        effect: '+30 de Dano Arcano ou +3 em Feitiçaria.',
      },
      4: {
        name: 'Veredito Solar',
        description: 'A mente alcança clareza absoluta, permitindo identificar falhas fatais no espírito e na armadura dos adversários.',
        effect: '+4 em Letalidade ou +4 em Astúcia.',
      },
      5: {
        name: 'Purificação Suprema',
        description: 'O imortal torna-se um condutor vivo para o sol, gerando uma explosão que restaura aliados e reduz sombras a cinzas.',
        effect: '+50 de Dano Arcano ou +5 em Regeneração.',
      },
    },
  },
  {
    court: 'Corte Crepuscular',
    title: 'Dom da Transformação e da Renovação',
    description: 'Magia de transição, cura, harmonia, barreiras de aurora e proteção.',
    levels: {
      1: {
        name: 'Canto da Alvorada',
        description: 'Uma melodia suave ressoa no sangue, harmonizando o ritmo do grupo e facilitando a diplomacia elegante.',
        effect: '+1 em Sinergia ou +1 em Encanto.',
      },
      2: {
        name: 'Ressonância Suave',
        description: 'Uma onda de luz rosada acalma as dores físicas ou ancora a presença de um guardião resoluto.',
        effect: '+20 de Vitalidade ou +2 em Égide.',
      },
      3: {
        name: 'Barreira de Aurora',
        description: 'A luz do horizonte é tecida em uma cúpula translúcida que absorve impactos e purifica intenções hostis.',
        effect: '+3 em Resistência ou +3 em Sinergia.',
      },
      4: {
        name: 'Alento Coletivo',
        description: 'O feérico libera partículas de luz que restauram o ânimo de legiões ou dominam salões inteiros com benevolência.',
        effect: 'cura +20 Vitalidade em até 3 aliados ou +4 em Encanto.',
      },
      5: {
        name: 'Escudo do Destino',
        description: 'O personagem nega a derrota através de um clarão magnífico que restaura corpos destroçados e cria um baluarte invencível.',
        effect: '+75 de Vitalidade ou +5 em Égide.',
      },
    },
  },
  {
    court: 'Corte Noturna',
    title: 'Dom das Sombras e das Estrelas',
    description: 'Sombras vivas, luz fria, domínio mental, chicotes noturnos e medo soberano.',
    levels: {
      1: {
        name: 'Véu de Sombras',
        description: 'A escuridão ao redor torna-se densa e consciente, agindo como camuflagem perfeita ou impulso para o movimento.',
        effect: '+1 em Dissimulação ou +1 em Agilidade.',
      },
      2: {
        name: 'Estilhaços de Estrelas',
        description: 'O personagem materializa luz fria em lâminas de energia pura ou a utiliza para perfurar mentiras e ilusões.',
        effect: 'atinge até 2 alvos com Arcano ou +2 em Investigação.',
      },
      3: {
        name: 'Invasão Obscura',
        description: 'O feérico projeta sua consciência ou sombras para dentro do inimigo, causando agonia física e domínio mental profundo.',
        effect: '+30 de Dano Arcano ou +3 em Mentalismo.',
      },
      4: {
        name: 'Chicotes Noturnos',
        description: 'Trevas tangíveis emergem das mãos do imortal para dominar o campo de batalha com uma velocidade que desafia a visão.',
        effect: 'atinge até 3 alvos com Arcano ou +4 em Agilidade.',
      },
      5: {
        name: 'Soberania do Medo',
        description: 'O personagem manifesta a aura esmagadora de um Grão-Senhor, onde o som desaparece e a realidade se curva à sua vontade.',
        effect: '+50 de Dano Arcano ou +5 em Arcano.',
      },
    },
  },
]

function createCharacter(index: number): Character {
  return {
    name: `Personagem ${index}`,
    court: '',
    attributes: {
      vigor: 1,
      agilidade: 1,
      canalizacao: 1,
      determinacao: 1,
      astucia: 1,
      encanto: 1,
    },
    skills: [],
    traits: [],
    lineageGiftLevel: 0,
  }
}

function getStoredPlayerId() {
  const existingId = window.localStorage.getItem(PLAYER_ID_STORAGE_KEY)

  if (existingId) {
    return existingId
  }

  const generatedId =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

  window.localStorage.setItem(PLAYER_ID_STORAGE_KEY, generatedId)
  return generatedId
}

function normalizeCharacter(character: Partial<Character>, index: number): Character {
  const fallback = createCharacter(index)

  return {
    name: typeof character.name === 'string' ? character.name : fallback.name,
    court: typeof character.court === 'string' ? character.court : fallback.court,
    attributes: {
      vigor: clampLevel(Number(character.attributes?.vigor ?? fallback.attributes.vigor)),
      agilidade: clampLevel(Number(character.attributes?.agilidade ?? fallback.attributes.agilidade)),
      canalizacao: clampLevel(Number(character.attributes?.canalizacao ?? fallback.attributes.canalizacao)),
      determinacao: clampLevel(Number(character.attributes?.determinacao ?? fallback.attributes.determinacao)),
      astucia: clampLevel(Number(character.attributes?.astucia ?? fallback.attributes.astucia)),
      encanto: clampLevel(Number(character.attributes?.encanto ?? fallback.attributes.encanto)),
    },
    skills: Array.isArray(character.skills)
      ? character.skills
          .filter((skill) => typeof skill?.id === 'string')
          .map((skill) => ({ id: skill.id, level: clampLevel(Number(skill.level)) }))
      : [],
    traits: Array.isArray(character.traits) ? character.traits.filter((trait) => typeof trait === 'string') : [],
    lineageGiftLevel: Number(character.lineageGiftLevel) === 0 ? 0 : clampLevel(Number(character.lineageGiftLevel ?? 0)),
  }
}

function clampLevel(value: number) {
  if (Number.isNaN(value)) {
    return 1
  }

  return Math.min(5, Math.max(1, value))
}

function progressiveCost(level: number, costs: Record<number, number>) {
  let total = 0

  for (let current = 1; current <= level; current += 1) {
    total += costs[current]
  }

  return total
}

function attributeCost(level: number) {
  let total = 0

  for (let current = 2; current <= level; current += 1) {
    total += attributeLevelCosts[current]
  }

  return total
}

function skillCost(level: number) {
  return progressiveCost(level, skillLevelCosts)
}

function lineageGiftCost(level: number) {
  return progressiveCost(level, lineageGiftLevelCosts)
}

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

function xpDelta(value: number) {
  if (value === 0) {
    return 'Gratuito'
  }

  return value > 0 ? `+${value} XP` : `${value} XP`
}

function renderGiftEffect(level: LineageGift['levels'][number]) {
  return (
    <>
      {level.name}: <strong>{level.effect}</strong>
    </>
  )
}

function getDerivedAttributes(character: Character): DerivedAttribute[] {
  const { vigor, agilidade, canalizacao, determinacao, astucia } = character.attributes

  return [
    {
      label: 'Vitalidade',
      value: (vigor + determinacao) * 25,
      formula: '(Vigor + Determinação) x 25',
    },
    {
      label: 'Mana',
      value: (canalizacao + astucia) * 20,
      formula: '(Canalização + Astúcia) x 20',
    },
    {
      label: 'Stamina',
      value: (vigor + agilidade) * 20,
      formula: '(Vigor + Agilidade) x 20',
    },
    {
      label: 'Iniciativa',
      value: agilidade + astucia,
      formula: 'Agilidade + Astúcia',
    },
  ]
}

function App() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [characters, setCharacters] = useState<Character[]>([createCharacter(1)])
  const [activeCharacterIndex, setActiveCharacterIndex] = useState(0)
  const [selectedSkillId, setSelectedSkillId] = useState('')
  const [hoveredSkillId, setHoveredSkillId] = useState('')
  const [selectedAdvantageId, setSelectedAdvantageId] = useState('')
  const [selectedDisadvantageId, setSelectedDisadvantageId] = useState('')
  const [hoveredTraitId, setHoveredTraitId] = useState('')
  const [hoveredGiftLevel, setHoveredGiftLevel] = useState<number | null>(null)
  const [playerId] = useState(getStoredPlayerId)
  const [isLoaded, setIsLoaded] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'loading' | 'saved' | 'saving' | 'error'>('loading')

  const character = characters[activeCharacterIndex]
  const selectedSkillIds = character.skills.map((skill) => skill.id)
  const availableSkills = skills.filter((skill) => !selectedSkillIds.includes(skill.id))
  const hoveredSkill = skills.find((skill) => skill.id === hoveredSkillId)
  const selectedTraits = traits.filter((trait) => character.traits.includes(trait.id))
  const selectedTraitIds = selectedTraits.map((trait) => trait.id)
  const availableAdvantages = traits.filter((trait) => trait.type === 'advantage' && !selectedTraitIds.includes(trait.id))
  const availableDisadvantages = traits.filter((trait) => trait.type === 'disadvantage' && !selectedTraitIds.includes(trait.id))
  const hoveredTrait = traits.find((trait) => trait.id === hoveredTraitId)
  const selectedAdvantages = selectedTraits.filter((trait) => trait.type === 'advantage')
  const selectedDisadvantages = selectedTraits.filter((trait) => trait.type === 'disadvantage')
  const lineageGift = lineageGifts.find((gift) => gift.court === character.court)
  const activeGiftHelpLevel = hoveredGiftLevel ?? (character.lineageGiftLevel || null)
  const creditedDisadvantageIds = selectedTraits
    .filter((trait) => trait.type === 'disadvantage')
    .slice(0, DISADVANTAGE_CREDIT_LIMIT)
    .map((trait) => trait.id)

  const attributeModifiers = useMemo(
    () =>
      selectedTraits.reduce(
        (modifiers, trait) => {
          if (trait.modifier) {
            modifiers[trait.modifier.attribute] += trait.modifier.value
          }

          return modifiers
        },
        {
          vigor: 0,
          agilidade: 0,
          canalizacao: 0,
          determinacao: 0,
          astucia: 0,
          encanto: 0,
        } satisfies Record<AttributeKey, number>,
      ),
    [selectedTraits],
  )

  const spentXp = useMemo(() => {
    const attributeXp = Object.values(character.attributes).reduce((total, level) => total + attributeCost(level), 0)
    const skillXp = character.skills.reduce((total, skill) => total + skillCost(skill.level), 0)
    const advantages = selectedTraits.filter((trait) => trait.type === 'advantage').length
    const disadvantages = selectedTraits.filter((trait) => trait.type === 'disadvantage').length
    const traitXp = advantages * ADVANTAGE_COST - Math.min(disadvantages, DISADVANTAGE_CREDIT_LIMIT) * ADVANTAGE_COST
    const lineageGiftXp = character.lineageGiftLevel > 0 ? lineageGiftCost(character.lineageGiftLevel) : 0

    return attributeXp + skillXp + traitXp + lineageGiftXp
  }, [character.attributes, character.skills, character.lineageGiftLevel, selectedTraits])

  const remainingXp = INITIAL_XP - spentXp
  const derivedAttributes = useMemo(() => getDerivedAttributes(character), [character])

  useEffect(() => {
    let isCurrent = true

    fetch(`${SHEETS_API_URL}?playerId=${encodeURIComponent(playerId)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Nao foi possivel carregar as fichas.')
        }

        return response.json()
      })
      .then((data) => {
        if (!isCurrent) {
          return
        }

        const loadedCharacters =
          Array.isArray(data.characters) && data.characters.length > 0
            ? data.characters.slice(0, MAX_CHARACTERS).map((loadedCharacter: Partial<Character>, index: number) =>
                normalizeCharacter(loadedCharacter, index + 1),
              )
            : [createCharacter(1)]

        setTheme(data.theme === 'light' ? 'light' : 'dark')
        setCharacters(loadedCharacters)
        setActiveCharacterIndex(Math.min(Number(data.activeCharacterIndex) || 0, loadedCharacters.length - 1))
        setSaveStatus('saved')
      })
      .catch(() => {
        if (isCurrent) {
          setSaveStatus('error')
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoaded(true)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [playerId])

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    setSaveStatus('saving')
    const saveTimer = window.setTimeout(() => {
      fetch(`${SHEETS_API_URL}?playerId=${encodeURIComponent(playerId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme,
          activeCharacterIndex,
          characters,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Nao foi possivel salvar as fichas.')
          }

          setSaveStatus('saved')
        })
        .catch(() => setSaveStatus('error'))
    }, 600)

    return () => window.clearTimeout(saveTimer)
  }, [activeCharacterIndex, characters, isLoaded, playerId, theme])

  function updateActiveCharacter(updater: (character: Character) => Character) {
    setCharacters((currentCharacters) =>
      currentCharacters.map((currentCharacter, index) =>
        index === activeCharacterIndex ? updater(currentCharacter) : currentCharacter,
      ),
    )
  }

  function updateCharacter<K extends keyof Character>(key: K, value: Character[K]) {
    updateActiveCharacter((current) => ({ ...current, [key]: value }))
  }

  function updateAttribute(key: AttributeKey, value: number) {
    updateActiveCharacter((current) => ({
      ...current,
      attributes: {
        ...current.attributes,
        [key]: clampLevel(value),
      },
    }))
  }

  function updateCourt(court: string) {
    updateActiveCharacter((current) => ({
      ...current,
      court,
      lineageGiftLevel: 0,
    }))
    setHoveredGiftLevel(null)
  }

  function updateLineageGiftLevel(level: number) {
    updateActiveCharacter((current) => ({
      ...current,
      lineageGiftLevel: level === 0 ? 0 : clampLevel(level),
    }))
  }

  function addCharacter() {
    if (characters.length >= MAX_CHARACTERS) {
      return
    }

    const nextIndex = characters.length
    setCharacters((currentCharacters) => [...currentCharacters, createCharacter(currentCharacters.length + 1)])
    setActiveCharacterIndex(nextIndex)
    setSelectedSkillId('')
    setHoveredSkillId('')
    setSelectedAdvantageId('')
    setSelectedDisadvantageId('')
    setHoveredTraitId('')
    setHoveredGiftLevel(null)
  }

  function removeCharacter(indexToRemove: number) {
    if (indexToRemove === 0) {
      return
    }

    setCharacters((currentCharacters) => currentCharacters.filter((_, index) => index !== indexToRemove))
    setActiveCharacterIndex((currentIndex) => {
      if (currentIndex === indexToRemove) {
        return Math.max(0, indexToRemove - 1)
      }

      return currentIndex > indexToRemove ? currentIndex - 1 : currentIndex
    })
    setSelectedSkillId('')
    setHoveredSkillId('')
    setSelectedAdvantageId('')
    setSelectedDisadvantageId('')
    setHoveredTraitId('')
    setHoveredGiftLevel(null)
  }

  function resetSheets() {
    setCharacters([createCharacter(1)])
    setActiveCharacterIndex(0)
    setSelectedSkillId('')
    setHoveredSkillId('')
    setSelectedAdvantageId('')
    setSelectedDisadvantageId('')
    setHoveredTraitId('')
    setHoveredGiftLevel(null)
  }

  function addSkill() {
    if (!selectedSkillId || selectedSkillIds.includes(selectedSkillId)) {
      return
    }

    updateActiveCharacter((current) => ({
      ...current,
      skills: [...current.skills, { id: selectedSkillId, level: 1 }],
    }))
    setHoveredSkillId(selectedSkillId)
    setSelectedSkillId('')
  }

  function removeSkill(skillId: string) {
    updateActiveCharacter((current) => ({
      ...current,
      skills: current.skills.filter((skill) => skill.id !== skillId),
    }))

    if (hoveredSkillId === skillId) {
      setHoveredSkillId('')
    }
  }

  function updateSkillLevel(skillId: string, level: number) {
    updateActiveCharacter((current) => ({
      ...current,
      skills: current.skills.map((skill) => (skill.id === skillId ? { ...skill, level: clampLevel(level) } : skill)),
    }))
  }

  function addTrait(traitId: string) {
    const selectedTrait = traits.find((trait) => trait.id === traitId)
    const advantageCount = selectedTraits.filter((trait) => trait.type === 'advantage').length

    if (!selectedTrait || selectedTraitIds.includes(selectedTrait.id)) {
      return
    }

    if (selectedTrait.type === 'advantage' && advantageCount >= MAX_ADVANTAGES) {
      return
    }

    updateActiveCharacter((current) => ({
      ...current,
      traits: [...current.traits, selectedTrait.id],
    }))
    setHoveredTraitId(selectedTrait.id)
    if (selectedTrait.type === 'advantage') {
      setSelectedAdvantageId('')
    } else {
      setSelectedDisadvantageId('')
    }
  }

  function removeTrait(traitId: string) {
    updateActiveCharacter((current) => ({
      ...current,
      traits: current.traits.filter((currentTraitId) => currentTraitId !== traitId),
    }))

    if (hoveredTraitId === traitId) {
      setHoveredTraitId('')
    }
  }

  return (
    <main className="app-shell" data-theme={theme}>
      <section className="sheet-header">
        <div className="title-block">
          <span className="eyebrow">Calculadora de ficha</span>
          <h1>A Court of Whispers and Shadows</h1>
        </div>
        <div className="header-actions">
          <button className="ghost-button" type="button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          <span className={`save-status ${saveStatus}`}>
            {saveStatus === 'loading' && 'Carregando fichas...'}
            {saveStatus === 'saving' && 'Salvando...'}
            {saveStatus === 'saved' && 'Fichas salvas'}
            {saveStatus === 'error' && 'Backend offline'}
          </span>
          <div className="header-stats" aria-label="Resumo de XP">
            <strong>{INITIAL_XP} XP</strong>
            <strong>{spentXp} gasto</strong>
            <strong className={remainingXp < 0 ? 'danger' : 'success'}>{remainingXp} restante</strong>
          </div>
        </div>
      </section>

      <section className="workspace">
        <form className="panel character-form">
          <div className="panel-heading character-heading">
            <h2>Personagens</h2>
            <div className="character-actions">
              <button className="icon-button" type="button" onClick={addCharacter} disabled={characters.length >= MAX_CHARACTERS}>
                +
              </button>
              <button className="ghost-button" type="button" onClick={resetSheets}>
                Reset
              </button>
            </div>
          </div>

          <div className="character-tabs" role="tablist" aria-label="Personagens criados">
            {characters.map((tabCharacter, index) => (
              <button
                className={index === activeCharacterIndex ? 'character-tab active' : 'character-tab'}
                key={`${tabCharacter.name}-${index}`}
                type="button"
                onClick={() => {
                  setActiveCharacterIndex(index)
                  setSelectedSkillId('')
                  setHoveredSkillId('')
                  setSelectedAdvantageId('')
                  setSelectedDisadvantageId('')
                  setHoveredTraitId('')
                  setHoveredGiftLevel(null)
                }}
              >
                <span>{tabCharacter.name || `Personagem ${index + 1}`}</span>
                {index > 0 && (
                  <small
                    aria-label={`Fechar personagem ${index + 1}`}
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation()
                      removeCharacter(index)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        event.stopPropagation()
                        removeCharacter(index)
                      }
                    }}
                  >
                    ×
                  </small>
                )}
              </button>
            ))}
          </div>

          <div className="field-grid">
            <label>
              Nome
              <input value={character.name} onChange={(event) => updateCharacter('name', event.target.value)} />
            </label>
            <label>
              Corte
              <select value={character.court} onChange={(event) => updateCourt(event.target.value)}>
                <option value="">Selecione...</option>
                {courts.map((court) => (
                  <option key={court} value={court}>
                    {court}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </form>

        <section className="panel cost-panel">
          <h2>Custo de evolução dos atributos principais</h2>
          <div className="cost-grid">
            {Object.entries(attributeLevelCosts).map(([level, cost]) => (
              <span key={level}>
                <strong>Nível {level}</strong>
                <em>{cost === 0 ? 'Gratuito' : `${cost} XP`}</em>
              </span>
            ))}
          </div>
        </section>

        <section className="panel xp-panel">
          <div className="panel-heading">
            <h2>Atributos principais</h2>
            <span className={remainingXp < 0 ? 'budget danger' : 'budget success'}>{remainingXp} XP</span>
          </div>
          <div className="attribute-grid">
            {attributes.map((attribute) => {
              const level = character.attributes[attribute.key]
              const cost = attributeCost(level)

              return (
                <label className="attribute-control" key={attribute.key}>
                  <span>
                    <strong>{attribute.label}</strong>
                    {attribute.description}
                  </span>
                  <select value={level} onChange={(event) => updateAttribute(attribute.key, Number(event.target.value))}>
                    <option value="1">Nível 1</option>
                    <option value="2">Nível 2</option>
                    <option value="3">Nível 3</option>
                    <option value="4">Nível 4</option>
                    <option value="5">Nível 5</option>
                  </select>
                  <em>
                    <small className={cost === 0 ? 'xp-delta free' : 'xp-delta spend'}>{cost === 0 ? 'Gratuito' : xpDelta(-cost)}</small>
                    {attributeModifiers[attribute.key] !== 0 && (
                      <small className={attributeModifiers[attribute.key] > 0 ? 'success' : 'danger'}>
                        {signed(attributeModifiers[attribute.key])}
                      </small>
                    )}
                  </em>
                </label>
              )
            })}
          </div>
        </section>

        <section className="panel derived-panel">
          <h2>Atributos derivados</h2>
          <div className="derived-grid">
            {derivedAttributes.map((attribute) => (
              <article className="derived-card" key={attribute.label}>
                <span>{attribute.label}</span>
                <strong>{attribute.value}</strong>
                <small>{attribute.formula}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="panel traits-panel">
          <div className="panel-heading">
            <h2>Vantagens e desvantagens</h2>
            <span className="budget">{selectedTraits.length} adicionadas</span>
          </div>

          <div className="skills-workspace">
            <div className="trait-columns">
              <section className="trait-column">
                <h3>Vantagens</h3>
                {selectedAdvantages.length >= MAX_ADVANTAGES && (
                  <p className="limit-note">Limite de 3 vantagens alcançado. Não é possível adicionar mais.</p>
                )}
                <div className="skill-picker">
                  <select value={selectedAdvantageId} onChange={(event) => setSelectedAdvantageId(event.target.value)}>
                    <option value="">Selecione uma vantagem...</option>
                    {availableAdvantages.map((trait) => (
                      <option key={trait.id} value={trait.id}>
                        {trait.label}
                      </option>
                    ))}
                  </select>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => addTrait(selectedAdvantageId)}
                    disabled={!selectedAdvantageId || selectedAdvantages.length >= MAX_ADVANTAGES}
                  >
                    +
                  </button>
                </div>

                <div className="skill-list">
                  {selectedAdvantages.length === 0 && <p className="empty-state">Nenhuma vantagem adicionada.</p>}
                  {selectedAdvantages.map((trait) => (
                    <article
                      className="trait-row"
                      key={trait.id}
                      onMouseEnter={() => setHoveredTraitId(trait.id)}
                      onFocus={() => setHoveredTraitId(trait.id)}
                    >
                      <span>
                        <strong>{trait.label}</strong>
                        {trait.subtitle}
                      </span>
                      <em className="xp-delta spend">{xpDelta(-ADVANTAGE_COST)}</em>
                      <button className="icon-button danger-button" type="button" onClick={() => removeTrait(trait.id)}>
                        -
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <section className="trait-column">
                <h3>Desvantagens</h3>
                <div className="skill-picker">
                  <select value={selectedDisadvantageId} onChange={(event) => setSelectedDisadvantageId(event.target.value)}>
                    <option value="">Selecione uma desvantagem...</option>
                    {availableDisadvantages.map((trait) => (
                      <option key={trait.id} value={trait.id}>
                        {trait.label}
                      </option>
                    ))}
                  </select>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => addTrait(selectedDisadvantageId)}
                    disabled={!selectedDisadvantageId}
                  >
                    +
                  </button>
                </div>

                <div className="skill-list">
                  {selectedDisadvantages.length === 0 && <p className="empty-state">Nenhuma desvantagem adicionada.</p>}
                  {selectedDisadvantages.map((trait) => {
                    const grantsCredit = creditedDisadvantageIds.includes(trait.id)

                    return (
                      <article
                        className="trait-row"
                        key={trait.id}
                        onMouseEnter={() => setHoveredTraitId(trait.id)}
                        onFocus={() => setHoveredTraitId(trait.id)}
                      >
                        <span>
                          <strong>{trait.label}</strong>
                          {trait.subtitle}
                        </span>
                        <em className={grantsCredit ? 'xp-delta credit' : 'xp-delta free'}>
                          {grantsCredit ? xpDelta(ADVANTAGE_COST) : '0 XP'}
                        </em>
                        <button className="icon-button danger-button" type="button" onClick={() => removeTrait(trait.id)}>
                          -
                        </button>
                      </article>
                    )
                  })}
                </div>
              </section>
            </div>

            <aside className="skill-help">
              {hoveredTrait ? (
                <>
                  <span>{hoveredTrait.subtitle}</span>
                  <strong>{hoveredTrait.label}</strong>
                  <p>{hoveredTrait.description}</p>
                </>
              ) : (
                <>
                  <span>Ajuda rápida</span>
                  <strong>Vantagens e desvantagens</strong>
                  <p>Passe o mouse sobre um traço adicionado para ver sua função e impacto na ficha.</p>
                </>
              )}
            </aside>
          </div>
        </section>

        <section className="panel cost-panel">
          <h2>Custo de evolução dos dons de linhagem</h2>
          <div className="cost-grid">
            {Object.entries(lineageGiftLevelCosts).map(([level, cost]) => (
              <span key={level}>
                <strong>Nível {level}</strong>
                <em>{cost} XP</em>
              </span>
            ))}
          </div>
        </section>

        <section className="panel lineage-panel">
          <div className="panel-heading">
            <h2>Dons de linhagem</h2>
            <span className="budget">{lineageGift ? character.court : 'Selecione uma Corte'}</span>
          </div>

          {lineageGift ? (
            <div className="lineage-gift">
              <div className="lineage-main">
                <div className="lineage-summary">
                  <span>{character.court}</span>
                  <strong>{lineageGift.title}</strong>
                  <p>{lineageGift.description}</p>
                </div>

                <div className="lineage-levels">
                  {Object.entries(lineageGift.levels).map(([level, effect]) => {
                    const numericLevel = Number(level)

                    return (
                      <article
                        className={numericLevel <= character.lineageGiftLevel ? 'active' : ''}
                        key={level}
                        onMouseEnter={() => setHoveredGiftLevel(numericLevel)}
                        onFocus={() => setHoveredGiftLevel(numericLevel)}
                      >
                        <strong>Nível {level}</strong>
                        <p>{renderGiftEffect(effect)}</p>
                      </article>
                    )
                  })}
                </div>
              </div>

              <aside className="lineage-side">
                <label className="lineage-level">
                  Nível do dom
                  <select value={character.lineageGiftLevel} onChange={(event) => updateLineageGiftLevel(Number(event.target.value))}>
                    <option value="0">Não despertado</option>
                    <option value="1">Nível 1</option>
                    <option value="2">Nível 2</option>
                    <option value="3">Nível 3</option>
                    <option value="4">Nível 4</option>
                    <option value="5">Nível 5</option>
                  </select>
                  <em className={character.lineageGiftLevel > 0 ? 'xp-delta spend' : 'xp-delta free'}>
                    {character.lineageGiftLevel > 0 ? xpDelta(-lineageGiftCost(character.lineageGiftLevel)) : '0 XP'}
                  </em>
                </label>

                <div className="skill-help lineage-help">
                  {activeGiftHelpLevel ? (
                    <>
                      <span>Ajuda rápida</span>
                      <strong>Nível {activeGiftHelpLevel}</strong>
                      <p>{lineageGift.levels[activeGiftHelpLevel].description}</p>
                    </>
                  ) : (
                    <>
                      <span>Ajuda rápida</span>
                      <strong>Dons de linhagem</strong>
                      <p>Passe o mouse sobre um nível para ver o efeito. Apenas níveis despertados entram na ficha.</p>
                    </>
                  )}
                </div>
              </aside>
            </div>
          ) : (
            <p className="empty-state">Selecione uma Corte para visualizar o dom de linhagem correspondente.</p>
          )}
        </section>

        <section className="panel cost-panel">
          <h2>Custo de evolução das perícias</h2>
          <div className="cost-grid">
            {Object.entries(skillLevelCosts).map(([level, cost]) => (
              <span key={level}>
                <strong>Nível {level}</strong>
                <em>{cost} XP</em>
              </span>
            ))}
          </div>
        </section>

        <section className="panel skills-panel">
          <div className="panel-heading">
            <h2>Perícias</h2>
            <span className="budget">{character.skills.length} adicionadas</span>
          </div>

          <div className="skill-picker">
            <select value={selectedSkillId} onChange={(event) => setSelectedSkillId(event.target.value)}>
              <option value="">Selecione uma perícia...</option>
              {availableSkills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.label}
                </option>
              ))}
            </select>
            <button className="icon-button" type="button" onClick={addSkill} disabled={!selectedSkillId}>
              +
            </button>
          </div>

          <div className="skills-workspace">
            <div className="skill-list">
              {character.skills.length === 0 && <p className="empty-state">Nenhuma perícia adicionada.</p>}
              {character.skills.map((characterSkill) => {
                const skill = skills.find((currentSkill) => currentSkill.id === characterSkill.id)

                if (!skill) {
                  return null
                }

                return (
                  <article
                    className="skill-row"
                    key={characterSkill.id}
                    onMouseEnter={() => setHoveredSkillId(characterSkill.id)}
                    onFocus={() => setHoveredSkillId(characterSkill.id)}
                  >
                    <span>
                      <strong>{skill.label}</strong>
                      {skill.subtitle}
                    </span>
                    <select
                      value={characterSkill.level}
                      onChange={(event) => updateSkillLevel(characterSkill.id, Number(event.target.value))}
                    >
                      <option value="1">Nível 1</option>
                      <option value="2">Nível 2</option>
                      <option value="3">Nível 3</option>
                      <option value="4">Nível 4</option>
                      <option value="5">Nível 5</option>
                    </select>
                    <em className="xp-delta spend">{xpDelta(-skillCost(characterSkill.level))}</em>
                    <button className="icon-button danger-button" type="button" onClick={() => removeSkill(characterSkill.id)}>
                      -
                    </button>
                  </article>
                )
              })}
            </div>

            <aside className="skill-help">
              {hoveredSkill ? (
                <>
                  <span>{hoveredSkill.subtitle}</span>
                  <strong>{hoveredSkill.label}</strong>
                  <p>{hoveredSkill.description}</p>
                </>
              ) : (
                <>
                  <span>Ajuda rápida</span>
                  <strong>Perícias</strong>
                  <p>Passe o mouse sobre uma perícia adicionada para ver sua função dentro do sistema.</p>
                </>
              )}
            </aside>
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
