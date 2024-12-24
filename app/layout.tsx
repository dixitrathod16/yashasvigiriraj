import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'यशस्वी गिरिराज - Jain Spiritual Pilgrimage',
  description: 'Join us for a transformative Jain spiritual pilgrimage event.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} font-sans antialiased bg-background`}
      >
        {children}
      </body>
    </html>
  )
}

