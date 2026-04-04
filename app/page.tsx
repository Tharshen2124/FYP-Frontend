import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Framework } from "@/components/landing/framework";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { Pricing } from "@/components/landing/pricing";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Framework />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
