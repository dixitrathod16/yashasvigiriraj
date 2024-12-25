"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "sonner"

export function RegistrationBanner() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    // Basic phone number validation
    if (!phoneNumber) {
      toast.error("Please enter your WhatsApp number")
      return
    }

    // Remove any non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '')
    if (cleanNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: cleanNumber }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register')
      }

      // Show appropriate toast based on the response message
      if (data.message.includes('already registered')) {
        toast.info("You're already on our notification list! We'll notify you when registrations open.", {
          duration: 5000
        })
      } else {
        toast.success("Thank you for registering! We'll notify you on WhatsApp when registrations open.", {
          duration: 5000
        })
        setPhoneNumber("") // Only clear the input if it's a new registration
      }
    } catch (error: unknown) {
      console.error('Registration error:', error);
      toast.error("Something went wrong. Please try again later.", {
        description: "If the problem persists, please contact support."
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full p-3 md:p-8 border-2 border-primary/20">
      <CardContent className="p-8">
          <h2 className="text-3xl font-bold text-center mb-4 text-primary decorative-border">
            पंजीकरण जल्द शुरू होगा!
          </h2>
          <p className="text-center text-lg mb-6">
            Registrations Opening Soon for this Divine Journey
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Input
              type="tel"
              placeholder="Enter your WhatsApp number"
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
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Notify Me"}
            </Button>
          </div>
      </CardContent>
    </Card>
  )
}

