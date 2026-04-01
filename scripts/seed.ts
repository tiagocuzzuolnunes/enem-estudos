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
  "linguagens": {
    "subjects": [
      {
        "name": "Língua Portuguesa e Literatura",
        "subareas": [
          {
            "name": "Gêneros e Tipologia",
            "topics": [
              { "name": "Gêneros Textuais", "subtopics": ["Crônica", "Conto", "Editorial", "Notícia", "Artigo de Opinião"] },
              { "name": "Gêneros Digitais", "subtopics": ["Meme", "Post de rede social", "E-mail", "Blog", "Podcast"] },
              { "name": "Tipologia Textual", "subtopics": ["Narrativo", "Descritivo", "Dissertativo-argumentativo", "Injuntivo", "Expositivo"] }
            ]
          },
          {
            "name": "Gramática e Linguística",
            "topics": [
              { "name": "Coesão e Coerência", "subtopics": ["Conectivos", "Anáforas", "Catáforas", "Operadores argumentativos"] },
              { "name": "Variação Linguística", "subtopics": ["Norma culta", "Coloquialismo", "Regionalismos", "Gírias"] },
              { "name": "Funções e Figuras", "subtopics": ["Funções da Linguagem", "Metáfora e Comparação", "Antítese e Paradoxo", "Ironia", "Hipérbole e Eufemismo", "Metonímia e Personificação"] },
              { "name": "Morfossintaxe", "subtopics": ["Tempos e modos verbais", "Concordância nominal e verbal", "Regência nominal e verbal", "Crase"] }
            ]
          },
          {
            "name": "Teoria e Escolas Literárias",
            "topics": [
              { "name": "Fundamentos", "subtopics": ["Gênero Lírico", "Gênero Épico", "Gênero Dramático", "Elementos da Narrativa"] },
              { "name": "Cronologia", "subtopics": ["Quinhentismo", "Barroco", "Arcadismo", "Romantismo", "Realismo e Naturalismo", "Parnasianismo e Simbolismo", "Pré-Modernismo", "Modernismo (1ª, 2ª e 3ª Geração)", "Literatura Contemporânea"] }
            ]
          },
          {
            "name": "Artes e Educação Física",
            "topics": [
              { "name": "Artes Visuais", "subtopics": ["Linguagem visual", "História da Arte (Clássica ao Moderno)"] },
              { "name": "Manifestações", "subtopics": ["Teatro", "Música", "Dança"] },
              { "name": "Corpo e Saúde", "subtopics": ["Anatomia e Fisiologia do exercício", "Saúde e Exercício", "História dos esportes e Lutas", "Danças e Jogos populares"] }
            ]
          }
        ]
      }
    ]
  },
  "matematica": {
    "subjects": [
      {
        "name": "Matemática",
        "subareas": [
          {
            "name": "Aritmética e Razão",
            "topics": [
              { "name": "Matemática Básica", "subtopics": ["Operações básicas", "Divisibilidade e Primos", "MMC e MDC", "Frações e Decimais", "Potenciação e Radiciação"] },
              { "name": "Proporcionalidade", "subtopics": ["Razão e Proporção", "Regra de três simples e composta", "Porcentagem"] },
              { "name": "Finanças", "subtopics": ["Juros simples", "Juros compostos"] }
            ]
          },
          {
            "name": "Álgebra e Sequências",
            "topics": [
              { "name": "Equações e Inequações", "subtopics": ["1º Grau", "2º Grau", "Sistemas"] },
              { "name": "Funções", "subtopics": ["Função Afim", "Função Quadrática", "Função Exponencial", "Logaritmos e Função Logarítmica"] },
              { "name": "Sequências", "subtopics": ["Progressão Aritmética (PA)", "Progressão Geométrica (PG)"] }
            ]
          },
          {
            "name": "Geometria e Trigonometria",
            "topics": [
              { "name": "Geometria Plana", "subtopics": ["Teorema de Pitágoras", "Áreas e Perímetros", "Semelhança de triângulos", "Teorema de Tales"] },
              { "name": "Geometria Espacial", "subtopics": ["Prismas", "Pirâmides", "Cilindros", "Cones", "Esferas"] },
              { "name": "Trigonometria", "subtopics": ["Razões no triângulo retângulo", "Ciclo trigonométrico", "Funções Seno e Cosseno"] },
              { "name": "Análise", "subtopics": ["Ponto e Reta", "Circunferência no plano"] }
            ]
          },
          {
            "name": "Estatística e Probabilidade",
            "topics": [
              { "name": "Análise Combinatória", "subtopics": ["PFC", "Arranjo", "Combinação", "Permutação"] },
              { "name": "Probabilidade", "subtopics": ["Conceitos básicos", "Espaço amostral", "Probabilidade condicional", "Eventos independentes"] },
              { "name": "Estatística", "subtopics": ["Média (Simples/Ponderada)", "Moda e Mediana", "Desvio padrão e Variância"] }
            ]
          }
        ]
      }
    ]
  },
  "ciencias-natureza": {
    "subjects": [
      {
        "name": "Física",
        "subareas": [
          {
            "name": "Mecânica",
            "topics": [
              { "name": "Cinemática", "subtopics": ["Velocidade média e escalar", "MU e MRUV", "Aceleração", "Movimento Circular", "Queda Livre e Lançamento"] },
              { "name": "Dinâmica", "subtopics": ["Leis de Newton", "Força de Atrito", "Força Centrípeta", "Trabalho, Energia e Potência"] },
              { "name": "Estática e Hidrostática", "subtopics": ["Torque e Equilíbrio", "Pressão e Densidade", "Empuxo e Pascal"] },
              { "name": "Gravitação", "subtopics": ["Leis de Kepler", "Lei da Gravitação Universal"] }
            ]
          },
          {
            "name": "Termofísica e Ondulatória",
            "topics": [
              { "name": "Termologia", "subtopics": ["Calorimetria", "Calor específico e capacidade", "Dilatação térmica", "Gases Ideais", "Leis da Termodinâmica"] },
              { "name": "Óptica", "subtopics": ["Reflexão e Refração", "Espelhos planos e esféricos", "Lentes e Visão humana"] },
              { "name": "Ondulatória", "subtopics": ["Princípios Básicos", "Fenômenos (Reflexão, Refração, Difração)", "Interferência, Polarização, Doppler"] }
            ]
          },
          {
            "name": "Eletromagnetismo",
            "topics": [
              { "name": "Eletricidade", "subtopics": ["Carga elétrica e Lei de Coulomb", "Circuitos e Leis de Ohm", "Potência e Consumo"] },
              { "name": "Magnetismo", "subtopics": ["Ímãs e Campo Magnético"] }
            ]
          }
        ]
      },
      {
        "name": "Química",
        "subareas": [
          {
            "name": "Química Geral e Físico-Química",
            "topics": [
              { "name": "Atomística", "subtopics": ["Modelos atômicos", "Tabela Periódica", "Ligações Químicas", "Polaridade e Forças Intermoleculares"] },
              { "name": "Estequiometria", "subtopics": ["Mol e Massa Molar", "Cálculos simples", "Leis Ponderais e Rendimento"] },
              { "name": "Soluções", "subtopics": ["Concentração e Solubilidade", "Propriedades Coligativas"] },
              { "name": "Energia e Reações", "subtopics": ["Termoquímica (Hess)", "Cinética Química", "Equilíbrio Químico (pH e pOH)", "Eletroquímica (Pilhas e Eletrólise)"] }
            ]
          },
          {
            "name": "Química Orgânica e Ambiental",
            "topics": [
              { "name": "Compostos Orgânicos", "subtopics": ["Hidrocarbonetos", "Funções Oxigenadas", "Funções Nitrogenadas", "Isomeria", "Polímeros e Reações"] },
              { "name": "Química Ambiental", "subtopics": ["Ciclos biogeoquímicos", "Poluição", "Tratamento de Água e Esgoto"] }
            ]
          }
        ]
      },
      {
        "name": "Biologia",
        "subareas": [
          {
            "name": "Vida e Célula",
            "topics": [
              { "name": "Citologia", "subtopics": ["Organelas", "Membrana e Transportes", "Metabolismo Energético", "Divisão Celular"] },
              { "name": "Genética e Evolução", "subtopics": ["Leis de Mendel", "DNA, RNA e Proteínas", "Biotecnologia", "Teorias de Lamarck e Darwin", "Neodarwinismo"] }
            ]
          },
          {
            "name": "Ecologia e Diversidade",
            "topics": [
              { "name": "Ecossistemas", "subtopics": ["Cadeias e Teias", "Ciclos Biogeoquímicos", "Biomas Brasileiros", "Impactos Ambientais"] },
              { "name": "Reinos", "subtopics": ["Vírus e Bactérias", "Protozoários e Fungos", "Botânica", "Zoologia"] }
            ]
          },
          {
            "name": "Saúde Humana",
            "topics": [
              { "name": "Fisiologia", "subtopics": ["Digestório e Respiratório", "Circulatório e Excretor", "Endócrino e Nervoso"] },
              { "name": "Programas de Saúde", "subtopics": ["Doenças bacterianas e virais", "Parasitoses comuns"] }
            ]
          }
        ]
      }
    ]
  },
  "ciencias-humanas": {
    "subjects": [
      {
        "name": "História",
        "subareas": [
          {
            "name": "História do Brasil",
            "topics": [
              { "name": "Colônia", "subtopics": ["Ciclos do açúcar e ouro", "Economia colonial", "Escravidão e Resistência"] },
              { "name": "Império e República", "subtopics": ["Independência", "Primeiro e Segundo Reinado", "República Velha", "Era Vargas", "Ditadura Militar", "Redemocratização"] }
            ]
          },
          {
            "name": "História Geral",
            "topics": [
              { "name": "Revoluções e Século XIX", "subtopics": ["Revolução Industrial", "Revolução Russa", "Imperialismo e Neocolonialismo"] },
              { "name": "Conflitos Mundiais", "subtopics": ["1ª e 2ª Guerra Mundial", "Guerra Fria", "Regimes Totalitários", "Revoluções Chinesa e Cubana"] }
            ]
          }
        ]
      },
      {
        "name": "Geografia",
        "subareas": [
          {
            "name": "Geografia Física e Cartografia",
            "topics": [
              { "name": "Cartografia", "subtopics": ["Projeções e Escalas", "Fusos e Coordenadas"] },
              { "name": "Geofísica", "subtopics": ["Estrutura da Terra", "Tectonismo", "Relevo e Solo", "Clima e Vegetação (Brasil/Mundo)"] }
            ]
          },
          {
            "name": "Geografia Humana e Econômica",
            "topics": [
              { "name": "Economia e Produção", "subtopics": ["Fordismo/Toyotismo", "Industrialização", "Agronegócio", "Globalização"] },
              { "name": "Urbana e Geopolítica", "subtopics": ["Urbanização", "Segregação e Problemas Urbanos", "ONU, OTAN e Conflitos atuais"] },
              { "name": "Meio Ambiente", "subtopics": ["Efeito Estufa", "Sustentabilidade", "Conferências Ambientais"] }
            ]
          }
        ]
      },
      {
        "name": "Sociologia e Filosofia",
        "subareas": [
          {
            "name": "Sociedade e Política",
            "topics": [
              { "name": "Cidadania", "subtopics": ["Direitos Civis, Políticos e Sociais", "Constituições Brasileiras"] },
              { "name": "Cultura", "subtopics": ["Cultura Material e Imaterial", "Diversidade e Patrimônio"] },
              { "name": "Movimentos Sociais", "subtopics": ["Lutas indígenas e negras", "Feminismo e Lutas operárias"] }
            ]
          }
        ]
      }
    ]
  },
  "redacao": {
    "subjects": [
      {
        "name": "Redação ENEM",
        "subareas": [
          {
            "name": "Teoria e Estrutura",
            "topics": [
              { "name": "Fundamentos", "subtopics": ["Análise do Edital", "Critérios de Correção", "Estrutura da Introdução e Tese"] },
              { "name": "Desenvolvimento", "subtopics": ["Estratégias argumentativas", "Repertório Sociocultural"] }
            ]
          },
          {
            "name": "Técnica e Prática",
            "topics": [
              { "name": "Escrita", "subtopics": ["Coesão Textual", "Operadores Argumentativos"] },
              { "name": "Intervenção", "subtopics": ["Os 5 elementos da Proposta"] }
            ]
          }
        ]
      }
    ]
  }
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
