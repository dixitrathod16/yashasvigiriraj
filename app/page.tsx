import { VideoCarousel } from '@/components/VideoCarousel'
import { EventDetails } from '@/components/EventDetails'
import { HeroSection } from '@/components/HeroSection'
import { Footer } from '@/components/Footer'
import { Navigation } from '@/components/Navigation'
import { RegistrationBanner } from '@/components/RegistrationBanner'
import { ContactUs } from '@/components/ContactUs'
import { About } from '@/components/About'
import { ImageCarousel } from '@/components/ImageCarousel'

// This is a Server Component by default
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1 bg-gradient-to-r from-primary/10 to-secondary/10">
        <section id="home">
          <HeroSection />
        </section>
        <div className="container mx-auto px-2 md:px-10 py-3 md:py-5 space-y-16">
          <section id="videos">
            <VideoCarousel />
          </section>
          <section id="images">
            <ImageCarousel />
          </section>
          <section id="registration">
            <RegistrationBanner />
          </section>
          <section id="about-us">
            <About />
          </section>
          <section id="event-details">
            <EventDetails />
          </section>
          <section id="contact-us">
            <ContactUs />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

