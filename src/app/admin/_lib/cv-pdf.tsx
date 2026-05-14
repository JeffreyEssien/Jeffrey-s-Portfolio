'use client'

import { Document, Page, Text, View, StyleSheet, Link, Font } from '@react-pdf/renderer'
import type { Cv, CvSection } from '../../../lib/content'

// Stick to PDF standard fonts — no network fetch, ATS-safe.
Font.registerHyphenationCallback((w) => [w])

const hex = (c: string) => (/^#[0-9a-fA-F]{6}$/.test(c) ? c : '#111111')

function makeStyles(cv: Cv) {
  const f = cv.fontFamily
  const s = cv.fontSize
  const m = cv.margin
  const accent = hex(cv.accentColor)
  return StyleSheet.create({
    page: { paddingTop: m, paddingBottom: m, paddingLeft: m, paddingRight: m, fontFamily: f, fontSize: s, color: '#111111', lineHeight: 1.4 },
    nameRow: { marginBottom: 6 },
    name: { fontSize: s + 12, fontFamily: f, fontWeight: 700, color: accent, letterSpacing: 0.5, lineHeight: 1.1 },
    headline: { fontSize: s + 1, color: '#444', marginTop: 8 },
    contactRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, marginBottom: 12 },
    contactItem: { fontSize: s - 1, color: '#444', marginRight: 10 },
    rule: { borderBottomWidth: 0.75, borderBottomColor: '#888', marginVertical: 8 },
    sectionHeading: { fontSize: s + 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: accent, marginTop: 10, marginBottom: 4 },
    itemHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    itemTitle: { fontWeight: 700 },
    itemSub: { color: '#444' },
    itemMeta: { color: '#666', fontSize: s - 0.5 },
    bullet: { flexDirection: 'row', marginTop: 2, paddingLeft: 8 },
    bulletDot: { width: 10 },
    bulletText: { flex: 1 },
    skillRow: { marginTop: 2 },
    skillLabel: { fontWeight: 700 },
    link: { color: accent, textDecoration: 'none' },
    summaryBody: { marginTop: 2 },
    // creative-only
    creativePage: { flexDirection: 'row', fontFamily: f, fontSize: s, color: '#111111', lineHeight: 1.4 },
    creativeSide: { width: '34%', backgroundColor: accent, color: '#ffffff', padding: m * 0.7 },
    creativeMain: { width: '66%', padding: m * 0.7 },
    creativeName: { fontSize: s + 14, fontWeight: 700, color: '#ffffff', lineHeight: 1.1 },
    creativeHeadline: { fontSize: s, color: '#e5e5e5', marginTop: 10, marginBottom: 14 },
    creativeSideHeading: { fontSize: s, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: '#ffffff', marginTop: 14, marginBottom: 4 },
    creativeSideText: { color: '#f1f1f1', fontSize: s - 0.5 },
    creativeMainHeading: { fontSize: s + 2, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 8, marginBottom: 4 },
    // editorial template
    editorialPage: { paddingTop: m + 8, paddingBottom: m, paddingLeft: m + 8, paddingRight: m + 8, fontFamily: f, fontSize: s, color: '#1a1a1a', lineHeight: 1.5 },
    editorialHeader: { borderBottomWidth: 1.5, borderBottomColor: accent, paddingBottom: 14, marginBottom: 18 },
    editorialName: { fontSize: s + 18, fontWeight: 700, color: accent, letterSpacing: 1.5, textTransform: 'uppercase', lineHeight: 1.05 },
    editorialHeadline: { fontSize: s + 1, color: '#555', marginTop: 10, fontStyle: 'italic' },
    editorialContactRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
    editorialContactItem: { fontSize: s - 1, color: '#555', marginRight: 14 },
    editorialSection: { marginTop: 16, marginBottom: 4 },
    editorialSectionLabel: { fontSize: s - 1, color: accent, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 8 },
    editorialSectionAccent: { width: 28, height: 2, backgroundColor: accent, marginBottom: 10 },
    editorialItemTitle: { fontWeight: 700, fontSize: s + 0.5 },
    editorialItemMeta: { color: '#666', fontSize: s - 0.5, fontStyle: 'italic' },
    editorialItemSub: { color: '#444', marginTop: 1 },
    editorialBullet: { flexDirection: 'row', marginTop: 3, paddingLeft: 4 },
    editorialBulletDot: { width: 12, color: accent },
    editorialBulletText: { flex: 1 },
    editorialSkillRow: { marginTop: 3 },
  })
}

function joinMeta(...parts: (string | undefined | null)[]) {
  return parts.filter(Boolean).join(' · ')
}

function SectionBlock({ section, styles, hideHeading }: { section: CvSection; styles: ReturnType<typeof makeStyles>; hideHeading?: boolean }) {
  if (!section.visible) return null
  const Heading = () => hideHeading ? null : <Text style={styles.sectionHeading}>{section.heading}</Text>
  if (section.type === 'summary') {
    if (!section.body?.trim()) return null
    return (
      <View wrap={false}>
        <Heading />
        <Text style={styles.summaryBody}>{section.body}</Text>
      </View>
    )
  }
  if (section.type === 'experience') {
    if (!section.items.length) return null
    return (
      <View>
        <Heading />
        {section.items.map((it) => (
          <View key={it.id} wrap={false} style={{ marginBottom: 6 }}>
            <View style={styles.itemHeaderRow}>
              <Text style={styles.itemTitle}>{it.role}{it.company ? ` · ${it.company}` : ''}</Text>
              <Text style={styles.itemMeta}>{it.period}</Text>
            </View>
            {it.location ? <Text style={styles.itemMeta}>{it.location}</Text> : null}
            {it.bullets.map((b) => (
              <View key={b.id} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{b.text}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    )
  }
  if (section.type === 'education') {
    if (!section.items.length) return null
    return (
      <View>
        <Heading />
        {section.items.map((it) => (
          <View key={it.id} wrap={false} style={{ marginBottom: 4 }}>
            <View style={styles.itemHeaderRow}>
              <Text style={styles.itemTitle}>{it.degree}</Text>
              <Text style={styles.itemMeta}>{it.period}</Text>
            </View>
            <Text style={styles.itemSub}>{joinMeta(it.school, it.location)}</Text>
            {it.details ? <Text style={styles.itemMeta}>{it.details}</Text> : null}
          </View>
        ))}
      </View>
    )
  }
  if (section.type === 'skills') {
    if (!section.groups.length) return null
    return (
      <View wrap={false}>
        <Heading />
        {section.groups.map((g) => (
          <Text key={g.id} style={styles.skillRow}>
            <Text style={styles.skillLabel}>{g.label}: </Text>
            <Text>{g.items.join(', ')}</Text>
          </Text>
        ))}
      </View>
    )
  }
  if (section.type === 'projects') {
    if (!section.items.length) return null
    return (
      <View>
        <Heading />
        {section.items.map((it) => (
          <View key={it.id} wrap={false} style={{ marginBottom: 6 }}>
            <View style={styles.itemHeaderRow}>
              <Text style={styles.itemTitle}>{it.title}</Text>
              {it.link ? <Link src={it.link} style={styles.link}>{it.link}</Link> : null}
            </View>
            {it.description ? <Text>{it.description}</Text> : null}
            {it.bullets.map((b) => (
              <View key={b.id} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{b.text}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    )
  }
  // certifications / custom
  if (!section.items.length) return null
  return (
    <View wrap={false}>
      <Heading />
      {section.items.map((it) => (
        <View key={it.id} style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{it.text}</Text>
        </View>
      ))}
    </View>
  )
}

function Header({ cv, styles, center }: { cv: Cv; styles: ReturnType<typeof makeStyles>; center?: boolean }) {
  const p = cv.personal
  const contactBits = [p.email, p.phone, p.location, p.website, ...p.links.map((l) => l.url)].filter(Boolean)
  return (
    <View style={center ? { alignItems: 'center' } : {}}>
      <View style={styles.nameRow}>
        <Text style={styles.name}>{p.fullName || ' '}</Text>
        {p.headline ? <Text style={styles.headline}>{p.headline}</Text> : null}
      </View>
      <View style={[styles.contactRow, center ? { justifyContent: 'center' } : {}]}>
        {contactBits.map((c, i) => (
          <Text key={i} style={styles.contactItem}>{c}</Text>
        ))}
      </View>
    </View>
  )
}

function AtsClassic({ cv }: { cv: Cv }) {
  const styles = makeStyles(cv)
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Header cv={cv} styles={styles} center />
        <View style={styles.rule} />
        {cv.sections.map((s) => (
          <SectionBlock key={s.id} section={s} styles={styles} />
        ))}
      </Page>
    </Document>
  )
}

function AtsModern({ cv }: { cv: Cv }) {
  const styles = makeStyles(cv)
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Header cv={cv} styles={styles} />
        {cv.sections.map((s) => (
          <SectionBlock key={s.id} section={s} styles={styles} />
        ))}
      </Page>
    </Document>
  )
}

function AtsCompact({ cv }: { cv: Cv }) {
  const styles = makeStyles({ ...cv, fontSize: cv.fontSize - 0.5, margin: Math.max(24, cv.margin - 10) })
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Header cv={cv} styles={styles} />
        <View style={styles.rule} />
        {cv.sections.map((s) => (
          <SectionBlock key={s.id} section={s} styles={styles} />
        ))}
      </Page>
    </Document>
  )
}

function Creative({ cv }: { cv: Cv }) {
  const styles = makeStyles(cv)
  const p = cv.personal
  const sideSections = cv.sections.filter((s) => s.type === 'skills' || s.type === 'certifications')
  const mainSections = cv.sections.filter((s) => !['skills', 'certifications'].includes(s.type))
  return (
    <Document>
      <Page size="LETTER" style={styles.creativePage}>
        <View style={styles.creativeSide}>
          <Text style={styles.creativeName}>{p.fullName || ' '}</Text>
          {p.headline ? <Text style={styles.creativeHeadline}>{p.headline}</Text> : null}
          <Text style={styles.creativeSideHeading}>Contact</Text>
          {[p.email, p.phone, p.location, p.website].filter(Boolean).map((c, i) => (
            <Text key={i} style={styles.creativeSideText}>{c}</Text>
          ))}
          {p.links.map((l) => (
            <Text key={l.id} style={styles.creativeSideText}>{l.label}: {l.url}</Text>
          ))}
          {sideSections.map((s) => {
            if (!s.visible) return null
            if (s.type === 'skills') {
              return (
                <View key={s.id}>
                  <Text style={styles.creativeSideHeading}>{s.heading}</Text>
                  {s.groups.map((g) => (
                    <View key={g.id} style={{ marginBottom: 4 }}>
                      <Text style={[styles.creativeSideText, { fontWeight: 700 }]}>{g.label}</Text>
                      <Text style={styles.creativeSideText}>{g.items.join(', ')}</Text>
                    </View>
                  ))}
                </View>
              )
            }
            if (s.type === 'certifications') {
              return (
                <View key={s.id}>
                  <Text style={styles.creativeSideHeading}>{s.heading}</Text>
                  {s.items.map((it) => (
                    <Text key={it.id} style={styles.creativeSideText}>• {it.text}</Text>
                  ))}
                </View>
              )
            }
            return null
          })}
        </View>
        <View style={styles.creativeMain}>
          {mainSections.map((s) => {
            if (!s.visible) return null
            if (s.type === 'summary') {
              if (!s.body?.trim()) return null
              return (
                <View key={s.id}>
                  <Text style={styles.creativeMainHeading}>{s.heading}</Text>
                  <Text>{s.body}</Text>
                </View>
              )
            }
            return (
              <View key={s.id}>
                <Text style={styles.creativeMainHeading}>{s.heading}</Text>
                <SectionBlock section={s} styles={styles} hideHeading />
              </View>
            )
          })}
        </View>
      </Page>
    </Document>
  )
}

function Editorial({ cv }: { cv: Cv }) {
  const styles = makeStyles(cv)
  const p = cv.personal
  const contactBits = [p.email, p.phone, p.location, p.website, ...p.links.map((l) => l.url)].filter(Boolean)
  return (
    <Document>
      <Page size="LETTER" style={styles.editorialPage}>
        <View style={styles.editorialHeader}>
          <Text style={styles.editorialName}>{p.fullName || ' '}</Text>
          {p.headline ? <Text style={styles.editorialHeadline}>{p.headline}</Text> : null}
          <View style={styles.editorialContactRow}>
            {contactBits.map((c, i) => (
              <Text key={i} style={styles.editorialContactItem}>{c}</Text>
            ))}
          </View>
        </View>
        {cv.sections.map((s) => {
          if (!s.visible) return null
          return (
            <View key={s.id} style={styles.editorialSection}>
              <View wrap={false}>
                <Text style={styles.editorialSectionLabel}>{s.heading}</Text>
                <View style={styles.editorialSectionAccent} />
              </View>
              <View>
                {s.type === 'summary' && s.body?.trim() ? <Text>{s.body}</Text> : null}
                {s.type === 'experience' && s.items.map((it) => (
                  <View key={it.id} wrap={false} style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.editorialItemTitle}>{it.role}{it.company ? ` — ${it.company}` : ''}</Text>
                      <Text style={styles.editorialItemMeta}>{it.period}</Text>
                    </View>
                    {it.location ? <Text style={styles.editorialItemMeta}>{it.location}</Text> : null}
                    {it.bullets.map((b) => (
                      <View key={b.id} style={styles.editorialBullet}>
                        <Text style={styles.editorialBulletDot}>›</Text>
                        <Text style={styles.editorialBulletText}>{b.text}</Text>
                      </View>
                    ))}
                  </View>
                ))}
                {s.type === 'education' && s.items.map((it) => (
                  <View key={it.id} wrap={false} style={{ marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.editorialItemTitle}>{it.degree}</Text>
                      <Text style={styles.editorialItemMeta}>{it.period}</Text>
                    </View>
                    <Text style={styles.editorialItemSub}>{joinMeta(it.school, it.location)}</Text>
                    {it.details ? <Text style={styles.editorialItemMeta}>{it.details}</Text> : null}
                  </View>
                ))}
                {s.type === 'skills' && s.groups.map((g) => (
                  <Text key={g.id} style={styles.editorialSkillRow}>
                    <Text style={{ fontWeight: 700 }}>{g.label} — </Text>
                    <Text>{g.items.join(', ')}</Text>
                  </Text>
                ))}
                {s.type === 'projects' && s.items.map((it) => (
                  <View key={it.id} wrap={false} style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.editorialItemTitle}>{it.title}</Text>
                      {it.link ? <Link src={it.link} style={styles.link}>{it.link}</Link> : null}
                    </View>
                    {it.description ? <Text style={styles.editorialItemSub}>{it.description}</Text> : null}
                    {it.bullets.map((b) => (
                      <View key={b.id} style={styles.editorialBullet}>
                        <Text style={styles.editorialBulletDot}>›</Text>
                        <Text style={styles.editorialBulletText}>{b.text}</Text>
                      </View>
                    ))}
                  </View>
                ))}
                {(s.type === 'certifications' || s.type === 'custom') && s.items.map((it) => (
                  <View key={it.id} style={styles.editorialBullet}>
                    <Text style={styles.editorialBulletDot}>›</Text>
                    <Text style={styles.editorialBulletText}>{it.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          )
        })}
      </Page>
    </Document>
  )
}

export function CvDocument({ cv }: { cv: Cv }) {
  switch (cv.template) {
    case 'ats-modern': return <AtsModern cv={cv} />
    case 'ats-compact': return <AtsCompact cv={cv} />
    case 'editorial': return <Editorial cv={cv} />
    case 'creative': return <Creative cv={cv} />
    case 'ats-classic':
    default: return <AtsClassic cv={cv} />
  }
}

export const TEMPLATE_OPTIONS: { value: Cv['template']; label: string; atsSafe: boolean; desc: string }[] = [
  { value: 'ats-classic', label: 'ATS Classic', atsSafe: true, desc: 'Centered header, ruled divider. Most universally parsed.' },
  { value: 'ats-modern', label: 'ATS Modern', atsSafe: true, desc: 'Left-aligned header, clean section breaks.' },
  { value: 'ats-compact', label: 'ATS Compact', atsSafe: true, desc: 'Tighter spacing, fits more on one page.' },
  { value: 'editorial', label: 'Editorial', atsSafe: true, desc: 'Side-labeled sections with a thin accent rule. Refined, magazine-style hierarchy — still parseable.' },
  { value: 'creative', label: 'Creative (Two-Column)', atsSafe: false, desc: 'Sidebar with accent color. Not ATS-safe — use for human readers only.' },
]
