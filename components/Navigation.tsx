'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const menuItems = [
  { name: 'Home', href: '#home' },
  { name: 'Videos', href: '#videos' },
  { name: 'Registration', href: '#registration' },
  { name: 'About Us', href: '#about-us' },
  { name: 'Event Details', href: '#event-details' },
  { name: 'Contact', href: '#contact-us' },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    
    // Close mobile menu first
    setIsOpen(false)
    
    // Small delay to allow menu closing animation to complete
    setTimeout(() => {
      const targetId = href.replace('#', '')
      const element = document.getElementById(targetId)
      
      if (element) {
        // Adjust header offset for mobile
        const headerOffset = window.innerWidth < 768 ? 60 : 80
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.scrollY - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }, 100)
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-md shadow-lg' : 'bg-white'
    }`}>
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center"
        >
          <Link href="/" className="flex items-center">
            <div className="relative w-12 h-12 md:mr-3">
              <Image
                src="/YASHVI LOGO 1 PNG.png"
                alt="Yashashvigiriraj Logo"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
            <span className="hidden md:block text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                यशस्वी गिरिराज
            </span>
          </Link>
        </motion.div>
        <span className="md:hidden text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            यशस्वी गिरिराज
        </span>
        <div className="hidden md:flex space-x-1">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className="text-gray-700 hover:text-primary transition-colors px-4 py-2 rounded-full hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                onClick={(e) => handleClick(e, item.href)}
              >
                {item.name}
              </Link>
            </motion.div>
          ))}
        </div>
        <motion.button
          className="md:hidden text-primary p-2 rounded-full hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => setIsOpen(!isOpen)}
          whileTap={{ scale: 0.95 }}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </nav>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white/90 backdrop-blur-md"
          >
            {menuItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className="block px-6 py-3 text-gray-700 hover:text-primary hover:bg-primary/10 transition-colors"
                  onClick={(e) => {
                    setIsOpen(false);
                    handleClick(e, item.href);
                  }}
                >
                  {item.name}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}