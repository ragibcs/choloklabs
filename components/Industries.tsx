import {ArrowUpRight, Factory, GraduationCap, ShieldCheck, Truck, Wheat, Zap} from 'lucide-react'
import SpotlightCard from '@/components/SpotlightCard'
import type {CmsIndustry} from '@/lib/cms'

const iconMap: Record<string, typeof Factory> = {
  GraduationCap,
  Factory,
  Wheat,
  Zap,
  Truck,
  ShieldCheck,
}
const fallbackIcons = [GraduationCap, Factory, Wheat, Zap, Truck, ShieldCheck]

export default function Industries({
  industries,
  heading = 'Where we build',
  subheading = 'Six sectors where software meets the physical world, and where our layers usually combine.',
}: {
  industries: CmsIndustry[]
  heading?: string
  subheading?: string
}) {
  return (
    <section id="industries" className="wrap section ind-section" aria-labelledby="industries-title">
      <div className="eyebrow"><i />INDUSTRIES</div>
      <div className="section-head">
        <h2 id="industries-title" data-split>{heading}<span>.</span></h2>
        <p data-reveal-up>{subheading}</p>
      </div>
      <ul className="ind-grid" data-stagger>
        {industries.map((t, i) => {
          const Icon = iconMap[t.icon] || fallbackIcons[i % fallbackIcons.length]
          const featured = i === 0
          return (
            <li key={t.id || t.name} className={featured ? 'ind-featured' : undefined}>
              <SpotlightCard
                theme={featured ? 'dark' : 'light'}
                spotlightColor={featured ? '#7af0cb' : '#0e7a5f'}
                intensity={featured ? 0.22 : 0.12}
                className="ind-card"
                style={{'--spotlight-card-surface': featured ? 'var(--ink)' : 'var(--card)'} as React.CSSProperties}
              >
                <div className="ind-top">
                  <span className="ind-icon"><Icon size={20} aria-hidden="true" /></span>
                  <span className="mono ind-code">IND—0{i + 1}</span>
                </div>
                <div className="ind-copy">
                  {t.flag && <span className="mono ind-flag">{t.flag}</span>}
                  <h3>{t.name}</h3>
                  <p>{t.note}</p>
                </div>
                <div className="ind-foot">
                  <ul className="ind-layers" aria-label={`Typical layers for ${t.name}`}>
                    {t.layers.map(l => <li key={l} className="mono">{l}</li>)}
                  </ul>
                  <ArrowUpRight size={18} aria-hidden="true" className="ind-arrow" />
                </div>
              </SpotlightCard>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
