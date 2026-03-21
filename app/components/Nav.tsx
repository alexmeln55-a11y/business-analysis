'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/profile',       label: 'Профиль' },
  { href: '/discovery',     label: 'Запрос' },
  { href: '/signals',       label: 'Сигналы' },
  { href: '/opportunities', label: 'Возможности' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav style={{
      borderBottom: '1px solid rgba(244,237,227,0.08)',
      backgroundColor: '#0B0908',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0 24px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#B57A56',
            letterSpacing: '0.04em',
          }}>
            OPPORTUNITY
          </span>
        </Link>

        <div style={{ display: 'flex', gap: '4px' }}>
          {links.map(({ href, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: active ? '#F4EDE3' : '#9B8A7A',
                  padding: '6px 14px',
                  borderRadius: '14px',
                  backgroundColor: active ? 'rgba(244,237,227,0.06)' : 'transparent',
                  transition: 'all 0.15s ease',
                  display: 'inline-block',
                }}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
