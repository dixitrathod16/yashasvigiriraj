'use client'
import React, { useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from 'framer-motion'
import Image from 'next/image'

interface ImageData {
  images: Array<{
    id: string;
    name: string;
    url: string;
    thumbnailUrl: string;
  }>;
  lastFetched: string;
}

interface ImageState {
  isLoading: boolean;
  error: string | null;
  images: ImageData['images'];
  lastFetched?: string;
}

const ImageSkeleton = () => (
  <div className="flex-[0_0_100%] min-w-0 px-4">
    <div className="aspect-video">
      <Skeleton className="w-full h-full rounded-lg" />
    </div>
  </div>
)

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#333" offset="20%" />
      <stop stop-color="#222" offset="50%" />
      <stop stop-color="#333" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#333" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)

export function ImageCarousel() {
  const [state, setState] = useState<ImageState>({
    isLoading: true,
    error: null,
    images: []
  })

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    duration: 20,
    skipSnaps: false
  })

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/images');
        const data: ImageData = await response.json();
        setState(prev => ({
          ...prev,
          isLoading: false,
          images: data.images,
          lastFetched: data.lastFetched
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load images. Please try again later.'
        }));
        console.error('Error fetching images:', error);
      }
    }
    fetchImages();
  }, []);

  useEffect(() => {
    if (emblaApi) {
      const autoplay = setInterval(() => {
        emblaApi.scrollNext()
      }, 5000)

      return () => clearInterval(autoplay)
    }
  }, [emblaApi])

  const renderContent = () => {
    if (state.isLoading) {
      return (
        <>
          <ImageSkeleton />
          <ImageSkeleton />
          <ImageSkeleton />
        </>
      );
    }

    if (state.error) {
      return (
        <div className="flex-[0_0_100%] min-w-0 px-4 flex items-center justify-center h-[300px]">
          <p className="text-red-500">{state.error}</p>
        </div>
      );
    }

    return state.images?.map((image, index) => (
      <div key={image.id} className="flex-[0_0_100%] min-w-0 px-2 md:px-4">
        <div className="aspect-video relative">
          <Image
            src={image.url}
            alt={image.name}
            fill
            className="object-cover rounded-lg"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            priority={index === 0}
            placeholder="blur"
            blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(700, 475))}`}
          />
        </div>
      </div>
    ));
  }

  return (
    <Card className="w-full p-3 md:p-8 border-2 border-primary/20">
      <CardContent className="p-6 md:p-8 max-w-[1600px] mx-auto w-full">
        <h2 className="text-3xl font-bold text-center mb-8 text-primary decorative-border">
          फोटो गैलरी
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative w-full max-w-[1400px] mx-auto"
        >
          <div className="overflow-hidden rounded-lg" ref={emblaRef}>
            <div className="flex">
              {renderContent()}
            </div>
          </div>
          {!state.isLoading && !state.error && state.images?.length > 0 && (
            <>
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
            </>
          )}
        </motion.div>
      </CardContent>
    </Card>
  )
} 