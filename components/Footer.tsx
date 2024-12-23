'use client'

import { motion } from "framer-motion"

export function Footer() {
  return (
    <motion.footer 
      className="w-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="container mx-auto px-4 text-center">
        <p className="text-primary/80">
          Designed & Developed by{" "}
          <motion.span 
            className="font-bold text-primary"
            whileHover={{ scale: 1.1 }}
            style={{ display: 'inline-block' }}
          >
            Dixit R Jain
          </motion.span>
        </p>
      </div>
    </motion.footer>
  )
}