import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

// Optimize font loading
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
  display: 'swap', // Use swap for better performance
  fallback: ['system-ui', 'sans-serif'], // Fallback fonts
})

export const metadata: Metadata = {
  title: 'यशस्वी गिरिराज - Jain Spiritual Pilgrimage',
  description: 'Join us for a transformative Jain spiritual pilgrimage event with संघ यशस्वी गिरिराज guided by expert mentors. Register now for this unique spiritual journey.',
  keywords: ['Jain pilgrimage', 'spiritual journey', 'Yashashvigiriraj Sangh', 'यशस्वी गिरिराज', 'religious event'],
  authors: [{ name: 'Yashashvigiriraj Sangh' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.youtube.com" />
      </head>
      <body className={`${poppins.variable} font-sans antialiased bg-background`}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}

