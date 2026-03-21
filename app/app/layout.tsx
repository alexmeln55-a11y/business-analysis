import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Opportunity Platform',
  description: 'Поиск сильных бизнес-возможностей для рынка РФ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>
        <Nav />
        <main style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '48px 24px',
          minHeight: 'calc(100vh - 56px)',
        }}>
          {children}
        </main>
      </body>
    </html>
  )
}
