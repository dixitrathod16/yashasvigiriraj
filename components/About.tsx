'use client'
import { Card, CardContent } from "@/components/ui/card"
import Image from 'next/image'
import React, { useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

const images = [
    {
        id: '1',
        src: '/Nana Nani.jpg',
        alt: 'Image of Sanagubai and Vardichandji'
    },
    {
        id: '2',
        src: '/Amritlalji.png',
        alt: 'Image of Amritlalji'
    },
    {
        id: '3',
        src: '/Devichandji.png',
        alt: 'Image of Devichandji'
    }
]

export function About() {
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
        if (emblaApi) {
            const autoplay = setInterval(() => {
                emblaApi.scrollNext()
            }, 5000)

            return () => clearInterval(autoplay)
        }
    }, [emblaApi])

    return (
        <Card className="w-full p-3 md:p-8 border-2 border-primary/20">
            <CardContent className="px-0 md:p-8 max-w-[1600px] mx-auto w-full">
                <h2 className="text-3xl font-bold text-center mb-8 text-primary decorative-border">
                    निमंत्रक परिवार
                </h2>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="relative w-full max-w-[1400px] mx-auto"
                >
                    <div className="overflow-hidden rounded-lg" ref={emblaRef}>
                        <div className="flex">
                            {images.map((image) => (
                                <div key={image.id} className="flex-[0_0_100%] min-w-0 px-2 md:px-4">
                                    <div className="flex justify-center items-center">
                                        <Image
                                            src={image.src}
                                            alt={image.alt}
                                            width={800}
                                            height={600}
                                            className="rounded-lg"
                                            priority={image.id === '1'}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute top-1/2 -left-2 md:left-8 -translate-y-1/2 z-10 bg-background border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={scrollPrev}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute top-1/2 -right-2 md:right-8 -translate-y-1/2 z-10 bg-background border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={scrollNext}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </motion.div>
            </CardContent>
        </Card>
    )
}

