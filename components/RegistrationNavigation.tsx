'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

const menuItems = [
  { name: 'Home', href: '/' },
  { name: 'Register', href: '/register' },
  { name: 'Check Status', href: '/check-status' }
]

export function RegistrationNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])


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
        <motion.span 
          className="md:hidden text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
          initial={{ scale: 0 }}
          animate={{ scale: 1}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
            यशस्वी गिरिराज
        </motion.span>
        <div className="hidden md:flex space-x-1">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className={`${
                    isActive 
                      ? 'text-primary bg-primary/10 font-semibold' 
                      : 'text-gray-700 hover:text-primary hover:bg-primary/10'
                  } transition-colors px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50`}
                >
                  {item.name}
                </Link>
              </motion.div>
            )
          })}
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
            {menuItems.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className={`block px-6 py-3 ${
                      isActive 
                        ? 'text-primary bg-primary/10 font-semibold' 
                        : 'text-gray-700 hover:text-primary hover:bg-primary/10'
                    } transition-colors`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}