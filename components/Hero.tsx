'use client'
import ShinyText from '@/components/ShinyText'
import Image from 'next/image'
import {useEffect,useRef,useState} from 'react'
import gsap from 'gsap'
import {SplitText} from 'gsap/SplitText'
import {ArrowRight,ArrowUpRight,ChevronLeft, ChevronRight} from 'lucide-react'
import {Marquee} from '@/components/ui/marquee'
import {ShimmerLink} from '@/components/ui/shimmer-button'
import {tools as defaultTools} from '@/content/site'
import type {HomepageCopy} from '@/lib/cms'

gsap.registerPlugin(SplitText)
const layers=[['Assembly view','Exploded processor assembly'],['Silicon die','The compute layer'],['Board interface','Power and signal routing']]

export default function Hero({copy}:{copy?:HomepageCopy}){
 const host=useRef<HTMLElement>(null), photo=useRef<HTMLDivElement>(null), title=useRef<HTMLHeadingElement>(null)
 const [layer,setLayer]=useState(0)
 const toolList = copy?.tools?.length ? copy.tools : [...defaultTools]

 useEffect(()=>{const mm=gsap.matchMedia();mm.add('(prefers-reduced-motion: no-preference)',()=>{
  const split=title.current?SplitText.create(title.current,{type:'words',mask:'words'}):null
  const tl=gsap.timeline({defaults:{ease:'expo.out'}})
  if(split) tl.from(split.words,{yPercent:120,duration:1.2,stagger:.08})
  tl.from('.hero-copy > :not(h1)',{y:24,opacity:0,stagger:.08,duration:1},'-=.9')
   .from('.machine-photo',{scale:1.15,opacity:0,duration:1.6,ease:'power3.out'},0)
   .from('.model-tag, .view-control',{y:12,opacity:0,stagger:.1,duration:.8},'-=1')
 },host);return ()=>mm.revert()},[])
 useEffect(()=>{const el=photo.current;if(!el)return;const mm=gsap.matchMedia();mm.add({reduce:'(prefers-reduced-motion: reduce)',motion:'(prefers-reduced-motion: no-preference)'},ctx=>{gsap.to(el,{scale:[1,1.28,1.24][layer],yPercent:[0,-2,-12][layer],duration:ctx.conditions?.reduce?0:.6,ease:'power3.out'})});return ()=>mm.revert()},[layer])

 return (
  <>
   <section className="lab-hero" ref={host}>
    <div className="wrap lab-layout">
     <div className="hero-copy">
      <span className="studio-badge"><i/><ShinyText text={copy?.heroBadge || "PRODUCT & ENGINEERING STUDIO"} color="#7af0cb" shineColor="#eef3f1" speed={3.2} /></span>
      <h1 ref={title}>{copy?.heroTitleLine1 || 'From software'}<br/>{copy?.heroTitleLine2 || 'to'} <em>{copy?.heroTitleAccent || 'silicon.'}</em></h1>
      <p>{copy?.heroDescription || 'We build intelligent products and engineer the systems behind them — from AI applications to embedded hardware.'}</p>
      <div className="actions">
       <ShimmerLink href="#products" className="hero-shimmer" background="#7af0cb" shimmerColor="#0a1416" shimmerDuration="2.6s">{copy?.heroPrimaryCta || 'Explore products'} <ArrowRight size={16} aria-hidden="true"/></ShimmerLink>
       <a href="#services" className="btn ghost">{copy?.heroSecondaryCta || 'Our services'} <ArrowUpRight size={16}/></a>
      </div>
     </div>
     <figure className="machine-stage">
      <div ref={photo} className="machine-photo"><Image src="/silicon-study.png" alt="Exploded processor showing a metal lid, illuminated silicon die and board interface" fill priority sizes="(max-width:600px) 100vw, 58vw"/></div>
      <div className="model-tag mono">FIG. 001 <span>/</span> SILICON STUDY</div>
      <figcaption className="view-control"><span aria-live="polite" title={layers[layer][1]}><b>0{layer+1}</b> / 03 <strong>{layers[layer][0]}</strong></span><button aria-label="Previous assembly view" onClick={()=>setLayer((layer+2)%3)}><ChevronLeft size={15}/></button><button aria-label="Next assembly view" onClick={()=>setLayer((layer+1)%3)}><ChevronRight size={15}/></button></figcaption>
     </figure>
    </div>
   </section>
   <div className="toolstrip">
    <div className="tool-marquee">
     <span className="mono tool-label">OUR TOOLCHAIN</span>
     <Marquee pauseOnHover className="marquee-mask [--duration:50s] [--gap:2.75rem]">{toolList.map(t=><span className="tool-chip" key={t}><i aria-hidden="true"/>{t}</span>)}</Marquee>
    </div>
   </div>
  </>
 )
}
