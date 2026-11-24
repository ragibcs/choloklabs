import Link from 'next/link'
import {ArrowUp} from 'lucide-react'
import {Brand} from '@/components/StudioHeader'
import {nav} from '@/content/site'
import type {CmsProduct, CmsService} from '@/lib/cms'

export default function SiteFooter({
  tagline = 'Product and engineering studio. From software to silicon.',
  products,
  services,
}: {
  tagline?: string
  products: CmsProduct[]
  services: CmsService[]
}) {
  return (
    <footer className="ft">
      <div className="wrap ft-grid">
        <div className="ft-brand">
          <Brand />
          <p>{tagline}</p>
        </div>
        <nav aria-label="Footer: sections">
          <h2 className="mono">SITE</h2>
          <ul>
            {nav.map(n => <li key={n.label}><a href={n.href}>{n.label}</a></li>)}
            <li><Link href="/login">Portal Sign In</Link></li>
          </ul>
        </nav>
        <nav aria-label="Footer: services">
          <h2 className="mono">SERVICES</h2>
          <ul>{services.map((s, i) => <li key={s.id || s.name}><a href={`#layer-${i + 1}`}>{s.name}</a></li>)}</ul>
        </nav>
        <nav aria-label="Footer: products">
          <h2 className="mono">PRODUCTS</h2>
          <ul>{products.map(p => <li key={p.id || p.slug}><a href="#products">{p.name}</a></li>)}</ul>
        </nav>
      </div>
      <div className="wrap ft-base">
        <span className="ft-word" aria-hidden="true">CholokLabs</span>
        <div className="ft-row">
          <small>© {new Date().getFullYear()} CholokLabs. All rights reserved.</small>
          <a href="#top" className="ft-top">Back to top <ArrowUp size={15} aria-hidden="true" /></a>
        </div>
      </div>
    </footer>
  )
}
