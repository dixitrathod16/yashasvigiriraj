'use client'

import { motion } from "framer-motion"
import { Button } from "./ui/button"

export function Header() {
  return (
    <motion.header 
      className="w-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 py-4"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <motion.h1 
          className="text-2xl font-bold text-primary"
          whileHover={{ scale: 1.05 }}
        >
          यशस्वी गिरिराज
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            size="lg" 
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Registration Opening Soon
          </Button>
        </motion.div>
      </div>
    </motion.header>
  )
} 