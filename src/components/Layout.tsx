import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import Lenis from 'lenis'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

/**
 * Global layout. Navbar is `fixed` (overlay + hide-on-scroll per design), so
 * this layout owns the 64px top offset (pt-16) on the content slot.
 * Full-bleed heroes opt out inside the page with a -mt-16 on the section.
 */
export default function Layout() {
  const { pathname } = useLocation()

  // Lenis smooth scrolling (lerp 0.1 per design)
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1 })
    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [])

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-[100dvh] bg-abyss text-ink-primary">
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
