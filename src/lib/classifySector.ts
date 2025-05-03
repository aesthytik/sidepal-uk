import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

/**
 * Possible industry sectors for classification
 */
export type Sector =
  | "it"
  | "finance"
  | "healthcare"
  | "education"
  | "retail"
  | "other";

/**
 * Uses AI to classify a company's industry sector based on name and homepage HTML
 * @param companyName The name of the company
 * @param homepageHtml Optional HTML content from the company's homepage
 * @returns Classified sector as a lowercase string
 */
export async function classifySector(
  companyName: string,
  homepageHtml?: string
): Promise<Sector> {
  try {
    // Prepare content for classification
    // If we have HTML, use it, otherwise just use the company name
    const contentToClassify = homepageHtml
      ? `Company Name: ${companyName}\n\nHomepage HTML: ${homepageHtml.substring(
          0,
          4000
        )}` // Limit HTML to avoid token limits
      : `Company Name: ${companyName}`;

    const { choices } = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are a company industry classifier. Classify the company into exactly one of these sectors: " +
            "it, finance, healthcare, education, retail, other. " +
            "Return ONLY the lowercase sector name without any explanation or punctuation.",
        },
        {
          role: "user",
          content: contentToClassify,
        },
      ],
    });

    const result = choices[0].message.content?.trim().toLowerCase() || "other";

    // Validate the result is one of our expected sectors
    if (
      ["it", "finance", "healthcare", "education", "retail", "other"].includes(
        result
      )
    ) {
      return result as Sector;
    }

    return "other";
  } catch (error) {
    console.error(`Error classifying sector for ${companyName}:`, error);
    return "other";
  }
}

/**
 * Bulk classification function that respects rate limits
 * @param companies List of companies to classify
 * @param cacheMap Optional cache of already classified sectors
 * @returns Map of company names to sectors
 */
export async function bulkClassifySectors(
  companies: { name: string; homepageHtml?: string }[],
  cacheMap: Map<string, Sector> = new Map()
): Promise<Map<string, Sector>> {
  const results = new Map<string, Sector>(cacheMap);
  const queue = companies.filter((company) => !cacheMap.has(company.name));

  // Process in batches to respect rate limits
  const BATCH_SIZE = 25;
  const DELAY_MS = 15 * 1000; // 15 seconds between batches

  for (let i = 0; i < queue.length; i += BATCH_SIZE) {
    const batch = queue.slice(i, i + BATCH_SIZE);

    // Process batch in parallel
    const batchPromises = batch.map(async (company) => {
      const sector = await classifySector(company.name, company.homepageHtml);
      return { name: company.name, sector };
    });

    const batchResults = await Promise.all(batchPromises);

    // Add results to map
    batchResults.forEach(({ name, sector }) => {
      results.set(name, sector);
    });

    // Log progress
    console.log(`Classified ${i + batch.length}/${queue.length} companies`);

    // Delay before next batch if not the last batch
    if (i + BATCH_SIZE < queue.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  return results;
}
