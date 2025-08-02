import React, { useEffect } from 'react'
import Lenis from '@studio-freight/lenis'
import UploadSection from '../components/UploadSection.jsx'

const Home = () => {
  useEffect(() => {
    const lenis = new Lenis()
    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [])

  return (
    <main>
      <section className="h-[100vh] flex items-center justify-center">
        <UploadSection />
      </section>
    </main>
  )
}

export default Home
