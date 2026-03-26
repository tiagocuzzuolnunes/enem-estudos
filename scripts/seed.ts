import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/enem-estudos'

// ---- inline schemas for seeding ----
const AreaSchema = new mongoose.Schema({ name: String, slug: String, color: String, icon: String, createdAt: { type: Date, default: Date.now } })
const SubjectSchema = new mongoose.Schema({ areaId: mongoose.Types.ObjectId, name: String, order: Number })
const SubareaSchema = new mongoose.Schema({ subjectId: mongoose.Types.ObjectId, areaId: mongoose.Types.ObjectId, name: String, order: Number })
const TopicSchema = new mongoose.Schema({ subareaId: mongoose.Types.ObjectId, subjectId: mongoose.Types.ObjectId, areaId: mongoose.Types.ObjectId, name: String, order: Number })
const SubtopicSchema = new mongoose.Schema({
  topicId: mongoose.Types.ObjectId, subareaId: mongoose.Types.ObjectId,
  subjectId: mongoose.Types.ObjectId, areaId: mongoose.Types.ObjectId,
  name: String, order: Number,
  videoLinks: [{ title: String, url: String }],
  exerciseLinks: [{ title: String, url: String }],
  priority: { type: String, default: 'medium' },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
}, { timestamps: true })
const SettingsSchema = new mongoose.Schema({ enemDate: Date, createdAt: { type: Date, default: Date.now } })

const Area     = mongoose.model('Area',     AreaSchema)
const Subject  = mongoose.model('Subject',  SubjectSchema)
const Subarea  = mongoose.model('Subarea',  SubareaSchema)
const Topic    = mongoose.model('Topic',    TopicSchema)
const Subtopic = mongoose.model('Subtopic', SubtopicSchema)
const Settings = mongoose.model('Settings', SettingsSchema)

// ---- seed data ----
const AREAS = [
  { name: 'Ciências da Natureza', slug: 'ciencias-natureza', color: '#10b981', icon: 'flask' },
  { name: 'Ciências Humanas',     slug: 'ciencias-humanas',  color: '#8b5cf6', icon: 'globe' },
  { name: 'Linguagens e Códigos', slug: 'linguagens',        color: '#3b82f6', icon: 'book'  },
  { name: 'Matemática',           slug: 'matematica',        color: '#f59e0b', icon: 'calculator' },
  { name: 'Redação',              slug: 'redacao',           color: '#ef4444', icon: 'pencil' },
]

const CONTENT: Record<string, {
  subjects: Array<{
    name: string
    subareas: Array<{
      name: string
      topics: Array<{
        name: string
        subtopics: string[]
      }>
    }>
  }>
}> = {
  'ciencias-natureza': {
    subjects: [
      {
        name: 'Física',
        subareas: [
          {
            name: 'Mecânica',
            topics: [
              { name: 'Cinemática', subtopics: ['Movimento Uniforme', 'Movimento Uniformemente Variado', 'Queda Livre', 'Lançamento de Projéteis'] },
              { name: 'Dinâmica',   subtopics: ['Leis de Newton', 'Força de Atrito', 'Força Normal', 'Plano Inclinado'] },
            ],
          },
          {
            name: 'Física Ondulatória',
            topics: [
              { name: 'Ondas',     subtopics: ['Reflexão', 'Refração', 'Difração', 'Interferência'] },
              { name: 'Acústica',  subtopics: ['Características do Som', 'Efeito Doppler', 'Ressonância'] },
              { name: 'Óptica',    subtopics: ['Reflexão da Luz', 'Refração da Luz', 'Lentes', 'Espelhos'] },
            ],
          },
          {
            name: 'Eletromagnetismo',
            topics: [
              { name: 'Eletrostática',  subtopics: ['Carga Elétrica', 'Lei de Coulomb', 'Campo Elétrico', 'Potencial Elétrico'] },
              { name: 'Eletrodinâmica', subtopics: ['Corrente Elétrica', 'Resistência', 'Lei de Ohm', 'Circuitos Elétricos'] },
            ],
          },
        ],
      },
      {
        name: 'Química',
        subareas: [
          {
            name: 'Química Geral',
            topics: [
              { name: 'Estrutura Atômica', subtopics: ['Modelos Atômicos', 'Tabela Periódica', 'Ligações Químicas'] },
              { name: 'Funções Inorgânicas', subtopics: ['Ácidos', 'Bases', 'Sais', 'Óxidos'] },
            ],
          },
          {
            name: 'Físico-Química',
            topics: [
              { name: 'Termoquímica',  subtopics: ['Entalpia', 'Lei de Hess', 'Energia de Ligação'] },
              { name: 'Equilíbrio',    subtopics: ['Equilíbrio Químico', 'Le Chatelier', 'Ka e Kb', 'pH e pOH'] },
              { name: 'Eletroquímica', subtopics: ['Pilhas e Baterias', 'Eletrólise', 'Potencial de Redução'] },
            ],
          },
          {
            name: 'Química Orgânica',
            topics: [
              { name: 'Fundamentos', subtopics: ['Hibridização do Carbono', 'Isomeria', 'Nomenclatura IUPAC'] },
              { name: 'Reações',     subtopics: ['Adição', 'Substituição', 'Eliminação', 'Oxidação'] },
            ],
          },
        ],
      },
      {
        name: 'Biologia',
        subareas: [
          {
            name: 'Biologia Celular',
            topics: [
              { name: 'Citologia', subtopics: ['Membrana Plasmática', 'Organelas Celulares', 'Divisão Celular', 'Metabolismo Celular'] },
            ],
          },
          {
            name: 'Genética',
            topics: [
              { name: 'Genética Clássica',   subtopics: ['Leis de Mendel', 'Dominância Incompleta', 'Codominância', 'Ligação Gênica'] },
              { name: 'Genética Molecular', subtopics: ['DNA e RNA', 'Replicação', 'Transcrição', 'Tradução'] },
            ],
          },
          {
            name: 'Ecologia',
            topics: [
              { name: 'Ecossistemas', subtopics: ['Cadeias Alimentares', 'Ciclos Biogeoquímicos', 'Biomas Brasileiros', 'Sucessão Ecológica'] },
            ],
          },
        ],
      },
    ],
  },
  'ciencias-humanas': {
    subjects: [
      {
        name: 'História',
        subareas: [
          {
            name: 'História do Brasil',
            topics: [
              { name: 'Brasil Colônia',   subtopics: ['Período Pré-Colonial', 'Colonização Portuguesa', 'Ciclos Econômicos', 'Sociedade Colonial'] },
              { name: 'Brasil Império',   subtopics: ['Independência', 'Primeiro Reinado', 'Período Regencial', 'Segundo Reinado'] },
              { name: 'Brasil República', subtopics: ['República Velha', 'Era Vargas', 'Ditadura Militar', 'Redemocratização'] },
            ],
          },
          {
            name: 'História Geral',
            topics: [
              { name: 'Guerras Mundiais', subtopics: ['Causas da 1ª GM', '1ª Guerra Mundial', 'Causas da 2ª GM', '2ª Guerra Mundial', 'Holocausto'] },
              { name: 'Guerra Fria',      subtopics: ['Bipolaridade', 'Corrida Armamentista', 'Conflitos Regionais', 'Fim da URSS'] },
            ],
          },
        ],
      },
      {
        name: 'Geografia',
        subareas: [
          {
            name: 'Geografia Física',
            topics: [
              { name: 'Climatologia',  subtopics: ['Climas do Brasil', 'Climas do Mundo', 'El Niño e La Niña', 'Mudanças Climáticas'] },
              { name: 'Geomorfologia', subtopics: ['Relevo Brasileiro', 'Processos Erosivos', 'Bacias Hidrográficas'] },
            ],
          },
          {
            name: 'Geografia Humana',
            topics: [
              { name: 'Urbanização', subtopics: ['Urbanização Brasileira', 'Urbanização Mundial', 'Problemas Urbanos', 'Metropolização'] },
              { name: 'Geopolítica', subtopics: ['Globalização', 'Blocos Econômicos', 'Conflitos Geopolíticos'] },
            ],
          },
        ],
      },
    ],
  },
  'linguagens': {
    subjects: [
      {
        name: 'Língua Portuguesa',
        subareas: [
          {
            name: 'Gramática',
            topics: [
              { name: 'Morfologia', subtopics: ['Classes de Palavras', 'Formação de Palavras', 'Flexão Nominal', 'Flexão Verbal'] },
              { name: 'Sintaxe',    subtopics: ['Análise Sintática', 'Concordância Nominal', 'Concordância Verbal', 'Regência'] },
            ],
          },
          {
            name: 'Interpretação e Produção',
            topics: [
              { name: 'Interpretação de Texto', subtopics: ['Texto Dissertativo', 'Texto Narrativo', 'Texto Poético', 'Texto Publicitário'] },
              { name: 'Redação',                subtopics: ['Estrutura da Redação ENEM', 'Tese e Argumentação', 'Proposta de Intervenção', 'Coesão e Coerência'] },
            ],
          },
        ],
      },
      {
        name: 'Literatura',
        subareas: [
          {
            name: 'Literatura Brasileira',
            topics: [
              { name: 'Modernismo',               subtopics: ['Semana de Arte Moderna', 'Geração de 22', 'Segundo Modernismo', 'Terceiro Modernismo'] },
              { name: 'Realismo e Naturalismo',   subtopics: ['Machado de Assis', 'Aluísio Azevedo', 'Características do Realismo'] },
            ],
          },
        ],
      },
      {
        name: 'Língua Inglesa',
        subareas: [
          {
            name: 'Interpretação',
            topics: [
              { name: 'Reading Comprehension', subtopics: ['Main Idea', 'Specific Information', 'Vocabulary in Context', 'Inferencing'] },
            ],
          },
        ],
      },
    ],
  },
  'matematica': {
    subjects: [
      {
        name: 'Matemática',
        subareas: [
          {
            name: 'Álgebra',
            topics: [
              { name: 'Funções',  subtopics: ['Função Afim', 'Função Quadrática', 'Função Exponencial', 'Função Logarítmica'] },
              { name: 'Equações', subtopics: ['Equações do 1º Grau', 'Equações do 2º Grau', 'Sistemas de Equações', 'Inequações'] },
            ],
          },
          {
            name: 'Geometria',
            topics: [
              { name: 'Geometria Plana',    subtopics: ['Triângulos', 'Quadriláteros', 'Círculo e Circunferência', 'Polígonos'] },
              { name: 'Geometria Espacial', subtopics: ['Prismas', 'Pirâmides', 'Cilindro, Cone e Esfera', 'Geometria Analítica'] },
            ],
          },
          {
            name: 'Estatística e Probabilidade',
            topics: [
              { name: 'Estatística',   subtopics: ['Média, Mediana e Moda', 'Desvio Padrão', 'Representações Gráficas'] },
              { name: 'Probabilidade', subtopics: ['Espaço Amostral', 'Eventos', 'Probabilidade Condicional', 'Binomial'] },
              { name: 'Combinatória',  subtopics: ['Princípio Multiplicativo', 'Permutação', 'Combinação', 'Arranjo'] },
            ],
          },
          {
            name: 'Trigonometria',
            topics: [
              { name: 'Trigonometria no Triângulo',        subtopics: ['Seno, Cosseno e Tangente', 'Lei dos Senos', 'Lei dos Cossenos'] },
              { name: 'Trigonometria na Circunferência',   subtopics: ['Ciclo Trigonométrico', 'Funções Trigonométricas', 'Equações Trigonométricas'] },
            ],
          },
        ],
      },
    ],
  },
  'redacao': {
    subjects: [
      {
        name: 'Redação ENEM',
        subareas: [
          {
            name: 'Estrutura',
            topics: [
              { name: 'Texto Dissertativo-Argumentativo', subtopics: ['Introdução', 'Desenvolvimento', 'Conclusão com Proposta de Intervenção'] },
              { name: 'Competências ENEM',                subtopics: ['Competência 1: Domínio da Língua', 'Competência 2: Compreensão da Proposta', 'Competência 3: Argumentação', 'Competência 4: Mecanismos Linguísticos', 'Competência 5: Proposta de Intervenção'] },
            ],
          },
          {
            name: 'Prática',
            topics: [
              { name: 'Operadores Argumentativos', subtopics: ['Conectivos de Adição', 'Conectivos de Oposição', 'Conectivos de Conclusão', 'Conectivos de Explicação'] },
              { name: 'Repertório Cultural',       subtopics: ['Dados Estatísticos', 'Citações e Referências', 'Fatos Históricos', 'Legislação'] },
            ],
          },
        ],
      },
    ],
  },
}

async function seed() {
  console.log('🌱 Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected')

  // Clear existing data
  await Promise.all([
    Area.deleteMany({}),
    Subject.deleteMany({}),
    Subarea.deleteMany({}),
    Topic.deleteMany({}),
    Subtopic.deleteMany({}),
    Settings.deleteMany({}),
  ])
  console.log('🗑️  Cleared existing data')

  // Create settings
  await Settings.create({ enemDate: new Date('2025-11-09') })
  console.log('⚙️  Settings created')

  let totalSubtopics = 0

  for (let ai = 0; ai < AREAS.length; ai++) {
    const areaData = AREAS[ai]
    const area = await Area.create(areaData)
    const areaContent = CONTENT[areaData.slug]
    if (!areaContent) continue

    for (let si = 0; si < areaContent.subjects.length; si++) {
      const subjectData = areaContent.subjects[si]
      const subject = await Subject.create({ areaId: area._id, name: subjectData.name, order: si })

      for (let sai = 0; sai < subjectData.subareas.length; sai++) {
        const subareaData = subjectData.subareas[sai]
        const subarea = await Subarea.create({
          subjectId: subject._id, areaId: area._id, name: subareaData.name, order: sai,
        })

        for (let ti = 0; ti < subareaData.topics.length; ti++) {
          const topicData = subareaData.topics[ti]
          const topic = await Topic.create({
            subareaId: subarea._id, subjectId: subject._id, areaId: area._id,
            name: topicData.name, order: ti,
          })

          for (let sti = 0; sti < topicData.subtopics.length; sti++) {
            await Subtopic.create({
              topicId: topic._id, subareaId: subarea._id,
              subjectId: subject._id, areaId: area._id,
              name: topicData.subtopics[sti],
              order: sti,
              priority: sti === 0 ? 'high' : sti === 1 ? 'medium' : 'low',
            })
            totalSubtopics++
          }
        }
      }
    }
    console.log(`  ✅ ${areaData.name}`)
  }

  console.log(`\n🎉 Seed complete! ${totalSubtopics} subtopics created across ${AREAS.length} areas.`)
  await mongoose.disconnect()
}

seed().catch((err) => { console.error(err); process.exit(1) })
