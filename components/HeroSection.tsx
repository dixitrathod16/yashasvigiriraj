'use client'

import Image from 'next/image'
import { motion } from "framer-motion"

export function HeroSection() {
  return (
    <motion.div 
      className="relative mt-12 md:mt-24 w-full min-h-[350px] md:min-h-[400px] flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="container mx-auto px-3 pt-12 flex flex-col items-center">
        <motion.div 
          className="relative w-[300px] h-[230px] md:w-[560px] md:h-[430px] mb-4 md:mb-12"
          initial={{ scale: 0.3, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            duration: 1.2,
            delay: 0.2,
            ease: [0.34, 1.56, 0.64, 1],
            rotate: {
              duration: 1.5,
              ease: [0.34, 1.56, 0.64, 1]
            }
          }}
        >
          <Image
            src="/YASHVI LOGO 1 TIFF.webp"
            alt="Yashashvigiriraj Sangh Logo"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </motion.div>
      </div>
    </motion.div>
  )
}

