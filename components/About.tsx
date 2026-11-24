import {Boxes, FileCheck2, Handshake, Hammer, PenTool, Search, PackageCheck} from 'lucide-react'

const principleIcons = [Boxes, Handshake, FileCheck2]
const stepIcons = [Search, PenTool, Hammer, PackageCheck]

export default function About({
  principles,
  steps,
  heading = 'One engineering team',
  subheading = 'Digital and physical work designed together, by the people who will hand it over.',
}: {
  principles: Array<{id: string; title: string; body: string}>
  steps: Array<{id: string; title: string; body: string}>
  heading?: string
  subheading?: string
}) {
  return (
    <section id="about" className="wrap section ab-section" aria-labelledby="about-title">
      <div className="eyebrow"><i />ABOUT CHOLOKLABS</div>
      <div className="section-head">
        <h2 id="about-title" data-split>{heading}<span>.</span></h2>
        <p data-reveal-up>{subheading}</p>
      </div>

      <ul className="ab-principles" data-stagger>
        {principles.map((t, i) => {
          const Icon = principleIcons[i % principleIcons.length]
          return (
            <li key={t.id || t.title} data-spotlight>
              <span className="ab-icon"><Icon size={20} aria-hidden="true" /></span>
              <h3>{t.title}</h3>
              <p>{t.body}</p>
            </li>
          )
        })}
      </ul>

      <div className="ab-process">
        <div className="ab-process-head">
          <h3 data-reveal-up>How we work</h3>
          <p className="mono" data-reveal-up>FOUR STAGES · ONE TEAM THROUGHOUT</p>
        </div>
        <div className="steps-wrap">
          <div className="ab-track" aria-hidden="true"><div className="steps-line" /></div>
          <ol className="ab-steps" data-stagger>
            {steps.map((s, i) => {
              const Icon = stepIcons[i % stepIcons.length]
              return (
                <li key={s.id || s.title}>
                  <span className="ab-node"><Icon size={18} aria-hidden="true" /></span>
                  <small className="mono">STEP 0{i + 1}</small>
                  <h4>{s.title}</h4>
                  <p>{s.body}</p>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
