import LandingNavbar from '@/components/home/layout/Navbar'
import Hero from '@/components/home/Hero'
import Features from '@/components/home/Features'
import Testimonials from '@/components/home/Testimonials'
import Pricing from '@/components/home/Pricing'
import CTA from '@/components/home/CTA'
import Footer from '@/components/home/layout/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <LandingNavbar />
      <Hero />
      <Features />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  )
}
