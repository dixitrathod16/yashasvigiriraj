'use client'
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Instagram, Youtube } from "lucide-react"

export function ContactUs() {
  return (
    <Card className="w-full p-3 md:p-8 border-2 border-primary/20">
      <CardContent className="px-0 md:p-8 max-w-[1600px] mx-auto w-full">
        <h2 className="text-3xl font-bold text-center mb-4 text-primary decorative-border">
          संपर्क जानकारी
        </h2>
        <motion.div
          className="space-y-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="text-lg">Email: <a href="mailto:yashashvigiriraj@gmail.com" className="text-lg">yashashvigiriraj@gmail.com
          </a></p>
          <div className="flex space-x-4 justify-center">
            <a href="https://www.instagram.com/yashashvi_giriraj?igsh=MXh5MGJkanQ1M3Z1Mw==" className="text-primary hover:text-secondary transition-colors">
              <Instagram size={24} />
            </a>
            <a href="https://youtube.com/@yashashvigiriraj?si=gD2Tbp7iDXb1PiAd" className="text-primary hover:text-secondary transition-colors">
              <Youtube size={24} />
            </a>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}

