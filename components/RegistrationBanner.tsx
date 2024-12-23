import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function RegistrationBanner() {
  return (
    <Card className="w-full p-3 md:p-8 border-2 border-primary/20">
      <CardContent className="p-8">
          <h2 className="text-3xl font-bold text-center mb-4 text-primary decorative-border">
            पंजीकरण जल्द शुरू होगा!
          </h2>
          <p className="text-center text-lg mb-6">
            Registrations Opening Soon for this Divine Journey
          </p>
          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Notify Me
            </Button>
          </div>
      </CardContent>
    </Card>
  )
}

