import Link from 'next/link'
import { School, Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react'

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Dashboard', href: '#dashboard' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'API', href: '#' },
    { label: 'Documentation', href: '#' },
  ],
  Company: [
    { label: 'About Us', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Press', href: '#' },
    { label: 'Partners', href: '#' },
  ],
  Support: [
    { label: 'Help Center', href: '#' },
    { label: 'Contact Us', href: '#' },
    { label: 'Status', href: '#' },
    { label: 'System Status', href: '#' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
  Legal: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'GDPR', href: '#' },
    { label: 'CCPA', href: '#' },
  ],
}

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Instagram, href: '#', label: 'Instagram' },
]

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-primary-600 p-2 rounded-lg">
                <School className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">EduManage</span>
            </div>
            <p className="mb-6 max-w-md">
              A comprehensive school management system that simplifies administrative tasks,
              enhances learning experiences, and connects educators, students, and parents.
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-primary-400" />
                <span>support@edumanage.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-primary-400" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-primary-400" />
                <span>123 Education Street, Learning City, 12345</span>
              </div>
            </div>
          </div>

          {/* Links sections */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-primary-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm">
                (c) {new Date().getFullYear()} EduManage. All rights reserved.
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex space-x-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      className="hover:text-primary-400 transition-colors"
                      aria-label={social.label}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  )
                })}
              </div>
              <div className="flex space-x-4">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg"
                  alt="Mastercard"
                  className="h-8"
                />
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
                  alt="Visa"
                  className="h-8"
                />
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/b/b7/PayPal_Logo_Icon_2014.svg"
                  alt="PayPal"
                  className="h-8"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
