import { query } from "./db";
import {
  industries as fallbackIndustries,
  principles as fallbackPrinciples,
  products as fallbackProducts,
  projects as fallbackProjects,
  services as fallbackServices,
  steps as fallbackSteps,
  tools as fallbackTools,
} from "@/content/site";

export interface HomepageCopy {
  siteName: string;
  heroBadge: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroTitleAccent: string;
  heroDescription: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  statementEyebrow: string;
  statementBody: string;
  productsHeading: string;
  productsSubheading: string;
  servicesHeading: string;
  industriesHeading: string;
  industriesSubheading: string;
  workHeading: string;
  workSubheading: string;
  aboutHeading: string;
  aboutSubheading: string;
  contactHeading: string;
  contactSubheading: string;
  footerTagline: string;
  tools: string[];
}

export interface CmsProduct {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  status: "testing" | "development" | "live";
  statusLabel: string;
  href: string;
  points: string[];
  icon: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface CmsService {
  id: string;
  layer: string;
  name: string;
  summary: string;
  tags: string[];
  imageUrl: string;
  imageAlt: string;
  icon: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface CmsIndustry {
  id: string;
  name: string;
  note: string;
  layers: string[];
  flag: string;
  icon: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface CmsProject {
  id: string;
  title: string;
  kind: string;
  summary: string;
  tags: string[];
  href: string;
  imageUrl: string;
  imageAlt: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface CmsSiteData {
  copy: HomepageCopy;
  products: CmsProduct[];
  services: CmsService[];
  industries: CmsIndustry[];
  projects: CmsProject[];
  principles: Array<{ id: string; title: string; body: string; sortOrder: number }>;
  steps: Array<{ id: string; title: string; body: string; sortOrder: number }>;
}

const DEFAULT_COPY: HomepageCopy = {
  siteName: "CholokLabs",
  heroBadge: "PRODUCT & ENGINEERING STUDIO",
  heroTitleLine1: "From software",
  heroTitleLine2: "to",
  heroTitleAccent: "silicon.",
  heroDescription:
    "We build intelligent products and engineer the systems behind them — from AI applications to embedded hardware.",
  heroPrimaryCta: "Explore products",
  heroSecondaryCta: "Our services",
  statementEyebrow: "WHY CHOLOKLABS",
  statementBody:
    "We ship our own products and engineer for ambitious teams. One studio, from the interface you touch to the transistor underneath.",
  productsHeading: "Our products",
  productsSubheading: "Independent products, built and maintained by the CholokLabs team.",
  servicesHeading: "Across the stack",
  industriesHeading: "Where we build",
  industriesSubheading:
    "Six sectors where software meets the physical world, and where our layers usually combine.",
  workHeading: "Engineering in practice",
  workSubheading:
    "One product we run ourselves and two engagements that show how the layers fit together.",
  aboutHeading: "One engineering team",
  aboutSubheading:
    "Digital and physical work designed together, by the people who will hand it over.",
  contactHeading: "Tell us what you want to build",
  contactSubheading:
    "Describe the problem, the site or the product idea. We read every inquiry and reply with questions and next steps.",
  footerTagline: "Product and engineering studio. From software to silicon.",
  tools: [...fallbackTools],
};

export async function getCmsSiteData(includeUnpublished = false): Promise<CmsSiteData> {
  try {
    const pubFilter = includeUnpublished ? "" : "WHERE is_published = TRUE";
    const [settingsRes, prodRes, svcRes, indRes, projRes, prinRes, stepRes] = await Promise.all([
      query<{ value: Partial<HomepageCopy> }>(`SELECT value FROM site_settings WHERE key = 'homepage'`),
      query<{
        id: string;
        slug: string;
        name: string;
        tagline: string;
        summary: string;
        status: "testing" | "development" | "live";
        status_label: string;
        href: string;
        points: string[];
        icon: string;
        sort_order: number;
        is_published: boolean;
      }>(`SELECT * FROM cms_products ${pubFilter} ORDER BY sort_order ASC, created_at ASC`),
      query<{
        id: string;
        layer: string;
        name: string;
        summary: string;
        tags: string[];
        image_url: string;
        image_alt: string;
        icon: string;
        sort_order: number;
        is_published: boolean;
      }>(`SELECT * FROM cms_services ${pubFilter} ORDER BY sort_order ASC, created_at ASC`),
      query<{
        id: string;
        name: string;
        note: string;
        layers: string[];
        flag: string;
        icon: string;
        sort_order: number;
        is_published: boolean;
      }>(`SELECT * FROM cms_industries ${pubFilter} ORDER BY sort_order ASC`),
      query<{
        id: string;
        title: string;
        kind: string;
        summary: string;
        tags: string[];
        href: string;
        image_url: string;
        image_alt: string;
        sort_order: number;
        is_published: boolean;
      }>(`SELECT * FROM cms_projects ${pubFilter} ORDER BY sort_order ASC`),
      query<{ id: string; title: string; body: string; sort_order: number }>(
        `SELECT * FROM cms_principles ORDER BY sort_order ASC`
      ),
      query<{ id: string; title: string; body: string; sort_order: number }>(
        `SELECT * FROM cms_steps ORDER BY sort_order ASC`
      ),
    ]);

    const copy: HomepageCopy = {
      ...DEFAULT_COPY,
      ...(settingsRes.rows[0]?.value || {}),
    };

    return {
      copy,
      products: prodRes.rows.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        summary: p.summary,
        status: p.status,
        statusLabel: p.status_label,
        href: p.href || "",
        points: Array.isArray(p.points) ? p.points : [],
        icon: p.icon || "GraduationCap",
        sortOrder: p.sort_order,
        isPublished: p.is_published,
      })),
      services: svcRes.rows.map((s) => ({
        id: s.id,
        layer: s.layer,
        name: s.name,
        summary: s.summary,
        tags: Array.isArray(s.tags) ? s.tags : [],
        imageUrl: s.image_url || "/services/software.png",
        imageAlt: s.image_alt || s.name,
        icon: s.icon || "Code2",
        sortOrder: s.sort_order,
        isPublished: s.is_published,
      })),
      industries: indRes.rows.map((ind) => ({
        id: ind.id,
        name: ind.name,
        note: ind.note,
        layers: Array.isArray(ind.layers) ? ind.layers : [],
        flag: ind.flag || "",
        icon: ind.icon || "Factory",
        sortOrder: ind.sort_order,
        isPublished: ind.is_published,
      })),
      projects: projRes.rows.map((pr) => ({
        id: pr.id,
        title: pr.title,
        kind: pr.kind,
        summary: pr.summary,
        tags: Array.isArray(pr.tags) ? pr.tags : [],
        href: pr.href || "",
        imageUrl: pr.image_url || "/services/software.png",
        imageAlt: pr.image_alt || pr.title,
        sortOrder: pr.sort_order,
        isPublished: pr.is_published,
      })),
      principles: prinRes.rows.map((x) => ({
        id: x.id,
        title: x.title,
        body: x.body,
        sortOrder: x.sort_order,
      })),
      steps: stepRes.rows.map((x) => ({
        id: x.id,
        title: x.title,
        body: x.body,
        sortOrder: x.sort_order,
      })),
    };
  } catch (err) {
    console.error("[cms] Falling back to static content:", err);
    return {
      copy: DEFAULT_COPY,
      products: fallbackProducts.map((p, i) => ({
        id: p.slug,
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        summary: p.summary,
        status: p.status,
        statusLabel: p.statusLabel,
        href: p.href || "",
        points: p.points,
        icon: i === 0 ? "GraduationCap" : "ShieldCheck",
        sortOrder: i,
        isPublished: true,
      })),
      services: fallbackServices.map((s, i) => ({
        id: `svc-${i}`,
        layer: s.layer,
        name: s.name,
        summary: s.summary,
        tags: s.tags,
        imageUrl: "/services/software.png",
        imageAlt: s.name,
        icon: "Code2",
        sortOrder: i,
        isPublished: true,
      })),
      industries: fallbackIndustries.map((ind, i) => ({
        id: `ind-${i}`,
        name: ind.name,
        note: ind.note,
        layers: ["Application"],
        flag: i === 0 ? "HOME OF PORIKKHA" : "",
        icon: "Factory",
        sortOrder: i,
        isPublished: true,
      })),
      projects: fallbackProjects.map((pr, i) => ({
        id: `proj-${i}`,
        title: pr.title,
        kind: pr.kind,
        summary: pr.summary,
        tags: pr.tags,
        href: pr.href || "",
        imageUrl: "/services/software.png",
        imageAlt: pr.title,
        sortOrder: i,
        isPublished: true,
      })),
      principles: fallbackPrinciples.map((x, i) => ({ id: `p-${i}`, ...x, sortOrder: i })),
      steps: fallbackSteps.map((x, i) => ({ id: `s-${i}`, ...x, sortOrder: i })),
    };
  }
}
