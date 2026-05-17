import type { Metadata } from 'next'
import { Bricolage_Grotesque, Ubuntu } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import "./globals.css"

const bricolage = Bricolage_Grotesque({ 
  subsets: ["latin"],
  variable: '--font-bricolage',
  display: 'swap',
});

const ubuntu = Ubuntu({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '700'],
  variable: '--font-ubuntu',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HabitFlow - 7 Habits Schedule Planner',
  description: 'Plan your week using the 7 Habits of Highly Effective People framework. Define goals, organize tasks, and export to Google Calendar.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${ubuntu.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
