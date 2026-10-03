import type { SectorId } from "./taxonomy";

// Ordered: the first match wins, so specific sectors come before broad ones
const RULES: [SectorId, RegExp][] = [
  ["recruitment", /\b(recruit\w*|staffing|resourcing|talent|employment agency|personnel|locum)\b/i],
  ["health", /\b(care|caring|nursing|nurses|nhs|hospital|clinic|medical|health\w*|dental|dentist|pharmac\w*|surgery|gp|physio\w*|therap\w*|homecare|residential|hospice|ambulance|veterinary|vets?)\b/i],
  ["tech", /\b(software|tech|technolog\w*|digital|data|cyber|cloud|systems|it|ai|apps?|computing|computer|online|web|saas|labs?|robotics|networks?|telecom\w*|semiconductor)\b/i],
  ["education", /\b(school|schools|academy|college|university|universities|nursery|education\w*|learning|training|tuition|montessori|tutor\w*)\b/i],
  ["finance", /\b(bank|banking|capital|financ\w*|invest\w*|insurance|assurance|accountan\w*|accounting|audit|solicitors?|law|legal|llp|advisory|consult\w*|wealth|asset|fund|partners|chartered|payments?|fintech)\b/i],
  ["hospitality", /\b(restaurants?|cafe|café|kitchen|catering|hotel|hotels|pub|inn|bar|bistro|takeaway|pizza|burger|curry|grill|diner|bakery|eatery|coffee|tandoori|sushi|noodle|food|foods|hospitality|lodge)\b/i],
  ["engineering", /\b(engineer\w*|construction|builders?|building|contractors?|civil|electrical|mechanical|plumbing|heating|roofing|architect\w*|surveyors?|manufactur\w*|fabrication|industrial|scaffolding|joinery)\b/i],
  ["logistics", /\b(logistics|transport\w*|haulage|freight|shipping|couriers?|taxis?|cars|travel|airlines?|aviation|delivery|warehouse|cargo)\b/i],
  ["retail", /\b(retail|stores?|shops?|supermarkets?|mart|wholesale|trading|traders?|importers?|exports?|fashion|boutique|convenience|market)\b/i],
  ["science", /\b(research|laborator\w*|scientific|science|pharma\w*|biotech\w*|bio\w*|genom\w*|chemical|chemistry|diagnostics)\b/i],
  ["media", /\b(media|studios?|creative|design\w*|film|films|music|games?|gaming|publishing|publishers|entertainment|production|productions|broadcast\w*|advertising|marketing|pr)\b/i],
  ["charity", /\b(church|churches|mosque|temple|trust|charity|charitable|foundation|ministry|ministries|parish|diocese|synagogue|gurdwara|mandir|faith|religious|association|society)\b/i],
];

/** A best guess at a sponsor's sector from its name, or undefined when nothing fits. */
export function classifyByName(name: string): SectorId | undefined {
  for (const [sector, regex] of RULES) if (regex.test(name)) return sector;
  return undefined;
}
