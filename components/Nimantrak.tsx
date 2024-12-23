import { Card, CardContent } from "@/components/ui/card"
import Image from 'next/image'
// import { CalendarDays, MapPin, Clock, Sun } from 'lucide-react'

export function Nimantrak() {
    return (
        <Card className="w-full p-3 md:p-8 border-2 border-primary/20">
            <CardContent className="p-6 md:p-8">
                <h2 className="text-3xl font-bold text-center mb-8 text-primary decorative-border">
                    निमंत्रक
                </h2>
                <div className="flex justify-center items-center">
                    <Image
                        src="/Nimantrak.png"
                        alt="Yashashvigiriraj Sangh Logo"
                        width={1000}
                        height={1000}
                        style={{ objectFit: 'cover' }}
                        priority
                    />
                </div>
            </CardContent>
        </Card>
    )
}

