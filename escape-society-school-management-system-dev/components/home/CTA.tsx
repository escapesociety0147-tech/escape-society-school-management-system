import { ArrowRight, CheckCircle, Shield, Headphones } from 'lucide-react'
import Link from 'next/link'

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary-600 to-accent-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your School Management?
          </h2>
          <p className="text-xl opacity-90 max-w-3xl mx-auto mb-8">
            Join thousands of schools that have streamlined their operations with EduManage.
            Start your free 14-day trial today - no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/auth/register"
              className="bg-white text-primary-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg text-lg flex items-center justify-center space-x-2 transition-colors group"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#"
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-3 rounded-lg text-lg transition-colors"
            >
              Schedule a Demo
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              {
                icon: CheckCircle,
                title: 'No credit card required',
                description: 'Start free, upgrade when ready',
              },
              {
                icon: Shield,
                title: 'Bank-level security',
                description: 'Your data is always safe',
              },
              {
                icon: Headphones,
                title: '24/7 support',
                description: "We're here to help you succeed",
              },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="opacity-90 text-sm">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
