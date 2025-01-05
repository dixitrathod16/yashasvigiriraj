'use client'
import { Card, CardContent } from "@/components/ui/card"
import Image from 'next/image'
import React from 'react'
import { motion } from 'framer-motion'

const images = [
    {
        id: '1',
        src: '/Bade Mama and Mami.png',
        alt: 'Image of Amritlalji and Manibai',
        description: 'श्रीमती मनीबाई अमृतलालजी जैन'
    },
    {
        id: '2',
        src: '/Chota Mama and Mami.png',
        alt: 'Image of Devichandji and Lalita Bai',
        description: 'श्रीमती ललिता देवीचंदजी जैन'
    }
]

export function JeevithMahotsav() {
    return (
        <Card className="w-full p-3 md:p-8 border-2 border-primary/20">
            <CardContent className="px-0 md:p-8 max-w-[1600px] mx-auto w-full">
                <h2 className="text-3xl font-bold text-center mb-8 text-primary decorative-border">
                    जीवित महोत्सव
                </h2>
                <div className="text-center mb-8">
                    <div className="mb-4">
                        <p className="text-lg text-primary mb-1">दिनांक</p>
                        <p className="text-xl font-bold text-primary">
                            25 - 26 नवंबर, 2025
                        </p>
                    </div>
                    <div>
                        <p className="text-lg text-primary mb-1">स्थान</p>
                        <p className="text-xl font-bold text-primary">
                            सिलदर, सिरोही जिला, राजस्थान - 342701
                        </p>
                    </div>
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="relative w-full max-w-[1400px] mx-auto"
                >
                    <div className="overflow-hidden rounded-lg">
                        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                            {images.map((image) => (
                                <div key={image.id} className="w-full flex flex-col items-center">
                                    <div className="flex justify-center items-center mb-4">
                                        <Image
                                            src={image.src}
                                            alt={image.alt}
                                            width={800}
                                            height={600}
                                            className="rounded-lg"
                                            priority={image.id === '1'}
                                        />
                                    </div>
                                    <p className="text-xl text-center font-bold text-primary">
                                        {image.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </CardContent>
        </Card>
    )
}

