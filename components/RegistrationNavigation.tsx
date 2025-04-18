'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

export function RegistrationNavigation() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-lg' : 'bg-white'
      }`}>
      <nav className="container mx-auto px-4 py-4 flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center"
        >
          <Link href="/" className="flex items-center">
            <div className="relative w-12 h-12 mr-3">
              <Image
                src="/YASHVI LOGO 1 PNG.png"
                alt="Yashashvigiriraj Logo"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              यशस्वी गिरिराज
            </span>
          </Link>
        </motion.div>
      </nav>
    </header>
  )
}