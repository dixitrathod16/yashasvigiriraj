'use client'

import React from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import useSWR from 'swr'

// Fetch images from the backend
const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface ImageData {
  id: string
  url: string
}

export function ImageCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  
  // Fetch images from backend
  const { data: images, error, isLoading } = useSWR<ImageData[]>('/api/images', fetcher)

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  if (error) return <div>Failed to load images</div>
  if (isLoading) return <div>Loading...</div>

  return (
    <Card className="w-full border-2 border-primary/20">
      <CardContent className="p-8 max-w-[1600px] mx-auto w-full">
        <h2 className="text-3xl font-bold text-center mb-8 text-primary decorative-border">
          छवि गैलरी
        </h2>
        <div className="relative w-full max-w-[1400px] mx-auto">
          <div className="overflow-hidden rounded-lg" ref={emblaRef}>
            <div className="flex">
              {images?.map((image) => (
                <div key={image.id} className="flex-[0_0_100%] min-w-0 px-4">
                  <div className="aspect-video relative">
                    <Image
                      src={image.url}
                      alt="Carousel image"
                      fill
                      className="object-cover rounded-lg"
                      priority
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-1/2 -left-4 -translate-y-1/2 z-10 bg-background border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-1/2 -right-4 -translate-y-1/2 z-10 bg-background border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={scrollNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 