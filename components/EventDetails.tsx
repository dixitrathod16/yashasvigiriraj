import { Card, CardContent } from "@/components/ui/card"
import Image from 'next/image'
// import { CalendarDays, MapPin, Clock, Sun } from 'lucide-react'

export function EventDetails() {
  return (
    <Card className="w-full p-3 md:p-8 border-2 border-primary/20">
      <CardContent className="px-0 md:p-8 max-w-[1600px] mx-auto w-full">
        <h2 className="text-3xl font-bold text-center mb-8 text-primary decorative-border">
          कार्यक्रम विवरण
        </h2>
        {/* <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-primary/5">
            <CalendarDays className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Date</h3>
            <p>August 15-20, 2024</p>
          </div>
          <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-primary/5">
            <MapPin className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Location</h3>
            <p>Palitana, Gujarat</p>
          </div>
          <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-primary/5">
            <Clock className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Duration</h3>
            <p>6 Days, 5 Nights</p>
          </div>
          <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-primary/5">
            <Sun className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Activities</h3>
            <p>Daily Prayers & Meditation</p>
          </div>
        </div>
        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-6 text-center text-primary">दैनिक कार्यक्रम</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { day: "Day 1", activity: "Welcome Ceremony and Introduction" },
              { day: "Day 2", activity: "Morning Meditation and Temple Visit" },
              { day: "Day 3", activity: "Spiritual Discourse and Group Reflection" },
              { day: "Day 4", activity: "Pilgrimage to Sacred Sites" },
              { day: "Day 5", activity: "Community Service and Evening Prayers" },
              { day: "Day 6", activity: "Closing Ceremony and Departure" },
            ].map((item) => (
              <div 
                key={item.day} 
                className="p-4 rounded-lg bg-primary/5 border border-primary/20"
              >
                <h4 className="font-bold text-primary">{item.day}</h4>
                <p>{item.activity}</p>
              </div>
            ))}
          </div>
        </div> */}
        <div className="flex justify-center items-center">
          <Image
            src="/Schedule Updated.jpeg"
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

