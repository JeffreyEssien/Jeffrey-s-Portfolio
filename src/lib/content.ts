import { ID, Permission, Role } from 'appwrite'
import { APPWRITE_CONFIG, databases, isAppwriteConfigured, storage } from './appwrite'

export type Site = {
  brand: string
  navHome: string
  navAbout: string
  navWork: string
  navProjects: string
  navContact: string
  metaTitle: string
  metaDescription: string
  footerCopyright: string
  footerTagline: string
  workEyebrow: string
  workHeadlinePrefix: string
  workHeadlineAccent: string
  workHeadlineSuffix: string
  workEmpty: string
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
  extraHeading: string
  extraParagraph: string
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

export type WorkEntry = {
  $id?: string
  role: string
  company: string
  period: string
  location: string
  description: string
  order: number
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
  navWork: 'Experience',
  navProjects: 'Work',
  navContact: 'Contact',
  metaTitle: 'Jeffrey Essien — Software Engineer',
  metaDescription: 'Front-end developer, mobile builder, UX-obsessed engineer.',
  footerCopyright: '© {year} Jeffrey Essien',
  footerTagline: 'Designed & built with care',
  workEyebrow: 'Experience',
  workHeadlinePrefix: "Places I've ",
  workHeadlineAccent: 'worked',
  workHeadlineSuffix: '.',
  workEmpty: 'No experience listed yet.',
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
  extraHeading: '',
  extraParagraph: '',
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

export async function getWorkEntries(): Promise<WorkEntry[]> {
  if (!isAppwriteConfigured()) return []
  try {
    const res = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.work,
    )
    const items = res.documents.map((doc) => {
      const raw = (doc as { data?: string }).data || '{}'
      const parsed = JSON.parse(raw)
      return { $id: doc.$id, order: 0, ...parsed } as WorkEntry
    })
    return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  } catch {
    return []
  }
}

export async function createWorkEntry(e: Omit<WorkEntry, '$id'>): Promise<WorkEntry> {
  const doc = await databases.createDocument(
    APPWRITE_CONFIG.databaseId,
    APPWRITE_CONFIG.collections.work,
    ID.unique(),
    { data: JSON.stringify(e) },
    [
      Permission.read(Role.any()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ],
  )
  return { $id: doc.$id, ...e }
}

export async function updateWorkEntry(id: string, e: Omit<WorkEntry, '$id'>): Promise<void> {
  await databases.updateDocument(
    APPWRITE_CONFIG.databaseId,
    APPWRITE_CONFIG.collections.work,
    id,
    { data: JSON.stringify(e) },
  )
}

export async function deleteWorkEntry(id: string): Promise<void> {
  await databases.deleteDocument(
    APPWRITE_CONFIG.databaseId,
    APPWRITE_CONFIG.collections.work,
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

export type CvLink = { id: string; label: string; url: string }
export type CvBullet = { id: string; text: string }
export type CvExperienceItem = { id: string; role: string; company: string; location: string; period: string; bullets: CvBullet[] }
export type CvEducationItem = { id: string; degree: string; school: string; location: string; period: string; details: string }
export type CvProjectItem = { id: string; title: string; description: string; link: string; bullets: CvBullet[] }
export type CvSkillGroup = { id: string; label: string; items: string[] }
export type CvSimpleItem = { id: string; text: string }

export type CvSection =
  | { id: string; type: 'summary'; visible: boolean; heading: string; body: string }
  | { id: string; type: 'experience'; visible: boolean; heading: string; items: CvExperienceItem[] }
  | { id: string; type: 'education'; visible: boolean; heading: string; items: CvEducationItem[] }
  | { id: string; type: 'skills'; visible: boolean; heading: string; groups: CvSkillGroup[] }
  | { id: string; type: 'projects'; visible: boolean; heading: string; items: CvProjectItem[] }
  | { id: string; type: 'certifications'; visible: boolean; heading: string; items: CvSimpleItem[] }
  | { id: string; type: 'custom'; visible: boolean; heading: string; items: CvSimpleItem[] }

export type CvTemplate = 'ats-classic' | 'ats-modern' | 'ats-compact' | 'editorial' | 'creative'

export type Cv = {
  template: CvTemplate
  fontFamily: 'Helvetica' | 'Times-Roman' | 'Courier'
  fontSize: number
  accentColor: string
  margin: number
  personal: {
    fullName: string
    headline: string
    email: string
    phone: string
    location: string
    website: string
    links: CvLink[]
  }
  sections: CvSection[]
}

export const DEFAULT_CV: Cv = {
  template: 'ats-classic',
  fontFamily: 'Helvetica',
  fontSize: 10.5,
  accentColor: '#111111',
  margin: 40,
  personal: {
    fullName: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    links: [],
  },
  sections: [],
}

const newId = () => Math.random().toString(36).slice(2, 10)

export function seedCvFromSite(
  hero: Hero,
  about: About,
  work: WorkEntry[],
  projects: Project[],
  contact: Contact,
  existing?: Cv,
): Cv {
  const base = existing ?? DEFAULT_CV
  const sections: CvSection[] = [
    { id: newId(), type: 'summary', visible: true, heading: 'Summary',
      body: [hero.subheadline, about.extraParagraph].filter(Boolean).join(' ') },
    { id: newId(), type: 'experience', visible: true, heading: 'Experience',
      items: work.map((w) => ({
        id: newId(),
        role: w.role,
        company: w.company,
        location: w.location,
        period: w.period,
        bullets: (w.description || '')
          .split('\n').map((l) => l.trim()).filter(Boolean)
          .map((text) => ({ id: newId(), text })),
      })) },
    { id: newId(), type: 'education', visible: true, heading: 'Education',
      items: [{
        id: newId(),
        degree: about.educationDegree,
        school: about.educationSchool,
        location: '',
        period: about.educationPeriod,
        details: '',
      }] },
    { id: newId(), type: 'skills', visible: true, heading: 'Skills',
      groups: [
        { id: newId(), label: about.skillsLabel || 'Core', items: about.skills.map((s) => s.name) },
        { id: newId(), label: about.stackLabel || 'Stack', items: about.technologies },
      ].filter((g) => g.items.length) },
    { id: newId(), type: 'projects', visible: true, heading: 'Projects',
      items: projects.map((p) => ({
        id: newId(),
        title: p.title,
        description: p.description,
        link: p.link,
        bullets: [],
      })) },
    { id: newId(), type: 'certifications', visible: true, heading: 'Certifications',
      items: about.certifications.map((c) => ({ id: newId(), text: c })) },
  ]
  return {
    ...base,
    personal: {
      ...base.personal,
      fullName: base.personal.fullName || [hero.greeting, hero.name].filter(Boolean).join(' ').replace(/^Hello,?\s*I'?m\s*/i, '').trim() || hero.name,
      headline: base.personal.headline || hero.taglines[0] || '',
      email: base.personal.email || contact.email,
    },
    sections,
  }
}

export const getCv = () => readSingleton(APPWRITE_CONFIG.collections.cv, DEFAULT_CV)
export const setCv = (v: Cv) => writeSingleton(APPWRITE_CONFIG.collections.cv, v)
