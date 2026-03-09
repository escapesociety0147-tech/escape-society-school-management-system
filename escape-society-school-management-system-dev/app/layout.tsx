import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import './global.css'
import { ThemeProvider } from '@/components/dashboard/layout/ThemeProvider'
import ToastProvider from '@/components/ui/ToastProvider'
import NotificationSync from '@/components/notifications/NotificationSync'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EduManage - School Management System',
  description: 'Comprehensive school management system for modern educational institutions',
  keywords: ['school management', 'education', 'student management', 'attendance', 'exam results', 'fee management'],
  authors: [{ name: 'EduManage Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://edumanage.com',
    title: 'EduManage - School Management System',
    description: 'Streamline your school administration with our comprehensive management system',
    siteName: 'EduManage',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'EduManage Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduManage - School Management System',
    description: 'Streamline your school administration with our comprehensive management system',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          <NotificationSync />
          <ToastProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
