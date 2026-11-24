import Image from 'next/image'
import {ArrowUpRight} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import SpotlightCard from '@/components/SpotlightCard'
import type {CmsProject} from '@/lib/cms'

export default function Work({
  projects,
  heading = 'Engineering in practice',
  subheading = 'One product we run ourselves and two engagements that show how the layers fit together.',
}: {
  projects: CmsProject[]
  heading?: string
  subheading?: string
}) {
  return (
    <section id="work" className="work" aria-labelledby="work-title">
      <div className="wrap section">
        <div className="eyebrow"><i />SELECTED WORK</div>
        <div className="section-head">
          <h2 id="work-title" data-split>{heading}<span>.</span></h2>
          <p data-reveal-up>{subheading}</p>
        </div>
        <ul className="wk-grid" data-stagger>
          {projects.map((p, i) => (
            <li key={p.id || p.title} className={i === 0 ? 'wk-lead' : undefined}>
              <SpotlightCard theme="dark" spotlightColor="#7af0cb" intensity={0.18} className="wk-card" style={{'--spotlight-card-surface': 'var(--surface)'} as React.CSSProperties}>
                <figure className="wk-art" aria-hidden="true">
                  <Image src={p.imageUrl || '/services/software.png'} alt={p.imageAlt || p.title} fill sizes="(max-width:900px) 90vw, 50vw" />
                </figure>
                <div className="wk-body">
                  <div className="wk-top">
                    <Badge variant="outline" className={p.kind === 'Product' ? 'wk-kind is-product' : 'wk-kind'}>{p.kind}</Badge>
                    <span className="mono wk-num">0{i + 1}</span>
                  </div>
                  <div className="wk-copy">
                    <h3>{p.title}</h3>
                    <p>{p.summary}</p>
                    <ul className="wk-tags" aria-label={`${p.title} tags`}>
                      {p.tags.map(t => <li key={t} className="mono">{t}</li>)}
                    </ul>
                    {p.href && (
                      <a className="wk-link" href={p.href} target="_blank" rel="noreferrer">
                        Explore the demo <ArrowUpRight size={16} aria-hidden="true" />
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    )}
                  </div>
                </div>
              </SpotlightCard>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
