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
        {/*
          Toaster is mounted before the page, not after it. Sonner replays nothing to a subscriber
          that arrives late, and effects run in tree order, so a page that toasts on mount -- the
          Google callback landing on /login#error=, the onboarding guard turning someone away --
          published to nobody when this sat second. It is fixed-position with its own z-index, so
          coming first costs the layout nothing.
        */}
        <Toaster />
        {children}
      </body>
    </html>
  )
}
