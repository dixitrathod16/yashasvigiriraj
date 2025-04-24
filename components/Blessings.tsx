'use client'

import Image from 'next/image'
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"

export function Blessings() {
  return (
    <Card className="w-full p-3 md:p-8 border-2 border-primary/20">
      <CardContent className="p-6 md:p-8">
        <h2 className="text-3xl font-bold text-center mb-4 text-primary decorative-border">
        </h2>
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="flex flex-col items-center">
            {/* Mobile: Three rows layout, Desktop: 3-2 grid */}
            <div className="w-full max-w-[500px] md:max-w-full mx-auto">
              {/* Mobile Layout */}
              <div className="md:hidden">
                <div className="flex flex-col items-center gap-8">
                  {/* First Avatar */}
                  <div className="flex flex-col items-center">
                    <h2 className="text-3xl font-bold text-center mb-4 text-primary">
                      शुभाशीष
                    </h2>
                    <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg hover:scale-105 transition-transform duration-300">
                      <Image
                        src="/1.jpg"
                        alt="प. पू. भक्तियोगाचार्य श्री यशोविजयसूरीश्वरजी महाराजा"
                        fill
                        style={{ objectFit: 'cover' }}
                        quality={100}
                        priority
                      />
                    </div>
                    <p className="m-4 text-xl text-center font-bold text-primary">प. पू. भक्तियोगाचार्य श्री यशोविजयसूरीश्वरजी महाराजा</p>
                  </div>

                  {/* Second Avatar */}
                  <div className="flex flex-col items-center">
                    <h2 className="text-3xl font-bold text-center mb-4 text-primary">
                      निश्रा दाता
                    </h2>
                    <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg hover:scale-105 transition-transform duration-300">
                      <Image
                        src="/2.jpg"
                        alt="प्रभु़ वत्सल प. पू. आ. श्री कल्पज्ञविजयसूरीश्वरजी महाराजा"
                        fill
                        style={{ objectFit: 'cover' }}
                        quality={100}
                        priority
                      />
                    </div>
                    <p className="m-4 text-xl text-center font-bold text-primary">प्रभु़ वत्सल प. पू. आ. श्री कल्पज्ञविजयसूरीश्वरजी महाराजा</p>
                  </div>

                  {/* Third Avatar */}
                  <div className="flex flex-col items-center">
                    <h2 className="text-3xl font-bold text-center mb-4 text-primary">
                      गुरु कृपा
                    </h2>
                    <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg hover:scale-105 transition-transform duration-300">
                      <Image
                        src="/3.jpg"
                        alt="मुनिराज श्री आध्यात्मयोग विजयजी म.सा."
                        fill
                        style={{ objectFit: 'cover' }}
                        quality={100}
                        priority
                      />
                    </div>
                    <p className="m-4 text-xl text-center font-bold text-primary">मुनिराज श्री आध्यात्मयोग विजयजी म.सा.</p>
                  </div>

                  {/* Fourth Avatar */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg hover:scale-105 transition-transform duration-300">
                      <Image
                        src="/4.png"
                        alt="मुनिराज श्री तीर्थवल्लभ विजयजी म.सा."
                        fill
                        style={{ objectFit: 'cover' }}
                        quality={100}
                        priority
                      />
                    </div>
                    <p className="m-4 text-xl text-center font-bold text-primary">मुनिराज श्री तीर्थवल्लभ विजयजी म.सा.</p>
                  </div>

                  {/* Fifth Avatar */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg hover:scale-105 transition-transform duration-300">
                      <Image
                        src="/5.jpg"
                        alt="प. पू. सा. श्री प्रार्थनाश्रीजी म.सा."
                        fill
                        style={{ objectFit: 'cover' }}
                        quality={100}
                      />
                    </div>
                    <p className="m-4 text-xl text-center font-bold text-primary">प. पू. सा. श्री प्रार्थनाश्रीजी म.सा.</p>
                  </div>

                  {/* Sixth Avatar */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg hover:scale-105 transition-transform duration-300">
                      <Image
                        src="/6.jpg"
                        alt="प. पू. सा. श्री अर्हंप्रज्ञाश्रीजी म.सा."
                        fill
                        style={{ objectFit: 'cover' }}
                        quality={100}
                      />
                    </div>
                    <p className="m-4 text-xl text-center font-bold text-primary">प. पू. सा. श्री अर्हंप्रज्ञाश्रीजी म.सा.</p>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:block">
                {/* First Row - 2 images */}
                <div className="grid grid-cols-2 gap-6 px-36">
                  <div className="flex flex-col items-center">
                    <h2 className="text-3xl font-bold text-center mb-4 text-primary">
                      शुभाशीष
                    </h2>
                    <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg hover:scale-105 transition-transform duration-300">
                      <Image
                        src="/1.jpg"
                        alt="प. पू. भक्तियोगाचार्य श्री यशोविजयसूरीश्वरजी महाराजा"
                        fill
                        style={{ objectFit: 'cover' }}
                        quality={100}
                        priority
                      />
                    </div>
                    <p className="m-4 text-xl text-center font-bold text-primary">प. पू. भक्तियोगाचार्य श्री यशोविजयसूरीश्वरजी महाराजा</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <h2 className="text-3xl font-bold text-center mb-4 text-primary">
                      निश्रा दाता
                    </h2>
                    <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg hover:scale-105 transition-transform duration-300">
                      <Image
                        src="/2.jpg"
                        alt="प्रभु़ वत्सल प. पू. आ. श्री कल्पज्ञविजयसूरीश्वरजी महाराजा"
                        fill
                        style={{ objectFit: 'cover' }}
                        quality={100}
                        priority
                      />
                    </div>
                    <p className="m-4 text-xl text-center font-bold text-primary">प्रभु़ वत्सल प. पू. आ. श्री कल्पज्ञविजयसूरीश्वरजी महाराजा</p>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-center mt-4 mb-8 text-primary">
                  गुरु कृपा
                </h2>
                {/* Second Row - 4 images 2 cols */}
                <div className="grid grid-cols-2 gap-6 px-36">
                  <div className="flex flex-col items-center">
                    <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg hover:scale-105 transition-transform duration-300">
                      <Image
                        src="/3.jpg"
                        alt="मुनिराज श्री आध्यात्मयोग विजयजी म.सा."
                        fill
                        style={{ objectFit: 'cover' }}
                        quality={100}
                        priority
                      />
                    </div>
                    <p className="m-4 text-xl text-center font-bold text-primary">मुनिराज श्री आध्यात्मयोग विजयजी म.सा.</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg hover:scale-105 transition-transform duration-300">
                      <Image
                        src="/4.png"
                        alt="मुनिराज श्री तीर्थवल्लभ विजयजी म.सा."
                        fill
                        style={{ objectFit: 'cover' }}
                        quality={100}
                        priority
                      />
                    </div>
                    <p className="m-4 text-xl text-center font-bold text-primary">मुनिराज श्री तीर्थवल्लभ विजयजी म.सा.</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg hover:scale-105 transition-transform duration-300">
                      <Image
                        src="/5.jpg"
                        alt="प. पू. सा. श्री प्रार्थनाश्रीजी म.सा."
                        fill
                        style={{ objectFit: 'cover' }}
                        quality={100}
                      />
                    </div>
                    <p className="m-4 text-xl text-center font-bold text-primary">प. पू. सा. श्री प्रार्थनाश्रीजी म.सा.</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg hover:scale-105 transition-transform duration-300">
                      <Image
                        src="/6.jpg"
                        alt="प. पू. सा. श्री अर्हंप्रज्ञाश्रीजी म.सा."
                        fill
                        style={{ objectFit: 'cover' }}
                        quality={100}
                      />
                    </div>
                    <p className="m-4 text-xl text-center font-bold text-primary">प. पू. सा. श्री अर्हंप्रज्ञाश्रीजी म.सा.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}

