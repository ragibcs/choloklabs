'use client'
import Image from 'next/image'
import {useEffect, useRef, useState} from 'react'
import gsap from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {ArrowUpRight, Code2, Cpu, Radio, SlidersHorizontal, CircuitBoard, Layers3} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip'
import DecryptedText from '@/components/DecryptedText'
import Magnet from '@/components/Magnet'
import {lenisRef} from '@/components/MotionProvider'
import type {CmsService} from '@/lib/cms'

gsap.registerPlugin(ScrollTrigger)

const iconByName: Record<string, typeof Code2> = {
  Code2,
  Cpu,
  Radio,
  SlidersHorizontal,
  CircuitBoard,
  Layers3,
}
const fallbackIcons = [Code2, Cpu, Radio, SlidersHorizontal, CircuitBoard, Layers3]

export default function Services({
  services,
  heading = 'Across the stack',
}: {
  services: CmsService[]
  heading?: string
}) {
  const root = useRef<HTMLElement>(null)
  const trigger = useRef<ScrollTrigger | null>(null)
  const [active, setActive] = useState(0)
  const n = Math.max(1, services.length)

  useEffect(() => {
    const el = root.current
    if (!el || services.length < 2) return
    const mm = gsap.matchMedia()

    mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
      el.classList.add('is-pinned')
      const panels = gsap.utils.toArray<HTMLElement>('.svc-panel', el)
      const ins = panels.map(p => p.querySelectorAll('[data-in]'))
      const imgs = panels.map(p => p.querySelector('.svc-media img'))
      gsap.set(panels, {flexGrow: 0})
      gsap.set(panels[0], {flexGrow: 1})
      panels.forEach((p, i) => i && gsap.set(ins[i], {opacity: 0, y: 36}))
      gsap.set(imgs.slice(1), {scale: 1.3})

      const tl = gsap.timeline({
        defaults: {ease: 'power3.inOut'},
        scrollTrigger: {
          trigger: el,
          pin: true,
          start: 'top top',
          end: () => `+=${window.innerHeight * (n - 1) * 0.85}`,
          scrub: 0.7,
          refreshPriority: 1,
          invalidateOnRefresh: true,
          snap: {snapTo: 1 / (n - 1), duration: {min: 0.25, max: 0.6}, delay: 0.05, ease: 'power2.inOut'},
          onUpdate: self => setActive(Math.round(self.progress * (n - 1))),
        },
      })
      for (let i = 1; i < n; i++) {
        const at = `s${i}`
        tl.addLabel(at)
          .to(ins[i - 1], {opacity: 0, y: -24, duration: 0.35, stagger: 0.03, ease: 'power2.in'}, at)
          .to(panels[i - 1], {flexGrow: 0, duration: 1}, at)
          .to(panels[i], {flexGrow: 1, duration: 1}, at)
          .to(imgs[i], {scale: 1, duration: 1.2, ease: 'power2.out'}, at)
          .to(ins[i], {opacity: 1, y: 0, duration: 0.55, stagger: 0.07, ease: 'power3.out'}, `${at}+=0.5`)
      }
      trigger.current = tl.scrollTrigger ?? null
      ScrollTrigger.sort()
      ScrollTrigger.refresh()
      return () => {
        el.classList.remove('is-pinned')
        trigger.current = null
      }
    })

    mm.add('(max-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray<HTMLElement>('.svc-panel', el).forEach(p => {
        const tl = gsap.timeline({scrollTrigger: {trigger: p, start: 'top 82%', onEnter: () => p.classList.add('is-open')}})
        tl.from(p.querySelector('.svc-media'), {clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.out'})
          .from(p.querySelector('.svc-media img'), {scale: 1.3, duration: 1.2, ease: 'power3.out'}, 0)
          .from(p.querySelectorAll('[data-in]'), {opacity: 0, y: 24, stagger: 0.07, duration: 0.6, ease: 'power3.out'}, 0.2)
      })
    })

    return () => mm.revert()
  }, [n, services.length])

  const goTo = (i: number) => {
    const st = trigger.current
    const target = st && n > 1 ? st.start + ((st.end - st.start) * i) / (n - 1) : document.getElementById(`layer-${i + 1}`)
    if (target === null) return
    if (lenisRef.current) lenisRef.current.scrollTo(target as number | HTMLElement, {offset: st ? 0 : -80, duration: 1.2})
    else if (typeof target === 'number') window.scrollTo({top: target})
    else target.scrollIntoView()
  }

  if (services.length === 0) return null
  const current = services[Math.min(active, services.length - 1)]

  return (
    <section className="stack-section svc-reactor" id="services" aria-labelledby="services-title" ref={root}>
      <div className="wrap svc-shell">
        <div className="stack-head">
          <div>
            <div className="eyebrow"><i />ENGINEERING SERVICES</div>
            <h2 id="services-title" data-split>{heading}<span>.</span></h2>
          </div>
          <div className="svc-console">
            <div className="svc-readout mono" aria-live="polite">
              <span className="svc-count">0{active + 1}<small>/0{n}</small></span>
              <DecryptedText key={active} text={current.layer.toUpperCase()} animateOn="view" speed={35} maxIterations={12} sequential className="svc-decrypt" encryptedClassName="svc-decrypt-enc" />
            </div>
            <TooltipProvider>
              <nav className="svc-dots" aria-label="Jump to service layer">
                {services.map((s, i) => (
                  <Tooltip key={s.id || s.name}>
                    <TooltipTrigger className={i === active ? 'on' : undefined} aria-label={`Layer ${i + 1}: ${s.name}`} aria-current={i === active ? 'step' : undefined} onClick={() => goTo(i)}>
                      <span>{i + 1}</span>
                    </TooltipTrigger>
                    <TooltipContent className="svc-tip">{s.name}</TooltipContent>
                  </Tooltip>
                ))}
              </nav>
            </TooltipProvider>
            <div className="svc-meter" aria-hidden="true"><i style={{transform: `scaleX(${(active + 1) / n})`}} /></div>
          </div>
        </div>

        <ol className="svc-rail">
          {services.map((s, i) => {
            const Icon = iconByName[s.icon] || fallbackIcons[i % fallbackIcons.length]
            return (
              <li key={s.id || s.name} id={`layer-${i + 1}`} className={'svc-panel' + (i === active ? ' is-active' : '')}>
                <div className="svc-strip" aria-hidden="true">
                  <Icon size={18} />
                  <span className="svc-strip-label mono">{s.name}</span>
                  <span className="svc-strip-num mono">0{i + 1}</span>
                </div>
                <article className="svc-body" aria-label={s.name} data-spotlight>
                  <figure className="svc-media">
                    <Image src={s.imageUrl || '/services/software.png'} alt={s.imageAlt || s.name} fill sizes="(max-width:900px) 90vw, 60vw" />
                  </figure>
                  <div className="svc-copy">
                    <div className="svc-meta mono" data-in>
                      <span className="stack-icon"><Icon size={18} aria-hidden="true" /></span>
                      LAYER {i + 1} / {n} · {s.layer.toUpperCase()}
                    </div>
                    <div className="svc-lower">
                      <h3 data-in>{s.name}</h3>
                      <p data-in>{s.summary}</p>
                      <ul className="svc-badges" data-in aria-label={`${s.name} capabilities`}>
                        {s.tags.map(t => <li key={t}><Badge variant="outline" className="svc-badge">{t}</Badge></li>)}
                      </ul>
                      <div data-in>
                        <Magnet padding={60} magnetStrength={3} wrapperClassName="svc-magnet">
                          <a className="svc-cta" href="#contact">Talk to our {s.layer.toLowerCase()} team <ArrowUpRight size={16} aria-hidden="true" /></a>
                        </Magnet>
                      </div>
                    </div>
                  </div>
                  <span className="svc-ghost mono" aria-hidden="true">0{i + 1}</span>
                </article>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
