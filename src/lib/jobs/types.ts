export type JobSource = 'adzuna' | 'jooble' | 'greenhouse' | 'lever' | 'ashby' | 'remotive' | 'hn-hiring' | 'hot-nigerian-jobs' | 'google-search'

export type NgFlag = 'direct' | 'worldwide' | 'unclear'

export type ScoreBreakdown = {
  titleHits: string[]
  bodyHits: string[]
  recencyBoost: number
  ngFlag: NgFlag
  rejected?: string
}

export type Job = {
  $id?: string
  id: string
  source: JobSource
  sourceId: string
  title: string
  company: string
  location: string
  remote: boolean
  url: string
  postedAt: string
  descriptionText: string
  score: number
  scoreBreakdown: ScoreBreakdown
  fetchedAt: string
}

export type JobActionState = 'saved' | 'applied' | 'dismissed'

export type JobAction = {
  $id?: string
  jobId: string
  state: JobActionState
  notes: string
  updatedAt: string
}

export type JobProfile = {
  roleKeywords: string[]
  skillKeywords: string[]
  seniority: ('graduate' | 'junior' | 'mid')[]
  locations: string[]
  excludes: string[]
  sources: Record<JobSource, boolean>
  greenhouseSlugs: string[]
  leverSlugs: string[]
  ashbySlugs: string[]
  companiesNG: string[]
  lastRunAt: string
  lastRunCounts: Partial<Record<JobSource, number>>
}

export type AdapterResult = {
  source: JobSource
  jobs: RawJob[]
  errors: string[]
}

export type RawJob = {
  sourceId: string
  title: string
  company: string
  location: string
  remote: boolean
  url: string
  postedAt: string
  descriptionText: string
}

export const DEFAULT_JOB_PROFILE: JobProfile = {
  roleKeywords: ['developer', 'engineer', 'frontend', 'front-end', 'front end', 'full-stack', 'fullstack', 'full stack', 'backend', 'back-end', 'web developer', 'software engineer', 'software developer', 'mobile developer', 'mobile engineer', 'react', 'react native', 'next.js', 'nextjs', 'javascript', 'typescript', 'graduate trainee', 'graduate program', 'junior', 'entry-level', 'entry level', 'intern'],
  skillKeywords: ['react', 'typescript', 'javascript', 'next.js', 'tailwind', 'node', 'firebase', 'appwrite', 'react native', 'figma', 'rest api', 'jwt', 'ci/cd'],
  seniority: ['graduate', 'junior', 'mid'],
  locations: ['Nigeria', 'Lagos', 'Abuja', 'Remote', 'Worldwide', 'Africa'],
  excludes: ['senior', 'principal', 'staff engineer', 'engineering manager', 'security clearance', 'us citizens only', 'must be located in the us', 'must be located in the eu', 'php developer', '.net developer'],
  sources: { adzuna: true, jooble: true, greenhouse: true, lever: true, ashby: true, remotive: true, 'hn-hiring': true, 'hot-nigerian-jobs': true, 'google-search': true },
  greenhouseSlugs: ['paystack', 'moniepoint'],
  leverSlugs: [],
  ashbySlugs: ['andela'],
  companiesNG: [
    'Access Bank', 'GTBank', 'Zenith Bank', 'UBA', 'FCMB', 'Sterling Bank', 'Stanbic IBTC',
    'Fidelity Bank', 'Ecobank', 'Greenwich Merchant Bank', 'Kuda Bank', 'Carbon', 'PalmPay',
    'OPay', 'PwC Nigeria', 'Deloitte Nigeria', 'KPMG Nigeria', 'EY Nigeria', 'McKinsey',
    'Phillips Consulting', 'Teamace', 'Unilever Nigeria', 'Nestlé Nigeria', 'Procter & Gamble',
    'Coca-Cola', 'Nigerian Breweries', 'PZ Cussons', 'Guinness Nigeria', 'Reckitt',
    'Dangote', 'BUA Group', 'Flour Mills', 'Interswitch', 'Flutterwave', 'Paystack',
    'Moniepoint', 'Andela', 'MTN Nigeria', 'Airtel Nigeria', '9mobile', 'Huawei',
    'Bincom', 'Appzone', 'Shell Nigeria', 'Chevron Nigeria', 'TotalEnergies', 'ExxonMobil',
    'NLNG', 'Schneider Electric', 'APM Terminals',
  ],
  lastRunAt: '',
  lastRunCounts: {},
}
