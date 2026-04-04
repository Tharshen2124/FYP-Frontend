import type { Metadata } from 'next'
import { Bricolage_Grotesque, Ubuntu } from 'next/font/google'
import './globals.css'

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
  title: 'HabitFlow | Principle-Centered Scheduling',
  description: 'Plan your week around what matters most. Based on The 7 Habits of Highly Effective People framework.',
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
    <html lang="en">
      <body className={`${bricolage.variable} ${ubuntu.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
