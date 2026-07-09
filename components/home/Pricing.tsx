import { Check, X, HelpCircle } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: 'Basic',
    description: 'Perfect for small schools just getting started',
    price: '$29',
    period: 'per month',
    features: [
      { text: 'Up to 500 students', included: true },
      { text: 'Basic student management', included: true },
      { text: 'Attendance tracking', included: true },
      { text: 'Exam results system', included: true },
      { text: 'Email support', included: true },
      { text: 'Advanced analytics', included: false },
      { text: 'Fee management', included: false },
      { text: 'Parent portal', included: false },
      { text: 'Custom reporting', included: false },
      { text: 'Priority support', included: false },
    ],
    highlighted: false,
  },
  {
    name: 'Professional',
    description: 'Best for growing schools with advanced needs',
    price: '$79',
    period: 'per month',
    features: [
      { text: 'Up to 2,000 students', included: true },
      { text: 'Advanced student management', included: true },
      { text: 'Attendance tracking', included: true },
      { text: 'Exam results system', included: true },
      { text: 'Fee management system', included: true },
      { text: 'Parent & teacher portals', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Custom reporting', included: true },
      { text: 'Email & phone support', included: true },
      { text: 'Priority support', included: false },
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    description: 'For large institutions with custom requirements',
    price: '$199',
    period: 'per month',
    features: [
      { text: 'Unlimited students', included: true },
      { text: 'All Professional features', included: true },
      { text: 'Custom modules & integrations', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'White-label solution', included: true },
      { text: 'API access', included: true },
      { text: 'On-premise deployment', included: true },
      { text: 'Custom training', included: true },
      { text: '24/7 priority support', included: true },
      { text: 'SLA guarantee', included: true },
    ],
    highlighted: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Choose the perfect plan for your institution. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl border ${
                plan.highlighted
                  ? 'border-primary-500 shadow-lg shadow-primary-500/10 dark:shadow-primary-500/20 scale-105'
                  : 'border-gray-200 dark:border-gray-700'
              } bg-white dark:bg-gray-800 overflow-hidden`}
            >
              {plan.highlighted && (
                <div className="bg-primary-500 text-white text-center py-2 text-sm font-semibold">
                  Most Popular
                </div>
              )}
              
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {plan.description}
                </p>
                
                <div className="mb-8">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Billed annually, cancel anytime
                  </p>
                </div>

                <Link
                  href="/auth/register"
                  className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors ${
                    plan.highlighted
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                >
                  Start Free Trial
                </Link>

                <div className="mt-8 space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-success-500 mr-3 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 dark:text-gray-600 mr-3 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`${
                          feature.included
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
            <HelpCircle className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
            <span className="text-gray-700 dark:text-gray-300">
              Need a custom plan?{' '}
              <a href="#" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                Contact our sales team
              </a>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
