import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Dr. Sarah Johnson',
    role: 'Principal, Green Valley High',
    content: 'EduManage has transformed how we run our school. The automation has saved us countless hours of administrative work.',
    rating: 5,
    avatar: 'SJ',
  },
  {
    name: 'Michael Chen',
    role: 'School Administrator',
    content: 'The attendance and fee management modules are exceptional. Parent feedback has been overwhelmingly positive.',
    rating: 5,
    avatar: 'MC',
  },
  {
    name: 'Emma Rodriguez',
    role: 'IT Manager, Oakwood Academy',
    content: 'Implementation was smooth, and the support team was incredibly helpful. The system scales perfectly with our growth.',
    rating: 5,
    avatar: 'ER',
  },
  {
    name: 'David Wilson',
    role: 'Board Chairman, Riverside School',
    content: 'The analytics dashboard provides insights we never had before. It helps us make data-driven decisions.',
    rating: 4,
    avatar: 'DW',
  },
  {
    name: 'Lisa Thompson',
    role: 'Teacher & System Coordinator',
    content: 'User-friendly interface and powerful features. It has made my job so much easier and more efficient.',
    rating: 5,
    avatar: 'LT',
  },
  {
    name: 'Robert Garcia',
    role: 'Parent & School Committee Member',
    content: 'As a parent, I appreciate the transparency and regular updates about my child progress and fee status.',
    rating: 5,
    avatar: 'RG',
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-6">
            <Quote className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Trusted by Schools Worldwide
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Join thousands of educational institutions that have streamlined their operations with EduManage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < testimonial.rating
                              ? 'text-warning-400 fill-warning-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                "{testimonial.content}"
              </p>

              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-4">
                  <span className="font-bold text-primary-600 dark:text-primary-400">
                    {testimonial.avatar}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="text-4xl font-bold text-gray-300 dark:text-gray-700"
              >
                {i}
              </div>
            ))}
            <div className="col-span-5 text-sm text-gray-600 dark:text-gray-400">
              Average rating from 500+ reviews
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}