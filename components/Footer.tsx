'use client'

import { motion } from "framer-motion"

export function Footer() {
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
          <motion.span
            className="font-bold text-primary"
            whileHover={{ scale: 1.1 }}
            style={{ display: 'inline-block' }}
          >
            Dixit R Jain
          </motion.span>
        </p>
        <p className="text-gray-600">
          © {new Date().getFullYear()} यशस्वी गिरिराज. All rights reserved.
        </p>
      </div>
    </motion.footer>
  )
}