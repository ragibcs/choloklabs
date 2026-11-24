/**
 * All page copy lives here as typed data. Components read from this file only,
 * so a CMS or CholokLabs Company OS can replace it later without touching UI.
 */

export const site = {
  name: "CholokLabs",
  statement: "We Build Products. We Engineer Solutions.",
  description:
    "CholokLabs builds its own technology products and delivers end-to-end digital and physical engineering: AI/ML, industrial automation, embedded systems, IoT, GPU programming and CPU design.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const nav = [
  { label: "Products", href: "/#products" },
  { label: "Services", href: "/#services" },
  { label: "Research", href: "/#research" },
  { label: "Team", href: "/team" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/#about" },
] as const;

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  status: "testing" | "development";
  statusLabel: string;
  href?: string;
  points: string[];
};

export const products: Product[] = [
  {
    slug: "porikkha",
    name: "Porikkha",
    tagline: "AI-powered examinations",
    summary:
      "An examination platform that helps institutions create, run and review exams with AI support. Porikkha is currently in testing. Explore the demo at ragib.bond.",
    status: "testing",
    statusLabel: "In testing",
    href: "https://ragib.bond",
    points: [
      "Create and run exams online",
      "AI support across the exam workflow",
      "Open to early testers today",
    ],
  },
  {
    slug: "boloy",
    name: "BOLoy",
    tagline: "Cybersecurity and digital protection",
    summary:
      "A security product for protecting people and businesses online. It is in development and not yet open for testing.",
    status: "development",
    statusLabel: "In development",
    points: [
      "Digital protection for everyday users",
      "Built by the team behind Porikkha",
      "Details shared as milestones are reached",
    ],
  },
];

export type Service = {
  layer: string;
  name: string;
  summary: string;
  tags: string[];
};

/** Ordered from the application layer down to silicon. */
export const services: Service[] = [
  {
    layer: "Application",
    name: "Software Development & AI/ML",
    summary:
      "Web and mobile applications, APIs, data pipelines and machine learning systems, from first prototype to production.",
    tags: ["Web & mobile", "LLM & ML systems", "Computer vision", "Data pipelines"],
  },
  {
    layer: "Acceleration",
    name: "GPU Programming",
    summary:
      "CUDA kernels and GPU pipelines that cut processing time for training, inference, simulation and image workloads.",
    tags: ["CUDA", "Kernel optimization", "Inference speed-up", "Profiling"],
  },
  {
    layer: "Connectivity",
    name: "IoT & Industrial IoT",
    summary:
      "Sensors, gateways and cloud dashboards that bring machines and sites online, with secure device-to-cloud messaging.",
    tags: ["MQTT", "OPC UA", "Edge gateways", "Dashboards"],
  },
  {
    layer: "Control",
    name: "Industrial Automation & PLC Programming",
    summary:
      "Control logic, HMI and SCADA for production lines and plants, written so your maintenance team can support it.",
    tags: ["PLC", "HMI & SCADA", "Panel logic", "Commissioning support"],
  },
  {
    layer: "Firmware & hardware",
    name: "Embedded Systems & Electronics",
    summary:
      "Schematics, PCB layout and firmware for microcontroller-based products, from prototype to small production runs.",
    tags: ["Microcontrollers", "PCB design", "Firmware", "Prototyping"],
  },
  {
    layer: "Silicon",
    name: "CPU Design & Computer Architecture",
    summary:
      "RTL design, FPGA prototyping and architecture exploration for custom processors and accelerators.",
    tags: ["RTL & Verilog", "FPGA", "RISC-V", "Architecture modeling"],
  },
];

export const tools = [
  "Python",
  "PyTorch",
  "CUDA",
  "TensorRT",
  "TypeScript",
  "Next.js",
  "Docker",
  "MQTT",
  "OPC UA",
  "Modbus",
  "Siemens TIA Portal",
  "CODESYS",
  "STM32",
  "ESP32",
  "KiCad",
  "Verilog",
  "RISC-V",
  "FPGA",
] as const;

export const industries = [
  { name: "Education", note: "Exam, assessment and learning platforms." },
  { name: "Manufacturing", note: "Line control, monitoring and quality inspection." },
  { name: "Food & agro processing", note: "Process automation and sensing for plants and farms." },
  { name: "Energy & utilities", note: "Metering, monitoring and control systems." },
  { name: "Logistics", note: "Tracking devices, fleet data and warehouse automation." },
  { name: "Security & fintech", note: "Protection, fraud signals and secure device messaging." },
] as const;

export type Project = {
  title: string;
  kind: "Product" | "Representative engagement";
  summary: string;
  tags: string[];
  href?: string;
};

/**
 * Replace the representative engagements with published client case studies
 * as they become available. Do not add metrics that were not measured.
 */
export const projects: Project[] = [
  {
    title: "Porikkha",
    kind: "Product",
    summary:
      "Our own AI-powered examination platform, designed and built end to end by CholokLabs and currently in its testing phase.",
    tags: ["Product", "AI", "Web"],
    href: "https://ragib.bond",
  },
  {
    title: "Production line monitoring",
    kind: "Representative engagement",
    summary:
      "PLC data collected through an industrial gateway and shown on a live dashboard for plant managers.",
    tags: ["PLC", "IIoT", "Dashboard"],
  },
  {
    title: "Edge vision inspection",
    kind: "Representative engagement",
    summary:
      "A camera, a small GPU board and a trained model that flags defects at the line, with no cloud round trip.",
    tags: ["Embedded", "Computer vision", "GPU"],
  },
];

export const principles = [
  {
    title: "Our own products keep us accountable",
    body: "We ship and maintain software ourselves, so we know what a good handover has to include.",
  },
  {
    title: "One team across digital and physical work",
    body: "Firmware, PLC logic, the cloud service and the dashboard are designed together, not passed between vendors.",
  },
  {
    title: "Built to be handed over",
    body: "Source, documentation and training are part of every delivery.",
  },
] as const;

export const steps = [
  { title: "Discover", body: "We map the problem, the site and the constraints." },
  { title: "Design", body: "Architecture, schematics or control logic, and a plan you can review." },
  { title: "Build", body: "Working increments you can test early, on real hardware or real data." },
  { title: "Hand over", body: "Source, documentation and training so your team can run it." },
] as const;

export const inquiryInterests = [
  "Porikkha",
  "BOLoy",
  "Bangla Audio Corpus & Datasets",
  "Research & Innovation Partnership",
  ...services.map((s) => s.name),
  "Something else",
] as const;
