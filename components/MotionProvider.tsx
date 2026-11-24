'use client'
import {useEffect} from 'react'
import gsap from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {SplitText} from 'gsap/SplitText'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, SplitText)

export const lenisRef: {current: Lenis | null} = {current: null}

export default function MotionProvider() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let lenis: Lenis | undefined
    const tick = (time: number) => lenis?.raf(time * 1000)
    if (!reduce) {
      lenis = new Lenis({lerp: 0.1, anchors: {offset: -80}})
      lenisRef.current = lenis
      lenis.on('scroll', ScrollTrigger.update)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
    }

    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.to('.scroll-progress', {scaleX: 1, ease: 'none', scrollTrigger: {start: 0, end: 'max', scrub: true}})

      gsap.utils.toArray<HTMLElement>('[data-split]').forEach(el => {
        SplitText.create(el, {
          type: 'words',
          mask: 'words',
          autoSplit: true,
          onSplit: self =>
            gsap.from(self.words, {yPercent: 115, stagger: 0.06, duration: 1, ease: 'expo.out', scrollTrigger: {trigger: el, start: 'top 88%'}}),
        })
      })

      gsap.utils.toArray<HTMLElement>('[data-reveal-up]').forEach(el =>
        gsap.from(el, {y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: {trigger: el, start: 'top 90%'}}),
      )

      gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach(el =>
        gsap.from(el.children, {y: 48, opacity: 0, stagger: 0.09, duration: 1, ease: 'power3.out', scrollTrigger: {trigger: el, start: 'top 86%'}}),
      )

      const statement = document.querySelector<HTMLElement>('[data-scrub-text]')
      if (statement) {
        const split = SplitText.create(statement, {type: 'words'})
        gsap.fromTo(split.words, {opacity: 0.14}, {opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: {trigger: statement, start: 'top 82%', end: 'bottom 50%', scrub: true}})
      }

      gsap.to('.machine-stage', {yPercent: 14, ease: 'none', scrollTrigger: {trigger: '.lab-hero', start: 'top top', end: 'bottom top', scrub: true}})
      gsap.to('.lab-hero .hero-copy', {yPercent: -12, opacity: 0.2, ease: 'none', scrollTrigger: {trigger: '.lab-hero', start: 'top top', end: 'bottom top', scrub: true}})

      gsap.from('.steps-line', {scaleX: 0, ease: 'none', scrollTrigger: {trigger: '.steps-wrap', start: 'top 85%', end: 'bottom 60%', scrub: true}})

    })

    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-spotlight]')
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    window.addEventListener('pointermove', onMove, {passive: true})

    return () => {
      mm.revert()
      window.removeEventListener('pointermove', onMove)
      gsap.ticker.remove(tick)
      lenis?.destroy()
      lenisRef.current = null
    }
  }, [])

  return <div className="scroll-progress" aria-hidden="true" />
}
