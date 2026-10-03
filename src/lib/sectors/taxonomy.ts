export const SECTORS = [
  { id: "health", label: "Health & Social Care" },
  { id: "tech", label: "IT & Software" },
  { id: "finance", label: "Finance & Professional Services" },
  { id: "education", label: "Education" },
  { id: "hospitality", label: "Hospitality & Food" },
  { id: "engineering", label: "Engineering & Construction" },
  { id: "retail", label: "Retail & Wholesale" },
  { id: "recruitment", label: "Recruitment & Staffing" },
  { id: "logistics", label: "Transport & Logistics" },
  { id: "charity", label: "Charity & Religious" },
  { id: "science", label: "Science & Research" },
  { id: "media", label: "Creative & Media" },
] as const;

export type SectorId = (typeof SECTORS)[number]["id"];

export const isSectorId = (v: unknown): v is SectorId => SECTORS.some((s) => s.id === v);
export const sectorLabel = (id: string) => SECTORS.find((s) => s.id === id)?.label ?? id;

/** A kind of job. `sectors` are where such employers are likely found; `titles` matches job titles. */
export const ROLE_FAMILIES = [
  { id: "software", label: "Software engineering", sectors: ["tech"], titles: /\b(software|developer|engineer(ing)? (manager|lead)|devops|sre|full[- ]?stack|front[- ]?end|back[- ]?end|mobile|ios|android|platform engineer|qa engineer|sdet)\b/i },
  { id: "data", label: "Data & AI", sectors: ["tech", "finance"], titles: /\b(data|machine learning|ml |ai |analytics|analyst|scientist|bi )\b/i },
  { id: "health", label: "Nursing & care", sectors: ["health"], titles: /\b(nurse|nursing|care ?(worker|assistant|manager)|carer|support worker|clinical|doctor|physician|therapist|pharmac|dentist|midwife)\b/i },
  { id: "engineering", label: "Engineering & construction", sectors: ["engineering"], titles: /\b(mechanical|electrical|civil|structural|site manager|quantity surveyor|project engineer|electrician|welder|construction)\b/i },
  { id: "finance", label: "Finance & accounting", sectors: ["finance"], titles: /\b(accountant|accounting|finance|financial|audit|tax|actuar|underwriter|investment|banking|risk|compliance)\b/i },
  { id: "education", label: "Teaching & academia", sectors: ["education", "science"], titles: /\b(teacher|lecturer|professor|tutor|teaching|researcher|research fellow|academic)\b/i },
  { id: "hospitality", label: "Chef & hospitality", sectors: ["hospitality"], titles: /\b(chef|cook|kitchen|restaurant|hotel|barista|front of house|waiter|waitress)\b/i },
  { id: "sales", label: "Sales & marketing", sectors: ["tech", "retail", "finance"], titles: /\b(sales|marketing|account executive|business development|customer success|brand)\b/i },
  { id: "design", label: "Design & media", sectors: ["media", "tech"], titles: /\b(designer|design|creative|editor|producer|animator|ux|ui )\b/i },
  { id: "logistics", label: "Logistics & drivers", sectors: ["logistics"], titles: /\b(driver|logistics|warehouse|supply chain|courier|operations)\b/i },
] as const satisfies readonly { id: string; label: string; sectors: readonly SectorId[]; titles: RegExp }[];

export type RoleId = (typeof ROLE_FAMILIES)[number]["id"];

export const isRoleId = (v: unknown): v is RoleId => ROLE_FAMILIES.some((r) => r.id === v);
export const roleFamily = (id: string) => ROLE_FAMILIES.find((r) => r.id === id);
