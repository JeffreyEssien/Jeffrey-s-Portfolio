import { ID, Permission, Role } from 'appwrite'
import { APPWRITE_CONFIG, databases, isAppwriteConfigured, storage } from './appwrite'

export type Site = {
  brand: string
  navHome: string
  navAbout: string
  navProjects: string
  navContact: string
  metaTitle: string
  metaDescription: string
  footerCopyright: string
  footerTagline: string
  projectsEyebrow: string
  projectsHeadlinePrefix: string
  projectsHeadlineAccent: string
  projectsHeadlineSuffix: string
  projectsEmpty: string
}

export type Hero = {
  availabilityLabel: string
  greeting: string
  name: string
  subheadline: string
  taglines: string[]
  ctaPrimary: string
  ctaSecondary: string
}

export type Skill = { name: string; level: number }

export type About = {
  eyebrow: string
  headlinePrefix: string
  headlineAccent: string
  headlineSuffix: string
  educationLabel: string
  educationDegree: string
  educationSchool: string
  educationPeriod: string
  certificationsLabel: string
  certifications: string[]
  skillsLabel: string
  skills: Skill[]
  stackLabel: string
  technologies: string[]
}

export type Project = {
  $id?: string
  title: string
  description: string
  link: string
  imageFileId: string
  order: number
}

export type Contact = {
  eyebrow: string
  headlinePrefix: string
  headlineAccent: string
  headlineSuffix: string
  body: string
  ctaEmailLabel: string
  ctaCvLabel: string
  emailLinkLabel: string
  email: string
  ctaSubject: string
  cvFileId: string
}

export const DEFAULT_SITE: Site = {
  brand: 'Jeffrey Essien',
  navHome: 'Home',
  navAbout: 'About',
  navProjects: 'Work',
  navContact: 'Contact',
  metaTitle: 'Jeffrey Essien — Software Engineer',
  metaDescription: 'Front-end developer, mobile builder, UX-obsessed engineer.',
  footerCopyright: '© {year} Jeffrey Essien',
  footerTagline: 'Designed & built with care',
  projectsEyebrow: 'Selected Work',
  projectsHeadlinePrefix: "A few things I've ",
  projectsHeadlineAccent: 'shipped',
  projectsHeadlineSuffix: '.',
  projectsEmpty: 'No projects yet.',
}

export const DEFAULT_HERO: Hero = {
  availabilityLabel: 'Available for new work',
  greeting: "Hello, I'm",
  name: 'Jeffrey',
  subheadline: 'A software engineer building thoughtful interfaces.',
  taglines: [
    'Seasoned Front-End Developer',
    'Mobile App Builder',
    'UI Implementation Expert',
    'UX Specialist',
    'JavaScript Wizard',
  ],
  ctaPrimary: 'View Projects',
  ctaSecondary: 'Contact Me',
}

export const DEFAULT_ABOUT: About = {
  eyebrow: 'About',
  headlinePrefix: 'I design and build digital products that feel ',
  headlineAccent: 'considered',
  headlineSuffix: ' and perform with intent.',
  educationLabel: 'Education',
  educationDegree: 'B.Sc. in Software Engineering',
  educationSchool: 'Babcock University, Nigeria',
  educationPeriod: 'CGPA: 4.10 / 5.00 (2022 – 2025)',
  certificationsLabel: 'Certifications',
  certifications: [
    'Google Machine Learning Crash Course – Google',
    'React Native for Beginners – CodeWithMosh',
    'Learn Next.js – Codecademy',
    'Microsoft Certified: Power BI Data Analyst Associate',
    'Database Administration Fundamentals – New Horizons',
  ],
  skillsLabel: 'Skills',
  skills: [
    { name: 'JavaScript', level: 95 },
    { name: 'TypeScript', level: 92 },
    { name: 'React & Next.js', level: 94 },
    { name: 'React Native', level: 88 },
    { name: 'Tailwind & ShadCN/UI', level: 90 },
  ],
  stackLabel: 'Stack',
  technologies: [
    'Firebase', 'AI API Integration', 'JWT Auth', 'Serverless APIs',
    'Postman', 'CI/CD', 'Figma', 'Vercel', 'Netlify',
  ],
}

export const DEFAULT_CONTACT: Contact = {
  eyebrow: 'Contact',
  headlinePrefix: "Let's build something ",
  headlineAccent: 'together',
  headlineSuffix: '.',
  body: 'Always open to new projects, collaborations, or a quick conversation. The fastest way to reach me is by email.',
  ctaEmailLabel: 'Send an email',
  ctaCvLabel: 'Download CV',
  emailLinkLabel: '',
  email: 'jeffreye306@gmail.com',
  ctaSubject: "Let's work together",
  cvFileId: '',
}

const SINGLE_DOC_ID = 'main'

async function readSingleton<T>(collectionId: string, fallback: T): Promise<T> {
  if (!isAppwriteConfigured()) return fallback
  try {
    const doc = await databases.getDocument(
      APPWRITE_CONFIG.databaseId,
      collectionId,
      SINGLE_DOC_ID,
    )
    const raw = (doc as { data?: string }).data
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return { ...fallback, ...parsed } as T
  } catch {
    return fallback
  }
}

async function writeSingleton<T>(collectionId: string, value: T): Promise<void> {
  await databases.updateDocument(
    APPWRITE_CONFIG.databaseId,
    collectionId,
    SINGLE_DOC_ID,
    { data: JSON.stringify(value) },
  )
}

const SITE_COLLECTION =
  process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_SITE || 'site'

export const getSite = () => readSingleton(SITE_COLLECTION, DEFAULT_SITE)
export const setSite = (v: Site) => writeSingleton(SITE_COLLECTION, v)

export const getHero = () => readSingleton(APPWRITE_CONFIG.collections.hero, DEFAULT_HERO)
export const setHero = (v: Hero) => writeSingleton(APPWRITE_CONFIG.collections.hero, v)

export const getAbout = () => readSingleton(APPWRITE_CONFIG.collections.about, DEFAULT_ABOUT)
export const setAbout = (v: About) => writeSingleton(APPWRITE_CONFIG.collections.about, v)

export const getContact = () => readSingleton(APPWRITE_CONFIG.collections.contact, DEFAULT_CONTACT)
export const setContact = (v: Contact) => writeSingleton(APPWRITE_CONFIG.collections.contact, v)

export async function getProjects(): Promise<Project[]> {
  if (!isAppwriteConfigured()) return []
  try {
    const res = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.projects,
    )
    const items = res.documents.map((doc) => {
      const raw = (doc as { data?: string }).data || '{}'
      const parsed = JSON.parse(raw)
      return { $id: doc.$id, order: 0, ...parsed } as Project
    })
    return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  } catch {
    return []
  }
}

export async function createProject(p: Omit<Project, '$id'>): Promise<Project> {
  const doc = await databases.createDocument(
    APPWRITE_CONFIG.databaseId,
    APPWRITE_CONFIG.collections.projects,
    ID.unique(),
    { data: JSON.stringify(p) },
    [
      Permission.read(Role.any()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ],
  )
  return { $id: doc.$id, ...p }
}

export async function updateProject(id: string, p: Omit<Project, '$id'>): Promise<void> {
  await databases.updateDocument(
    APPWRITE_CONFIG.databaseId,
    APPWRITE_CONFIG.collections.projects,
    id,
    { data: JSON.stringify(p) },
  )
}

export async function deleteProject(id: string): Promise<void> {
  await databases.deleteDocument(
    APPWRITE_CONFIG.databaseId,
    APPWRITE_CONFIG.collections.projects,
    id,
  )
}

export async function uploadFile(file: File): Promise<string> {
  const created = await storage.createFile(
    APPWRITE_CONFIG.bucketId,
    ID.unique(),
    file,
    [
      Permission.read(Role.any()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ],
  )
  return created.$id
}

export async function deleteFile(fileId: string): Promise<void> {
  if (!fileId) return
  try {
    await storage.deleteFile(APPWRITE_CONFIG.bucketId, fileId)
  } catch {
    // ignore — file may already be gone
  }
}
