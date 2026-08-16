import { HeroSection } from "./_components/hero-section"
import { FeaturesSection } from "./_components/features-section"
import { HabitsSection } from "./_components/habits-section"
import { HowItWorksSection } from "./_components/how-it-works-section"
import { CtaSection } from "./_components/cta-section"
import { SiteFooter } from "./_components/site-footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <HeroSection />
      <FeaturesSection />
      <HabitsSection />
      <HowItWorksSection />
      <CtaSection />
      <SiteFooter />
    </div>
  )
}
