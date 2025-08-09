'use client'

import { motion } from 'framer-motion'

const Contact = () => {
  const email = 'yourname@example.com'
  const mailtoLink = `mailto:${email}?subject=👋 Let's work together&body=Hi Jeffrey, I came across your portfolio and...`

  return (
    <motion.div
      className="min-h-screen bg-indigo-900 text-white px-6 py-20 text-center"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <h2 className="text-3xl font-bold mb-6">Get In Touch</h2>
      <p className="mb-4 text-lg">
        I'm open to projects, collaborations, or even just saying hi!
      </p>
      <a
        href={mailtoLink}
        className="inline-block mt-4 bg-white text-indigo-700 font-bold px-6 py-3 rounded-xl shadow hover:scale-105 transition-all"
      >
        Email Me
      </a>

      <div className="mt-10">
        <a
          href="/Jeffrey_Essien_CV.pdf"
          download
          className="inline-block border border-white text-white px-5 py-2 rounded-lg hover:bg-white hover:text-indigo-900 transition-all"
        >
          📄 Download My CV
        </a>
      </div>
    </motion.div>
  )
}

export default Contact
