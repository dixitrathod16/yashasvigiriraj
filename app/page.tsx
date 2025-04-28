import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { HeroSection } from '@/components/HeroSection'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { Blessings } from '@/components/Blessings'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamic imports for components that are not needed immediately
const VideoCarousel = dynamic(() => import('@/components/VideoCarousel').then(mod => ({ default: mod.VideoCarousel })), {
  loading: () => <CarouselSkeleton title="वीडियो गैलरी" />
})

const ImageCarousel = dynamic(() => import('@/components/ImageCarousel').then(mod => ({ default: mod.ImageCarousel })), {
  loading: () => <CarouselSkeleton title="फोटो गैलरी" />
})

const RegistrationBanner = dynamic(() => import('@/components/RegistrationBanner').then(mod => ({ default: mod.RegistrationBanner })), {
  loading: () => <SectionSkeleton height="400px" />
})

const About = dynamic(() => import('@/components/About').then(mod => ({ default: mod.About })), {
  loading: () => <SectionSkeleton height="300px" />
})

const JeevithMahotsav = dynamic(() => import('@/components/JeevithMahotsav').then(mod => ({ default: mod.JeevithMahotsav })), {
  loading: () => <SectionSkeleton height="300px" />
})

const EventDetails = dynamic(() => import('@/components/EventDetails').then(mod => ({ default: mod.EventDetails })), {
  loading: () => <SectionSkeleton height="300px" />
})

const ContactUs = dynamic(() => import('@/components/ContactUs').then(mod => ({ default: mod.ContactUs })), {
  loading: () => <SectionSkeleton height="200px" />
})

// Skeleton components for loading states
const CarouselSkeleton = ({ title }: { title: string }) => (
  <div className="w-full p-3 md:p-8 border-2 border-primary/20 rounded-lg">
    <div className="px-0 md:p-8 max-w-[1600px] mx-auto w-full">
      <h2 className="text-3xl font-bold text-center mb-8 text-primary">{title}</h2>
      <div className="aspect-video w-full bg-gray-200 animate-pulse rounded-lg"></div>
    </div>
  </div>
)

const SectionSkeleton = ({ height }: { height: string }) => (
  <div className="w-full rounded-lg overflow-hidden">
    <Skeleton style={{ height }} className="w-full" />
  </div>
)

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
          <section id="blessings">
            <Blessings />
          </section>
          
          <section id="videos">
            <Suspense fallback={<CarouselSkeleton title="वीडियो गैलरी" />}>
              <VideoCarousel />
            </Suspense>
          </section>
          
          <section id="images">
            <Suspense fallback={<CarouselSkeleton title="फोटो गैलरी" />}>
              <ImageCarousel />
            </Suspense>
          </section>
          
          <section id="registration">
            <Suspense fallback={<SectionSkeleton height="400px" />}>
              <RegistrationBanner />
            </Suspense>
          </section>
          
          <section id="about-us">
            <Suspense fallback={<SectionSkeleton height="300px" />}>
              <About />
            </Suspense>
          </section>
          
          <section id="jeevith-mahotsav">
            <Suspense fallback={<SectionSkeleton height="300px" />}>
              <JeevithMahotsav />
            </Suspense>
          </section>
          
          <section id="event-details">
            <Suspense fallback={<SectionSkeleton height="300px" />}>
              <EventDetails />
            </Suspense>
          </section>
          
          <section id="contact-us">
            <Suspense fallback={<SectionSkeleton height="200px" />}>
              <ContactUs />
            </Suspense>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

