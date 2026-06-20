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
  type: 'Bélica' | 'Erudita' | 'Hereditária'
  court?: string
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

type BattleDiscipline = {
  id: string
  title: string
  subtitle: string
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

type CharacterBattleDiscipline = {
  id: string
  level: number
}

type Character = {
  name: string
  court: string
  attributes: Record<AttributeKey, number>
  skills: CharacterSkill[]
  battleDisciplines: CharacterBattleDiscipline[]
  traits: string[]
  lineageGiftLevel: number
  secondaryLineageGiftCourt: string
  secondaryLineageGiftLevel: number
}

type DerivedAttribute = {
  label: string
  value: number
  formula: string
}

type SheetPayload = {
  theme: Theme
  activeCharacterIndex: number
  characters: Character[]
}

const INITIAL_XP = 900
const MAX_CHARACTERS = 3
const ADVANTAGE_COST = 100
const MAX_ADVANTAGES = 3
const MAX_DISADVANTAGES = 3
const DISADVANTAGE_CREDIT_LIMIT = 3
const SHEETS_API_URL = '/api/sheets'
const PLAYER_ID_STORAGE_KEY = 'acowas-player-id'

const attributeLevelCosts: Record<number, number> = {
  1: 20,
  2: 40,
  3: 60,
  4: 80,
  5: 100,
}

const skillLevelCosts: Record<number, number> = {
  1: 20,
  2: 40,
  3: 60,
  4: 80,
  5: 100,
}

const lineageGiftLevelCosts: Record<number, number> = {
  1: 20,
  2: 40,
  3: 60,
  4: 80,
  5: 100,
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
    type: 'Bélica',
    subtitle: 'Ataque físico',
    description: 'Usada para golpes com lâminas, armas, corpo a corpo, arcos e investidas físicas.',
  },
  {
    id: 'arcano',
    label: 'Arcano',
    type: 'Bélica',
    subtitle: 'Ataque mágico',
    description: 'Exterioriza poder ofensivo: elementos, energia pura, rajadas, chamas e ataques místicos.',
  },
  {
    id: 'constricao',
    label: 'Constrição',
    type: 'Bélica',
    subtitle: 'Imobilização e restrição',
    description: 'Contém alvos por agarres, submissões, amarras mágicas, sombras, raízes ou paralisia mental.',
  },
  {
    id: 'resistencia',
    label: 'Resistência',
    type: 'Bélica',
    subtitle: 'Defesa geral',
    description: 'Defesa universal contra agressões físicas, mágicas, psíquicas ou elementais.',
  },
  {
    id: 'egide',
    label: 'Égide',
    type: 'Bélica',
    subtitle: 'Guarda e proteção',
    description: 'Atrai ataques para si ou protege aliados, funcionando como técnica de guarda do grupo.',
  },
  {
    id: 'ressonancia',
    label: 'Ressonância',
    type: 'Bélica',
    subtitle: 'Transferência de poder',
    description: 'Transfere energia ou dons de linhagem a um aliado por meio de ponte mística temporária.',
  },
  {
    id: 'regeneracao',
    label: 'Regeneração',
    type: 'Bélica',
    subtitle: 'Cura e restauração',
    description: 'Restaura Vitalidade, neutraliza venenos e estabiliza ferimentos críticos.',
  },
  {
    id: 'intimidacao',
    label: 'Intimidação',
    type: 'Erudita',
    subtitle: 'Ameaça e imposição',
    description: 'Subjuga pela presença, interroga, impõe autoridade e força recuos políticos ou militares.',
  },
  {
    id: 'manipulacao',
    label: 'Manipulação',
    type: 'Erudita',
    subtitle: 'Enganar e seduzir',
    description: 'Persuade, negocia alianças, obtém segredos e conduz interações diplomáticas com charme.',
  },
  {
    id: 'atletismo',
    label: 'Atletismo',
    type: 'Erudita',
    subtitle: 'Proezas físicas',
    description: 'Executa acrobacias, voos prolongados, escaladas, natação e feitos físicos extremos.',
  },
  {
    id: 'dissimulacao',
    label: 'Dissimulação',
    type: 'Erudita',
    subtitle: 'Furtividade',
    description: 'Infiltra, oculta traços, escuta conversas e desaparece em meio ao caos.',
  },
  {
    id: 'sobrevivencia',
    label: 'Sobrevivência',
    type: 'Erudita',
    subtitle: 'Rastreio e natureza',
    description: 'Rastreia criaturas, navega territórios hostis, caça e reconhece perigos naturais.',
  },
  {
    id: 'investigacao',
    label: 'Investigação',
    type: 'Erudita',
    subtitle: 'Análise e percepção',
    description: 'Analisa cenas, identifica armadilhas, desvenda enigmas e percebe manipulações ocultas.',
  },
  {
    id: 'feiticaria',
    label: 'Feitiçaria',
    type: 'Erudita',
    subtitle: 'Rituais e objetos',
    description: 'Realiza rituais, interpreta runas, compreende artefatos e neutraliza proteções mágicas.',
  },
  {
    id: 'metamorfose',
    label: 'Metamorfose',
    type: 'Hereditária',
    court: 'Corte Primaveril',
    subtitle: 'Mutação biológica',
    description: 'Dobra a biologia do sangue para assumir formas bestiais ou animalescas.',
  },
  {
    id: 'navegacao',
    label: 'Navegação',
    type: 'Hereditária',
    court: 'Corte Estival',
    subtitle: 'Domínio das direções',
    description: 'Manifesta instinto de direção em águas, rotas terrestres e encruzilhadas.',
  },
  {
    id: 'intriga',
    label: 'Intriga',
    type: 'Hereditária',
    court: 'Corte Outonal',
    subtitle: 'Discórdia estratégica',
    description: 'Semeia discórdia e tumulto através de mentiras cirúrgicas e verdades distorcidas.',
  },
  {
    id: 'estagnacao',
    label: 'Estagnação',
    type: 'Hereditária',
    court: 'Corte Invernal',
    subtitle: 'Inércia mística',
    description: 'Interrompe fluxo de movimento, tempo ou processos biológicos hostis.',
  },
  {
    id: 'diplomacia',
    label: 'Diplomacia',
    type: 'Hereditária',
    court: 'Corte Crepuscular',
    subtitle: 'Pacificação de almas',
    description: 'Projeta harmonia e trégua mística para silenciar hostilidade imediata.',
  },
  {
    id: 'ruptura',
    label: 'Ruptura',
    type: 'Hereditária',
    court: 'Corte Diurna',
    subtitle: 'Quebra de feitiços',
    description: 'Identifica, perfura e dissolve ilusões, barreiras rúnicas, encantamentos e maldições.',
  },
  {
    id: 'telepatia',
    label: 'Telepatia',
    type: 'Hereditária',
    court: 'Corte Noturna',
    subtitle: 'Incursão mental',
    description: 'Permite entrar em consciências alheias, ler segredos, projetar ilusões ou escravizar vontades vulneráveis.',
  },
]

const skillIdAliases: Record<string, string> = {
  confluencia: 'ressonancia',
  magnetismo: 'manipulacao',
}

function normalizeSkillId(skillId: string) {
  return skillIdAliases[skillId] ?? skillId
}

function canUseSkill(skill: Skill, court: string) {
  return skill.type !== 'Hereditária' || skill.court === court
}

function formatSkillName(skill: Skill) {
  return `${skill.type} - ${skill.label}`
}

function formatTraitName(trait: Trait) {
  const category = trait.subtitle.includes('sistemática') ? 'Sistemática' : 'Interpretativa'

  return `${category} - ${trait.label}`
}

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
    id: 'tenaz',
    label: 'Tenaz',
    type: 'advantage',
    subtitle: 'Vantagem sistemática',
    description: 'Concede +2 em todos os testes ativos que envolvam Determinação.',
    modifier: { attribute: 'determinacao', value: 2 },
  },
  {
    id: 'esperto',
    label: 'Esperto',
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
    id: 'voz-autoridade',
    label: 'Voz de Liderança',
    type: 'advantage',
    subtitle: 'Vantagem interpretativa',
    description: 'Emana clareza inspiradora que organiza aliados em combate e torna diretrizes difíceis de ignorar.',
  },
  {
    id: 'veu-ilusoes',
    label: 'Véu de Ilusões',
    type: 'advantage',
    subtitle: 'Vantagem interpretativa',
    description: 'Oculta misticamente objetos portados ou extensões físicas específicas, como armas ou asas.',
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
    id: 'reputacao-ilibada',
    label: 'Reputação Ilibada',
    type: 'advantage',
    subtitle: 'Vantagem interpretativa',
    description: 'O nome e os feitos do personagem abrem portas e garantem o direito de ser ouvido em impasses diplomáticos.',
  },
  {
    id: 'opulencia-material',
    label: 'Opulência Material',
    type: 'advantage',
    subtitle: 'Vantagem interpretativa',
    description: 'Permite acesso a vastas reservas financeiras, privilégios da elite e recursos luxuosos.',
  },
  {
    id: 'erudito-seculos',
    label: 'Erudito dos Séculos',
    type: 'advantage',
    subtitle: 'Vantagem interpretativa',
    description: 'Concede autoridade acadêmica sobre línguas antigas, artefatos perdidos e itens de poder.',
  },
  {
    id: 'aliado-criaturas',
    label: 'Aliado das Criaturas',
    type: 'advantage',
    subtitle: 'Vantagem interpretativa',
    description: 'Garante afinidade com animais selvagens, seres do Meio e feéricos inferiores.',
  },
  {
    id: 'memoria-implacavel',
    label: 'Memória Implacável',
    type: 'advantage',
    subtitle: 'Vantagem interpretativa',
    description: 'Permite recordar acontecimentos, mapas e livros vistos anteriormente com detalhes perfeitos.',
  },
  {
    id: 'vinculo-territorial',
    label: 'Vínculo Territorial',
    type: 'advantage',
    subtitle: 'Vantagem interpretativa',
    description: 'Permite sentir invasões ou corrupções territoriais através da própria essência ligada ao solo da Corte.',
  },
  {
    id: 'fragil',
    label: 'Frágil',
    type: 'disadvantage',
    subtitle: 'Desvantagem sistemática',
    description: 'Impõe -2 em todos os testes que envolvam Vigor.',
    modifier: { attribute: 'vigor', value: -2 },
  },
  {
    id: 'lento',
    label: 'Lento',
    type: 'disadvantage',
    subtitle: 'Desvantagem sistemática',
    description: 'Impõe -2 em todos os testes que envolvam Agilidade.',
    modifier: { attribute: 'agilidade', value: -2 },
  },
  {
    id: 'inabil',
    label: 'Inábil',
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
    label: 'Ancoragem',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'Impede o uso de Atravessar, exigindo deslocamento físico.',
  },
  {
    id: 'eco-parceria',
    label: 'Eco de Parceria',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'Um laço de parceria interrompido ou jamais concretizado drena a determinação em momentos críticos.',
  },
  {
    id: 'magia-indomita',
    label: 'Magia Indômita',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'Torna usos utilitários da magia instáveis e perigosos em caso de falha.',
  },
  {
    id: 'aflicoes-alma',
    label: 'Aflições da Alma',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'Traumas e ruínas internas podem surgir como surto, paralisia ou pânico diante de gatilhos específicos.',
  },
  {
    id: 'tatuagem-contrato',
    label: 'Tatuagem de Contrato',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'Permite que o detentor do contrato force ações ou puna resistência.',
  },
  {
    id: 'nevoa-oblivio',
    label: 'Névoa do Oblívio',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'Recordações vitais e locais visitados se desintegram em lapsos difíceis de resgatar.',
  },
  {
    id: 'mente-indefesa',
    label: 'Mente Indefesa',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'A consciência não possui barreiras protetoras mínimas contra leitura mental e escrutínio imediato.',
  },
  {
    id: 'infamia-anunciada',
    label: 'Infâmia Anunciada',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'Uma reputação nefasta precede o personagem e gera suspeita, hostilidade ou preconceito.',
  },
  {
    id: 'fardo-escassez',
    label: 'Fardo da Escassez',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'A pobreza extrema torna recursos básicos e acessos materiais um desafio constante.',
  },
  {
    id: 'insipiencia-seculos',
    label: 'Insipiência dos Séculos',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'A falta de conhecimento místico dificulta runas, línguas antigas e artefatos perdidos.',
  },
  {
    id: 'carrasco-bestas',
    label: 'Carrasco das Bestas',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'Animais selvagens, seres do Meio e feéricos inferiores tendem a reagir com inquietação ou hostilidade.',
  },
  {
    id: 'cicatriz-territorial',
    label: 'Cicatriz Territorial',
    type: 'disadvantage',
    subtitle: 'Desvantagem interpretativa',
    description: 'A alma sente cada ferida infligida à terra da Corte como dor nos próprios ossos.',
  },
]

const traitIdAliases: Record<string, string> = {
  'alergia-freixo': 'aflicoes-alma',
  'assombrado-bogge': 'infamia-anunciada',
  debil: 'fragil',
  'instabilidade-magica': 'nevoa-oblivio',
  'mestre-ilusoes': 'veu-ilusoes',
  minguante: 'inabil',
  resoluto: 'tenaz',
  sagaz: 'esperto',
  'sentidos-predador': 'aliado-criaturas',
  vagaroso: 'lento',
  'voz-autoridade': 'voz-autoridade',
}

function normalizeTraitId(traitId: string) {
  return traitIdAliases[traitId] ?? traitId
}

const lineageGifts: LineageGift[] = [
  {
    court: 'Corte Primaveril',
    title: 'Dom da Mutação e do Crescimento',
    description: 'Herança primitiva de mutação biológica, crescimento vital, instinto predatório e autoridade da natureza.',
    levels: {
      1: {
        name: 'Vigor da Floresta',
        description: 'O sangue pulsa com a seiva de árvores ancestrais, endurecendo as fibras musculares.',
        effect: '+1 em Metamorfose OU +1 em Combate.',
      },
      2: {
        name: 'Florescer Vital',
        description: 'A vida irrompe onde o personagem pisa, fechando feridas com tecidos vegetais temporários e concedendo maior rapidez.',
        effect: '+30 de Vitalidade OU +2 em Agilidade.',
      },
      3: {
        name: 'Raízes Constritoras',
        description: 'O solo atende ao comando do herdeiro da linhagem, modificando mais seu corpo e ampliando seus sentidos de predador.',
        effect: '+3 em Metamorfose OU +3 em Investigação.',
      },
      4: {
        name: 'Garras da Besta',
        description: 'O feérico inicia uma transição física agressiva e manifesta autoridade física como um baluarte no campo de batalha.',
        effect: '+40 de Dano Direto OU +4 em Égide.',
      },
      5: {
        name: 'Avatar da Natureza',
        description: 'O imortal manifesta a autoridade de um Grão-Senhor da Primavera, alcançando o ápice da potência física.',
        effect: '+5 em Metamorfose OU +5 em Vigor.',
      },
    },
  },
  {
    court: 'Corte Estival',
    title: 'Dom das Marés e das Tempestades',
    description: 'Força das marés, tempestades, proteção líquida e pressão abissal.',
    levels: {
      1: {
        name: 'Impulso das Ondas',
        description: 'O feérico sintoniza seus movimentos com o fluxo das águas, mantendo o instinto de direção mesmo em meio ao caos.',
        effect: '+1 em Navegação OU +1 em Regeneração.',
      },
      2: {
        name: 'Maré Revigorante',
        description: 'A umidade ao redor torna-se um escudo líquido, refletindo o vigor dos batedores navais.',
        effect: 'Proteger 2 Aliados OU +2 em Vigor.',
      },
      3: {
        name: 'Pressão Abissal',
        description: 'O personagem canaliza o peso das fossas oceânicas em suas ações e domina o campo de batalha marítimo ou terrestre.',
        effect: '+3 em Navegação OU +3 em Atletismo.',
      },
      4: {
        name: 'Fúria do Mar',
        description: 'O feérico convoca a eletricidade que precede a tempestade, saturando o ambiente com ataques mágicos.',
        effect: 'Atacar 4 Alvos OU +4 em Arcano.',
      },
      5: {
        name: 'Tsunami de Poder',
        description: 'O personagem manifesta a autoridade de um Grão-Senhor do Verão sobre todas as marés.',
        effect: '+5 em Navegação OU +5 em Canalização.',
      },
    },
  },
  {
    court: 'Corte Outonal',
    title: 'Dom do Fogo e da Fúria',
    description: 'Fogo estratégico, intriga, comando soberano e agressividade tática.',
    levels: {
      1: {
        name: 'Presença Incendiária',
        description: 'O feérico emana um calor latente que faz o ar vibrar, tecendo intrigas ou assumindo guarda vigilante.',
        effect: '+1 em Intriga OU +1 em Égide.',
      },
      2: {
        name: 'Chamas de Batalha',
        description: 'O fogo da linhagem flui para as palavras e para o espírito, despertando magnetismo social e ímpeto de iniciativa.',
        effect: '+5 de Iniciativa OU +2 em Encanto.',
      },
      3: {
        name: 'Cinzas ao Vento',
        description: 'Uma explosão de autoridade e calor quebra a vontade inimiga e manipula a percepção durante o tumulto social.',
        effect: '+3 em Intriga OU +3 em Intimidação.',
      },
      4: {
        name: 'Inferno de Folhas',
        description: 'O personagem torna-se o centro de um vórtice ardente e letal, buscando encerrar o conflito com precisão.',
        effect: '+6 em Letalidade OU +4 em Combate.',
      },
      5: {
        name: 'Labareda de Sangue',
        description: 'A fúria atinge o ápice místico, manifestando a autoridade de um Grão-Senhor com fluidez letal.',
        effect: '+5 em Intriga OU +5 em Agilidade.',
      },
    },
  },
  {
    court: 'Corte Invernal',
    title: 'Dom do Gelo e da Estagnação',
    description: 'Gelo absoluto, inércia mística, sobrevivência nas neves e resistência inabalável.',
    levels: {
      1: {
        name: 'Resiliência Gélida',
        description: 'Uma camada de geada emana dos poros para estagnar ameaças próximas ou imobilizar inimigos.',
        effect: '+1 em Estagnação OU +1 em Constrição.',
      },
      2: {
        name: 'Prisão de Gelo',
        description: 'A umidade ao redor se condensa para drenar a vitalidade inimiga ou potencializar a canalização mística.',
        effect: '+20 de Dano Direto OU +2 em Canalização.',
      },
      3: {
        name: 'Coração de Rocha',
        description: 'O feérico mergulha em inércia mágica, tornando a alma inexpugnável e aguçando seus instintos de sobrevivência.',
        effect: '+3 em Estagnação OU +3 em Sobrevivência.',
      },
      4: {
        name: 'Vento Cortante',
        description: 'Uma nevasca envolve o guerreiro, projetando a si próprio e seus aliados como uma geleira inquebrável.',
        effect: 'Proteger 4 Aliados OU +4 em Resistência.',
      },
      5: {
        name: 'Inverno Eterno',
        description: 'O personagem manifesta a soberania de um Grão-Senhor do Norte e a determinação que comanda o silêncio.',
        effect: '+5 em Estagnação OU +5 em Determinação.',
      },
    },
  },
  {
    court: 'Corte Diurna',
    title: 'Dom da Luz e da Verdade',
    description: 'Luz solar, verdade, quebra de feitiços, clareza mental e revelação.',
    levels: {
      1: {
        name: 'Luz da Verdade',
        description: 'O feérico emana um brilho interior que limpa incertezas e revela fissuras em arquiteturas mágicas.',
        effect: '+1 em Ruptura OU +1 em Resistência.',
      },
      2: {
        name: 'Veredito Solar',
        description: 'A luz da linhagem revela o nervo frágil da batalha ou ancora a mente contra qualquer pânico.',
        effect: '+3 de Letalidade OU +2 de Determinação.',
      },
      3: {
        name: 'Desvendar Místico',
        description: 'O personagem canaliza a erudição do sol para desmantelar encantamentos ou manipular objetos de poder.',
        effect: '+3 em Ruptura OU +3 em Feitiçaria.',
      },
      4: {
        name: 'Confluência Solar',
        description: 'O feérico torna-se um reservatório de energia, cedendo vigor místico a aliados ou sustentando o próprio fôlego.',
        effect: '+40 de Mana e Stamina OU +4 em Ressonância.',
      },
      5: {
        name: 'Sabedoria do Quebrador',
        description: 'O imortal manifesta a autoridade de um Grão-Senhor da Diurna, desfazendo magias lendárias com vontade soberana.',
        effect: '+5 em Ruptura OU +5 em Astúcia.',
      },
    },
  },
  {
    court: 'Corte Crepuscular',
    title: 'Dom da Renovação e da Pacificação',
    description: 'Magia de cura, transição, diplomacia, pacificação e restauração.',
    levels: {
      1: {
        name: 'Canto da Alvorada',
        description: 'Uma ressonância harmônica emana do sangue, criando elos de poder ou pacificando almas.',
        effect: '+1 em Diplomacia OU +1 em Ressonância.',
      },
      2: {
        name: 'Fôlego do Alvorecer',
        description: 'A umidade ao redor se condensa para renovar reservas vitais ou fortalecer o vigor do feérico.',
        effect: '+20 de Mana e Stamina OU +2 em Vigor.',
      },
      3: {
        name: 'Soberania Diplomática',
        description: 'O personagem projeta o equilíbrio das nuvens do amanhecer, convencendo aliados ou subjugando vontades.',
        effect: '+3 em Diplomacia OU +3 em Manipulação.',
      },
      4: {
        name: 'Orvalho Restaurador',
        description: 'O poder atinge vitacinese plena, restaurando corpos quase destruídos ou protegendo aliados.',
        effect: '+60 de Vitalidade OU +4 em Regeneração.',
      },
      5: {
        name: 'Aura do Pacifista',
        description: 'O imortal manifesta a soberania de um Grão-Senhor da Crepuscular, impondo calma absoluta sobre o caos.',
        effect: '+5 em Diplomacia OU +5 em Encanto.',
      },
    },
  },
  {
    court: 'Corte Noturna',
    title: 'Dom das Sombras e das Estrelas',
    description: 'Sombras vivas, estrelas, telepatia, segredos ocultos e soberania dos sonhos.',
    levels: {
      1: {
        name: 'Sussurros da Noite',
        description: 'As sombras se tornam extensões da consciência, tocando mentes próximas ou exteriorizando poder em pulsos de energia.',
        effect: '+1 em Telepatia OU +1 em Resistência.',
      },
      2: {
        name: 'Estilhaços de Estrelas',
        description: 'O personagem manifesta a agudeza tática dos astros, executando golpes simultâneos ou identificando segredos.',
        effect: 'Atacar 2 Alvos OU +2 de Astúcia.',
      },
      3: {
        name: 'Invasão Obscura',
        description: 'O dom dos daemati ganha força agressiva, violando defesas mentais ou movendo o feérico como um fantasma.',
        effect: '+3 em Telepatia OU +3 em Dissimulação.',
      },
      4: {
        name: 'Velocidade do Vento',
        description: 'O personagem canaliza celeridade e controle das raízes illyrianas, restringindo a reação inimiga.',
        effect: '+10 em Iniciativa OU +4 em Constrição.',
      },
      5: {
        name: 'Noite Triunfante',
        description: 'O imortal evoca a soberania de um Grão-Senhor da Noite, escravizando vontades ou canalizando magia eterna.',
        effect: '+5 em Telepatia OU +5 em Canalização.',
      },
    },
  },
]

const battleDisciplines: BattleDiscipline[] = [
  {
    id: 'virtude-mortifera',
    title: 'Virtude Mortífera',
    subtitle: 'A disciplina do aço e da precisão',
    description: 'Refinamento marcial de quem faz da lâmina uma extensão orgânica da própria vontade imortal.',
    levels: {
      1: {
        name: 'Postura de Ferro',
        description: 'O guerreiro estabiliza seu centro de gravidade e prepara a arma para o impacto.',
        effect: '+1 em Combate.',
      },
      2: {
        name: 'Fúria Múltipla',
        description: 'A velocidade do ataque desafia a percepção comum, fazendo a lâmina ocupar dois lugares ao mesmo tempo.',
        effect: 'Atacar 2 Alvos.',
      },
      3: {
        name: 'Fluidez do Passo',
        description: 'Cada estocada e paragem é executada com a perfeição de séculos de prática constante.',
        effect: '+3 em Combate.',
      },
      4: {
        name: 'Frenesi de Lâminas',
        description: 'O combatente torna-se um borrão de prata e sombras, saturando a defesa de múltiplos inimigos.',
        effect: 'Atacar 4 alvos.',
      },
      5: {
        name: 'Maestria da Dança',
        description: 'O guerreiro flui pelo ambiente como o vento, tornando-se uma silhueta inalcançável e letal.',
        effect: '+5 em Combate.',
      },
    },
  },
  {
    id: 'fluxo-mistico',
    title: 'Fluxo Místico',
    subtitle: 'A disciplina do foco e da centelha',
    description: 'Controle técnico sobre a exteriorização do poder bruto que ferve no sangue feérico.',
    levels: {
      1: {
        name: 'Foco da Vontade',
        description: 'O praticante silencia as emoções para que a magia flua como um rio controlado.',
        effect: '+1 em Arcano.',
      },
      2: {
        name: 'Pulso de Energia',
        description: 'Uma pequena porção de poder é condensada em um impacto concentrado que perfura defesas comuns.',
        effect: '+20 de Dano Direto.',
      },
      3: {
        name: 'Fluidez Técnica',
        description: 'A herança do sangue é moldada com agudeza tática, minimizando desperdício de energia vital.',
        effect: '+3 em Arcano.',
      },
      4: {
        name: 'Detonação Concentrada',
        description: 'O guerreiro arcano localiza a falha na armadura mística do alvo e descarrega energia concentrada.',
        effect: '+40 de Dano Direto.',
      },
      5: {
        name: 'Soberania Mística',
        description: 'O imortal torna-se um condutor perfeito para o Caldeirão.',
        effect: '+5 em Arcano.',
      },
    },
  },
  {
    id: 'cerco-estrategico',
    title: 'Cerco Estratégico',
    subtitle: 'A disciplina do ritmo e da restrição',
    description: 'Arte de ditar o ritmo da batalha e restringir o inimigo antes do golpe final.',
    levels: {
      1: {
        name: 'Cálculo de Distância',
        description: 'O guerreiro mapeia o campo de batalha para identificar movimentos vulneráveis a bloqueios.',
        effect: '+1 em Constrição.',
      },
      2: {
        name: 'Lampejo de Reação',
        description: 'A percepção tática antecipa o movimento hostil no instante necessário para frustrar o ataque.',
        effect: '+5 em Iniciativa.',
      },
      3: {
        name: 'Cerco de Aço',
        description: 'Cada movimento do guerreiro parece fechar uma rota de fuga do alvo.',
        effect: '+3 em Constrição.',
      },
      4: {
        name: 'Antecipação do General',
        description: 'O intelecto estratégico processa a posição de todos na batalha e dita os termos do conflito.',
        effect: '+10 em Iniciativa.',
      },
      5: {
        name: 'Maestria da Imobilização',
        description: 'O oponente é neutralizado por força, técnica e pressão psicológica perfeitamente combinadas.',
        effect: '+5 em Constrição.',
      },
    },
  },
  {
    id: 'couraca-ferrea',
    title: 'Couraça Férrea',
    subtitle: 'A disciplina da fibra e da resiliência',
    description: 'Disciplina defensiva de quem transforma o próprio corpo em uma bigorna de resistência.',
    levels: {
      1: {
        name: 'Blindagem da Alma',
        description: 'O guerreiro prepara o corpo para absorver impactos através de vontade e respiração controlada.',
        effect: '+1 em Resistência.',
      },
      2: {
        name: 'Fenda na Armadura',
        description: 'Durante a defesa, o mestre localiza uma brecha milimétrica para um golpe preciso.',
        effect: '+3 em Letalidade.',
      },
      3: {
        name: 'Resiliência de Mestre',
        description: 'A harmonia entre reflexo corporal e durabilidade biológica alcança um novo patamar.',
        effect: '+3 em Resistência.',
      },
      4: {
        name: 'Ponto de Ruptura',
        description: 'O guerreiro converte a defesa no instante exato para uma sentença de morte.',
        effect: '+6 em Letalidade.',
      },
      5: {
        name: 'Guerreiro Inexpugnável',
        description: 'O combatente torna-se uma montanha inamovível contra a qual exércitos e magia se quebram.',
        effect: '+5 em Resistência.',
      },
    },
  },
  {
    id: 'escolta-tatica',
    title: 'Escolta Tática',
    subtitle: 'A disciplina da proteção e da guarda',
    description: 'Domínio do sacrifício e do dever para proteger aliados vulneráveis com autoridade tática.',
    levels: {
      1: {
        name: 'Postura de Sentinela',
        description: 'O guerreiro cobre brechas de defesa e firma sua posição como âncora da formação.',
        effect: '+1 em Égide.',
      },
      2: {
        name: 'Baluarte da Unidade',
        description: 'O combatente expande seu raio de proteção e monitora múltiplos flancos.',
        effect: 'Proteger 2 Aliados.',
      },
      3: {
        name: 'Escudo Intransponível',
        description: 'O bloqueio distribui o impacto das armas inimigas pela estrutura do guerreiro.',
        effect: '+3 em Égide.',
      },
      4: {
        name: 'Aura de Proteção',
        description: 'O mestre se interpõe em uma área vasta, garantindo a integridade do grupo.',
        effect: 'Proteger 4 Aliados.',
      },
      5: {
        name: 'Soberania do Guardião',
        description: 'O guerreiro encarna o juramento de defesa e impede que golpes transponham sua linha.',
        effect: '+5 em Égide.',
      },
    },
  },
  {
    id: 'sinergia-marcial',
    title: 'Sinergia Marcial',
    subtitle: 'A disciplina da ponte ressonante',
    description: 'Habilidade prática de entrelaçar correntes de poder místico entre imortais em batalha.',
    levels: {
      1: {
        name: 'Harmonia do Fluxo',
        description: 'O praticante reduz desperdício energético e cria elos iniciais de transferência.',
        effect: '+1 em Ressonância.',
      },
      2: {
        name: 'Núcleo Estabilizado',
        description: 'Exercícios de meditação e controle muscular criam reservatórios extras de vigor.',
        effect: '+20 de Mana e Stamina.',
      },
      3: {
        name: 'Ponte Mística',
        description: 'A essência vital pode ser cedida ou recebida com precisão cirúrgica.',
        effect: '+3 em Ressonância.',
      },
      4: {
        name: 'Força das Eras',
        description: 'O corpo opera como um condutor capaz de suportar cargas imensas de esforço prolongado.',
        effect: '+40 de Mana e Stamina.',
      },
      5: {
        name: 'Mestre da Sinfonia',
        description: 'O guerreiro controla perfeitamente as marés da alma e sustenta a batalha coletivamente.',
        effect: '+5 em Ressonância.',
      },
    },
  },
  {
    id: 'sopro-restaurador',
    title: 'Sopro Restaurador',
    subtitle: 'A disciplina da cura e da disposição',
    description: 'Técnica de manipulação da energia vital para preservar e restaurar a estrutura biológica.',
    levels: {
      1: {
        name: 'Toque Restaurador',
        description: 'O praticante domina primeiros socorros místicos e vitacinese básica.',
        effect: '+1 em Regeneração.',
      },
      2: {
        name: 'Sopro de Renovação',
        description: 'O combatente impulsiona a fibra biológica própria ou de um aliado.',
        effect: '+30 de Vitalidade.',
      },
      3: {
        name: 'Oração Vital',
        description: 'Processos de restauração complexos podem ser realizados sob estresse de batalha.',
        effect: '+3 em Regeneração.',
      },
      4: {
        name: 'Vigor do Horizonte',
        description: 'O mestre satura células com uma torrente restauradora massiva.',
        effect: '+60 de Vitalidade.',
      },
      5: {
        name: 'Zênite da Vida',
        description: 'O mestre torna-se um reservatório vivo de cura e reorganiza a integridade da carne.',
        effect: '+5 em Regeneração.',
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
    battleDisciplines: [],
    traits: [],
    lineageGiftLevel: 0,
    secondaryLineageGiftCourt: '',
    secondaryLineageGiftLevel: 0,
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
  const court = typeof character.court === 'string' ? character.court : fallback.court
  const secondaryLineageGiftCourt =
    typeof character.secondaryLineageGiftCourt === 'string' &&
    character.secondaryLineageGiftCourt !== court &&
    lineageGifts.some((gift) => gift.court === character.secondaryLineageGiftCourt)
      ? character.secondaryLineageGiftCourt
      : ''

  return {
    name: typeof character.name === 'string' ? character.name : fallback.name,
    court,
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
          .map((skill) => ({ id: normalizeSkillId(skill.id), level: clampLevel(Number(skill.level)) }))
          .filter((skill, index, normalizedSkills) => {
            const skillDefinition = skills.find((currentSkill) => currentSkill.id === skill.id)

            return Boolean(skillDefinition && canUseSkill(skillDefinition, court)) && normalizedSkills.findIndex((currentSkill) => currentSkill.id === skill.id) === index
          })
      : [],
    battleDisciplines: Array.isArray(character.battleDisciplines)
      ? character.battleDisciplines
          .filter((discipline) => typeof discipline?.id === 'string')
          .map((discipline) => ({ id: discipline.id, level: clampLevel(Number(discipline.level)) }))
          .filter(
            (discipline, index, normalizedDisciplines) =>
              battleDisciplines.some((currentDiscipline) => currentDiscipline.id === discipline.id) &&
              normalizedDisciplines.findIndex((currentDiscipline) => currentDiscipline.id === discipline.id) === index,
          )
      : [],
    traits: Array.isArray(character.traits)
      ? character.traits
          .filter((trait) => typeof trait === 'string')
          .map(normalizeTraitId)
          .filter(
            (trait, index, normalizedTraits) =>
              traits.some((currentTrait) => currentTrait.id === trait) && normalizedTraits.findIndex((currentTrait) => currentTrait === trait) === index,
          )
      : [],
    lineageGiftLevel: Number(character.lineageGiftLevel) === 0 ? 0 : clampLevel(Number(character.lineageGiftLevel ?? 0)),
    secondaryLineageGiftCourt,
    secondaryLineageGiftLevel:
      secondaryLineageGiftCourt && Number(character.secondaryLineageGiftLevel) !== 0
        ? clampLevel(Number(character.secondaryLineageGiftLevel ?? 0))
        : 0,
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
  const { vigor, agilidade, canalizacao, determinacao, astucia, encanto } = character.attributes

  return [
    {
      label: 'Vitalidade',
      value: (vigor + determinacao + canalizacao) * 20,
      formula: '(Vigor + Determinação + Canalização) x 20',
    },
    {
      label: 'Mana',
      value: (canalizacao + astucia + determinacao) * 15,
      formula: '(Canalização + Astúcia + Determinação) x 15',
    },
    {
      label: 'Stamina',
      value: (vigor + agilidade + encanto) * 15,
      formula: '(Vigor + Agilidade + Encanto) x 15',
    },
    {
      label: 'Iniciativa',
      value: agilidade + astucia + encanto,
      formula: 'Agilidade + Astúcia + Encanto',
    },
  ]
}

function parseSheetSnapshot(snapshot: string): SheetPayload | null {
  if (!snapshot) {
    return null
  }

  try {
    const parsed = JSON.parse(snapshot) as Partial<SheetPayload>

    if (!Array.isArray(parsed.characters)) {
      return null
    }

    return {
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      activeCharacterIndex: Number(parsed.activeCharacterIndex) || 0,
      characters: parsed.characters,
    }
  } catch {
    return null
  }
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function getCharacterSpentXp(character: Character) {
  const selectedTraits = traits.filter((trait) => character.traits.includes(trait.id))
  const attributeXp = Object.values(character.attributes).reduce((total, level) => total + attributeCost(level), 0)
  const skillXp = character.skills.reduce((total, skill) => total + skillCost(skill.level), 0)
  const battleDisciplineXp = character.battleDisciplines.reduce((total, discipline) => total + skillCost(discipline.level), 0)
  const advantages = selectedTraits.filter((trait) => trait.type === 'advantage').length
  const traitXp = advantages * ADVANTAGE_COST
  const lineageGiftXp =
    (character.lineageGiftLevel > 0 ? lineageGiftCost(character.lineageGiftLevel) : 0) +
    (character.secondaryLineageGiftLevel > 0 ? lineageGiftCost(character.secondaryLineageGiftLevel) * 2 : 0)

  return attributeXp + skillXp + battleDisciplineXp + traitXp + lineageGiftXp
}

function getCharacterDisadvantageCredit(character: Character) {
  const disadvantages = traits.filter(
    (trait) => trait.type === 'disadvantage' && character.traits.includes(trait.id),
  ).length

  return Math.min(disadvantages, DISADVANTAGE_CREDIT_LIMIT) * ADVANTAGE_COST
}

function renderExportRows(items: string[]) {
  if (items.length === 0) {
    return '<p class="muted">Nenhum item selecionado.</p>'
  }

  return `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`
}

function renderExportXpDelta(value: number) {
  if (value === 0) {
    return ''
  }

  const className = value >= 0 ? 'credit' : 'spend'
  const label = value > 0 ? `+${value} XP` : `${value} XP`

  return ` <span class="item-xp ${className}">${escapeHtml(label)}</span>`
}

function buildCharacterExportHtml(character: Character) {
  const spentXp = getCharacterSpentXp(character)
  const disadvantageCredit = getCharacterDisadvantageCredit(character)
  const availableXp = INITIAL_XP + disadvantageCredit
  const remainingXp = availableXp - spentXp
  const characterLineageGift = lineageGifts.find((gift) => gift.court === character.court)
  const secondaryGift = lineageGifts.find((gift) => gift.court === character.secondaryLineageGiftCourt)
  const characterTraits = traits.filter((trait) => character.traits.includes(trait.id))
  const advantages = characterTraits.filter((trait) => trait.type === 'advantage')
  const disadvantages = characterTraits.filter((trait) => trait.type === 'disadvantage')
  const derivedRows = getDerivedAttributes(character).map(
    (attribute) => `<strong>${escapeHtml(attribute.label)}:</strong> ${attribute.value}`,
  )
  const attributeRows = attributes.map(
    (attribute) =>
      `<strong>${escapeHtml(attribute.label)}:</strong> Nível ${character.attributes[attribute.key]}${renderExportXpDelta(
        -attributeCost(character.attributes[attribute.key]),
      )}`,
  )
  const skillRows = character.skills.map((characterSkill) => {
    const skill = skills.find((currentSkill) => currentSkill.id === characterSkill.id)

    return skill
      ? `${escapeHtml(formatSkillName(skill))}: Nível ${characterSkill.level}${renderExportXpDelta(-skillCost(characterSkill.level))}`
      : ''
  })
  const disciplineRows = character.battleDisciplines.map((characterDiscipline) => {
    const discipline = battleDisciplines.find((currentDiscipline) => currentDiscipline.id === characterDiscipline.id)

    return discipline
      ? `${escapeHtml(discipline.title)}: Nível ${characterDiscipline.level}${renderExportXpDelta(-skillCost(characterDiscipline.level))}`
      : ''
  })

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(character.name)} - Ficha</title>
  <style>
    body { color: #211b16; font-family: Arial, sans-serif; margin: 32px; }
    h1 { font-family: Georgia, serif; font-size: 30px; margin: 0 0 4px; }
    h2 { border-bottom: 1px solid #c9b8a3; font-size: 15px; margin: 22px 0 10px; padding-bottom: 5px; text-transform: uppercase; }
    .meta, .muted, small { color: #6f6257; }
    .item-xp { font-size: 11px; font-weight: 700; }
    .item-xp.spend { color: #a53a4f; }
    .item-xp.credit { color: #2f7d55; }
    .xp { display: flex; gap: 10px; flex-wrap: wrap; margin: 16px 0; }
    .xp span { border: 1px solid #c9b8a3; border-radius: 6px; padding: 8px 10px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    ul { margin: 0; padding-left: 18px; }
    li { margin: 5px 0; }
    @media print { body { margin: 18mm; } button { display: none; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(character.name)}</h1>
  <p class="meta">${escapeHtml(character.court || 'Sem Corte selecionada')}</p>
  <div class="xp">
    <span><strong>${INITIAL_XP} XP + ${disadvantageCredit} XP</strong> de desvantagens = ${availableXp} XP disponível</span>
    <span><strong>${spentXp}</strong> XP gasto</span>
    <span><strong>${remainingXp}</strong> XP restante</span>
  </div>
  <section class="grid">
    <div>
      <h2>Atributos principais</h2>
      ${renderExportRows(attributeRows)}
    </div>
    <div>
      <h2>Atributos derivados</h2>
      ${renderExportRows(derivedRows)}
    </div>
  </section>
  <h2>Perícias</h2>
  ${renderExportRows(skillRows.filter(Boolean))}
  <h2>Dons de Linhagem</h2>
  ${renderExportRows([
    characterLineageGift
      ? `${escapeHtml(characterLineageGift.title)} (${escapeHtml(character.court)}): Nível ${character.lineageGiftLevel}${renderExportXpDelta(
          -(character.lineageGiftLevel > 0 ? lineageGiftCost(character.lineageGiftLevel) : 0),
        )}`
      : '',
    secondaryGift
      ? `${escapeHtml(secondaryGift.title)} (${escapeHtml(character.secondaryLineageGiftCourt)}): Nível ${
          character.secondaryLineageGiftLevel
        } - secundário${renderExportXpDelta(
          -(character.secondaryLineageGiftLevel > 0 ? lineageGiftCost(character.secondaryLineageGiftLevel) * 2 : 0),
        )}`
      : '',
  ].filter(Boolean))}
  <h2>Disciplinas de Batalha</h2>
  ${renderExportRows(disciplineRows.filter(Boolean))}
  <section class="grid">
    <div>
      <h2>Vantagens</h2>
      ${renderExportRows(advantages.map((trait) => `${escapeHtml(trait.label)} - ${escapeHtml(trait.subtitle)}${renderExportXpDelta(-ADVANTAGE_COST)}`))}
    </div>
    <div>
      <h2>Desvantagens</h2>
      ${renderExportRows(disadvantages.map((trait) => `${escapeHtml(trait.label)} - ${escapeHtml(trait.subtitle)}${renderExportXpDelta(ADVANTAGE_COST)}`))}
    </div>
  </section>
</body>
</html>`
}

function App() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [characters, setCharacters] = useState<Character[]>([createCharacter(1)])
  const [activeCharacterIndex, setActiveCharacterIndex] = useState(0)
  const [selectedSkillId, setSelectedSkillId] = useState('')
  const [hoveredSkillId, setHoveredSkillId] = useState('')
  const [selectedBattleDisciplineId, setSelectedBattleDisciplineId] = useState('')
  const [hoveredBattleDisciplineId, setHoveredBattleDisciplineId] = useState('')
  const [selectedAdvantageId, setSelectedAdvantageId] = useState('')
  const [selectedDisadvantageId, setSelectedDisadvantageId] = useState('')
  const [hoveredTraitId, setHoveredTraitId] = useState('')
  const [hoveredGiftLevel, setHoveredGiftLevel] = useState<number | null>(null)
  const [playerId] = useState(getStoredPlayerId)
  const [isLoaded, setIsLoaded] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'loading' | 'saved' | 'saving' | 'unsaved' | 'error'>('loading')
  const [savedSnapshot, setSavedSnapshot] = useState('')

  const character = characters[activeCharacterIndex]
  const selectedSkillIds = character.skills.map((skill) => skill.id)
  const availableSkills = skills.filter(
    (skill) =>
      canUseSkill(skill, character.court) &&
      !selectedSkillIds.includes(skill.id),
  )
  const canAddSelectedSkill = availableSkills.some((skill) => skill.id === selectedSkillId)
  const hoveredSkill = skills.find((skill) => skill.id === hoveredSkillId)
  const selectedBattleDisciplineIds = character.battleDisciplines.map((discipline) => discipline.id)
  const availableBattleDisciplines = battleDisciplines.filter((discipline) => !selectedBattleDisciplineIds.includes(discipline.id))
  const hoveredBattleDiscipline = battleDisciplines.find((discipline) => discipline.id === hoveredBattleDisciplineId)
  const hoveredBattleDisciplineLevel = character.battleDisciplines.find((discipline) => discipline.id === hoveredBattleDisciplineId)?.level ?? 0
  const selectedTraits = traits.filter((trait) => character.traits.includes(trait.id))
  const selectedTraitIds = selectedTraits.map((trait) => trait.id)
  const availableAdvantages = traits.filter((trait) => trait.type === 'advantage' && !selectedTraitIds.includes(trait.id))
  const availableDisadvantages = traits.filter((trait) => trait.type === 'disadvantage' && !selectedTraitIds.includes(trait.id))
  const hoveredTrait = traits.find((trait) => trait.id === hoveredTraitId)
  const selectedAdvantages = selectedTraits.filter((trait) => trait.type === 'advantage')
  const selectedDisadvantages = selectedTraits.filter((trait) => trait.type === 'disadvantage')
  const lineageGift = lineageGifts.find((gift) => gift.court === character.court)
  const secondaryLineageGift = lineageGifts.find((gift) => gift.court === character.secondaryLineageGiftCourt)
  const secondaryLineageOptions = lineageGifts.filter((gift) => gift.court !== character.court)
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
    const battleDisciplineXp = character.battleDisciplines.reduce((total, discipline) => total + skillCost(discipline.level), 0)
    const advantages = selectedTraits.filter((trait) => trait.type === 'advantage').length
    const traitXp = advantages * ADVANTAGE_COST
    const lineageGiftXp =
      (character.lineageGiftLevel > 0 ? lineageGiftCost(character.lineageGiftLevel) : 0) +
      (character.secondaryLineageGiftLevel > 0 ? lineageGiftCost(character.secondaryLineageGiftLevel) * 2 : 0)

    return attributeXp + skillXp + battleDisciplineXp + traitXp + lineageGiftXp
  }, [
    character.attributes,
    character.battleDisciplines,
    character.skills,
    character.lineageGiftLevel,
    character.secondaryLineageGiftLevel,
    selectedTraits,
  ])

  const disadvantageCredit = Math.min(selectedDisadvantages.length, DISADVANTAGE_CREDIT_LIMIT) * ADVANTAGE_COST
  const availableXp = INITIAL_XP + disadvantageCredit
  const remainingXp = availableXp - spentXp
  const derivedAttributes = useMemo(() => getDerivedAttributes(character), [character])
  const sheetPayload = useMemo(
    () => ({
      theme,
      activeCharacterIndex,
      characters,
    }),
    [activeCharacterIndex, characters, theme],
  )
  const currentSnapshot = useMemo(() => JSON.stringify(sheetPayload), [sheetPayload])
  const hasUnsavedChanges = isLoaded && currentSnapshot !== savedSnapshot
  const savedSheet = useMemo(() => parseSheetSnapshot(savedSnapshot), [savedSnapshot])
  const savedActiveCharacter = savedSheet?.characters[activeCharacterIndex]

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

        const loadedTheme = data.theme === 'light' ? 'light' : 'dark'
        const loadedActiveIndex = Math.min(Number(data.activeCharacterIndex) || 0, loadedCharacters.length - 1)

        setTheme(loadedTheme)
        setCharacters(loadedCharacters)
        setActiveCharacterIndex(loadedActiveIndex)
        setSavedSnapshot(
          JSON.stringify({
            theme: loadedTheme,
            activeCharacterIndex: loadedActiveIndex,
            characters: loadedCharacters,
          }),
        )
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
    if (hasUnsavedChanges && saveStatus === 'saved') {
      setSaveStatus('unsaved')
    }
  }, [hasUnsavedChanges, saveStatus])

  function handleSave() {
    if (!isLoaded || saveStatus === 'saving') {
      return
    }

    setSaveStatus('saving')
    fetch(`${SHEETS_API_URL}?playerId=${encodeURIComponent(playerId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: currentSnapshot,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Nao foi possivel salvar as fichas.')
        }

        setSavedSnapshot(currentSnapshot)
        setSaveStatus('saved')
      })
      .catch(() => setSaveStatus('error'))
  }

  function handleExportPdf() {
    if (!savedActiveCharacter) {
      return
    }

    const exportWindow = window.open('', '_blank')

    if (!exportWindow) {
      return
    }

    exportWindow.document.open()
    exportWindow.document.write(buildCharacterExportHtml(savedActiveCharacter))
    exportWindow.document.close()
    exportWindow.focus()
    window.setTimeout(() => {
      exportWindow.print()
    }, 250)
  }

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
      secondaryLineageGiftCourt: current.secondaryLineageGiftCourt === court ? '' : current.secondaryLineageGiftCourt,
      secondaryLineageGiftLevel: current.secondaryLineageGiftCourt === court ? 0 : current.secondaryLineageGiftLevel,
      skills: current.skills.filter((characterSkill) => {
        const skill = skills.find((currentSkill) => currentSkill.id === characterSkill.id)

        return Boolean(skill && canUseSkill(skill, court))
      }),
    }))
    setSelectedSkillId('')
    setHoveredSkillId('')
    setSelectedBattleDisciplineId('')
    setHoveredBattleDisciplineId('')
    setHoveredGiftLevel(null)
  }

  function updateLineageGiftLevel(level: number) {
    updateActiveCharacter((current) => ({
      ...current,
      lineageGiftLevel: level === 0 ? 0 : clampLevel(level),
    }))
  }

  function updateSecondaryLineageGiftCourt(court: string) {
    updateActiveCharacter((current) => ({
      ...current,
      secondaryLineageGiftCourt: court,
      secondaryLineageGiftLevel: 0,
    }))
  }

  function updateSecondaryLineageGiftLevel(level: number) {
    updateActiveCharacter((current) => ({
      ...current,
      secondaryLineageGiftLevel: level === 0 ? 0 : clampLevel(level),
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
    setSelectedBattleDisciplineId('')
    setHoveredBattleDisciplineId('')
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
    setSelectedBattleDisciplineId('')
    setHoveredBattleDisciplineId('')
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
    setSelectedBattleDisciplineId('')
    setHoveredBattleDisciplineId('')
    setSelectedAdvantageId('')
    setSelectedDisadvantageId('')
    setHoveredTraitId('')
    setHoveredGiftLevel(null)
  }

  function addSkill() {
    const selectedSkill = skills.find((skill) => skill.id === selectedSkillId)

    if (
      !selectedSkillId ||
      !selectedSkill ||
      selectedSkillIds.includes(selectedSkillId) ||
      !canUseSkill(selectedSkill, character.court)
    ) {
      return
    }

    updateActiveCharacter((current) => ({
      ...current,
      skills: [...current.skills, { id: selectedSkillId, level: 1 }],
    }))
    setHoveredSkillId(selectedSkillId)
    setSelectedSkillId('')
  }

  function addBattleDiscipline() {
    if (
      !selectedBattleDisciplineId ||
      selectedBattleDisciplineIds.includes(selectedBattleDisciplineId) ||
      !availableBattleDisciplines.some((discipline) => discipline.id === selectedBattleDisciplineId)
    ) {
      return
    }

    updateActiveCharacter((current) => ({
      ...current,
      battleDisciplines: [...current.battleDisciplines, { id: selectedBattleDisciplineId, level: 1 }],
    }))
    setHoveredBattleDisciplineId(selectedBattleDisciplineId)
    setSelectedBattleDisciplineId('')
  }

  function removeBattleDiscipline(disciplineId: string) {
    updateActiveCharacter((current) => ({
      ...current,
      battleDisciplines: current.battleDisciplines.filter((discipline) => discipline.id !== disciplineId),
    }))

    if (hoveredBattleDisciplineId === disciplineId) {
      setHoveredBattleDisciplineId('')
    }
  }

  function updateBattleDisciplineLevel(disciplineId: string, level: number) {
    updateActiveCharacter((current) => ({
      ...current,
      battleDisciplines: current.battleDisciplines.map((discipline) =>
        discipline.id === disciplineId ? { ...discipline, level: clampLevel(level) } : discipline,
      ),
    }))
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
    const disadvantageCount = selectedTraits.filter((trait) => trait.type === 'disadvantage').length

    if (!selectedTrait || selectedTraitIds.includes(selectedTrait.id)) {
      return
    }

    if (selectedTrait.type === 'advantage' && advantageCount >= MAX_ADVANTAGES) {
      return
    }

    if (selectedTrait.type === 'disadvantage' && disadvantageCount >= MAX_DISADVANTAGES) {
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
            {saveStatus === 'unsaved' && 'Alterações não salvas'}
            {saveStatus === 'error' && 'Backend offline'}
          </span>
          <button className="save-button" type="button" onClick={handleSave} disabled={!hasUnsavedChanges || saveStatus === 'saving'}>
            Salvar
          </button>
          <button className="ghost-button" type="button" onClick={handleExportPdf} disabled={!savedActiveCharacter || saveStatus === 'loading'}>
            Exportar PDF
          </button>
          <span className="export-note">Exporta a versão salva mais recente.</span>
          <div className="header-stats" aria-label="Resumo de XP">
            <strong className="available-xp">
              <span>{availableXp} xp</span>
              <small>
                {INITIAL_XP} base <em>+ {disadvantageCredit} bônus</em>
              </small>
            </strong>
            <strong>{spentXp} xp gasto</strong>
            <strong className={remainingXp < 0 ? 'danger' : 'success'}>{remainingXp} xp restante</strong>
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
                  setSelectedBattleDisciplineId('')
                  setHoveredBattleDisciplineId('')
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
          <h2>Custos de evolução</h2>
          <div className="cost-grid">
            {Object.entries(skillLevelCosts).map(([level, cost]) => (
              <span key={level}>
                <strong>Nível {level}</strong>
                <em>{cost} XP</em>
              </span>
            ))}
          </div>
          <p className="cost-note">
            Atributos, Perícias, Dons de Linhagem e Disciplinas de Batalha usam esta progressão. O nível 1 de Atributos é gratuito.
          </p>
        </section>

        <section className="panel xp-panel">
          <div className="panel-heading">
            <h2>Atributos principais</h2>
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
                        {formatTraitName(trait)}
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
                        X
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <section className="trait-column">
                <h3>Desvantagens</h3>
                {selectedDisadvantages.length >= MAX_DISADVANTAGES && (
                  <p className="limit-note">Limite de 3 desvantagens alcançado. Não é possível adicionar mais.</p>
                )}
                <div className="skill-picker">
                  <select value={selectedDisadvantageId} onChange={(event) => setSelectedDisadvantageId(event.target.value)}>
                    <option value="">Selecione uma desvantagem...</option>
                    {availableDisadvantages.map((trait) => (
                      <option key={trait.id} value={trait.id}>
                        {formatTraitName(trait)}
                      </option>
                    ))}
                  </select>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => addTrait(selectedDisadvantageId)}
                    disabled={!selectedDisadvantageId || selectedDisadvantages.length >= MAX_DISADVANTAGES}
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
                          X
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

        <section className="panel lineage-panel">
          <div className="panel-heading">
            <h2>Dons de linhagem</h2>
            <span className="budget">{lineageGift ? character.court : 'Selecione uma Corte'}</span>
          </div>

          {lineageGift ? (
            <div className="lineage-gift">
              <div className="lineage-main">
                <div className="lineage-summary">
                  <span>Primário - {character.court}</span>
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

                {secondaryLineageGift && (
                  <>
                    <div className="lineage-summary">
                      <span>Secundário - {secondaryLineageGift.court}</span>
                      <strong>{secondaryLineageGift.title}</strong>
                      <p>{secondaryLineageGift.description}</p>
                    </div>

                    <div className="lineage-levels">
                      {Object.entries(secondaryLineageGift.levels).map(([level, effect]) => {
                        const numericLevel = Number(level)

                        return (
                          <article className={numericLevel <= character.secondaryLineageGiftLevel ? 'active' : ''} key={level}>
                            <strong>Nível {level}</strong>
                            <p>{renderGiftEffect(effect)}</p>
                          </article>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              <aside className="lineage-side">
                <label className="lineage-level">
                  Nível do dom primário
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

                <label className="lineage-level">
                  Dom secundário
                  <select value={character.secondaryLineageGiftCourt} onChange={(event) => updateSecondaryLineageGiftCourt(event.target.value)}>
                    <option value="">Nenhum</option>
                    {secondaryLineageOptions.map((gift) => (
                      <option key={gift.court} value={gift.court}>
                        {gift.court}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="lineage-level">
                  Nível do dom secundário
                  <select
                    value={character.secondaryLineageGiftLevel}
                    onChange={(event) => updateSecondaryLineageGiftLevel(Number(event.target.value))}
                    disabled={!secondaryLineageGift}
                  >
                    <option value="0">Não despertado</option>
                    <option value="1">Nível 1</option>
                    <option value="2">Nível 2</option>
                    <option value="3">Nível 3</option>
                    <option value="4">Nível 4</option>
                    <option value="5">Nível 5</option>
                  </select>
                  <em className={character.secondaryLineageGiftLevel > 0 ? 'xp-delta spend' : 'xp-delta free'}>
                    {character.secondaryLineageGiftLevel > 0 ? xpDelta(-lineageGiftCost(character.secondaryLineageGiftLevel) * 2) : '0 XP'}
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
            <p className="empty-state lineage-empty-state">Selecione uma Corte para visualizar o dom de linhagem correspondente.</p>
          )}
        </section>

        <section className="panel disciplines-panel">
          <div className="panel-heading">
            <h2>Disciplinas de batalha</h2>
            <span className="budget">{character.battleDisciplines.length} adicionadas</span>
          </div>

          <div className="skill-picker">
            <select value={selectedBattleDisciplineId} onChange={(event) => setSelectedBattleDisciplineId(event.target.value)}>
              <option value="">Selecione uma disciplina...</option>
              {availableBattleDisciplines.map((discipline) => (
                <option key={discipline.id} value={discipline.id}>
                  {discipline.title}
                </option>
              ))}
            </select>
            <button className="icon-button" type="button" onClick={addBattleDiscipline} disabled={!selectedBattleDisciplineId}>
              +
            </button>
          </div>

          <div className="skills-workspace">
            <div className="skill-list">
              {character.battleDisciplines.length === 0 && <p className="empty-state">Nenhuma disciplina adicionada.</p>}
              {character.battleDisciplines.map((characterDiscipline) => {
                const discipline = battleDisciplines.find((currentDiscipline) => currentDiscipline.id === characterDiscipline.id)

                if (!discipline) {
                  return null
                }

                return (
                  <article
                    className="skill-row"
                    key={characterDiscipline.id}
                    onMouseEnter={() => setHoveredBattleDisciplineId(characterDiscipline.id)}
                    onFocus={() => setHoveredBattleDisciplineId(characterDiscipline.id)}
                  >
                    <span>
                      <strong>{discipline.title}</strong>
                      {discipline.subtitle}
                    </span>
                    <select
                      value={characterDiscipline.level}
                      onChange={(event) => updateBattleDisciplineLevel(characterDiscipline.id, Number(event.target.value))}
                    >
                      <option value="1">Nível 1</option>
                      <option value="2">Nível 2</option>
                      <option value="3">Nível 3</option>
                      <option value="4">Nível 4</option>
                      <option value="5">Nível 5</option>
                    </select>
                    <em className="xp-delta spend">{xpDelta(-skillCost(characterDiscipline.level))}</em>
                    <button className="icon-button danger-button" type="button" onClick={() => removeBattleDiscipline(characterDiscipline.id)}>
                      X
                    </button>
                  </article>
                )
              })}
            </div>

            <aside className="skill-help">
              {hoveredBattleDiscipline ? (
                <>
                  <span>{hoveredBattleDiscipline.subtitle}</span>
                  <strong>{hoveredBattleDiscipline.title}</strong>
                  <p>{hoveredBattleDiscipline.description}</p>
                  <div className="discipline-help-levels">
                    {Object.entries(hoveredBattleDiscipline.levels).map(([level, effect]) => {
                      const numericLevel = Number(level)

                      return (
                      <p className={numericLevel <= hoveredBattleDisciplineLevel ? 'active' : ''} key={level}>
                        <strong>Nível {level}:</strong> {effect.name} - {effect.effect}
                      </p>
                      )
                    })}
                  </div>
                </>
              ) : (
                <>
                  <span>Ajuda rápida</span>
                  <strong>Disciplinas de batalha</strong>
                  <p>Passe o mouse sobre uma disciplina adicionada para ver seus níveis e bônus.</p>
                </>
              )}
            </aside>
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
                  {formatSkillName(skill)}
                </option>
              ))}
            </select>
            <button className="icon-button" type="button" onClick={addSkill} disabled={!canAddSelectedSkill}>
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
                      <strong>{formatSkillName(skill)}</strong>
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
                      X
                    </button>
                  </article>
                )
              })}
            </div>

            <aside className="skill-help">
              {hoveredSkill ? (
                <>
                  <span>{hoveredSkill.subtitle}</span>
                  <strong>{formatSkillName(hoveredSkill)}</strong>
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
