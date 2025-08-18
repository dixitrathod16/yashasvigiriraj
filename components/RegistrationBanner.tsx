"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
import { useState } from "react"
// import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
// import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CountdownTimer } from "@/components/CountdownTimer"

export function RegistrationBanner() {
  const router = useRouter()
  // const [showForm, setShowForm] = useState(false)
  // const [fullName, setFullName] = useState("")
  // const [phoneNumber, setPhoneNumber] = useState("")
  // const [isLoading, setIsLoading] = useState(false)
  // const [hasConsent, setHasConsent] = useState(false)
  const [hasRegistrationEnded, setHasRegistrationEnded] = useState(false)

  // Get registration start date from environment variable
  const registrationStartDate = new Date(process.env.NEXT_PUBLIC_REGISTRATION_START_DATE || '2025-04-30T00:00:00')

  const handleCountdownComplete = () => {
    setHasRegistrationEnded(true)
  }

  // const handleSubmit = async () => {
  //   // Basic validations
  //   if (!fullName.trim()) {
  //     toast.error("Please enter your full name")
  //     return
  //   }

  //   if (!phoneNumber) {
  //     toast.error("Please enter your phone number")
  //     return
  //   }

  //   if (!hasConsent) {
  //     toast.error("Please provide consent to receive communications")
  //     return
  //   }

  //   // Remove any non-digit characters
  //   const cleanNumber = phoneNumber.replace(/\D/g, '')
  //   if (cleanNumber.length !== 10) {
  //     toast.error("Please enter a valid 10-digit mobile number")
  //     return
  //   }

  //   setIsLoading(true)
  //   try {
  //     const response = await fetch('/api/notify', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         phoneNumber: cleanNumber,
  //         fullName: fullName,
  //         hasConsent: hasConsent
  //       }),
  //     })

  //     const data = await response.json()

  //     if (!response.ok) {
  //       throw new Error(data.error || 'Failed to register')
  //     }

  //     // Show appropriate toast based on the response message
  //     if (data.message.includes('already registered')) {
  //       toast.info("You're already on our notification list! We'll notify you when registrations open.", {
  //         duration: 5000
  //       })
  //     } else {
  //       toast.success("Thank you for registering! We'll notify you when registrations open.", {
  //         duration: 5000
  //       })
  //       // Reset form
  //       setFullName("")
  //       setPhoneNumber("")
  //       setShowForm(false)
  //     }
  //   } catch (error: unknown) {
  //     console.error('Registration error:', error);
  //     toast.error("Something went wrong. Please try again later.", {
  //       description: "If the problem persists, please contact support."
  //     })
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  return (
    <Card className="w-full p-3 md:p-8 border-2 border-primary/20">
      <CardContent className="px-0 md:p-8 max-w-[1600px] mx-auto w-full">
        <h2 className="text-3xl font-bold text-center mb-4 text-primary decorative-border">
          पंजीकरण
        </h2>
        <AnimatePresence mode="wait">
          {!hasRegistrationEnded ? (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <CountdownTimer
                targetDate={registrationStartDate}
                onCountdownComplete={handleCountdownComplete}
                showCard={false}
              />
              <motion.div
                key="register-button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex justify-center"
              >
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => router.push('/register')}
                >
                  Register Now
                </Button>
              </motion.div>
              {/* {!showForm ? (
                <motion.div
                  key="button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex justify-center"
                >
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setShowForm(true)}
                  >
                    Notify Me
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col gap-4 max-w-md mx-auto"
                >
                  <Input
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => {
                      // Only allow digits and limit to 10 characters
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setPhoneNumber(value)
                    }}
                    className="flex-1"
                    disabled={isLoading}
                    inputMode="numeric"
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="consent"
                      checked={hasConsent}
                      onCheckedChange={(checked) => setHasConsent(checked as boolean)}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="consent"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Yes, I want to receive important updates through WhatsApp/SMS
                    </label>
                  </div>
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                    onClick={handleSubmit}
                    disabled={isLoading || !hasConsent}
                  >
                    {isLoading ? "Registering..." : "Submit"}
                  </Button>
                </motion.div>
              )} */}
            </motion.div>
          ) : (
            <motion.div
              key="registration-closed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-4xl mx-auto text-center space-y-6 py-8"
            >
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-400 rounded-lg p-6">
                <h3 className="text-2xl font-bold text-orange-500 dark:text-orange-400 mb-3">
                  Registration is now closed
                </h3>
                <p className="text-orange-500 dark:text-orange-400">
                  Thank you for showing interest. We will get back to you soon with more details.
                </p>
              </div>
              <div className="flex justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Link href="/check-status" target="_blank" rel="noopener noreferrer">
                    Check Status
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

