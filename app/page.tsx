import { VideoCarousel } from '@/components/VideoCarousel'
import { EventDetails } from '@/components/EventDetails'
import { HeroSection } from '@/components/HeroSection'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Nimantrak } from '@/components/Nimantrak'

// This is a Server Component by default
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <div className="container mx-auto px-2 md:px-10 py-3 md:py-5 space-y-16">
          <VideoCarousel />
          <Nimantrak />
          <EventDetails />
        </div>
      </main>
      <Footer />
    </div>
  )
}

