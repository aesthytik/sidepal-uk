import type { RoleId } from "../sectors/taxonomy";

/**
 * Skills we recognise in CVs and job ads: [display name, role family, extra aliases].
 * The name itself is always an alias. Short or ambiguous words (Go, R, C) are only
 * matched through unambiguous aliases.
 */
const TABLE: [string, RoleId, string[]?][] = [
  // Software
  ["JavaScript", "software", ["js", "ecmascript"]],
  ["TypeScript", "software", ["ts"]],
  ["Python", "software"],
  ["Java", "software"],
  ["Kotlin", "software"],
  ["Swift", "software", ["swiftui"]],
  ["Go", "software", ["golang", "go lang"]],
  ["Rust", "software"],
  ["C++", "software", ["cpp"]],
  ["C#", "software", ["c sharp", "csharp"]],
  [".NET", "software", ["dotnet", "asp.net", ".net core"]],
  ["Ruby", "software", ["ruby on rails", "rails"]],
  ["PHP", "software", ["laravel", "symfony"]],
  ["Scala", "software"],
  ["Elixir", "software"],
  ["React", "software", ["react.js", "reactjs"]],
  ["React Native", "software"],
  ["Next.js", "software", ["nextjs"]],
  ["Vue", "software", ["vue.js", "vuejs", "nuxt"]],
  ["Angular", "software", ["angularjs"]],
  ["Svelte", "software", ["sveltekit"]],
  ["Node.js", "software", ["node", "nodejs", "express.js", "nestjs"]],
  ["Django", "software"],
  ["Flask", "software", ["fastapi"]],
  ["Spring", "software", ["spring boot"]],
  ["HTML", "software", ["html5"]],
  ["CSS", "software", ["css3", "sass", "scss", "tailwind", "tailwindcss"]],
  ["GraphQL", "software"],
  ["REST APIs", "software", ["rest api", "restful", "rest"]],
  ["Microservices", "software", ["microservice"]],
  ["iOS", "software"],
  ["Android", "software"],
  ["Flutter", "software", ["dart"]],
  ["AWS", "software", ["amazon web services", "ec2", "lambda", "s3"]],
  ["Azure", "software", ["microsoft azure"]],
  ["GCP", "software", ["google cloud", "google cloud platform"]],
  ["Docker", "software", ["containers"]],
  ["Kubernetes", "software", ["k8s", "eks", "gke", "aks"]],
  ["Terraform", "software", ["infrastructure as code", "iac"]],
  ["CI/CD", "software", ["continuous integration", "github actions", "jenkins", "gitlab ci", "circleci"]],
  ["Linux", "software", ["unix", "bash"]],
  ["Git", "software", ["github", "gitlab"]],
  ["Testing", "software", ["unit testing", "tdd", "jest", "pytest", "cypress", "playwright", "selenium"]],
  ["Security", "software", ["cybersecurity", "cyber security", "infosec", "penetration testing", "owasp"]],
  ["Agile", "software", ["scrum", "kanban", "jira"]],
  // Data & AI
  ["SQL", "data", ["postgresql", "postgres", "mysql", "t-sql", "pl/sql", "sql server"]],
  ["NoSQL", "data", ["mongodb", "dynamodb", "cassandra", "redis"]],
  ["Machine Learning", "data", ["ml", "deep learning", "neural networks"]],
  ["AI / LLMs", "data", ["llm", "llms", "large language models", "generative ai", "genai", "nlp", "natural language processing"]],
  ["PyTorch", "data"],
  ["TensorFlow", "data", ["keras"]],
  ["scikit-learn", "data", ["sklearn"]],
  ["Pandas", "data", ["numpy"]],
  ["Spark", "data", ["pyspark", "apache spark", "databricks"]],
  ["Airflow", "data", ["dbt", "etl", "elt", "data pipelines"]],
  ["Snowflake", "data", ["bigquery", "redshift", "data warehouse"]],
  ["Kafka", "data", ["event streaming"]],
  ["Power BI", "data", ["powerbi"]],
  ["Tableau", "data", ["looker"]],
  ["Excel", "data", ["microsoft excel", "vba", "pivot tables"]],
  ["Statistics", "data", ["statistical analysis", "a/b testing", "hypothesis testing"]],
  ["R (language)", "data", ["rstudio", "tidyverse", "r programming"]],
  ["Computer Vision", "data", ["opencv", "image processing"]],
  // Health & care
  ["NMC registration", "health", ["nmc pin", "nmc registered", "registered nurse", "rgn", "rmn"]],
  ["GMC registration", "health", ["gmc registered", "gmc"]],
  ["HCPC registration", "health", ["hcpc"]],
  ["Patient care", "health", ["patient-centred care", "person-centred care"]],
  ["Medication administration", "health", ["administering medication", "medicines management"]],
  ["Care planning", "health", ["care plans"]],
  ["Safeguarding", "health", ["safeguarding adults", "safeguarding children"]],
  ["Dementia care", "health", ["dementia"]],
  ["Phlebotomy", "health", ["venepuncture", "cannulation"]],
  ["ICU", "health", ["intensive care", "critical care", "itu"]],
  ["A&E", "health", ["emergency department", "accident and emergency"]],
  ["Mental health", "health", ["psychiatric", "cbt"]],
  ["Physiotherapy", "health"],
  ["Pharmacy", "health", ["dispensing", "gphc"]],
  ["First aid", "health", ["bls", "ils", "als", "basic life support"]],
  // Engineering & construction
  ["AutoCAD", "engineering", ["cad"]],
  ["SolidWorks", "engineering"],
  ["Revit", "engineering", ["bim"]],
  ["MATLAB", "engineering", ["simulink"]],
  ["Structural analysis", "engineering", ["finite element", "fea", "eurocodes"]],
  ["Project management", "engineering", ["prince2", "pmp", "project manager"]],
  ["Health & safety", "engineering", ["cscs", "smsts", "sssts", "iosh", "nebosh"]],
  ["HVAC", "engineering", ["mechanical services", "building services"]],
  ["Electrical installation", "engineering", ["18th edition", "bs 7671", "wiring regulations"]],
  ["PLC", "engineering", ["scada", "plc programming"]],
  ["Quantity surveying", "engineering", ["rics", "cost estimation", "nec contracts"]],
  ["Chartered engineer", "engineering", ["ceng", "ieng", "imeche", "ice", "iet"]],
  ["Lean / Six Sigma", "engineering", ["lean manufacturing", "six sigma", "continuous improvement"]],
  // Finance
  ["ACCA", "finance"],
  ["ACA", "finance", ["icaew"]],
  ["CIMA", "finance"],
  ["CFA", "finance"],
  ["Financial modelling", "finance", ["financial modeling", "dcf", "valuation"]],
  ["IFRS", "finance", ["uk gaap", "us gaap"]],
  ["Audit", "finance", ["external audit", "internal audit"]],
  ["Tax", "finance", ["corporation tax", "vat", "transfer pricing"]],
  ["Management accounts", "finance", ["month-end", "month end", "reconciliations", "budgeting", "forecasting"]],
  ["Risk management", "finance", ["credit risk", "market risk", "operational risk"]],
  ["Compliance", "finance", ["aml", "kyc", "anti-money laundering", "fca"]],
  ["SAP", "finance", ["sap fico", "s/4hana"]],
  ["Xero", "finance", ["quickbooks", "sage"]],
  ["Bloomberg", "finance", ["bloomberg terminal"]],
  // Teaching & academia
  ["QTS", "education", ["qualified teacher status", "pgce"]],
  ["Lesson planning", "education", ["curriculum design", "schemes of work"]],
  ["SEN", "education", ["send", "special educational needs"]],
  ["Classroom management", "education", ["behaviour management"]],
  ["Research", "education", ["peer-reviewed", "publications", "grant writing"]],
  ["PhD", "education", ["doctorate", "dphil"]],
  // Hospitality
  ["Food hygiene", "hospitality", ["food safety", "haccp", "level 2 food hygiene"]],
  ["Menu development", "hospitality", ["menu planning"]],
  ["Fine dining", "hospitality", ["michelin", "a la carte"]],
  ["Pastry", "hospitality", ["patisserie", "baking"]],
  ["Kitchen management", "hospitality", ["stock control", "gp margins", "kitchen brigade"]],
  ["Barista", "hospitality", ["coffee"]],
  // Sales & marketing
  ["Salesforce", "sales", ["crm"]],
  ["HubSpot", "sales"],
  ["B2B sales", "sales", ["b2b", "saas sales", "enterprise sales"]],
  ["Lead generation", "sales", ["prospecting", "cold calling", "pipeline management"]],
  ["Account management", "sales", ["key accounts", "client relationships"]],
  ["SEO", "sales", ["search engine optimisation", "search engine optimization"]],
  ["PPC", "sales", ["google ads", "paid search", "sem"]],
  ["Social media", "sales", ["social media marketing", "paid social", "meta ads"]],
  ["Content marketing", "sales", ["copywriting", "content strategy"]],
  ["Google Analytics", "sales", ["ga4"]],
  ["Email marketing", "sales", ["mailchimp", "klaviyo"]],
  ["Product management", "sales", ["product manager", "roadmapping", "product discovery"]],
  // Design & media
  ["Figma", "design", ["sketch", "adobe xd"]],
  ["UX research", "design", ["user research", "usability testing"]],
  ["UI design", "design", ["interaction design", "visual design"]],
  ["Design systems", "design", ["component library"]],
  ["Prototyping", "design", ["wireframing", "wireframes"]],
  ["Photoshop", "design", ["adobe photoshop", "lightroom"]],
  ["Illustrator", "design", ["adobe illustrator", "indesign"]],
  ["Adobe Creative Suite", "design", ["adobe creative cloud"]],
  ["After Effects", "design", ["motion graphics"]],
  ["Video editing", "design", ["premiere pro", "final cut", "davinci resolve"]],
  ["3D", "design", ["blender", "maya", "cinema 4d", "unreal engine", "unity"]],
  // Logistics
  ["HGV licence", "logistics", ["hgv", "class 1", "class 2", "c+e", "cpc"]],
  ["Forklift", "logistics", ["flt", "counterbalance", "reach truck"]],
  ["Supply chain", "logistics", ["procurement", "purchasing", "sourcing"]],
  ["Inventory management", "logistics", ["stock management", "warehouse management", "wms"]],
  ["Demand planning", "logistics", ["s&op", "forecasting demand"]],
  ["Freight", "logistics", ["shipping", "customs", "import/export"]],
];

export interface Skill {
  name: string;
  role: RoleId;
  patterns: RegExp[];
}

// Treat +, # and . as part of a word so "C++" and ".NET" match whole, and "node" doesn't match inside "node.js"
const LEFT = "(?<![\\w+#.])";
const RIGHT = "(?![\\w+#]|\\.\\w)";
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A whole-word pattern for any of the phrases. */
const phrasePattern = (phrases: string[], flags = "gi") => new RegExp(`${LEFT}(?:${[...phrases].sort((a, b) => b.length - a.length).map(escape).join("|")})${RIGHT}`, flags);

// Too common in ordinary prose to match in any case ("rest of the team", "send an email")
const PROSE = new Set(["go", "go lang", "rest", "node", "send", "ice", "iet", "ts", "js", "r (language)", "coffee", "research", "cad", "sem", "lambda", "unity", "maya", "sketch", "dart", "containers"]);
// Ordinary words that are skills only when capitalised ("Swift", not "a swift reply")
const CASED = new Set(["swift", "spring", "rust", "spark", "flask", "ruby", "rails", "sage", "looker", "unity", "maya", "sketch", "dart"]);

export const SKILLS: Skill[] = TABLE.map(([name, role, aliases = []]) => {
  const phrases = [name, ...aliases].map((p) => p.toLowerCase());
  const plain = phrases.filter((p) => !PROSE.has(p) && !CASED.has(p));
  const cased = [name, ...aliases].filter((p) => CASED.has(p.toLowerCase())).map((p) => p[0].toUpperCase() + p.slice(1));
  const patterns = [plain.length && phrasePattern(plain), cased.length && phrasePattern(cased, "g")].filter((p): p is RegExp => Boolean(p));
  return { name, role, patterns };
});

const BY_NAME = new Map(SKILLS.map((s) => [s.name.toLowerCase(), s]));
const custom = new Map<string, RegExp[]>();

/** The patterns for a skill name, including ones the user typed that aren't in the table. */
function patternsFor(name: string): RegExp[] {
  const known = BY_NAME.get(name.toLowerCase());
  if (known) return known.patterns;
  let p = custom.get(name);
  if (!p) {
    p = [phrasePattern([name.toLowerCase()])];
    if (custom.size > 500) custom.clear();
    custom.set(name, p);
  }
  return p;
}

export const skillRole = (name: string): RoleId | undefined => BY_NAME.get(name.toLowerCase())?.role;

/** The table's spelling of a skill, so "react.js" typed by hand becomes "React". */
export function canonicalSkill(input: string): string {
  const text = input.trim();
  return SKILLS.find((s) => s.patterns.some((p) => new RegExp(`^(?:${p.source})$`, p.flags.replace("g", "")).test(text)))?.name ?? text;
}

/** How many times a skill is mentioned in some text. */
export function countMentions(text: string, name: string): number {
  return patternsFor(name).reduce((n, p) => n + (text.match(p)?.length ?? 0), 0);
}
