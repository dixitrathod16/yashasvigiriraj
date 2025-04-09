'use client';

import { RegistrationNavigation } from '@/components/RegistrationNavigation'
import { Footer } from '@/components/Footer'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function RegisterPage() {
    return (
      <div className="flex min-h-screen flex-col">
        <RegistrationNavigation />
        <main className="flex-1 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="container mx-auto px-2 md:px-10 py-3 md:py-5 space-y-16">
            {/* Registration coming soon banner */}
            <section className="flex justify-center items-center min-h-[80vh]">
              <motion.div 
                className="text-center p-10 md:p-16 rounded-lg bg-white/80 backdrop-blur-sm shadow-xl max-w-4xl w-full mx-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <motion.div 
                  className="relative w-48 h-48 md:w-64 md:h-64 mx-auto mb-10"
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <Image
                    src="/YASHVI LOGO 1 PNG.png"
                    alt="Yashashvigiriraj Logo"
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                  />
                </motion.div>
                
                <motion.h1 
                  className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary leading-relaxed py-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  पंजीकरण जल्द ही शुरू होंगे!
                </motion.h1>
                
                <motion.h2 
                  className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-700"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  Registrations will open soon!
                </motion.h2>
              </motion.div>
            </section>
            
            <section id="blessings">
            </section>
          </div>
        </main>
        <Footer />
      </div>
    );
} 