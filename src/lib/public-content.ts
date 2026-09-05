import snapshot from './published-content.json'
import {
  DEFAULT_ABOUT, DEFAULT_CONTACT, DEFAULT_HERO, DEFAULT_SITE,
  getAbout, getContact, getHero, getProjects, getSite, getWorkEntries,
  type About, type Contact, type Hero, type Project, type Site, type WorkEntry,
} from './content'
import { fileUrl } from './appwrite'

export const publishedSite: Site = { ...DEFAULT_SITE, ...snapshot.site }
export const publishedHero: Hero = { ...DEFAULT_HERO, ...snapshot.hero }
export const publishedAbout: About = { ...DEFAULT_ABOUT, ...snapshot.about }
export const publishedContact: Contact = { ...DEFAULT_CONTACT, ...snapshot.contact }
export const publishedProjects: Project[] = snapshot.projects
export const publishedWork: WorkEntry[] = snapshot.work
export const publishedAt = snapshot.publishedAt

async function withFallback<T>(request: Promise<T>, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      request,
      new Promise<T>((resolve) => { timer = setTimeout(() => resolve(fallback), 5000) }),
    ])
  } catch {
    return fallback
  } finally {
    clearTimeout(timer)
  }
}

export const getPublicSite = () => withFallback(getSite(publishedSite), publishedSite)
export const getPublicHero = () => withFallback(getHero(publishedHero), publishedHero)
export const getPublicAbout = () => withFallback(getAbout(publishedAbout), publishedAbout)
export const getPublicContact = () => withFallback(getContact(publishedContact), publishedContact)
export const getPublicProjects = () => withFallback(getProjects(publishedProjects), publishedProjects)
export const getPublicWork = () => withFallback(getWorkEntries(publishedWork), publishedWork)

export function publicAssetUrl(id: string): string {
  return (snapshot.assets as Record<string, string>)[id] || fileUrl(id)
}
