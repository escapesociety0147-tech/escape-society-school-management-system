import { ArrowRight, CheckCircle, Users, BarChart3, Shield } from 'lucide-react'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Streamline Your School
            <span className="text-primary-600 dark:text-primary-400 block">
              Management Effortlessly
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            EduManage is a comprehensive school management system that simplifies student tracking, 
            attendance, exam results, and fee management all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/auth/register"
              className="btn-primary text-lg px-8 py-3 flex items-center justify-center space-x-2 group"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#dashboard"
              className="btn-secondary text-lg px-8 py-3"
            >
              View Demo
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Users, label: '10,000+ Students', desc: 'Successfully Managed' },
              { icon: BarChart3, label: '99%', desc: 'Satisfaction Rate' },
              { icon: Shield, label: 'Bank-level', desc: 'Security' },
              { icon: CheckCircle, label: '24/7', desc: 'Support Available' },
            ].map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center mb-2">
                  <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-lg">
                    <stat.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.label}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 right-0 -z-10">
        <div className="w-64 h-64 bg-primary-300 dark:bg-primary-800 rounded-full blur-3xl opacity-20"></div>
      </div>
      <div className="absolute bottom-0 left-0 -z-10">
        <div className="w-64 h-64 bg-accent-300 dark:bg-accent-800 rounded-full blur-3xl opacity-20"></div>
      </div>
    </section>
  )
}
