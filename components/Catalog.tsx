import Services from '@/components/Services'
import Industries from '@/components/Industries'
import Work from '@/components/Work'
import About from '@/components/About'
import {BorderBeam} from '@/components/ui/border-beam'
import {GraduationCap, ShieldCheck, Cpu, Layers3, Sparkles, ArrowUpRight, Plus} from 'lucide-react'
import type {CmsSiteData} from '@/lib/cms'

function Kicker({children}:{children:React.ReactNode}){return <div className="eyebrow"><i/>{children}</div>}

const iconMap: Record<string, typeof GraduationCap> = {
  GraduationCap,
  ShieldCheck,
  Cpu,
  Layers3,
  Sparkles,
}

export default function Catalog({cms}:{cms: CmsSiteData}){
  return (
    <>
      <section id="products" className="wrap section">
        <Kicker>THE PRODUCT LAB</Kicker>
        <div className="section-head">
          <h2 data-split>{cms.copy.productsHeading}<span>.</span></h2>
          <p data-reveal-up>{cms.copy.productsSubheading}</p>
        </div>
        <div className="product-grid" data-stagger>
          {cms.products.map((p,i)=>{
            const Icon = iconMap[p.icon] || (i % 2 === 0 ? GraduationCap : ShieldCheck)
            const hasHref = Boolean(p.href && p.href.trim())
            return (
              <article data-spotlight className={'product p'+(i%2)} key={p.id || p.slug}>
                {i===0&&<div className="beam-wrap" aria-hidden="true"><BorderBeam size={140} duration={9} colorFrom="#7af0cb" colorTo="#0e7a5f" borderWidth={1.5}/></div>}
                <div className="product-top">
                  <span className="mono">CL / P—0{i+1}</span>
                  <span className="status"><i/>{p.statusLabel}</span>
                </div>
                <div className="product-title"><Icon/><h3>{p.name}</h3></div>
                <p>{p.tagline}</p>
                <details>
                  <summary>Product overview <Plus size={15}/></summary>
                  <p>{p.summary}</p>
                  <ul>{p.points.map(t=><li key={t}>{t}</li>)}</ul>
                </details>
                <a className="product-link" href={hasHref ? p.href : '#contact'} {...(hasHref ? {target:'_blank',rel:'noreferrer'} : {})}>
                  {hasHref ? `Open ${p.name}` : `Ask about ${p.name}`} <ArrowUpRight size={17}/>
                </a>
              </article>
            )
          })}
        </div>
      </section>
      <Services services={cms.services} heading={cms.copy.servicesHeading}/>
      <Industries industries={cms.industries} heading={cms.copy.industriesHeading} subheading={cms.copy.industriesSubheading}/>
      <Work projects={cms.projects} heading={cms.copy.workHeading} subheading={cms.copy.workSubheading}/>
      <About principles={cms.principles} steps={cms.steps} heading={cms.copy.aboutHeading} subheading={cms.copy.aboutSubheading}/>
    </>
  )
}
