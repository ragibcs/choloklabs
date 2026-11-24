import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./studio.css";
import "./sections.css";
import "./dashboard.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://choloklabs.tech").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CholokLabs — Product & Engineering Studio | From Software to Silicon",
    template: "%s | CholokLabs",
  },
  description:
    "CholokLabs builds intelligent technology products (Porikkha, BOLoy) and delivers end-to-end engineering: AI/ML, CUDA GPU acceleration, Industrial IoT, PLC automation, embedded systems, and custom silicon architecture.",
  keywords: [
    "CholokLabs",
    "Porikkha",
    "BOLoy",
    "Product Engineering Studio",
    "AI ML Engineering",
    "GPU Programming CUDA",
    "Industrial IoT",
    "PLC Automation",
    "Embedded Systems",
    "PCB Design",
    "CPU Design RISC-V FPGA",
    "Bangladesh Engineering Studio",
  ],
  authors: [
    { name: "Ragib Hasan", url: siteUrl },
    { name: "Rakibul Hasan", url: siteUrl },
    { name: "CholokLabs", url: siteUrl },
  ],
  creator: "CholokLabs",
  publisher: "CholokLabs",
  category: "technology",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "CholokLabs",
    title: "CholokLabs — Product & Engineering Studio",
    description:
      "We build intelligent products and engineer the systems behind them — from AI applications and GPU acceleration to embedded hardware and silicon.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "CholokLabs — From software to silicon.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CholokLabs — Product & Engineering Studio",
    description:
      "From software to silicon: AI/ML, GPU kernels, Industrial IoT, PLC automation, embedded electronics, and custom CPU architecture.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a1416" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1416" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "CholokLabs",
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
      description:
        "CholokLabs builds its own technology products and delivers end-to-end digital and physical engineering from AI/ML and GPU acceleration to embedded systems and silicon.",
      founders: [
        { "@type": "Person", name: "Ragib Hasan", jobTitle: "Founder" },
        { "@type": "Person", name: "Rakibul Hasan", jobTitle: "Co-Founder" },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "CholokLabs",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${jetbrainsMono.variable} bg-background`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
