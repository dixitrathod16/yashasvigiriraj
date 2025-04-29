'use client'

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { FaWhatsapp } from "react-icons/fa"

export function Footer() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkIfMobile()

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile)

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  return (
    <motion.footer
      className="w-full bg-white py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="footer container mx-auto px-4 text-center">
        <p className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Designed & Developed by{" "}
          <motion.a
            href={isMobile ? "https://wa.me/919738876147" : "https://dixitjain.dev"}
            className="font-bold text-primary relative cursor-pointer group"
            whileHover={{ scale: 1.05 }}
            style={{ display: 'inline-block' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="inline-flex items-center">
              Dixit R Jain
            </span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </motion.a>
        </p>
        <p className="text-gray-600">
          Connect with me for queries:
          <a
            href="https://wa.me/919738876147"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="inline-block align-middle ml-2 text-green-500 hover:text-green-600 transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <FaWhatsapp size={22} />
          </a>
        </p>
        <p className="text-gray-600">
          © {new Date().getFullYear()} यशस्वी गिरिराज. All rights reserved.
        </p>
      </div>
    </motion.footer>
  )
}