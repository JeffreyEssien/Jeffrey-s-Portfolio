'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const projectUrls = [
  'https://student-therapy-chatbot-fe.vercel.app/',
  'https://improved-currency-converter-kpb8.vercel.app/',
  'https://improved-currency-converter.vercel.app/'
]

const fetchMicrolinkData = async (url: string) => {
  const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
  const json = await res.json()
  return json.data
}

const Projects = () => {
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    const fetchAll = async () => {
      const results = await Promise.all(projectUrls.map(fetchMicrolinkData))
      setProjects(results)
    }
    fetchAll()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-20 text-center text-gray-500">
      <motion.h2
        className="text-3xl font-bold mb-10"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Projects
      </motion.h2>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((proj, idx) => (
          <motion.div
            key={idx}
            className="bg-white rounded-xl overflow-hidden shadow-md text-left border"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.2 }}
          >
            <img
              src={proj.image?.url || '/fallback.png'}
              alt={proj.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-1">{proj.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-3">{proj.description}</p>
              <a
                href={proj.url}
                target="_blank"
                className="inline-block mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
              >
                Visit Site
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default Projects
