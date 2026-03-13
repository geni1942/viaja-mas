'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────
//  VIVANTE Brandbook 2.0
//  Naranja Coral    #FF6332  → acción (CTA)
//  Fucsia Vibrante  #E83E8C  → acento
//  Violeta Profundo #6F42C1  → secundario / hover
//  Crema Suave      #FCF8F4  → fondo
//  Gris Carbón      #212529  → texto
// ─────────────────────────────────────────────

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Cómo funciona', href: '#como-funciona' },
    { label: 'Inspiración',   href: '#inspiracion'   },
    { label: 'Precios',       href: '#precios'        },
  ]

  return (
    <>
      <header style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        transition: 'background 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease',
        backgroundColor: scrolled ? 'rgba(252, 248, 244, 0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(111, 66, 193, 0.12)' : '1px solid transparent',
        boxShadow: scrolled ? '0 2px 24px rgba(111, 66, 193, 0.08)' : 'none',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>

          {/* ── Logo ── */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <Image
              src="/images/vivante_logo.svg"
              alt="VIVANTE"
              width={120}
              height={88}
              priority
              style={{
                height: '42px',
                width: 'auto',
                // SVG blanco → al hacer scroll, se convierte en Violeta Profundo #6F42C1
                filter: scrolled
                  ? 'invert(24%) sepia(60%) saturate(900%) hue-rotate(240deg) brightness(80%)'
                  : 'none',
                transition: 'filter 0.35s ease',
              }}
            />
          </Link>

          {/* ── Nav desktop ── */}
          <nav className="vivante-nav-desktop" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
          }}>
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: '14px',
                  letterSpacing: '0.2px',
                  color: scrolled ? '#212529' : '#ffffff',
                  textDecoration: 'none',
                  opacity: 0.85,
                  transition: 'opacity 0.2s ease, color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1'
                  if (scrolled) e.currentTarget.style.color = '#6F42C1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.85'
                  e.currentTarget.style.color = scrolled ? '#212529' : '#ffffff'
                }}
              >
                {item.label}
              </Link>
            ))}

            {/* CTA — Naranja Coral */}
            <Link
              href="#planifica"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: '14px',
                color: '#ffffff',
                backgroundColor: '#FF6332',
                padding: '10px 22px',
                borderRadius: '100px',
                textDecoration: 'none',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                boxShadow: '0 4px 16px rgba(255, 99, 50, 0.38)',
                display: 'inline-block',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 99, 50, 0.48)'
                e.currentTarget.style.backgroundColor = '#e8551f'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 99, 50, 0.38)'
                e.currentTarget.style.backgroundColor = '#FF6332'
              }}
            >
              Planifica tu viaje →
            </Link>
          </nav>

          {/* ── Hamburger mobile ── */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="vivante-hamburger"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              flexDirection: 'column',
              gap: '5px',
            }}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {[0, 1, 2].map((i) => (
              <span key={i} style={{
                display: 'block',
                width: '24px',
                height: '2px',
                backgroundColor: scrolled ? '#212529' : '#ffffff',
                borderRadius: '2px',
                transition: 'all 0.3s ease',
                transform:
                  menuOpen && i === 0 ? 'rotate(45deg) translate(5px, 5px)'  :
                  menuOpen && i === 1 ? 'scaleX(0)'                           :
                  menuOpen && i === 2 ? 'rotate(-45deg) translate(5px, -5px)' :
                  'none',
              }} />
            ))}
          </button>
        </div>

        {/* ── Menú mobile animado ── */}
        <div
          className="vivante-mobile-menu"
          style={{
            backgroundColor: '#FCF8F4',
            borderTop: '1px solid rgba(111, 66, 193, 0.1)',
            padding: menuOpen ? '16px 24px 28px' : '0 24px',
            maxHeight: menuOpen ? '400px' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.35s ease, padding 0.35s ease',
          }}
        >
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                fontSize: '16px',
                color: '#212529',
                textDecoration: 'none',
                padding: '13px 0',
                borderBottom: '1px solid rgba(111, 66, 193, 0.08)',
              }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="#planifica"
            onClick={() => setMenuOpen(false)}
            style={{
              display: 'block',
              marginTop: '18px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: '15px',
              color: '#ffffff',
              backgroundColor: '#FF6332',
              padding: '14px 22px',
              borderRadius: '100px',
              textDecoration: 'none',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(255, 99, 50, 0.35)',
            }}
          >
            Planifica tu viaje →
          </Link>
        </div>
      </header>

      <style>{`
        @media (max-width: 768px) {
          .vivante-nav-desktop { display: none !important; }
          .vivante-hamburger   { display: flex !important; }
        }
        @media (min-width: 769px) {
          .vivante-mobile-menu { display: none !important; }
        }
      `}</style>
    </>
  )
}
