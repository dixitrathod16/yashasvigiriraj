'use client'
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { FaInstagram, FaYoutube, FaFacebook, FaWhatsapp } from "react-icons/fa"
import { SiGmail } from "react-icons/si"

export function ContactUs() {
  return (
    <Card className="w-full p-3 md:p-8 border-2 border-primary/20">
      <CardContent className="px-0 md:p-8 max-w-[1600px] mx-auto w-full">
        <h2 className="text-3xl font-bold text-center mb-4 text-primary decorative-border">
          संपर्क जानकारी
        </h2>
        <motion.div
          className="space-y-4 flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-center space-x-4">
            <span className="font-semibold text-primary" style={{ minWidth: '90px', textAlign: 'right' }}>Contact:</span>
            <a href="mailto:yashashvigiriraj@gmail.com" className="text-primary hover:text-secondary transition-colors" aria-label="Gmail" target="_blank" rel="noopener noreferrer">
              <SiGmail size={28} />
            </a>
            <a href="https://wa.me/918015888362" className="text-primary hover:text-secondary transition-colors" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
              <FaWhatsapp size={28} />
            </a>
          </div>
          <div className="flex items-center justify-center space-x-4">
            <span className="font-semibold text-primary" style={{ minWidth: '90px', textAlign: 'right' }}>Follow on:</span>
            <a href="https://www.instagram.com/yashashvi_giriraj?igsh=MXh5MGJkanQ1M3Z1Mw==" className="text-primary hover:text-secondary transition-colors" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
              <FaInstagram size={28} />
            </a>
            <a href="https://youtube.com/@yashashvigiriraj?si=gD2Tbp7iDXb1PiAd" className="text-primary hover:text-secondary transition-colors" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
              <FaYoutube size={28} />
            </a>
            <a href="https://www.facebook.com/profile.php?id=61575280161652" className="text-primary hover:text-secondary transition-colors" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
              <FaFacebook size={28} />
            </a>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}

