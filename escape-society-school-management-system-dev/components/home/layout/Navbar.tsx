'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/components/dashboard/layout/ThemeProvider'
import { Menu, X, Sun, Moon, ChevronDown, School, LogIn, UserPlus } from 'lucide-react'

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'Dashboard', href: '#dashboard' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Pricing', href: '#pricing' },
]

export default function LandingNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-primary-600 p-2 rounded-lg">
                <School className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                EduManage
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            <Link
              href="/auth/login"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
            >
              Log In
            </Link>
            
            <Link
              href="/auth/register"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors flex items-center space-x-1"
            >
              <UserPlus className="h-4 w-4" />
              <span>Register</span>
            </Link>
            
            <Link
              href="/auth/register"
              className="btn-primary flex items-center space-x-2"
            >
              <span>Get Started</span>
              <ChevronDown className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium py-2"
                >
                  {item.label}
                </a>
              ))}
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Theme
                  </span>
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {theme === 'light' ? (
                      <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
                
                <div className="space-y-3">
                  <Link
                    href="/auth/login"
                    className="w-full btn-secondary flex items-center justify-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Log In</span>
                  </Link>
                  
                  <Link
                    href="/auth/register"
                    className="w-full border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-medium rounded-lg px-4 py-2 flex items-center justify-center space-x-2 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Register</span>
                  </Link>
                  
                  <Link
                    href="/auth/register"
                    className="w-full btn-primary flex items-center justify-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
