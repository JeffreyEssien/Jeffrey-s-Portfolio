'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

const skills = [
  { name: 'JavaScript', level: 95 },
  { name: 'TypeScript', level: 92 },
  { name: 'React & Next.js', level: 94 },
  { name: 'React Native', level: 88 },
  { name: 'Tailwind & ShadCN/UI', level: 90 }
]

const technologies = [
  'Firebase', 'AI API Integration', 'JWT Auth', 'Serverless APIs',
  'Postman', 'CI/CD', 'Figma', 'Vercel', 'Netlify'
]

const certifications = [
  'Google Machine Learning Crash Course – Google',
  'React Native for Beginners – CodeWithMosh',
  'Learn Next.js – Codecademy',
  'Microsoft Certified: Power BI Data Analyst Associate',
  'Database Administration Fundamentals – New Horizons'
]

export default function About() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['0 1', '1.2 1'] })

  const translateLeft = useTransform(scrollYProgress, [0, 1], ['-60px', '0px'])
  const translateRight = useTransform(scrollYProgress, [0, 1], ['60px', '0px'])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 1], [0, 0.6, 1])

  return (
    <section
      ref={ref}
      id="about"
      className="relative min-h-screen py-32 px-6 md:px-20 bg-[#f9fafb] text-gray-800 overflow-hidden"
    >
      {/* Decorative blob */}
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-gradient-to-br from-indigo-300 to-purple-300 opacity-30 blur-[100px] rounded-full"
        animate={{ scale: [1, 1.2, 1], borderRadius: ['50%', '40%', '50%'] }}
        transition={{ repeat: Infinity, duration: 10 }}
      />

      <motion.h2
        className="text-5xl font-bold text-center mb-20"
        initial={{ opacity: 0, y: -40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        👨‍💻 About Me
      </motion.h2>

      <div className="grid md:grid-cols-2 gap-20 max-w-7xl mx-auto items-start">
        {/* Education & Certifications */}
        <motion.div style={{ translateX: translateLeft, opacity }}>
          <h3 className="text-2xl font-semibold mb-4 text-indigo-700">🎓 Education</h3>
          <div className="bg-white/60 backdrop-blur shadow-xl rounded-xl p-6 mb-10">
            <p>
              <strong>B.Sc. in Software Engineering</strong><br />
              Babcock University, Nigeria <br />
              <span className="text-sm text-gray-500">CGPA: 4.10 / 5.00 (2022 – 2025)</span>
            </p>
          </div>

          <h3 className="text-2xl font-semibold mb-4 text-indigo-700">📜 Certifications</h3>
          <ul className="space-y-4">
            {certifications.map((cert, i) => (
              <motion.li
                key={i}
                className="bg-white shadow px-4 py-3 rounded-lg border-l-4 border-indigo-500"
                whileHover={{ scale: 1.05 }}
              >
                {cert}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Skills & Technologies */}
        <motion.div style={{ translateX: translateRight, opacity }}>
          <h3 className="text-2xl font-semibold mb-4 text-indigo-700">🧠 Skill Proficiency</h3>
          <div className="space-y-6 mb-10">
            {skills.map((skill, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1 text-sm font-medium">
                  <span>{skill.name}</span>
                  <span>{skill.level}%</span>
                </div>
                <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-indigo-600 h-3"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${skill.level}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-2xl font-semibold mb-4 text-indigo-700">🧰 Technologies</h3>
          <div className="flex flex-wrap gap-3">
            {technologies.map((tech, i) => (
              <motion.span
                key={i}
                className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-full font-medium shadow hover:shadow-lg cursor-pointer"
                whileHover={{ scale: 1.15, rotate: [0, 2, -2, 0] }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              >
                {tech}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
