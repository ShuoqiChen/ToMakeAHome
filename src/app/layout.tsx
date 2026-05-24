import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'ToMakeAHome',
  description: 'A companion that grows with you. Stories that carry you forward. A place to belong.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#FAF7F2] min-h-screen font-sans">
        <Navigation />
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  )
}
