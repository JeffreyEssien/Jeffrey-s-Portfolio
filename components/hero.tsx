'use client'

import { motion } from 'framer-motion'
import { Typewriter } from 'react-simple-typewriter'
import Image from 'next/image'

const Hero = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-indigo-900 flex flex-col justify-center items-center text-center text-white px-6 pt-24 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
      >
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
          Hello, I'm <span className="text-indigo-400">Jeffrey</span>
        </h1>
        <h2 className="text-xl md:text-2xl text-gray-300 mb-6">
          <Typewriter
            words={['Seasoned Front-End Developer', 'Mobile App Builders', 'UI Implementation expert', 'UX specialist', 'JavaScript Wizard']}
            loop={true}
            cursor
            cursorStyle="|"
            typeSpeed={70}
            deleteSpeed={50}
            delaySpeed={1500}
          />
        </h2>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex gap-6 justify-center"
        >
          <a
            href="#projects"
            className="bg-indigo-500 hover:bg-indigo-600 px-6 py-3 rounded-xl font-semibold transition-all shadow-xl"
          >
            View Projects
          </a>
          <a
            href="#contact"
            className="bg-white text-indigo-600 hover:text-indigo-700 px-6 py-3 rounded-xl font-semibold transition-all shadow-xl"
          >
            Contact Me
          </a>
        </motion.div>
      </motion.div>

      {/* Floating blurred background shapes */}
      <motion.div
        className="absolute top-0 left-0 w-60 h-60 bg-indigo-400 opacity-20 rounded-full filter blur-3xl animate-pulse"
        animate={{ x: [0, 50, -50, 0], y: [0, -40, 40, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-72 h-72 bg-pink-400 opacity-10 rounded-full filter blur-2xl"
        animate={{ x: [0, -30, 30, 0], y: [0, 20, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      />
    </div>
  )
}

export default Hero
