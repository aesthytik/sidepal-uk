// Word lists for the geocoder. Kept apart from places.ts so pages that only need place names stay small.

/** Names shared with bigger places abroad: only trusted when nothing foreign is mentioned, or a UK marker follows. */
export const AMBIGUOUS = new Set(["cambridge", "perth", "durham", "jersey", "york", "newport", "windsor", "bangor", "kingston", "stamford", "newcastle", "bath", "reading", "derry", "lancaster", "chester"]);

/** Words that say "somewhere in the UK" without naming a place. */
export const UK_MARKERS = new Set([
  "uk", "u k", "united kingdom", "great britain", "britain", "gb", "gbr", "england", "scotland", "wales", "ukd",
]);

/**
 * Countries, regions and cities outside the UK seen in job locations. Two-letter codes are only
 * matched when they make up a whole part ("Durham, NC"), so "Ashby de la Zouch" isn't German.
 */
export const FOREIGN = new Set([
  "germany", "netherlands", "spain", "australia", "united states", "united states of america", "usa", "america",
  "poland", "france", "ireland", "europe", "emea", "portugal", "canada", "cyprus", "czech republic", "czechia",
  "sweden", "bulgaria", "serbia", "armenia", "belgium", "italy", "israel", "denmark", "switzerland", "mexico",
  "finland", "united arab emirates", "uae", "brazil", "romania", "croatia", "india", "norway", "kenya", "austria",
  "luxembourg", "hungary", "colombia", "argentina", "qatar", "chile", "philippines", "south korea", "south africa",
  "greece", "iceland", "latvia", "lithuania", "estonia", "japan", "china", "singapore", "new zealand", "americas",
  "apac", "latam", "nigeria", "ghana", "egypt", "turkey", "ukraine", "bahrain", "saudi arabia",
  "new south wales", "queensland", "victoria", "western australia", "south australia", "tasmania", "ontario",
  "quebec", "british columbia", "california", "texas", "florida", "massachusetts", "new jersey", "new hampshire",
  "maryland", "alabama", "washington", "colorado", "missouri", "illinois", "georgia", "virginia", "north carolina",
  "pennsylvania", "ohio", "arizona", "utah", "oregon", "bavaria", "hessen", "lower saxony", "karnataka",
  "north holland", "pomeranian voivodeship", "masovian voivodeship", "south moravian", "east coast", "west coast",
  "skane lan", "stockholms lan", "new york", "new york city", "nyc", "sydney", "berlin", "amsterdam", "paris",
  "munich", "munchen", "montreal", "stockholm", "madrid", "san francisco", "dublin", "warsaw", "prague", "geneva",
  "dubai", "toronto", "barcelona", "limassol", "hong kong", "boston", "bangalore", "bengaluru", "zurich",
  "belgrade", "brussels", "houston", "yerevan", "helsinki", "zug", "abu dhabi", "melbourne", "lisbon", "paphos",
  "sofia", "copenhagen", "tallinn", "seattle", "milan", "milano", "porto", "frankfurt", "frankfurt am main",
  "krakow", "brisbane", "rome", "budapest", "nairobi", "eindhoven", "manama", "vienna", "wien", "athens",
  "rotterdam", "zagreb", "austin", "oslo", "tokyo", "atlanta", "los angeles", "johannesburg", "gdansk",
  "salt lake city", "palo alto", "istanbul", "antwerp", "malmo", "tel aviv", "bucharest", "cape town", "lagos",
  "lausanne", "cleveland", "pittsburgh", "somerville", "miami", "the hague", "santa clara", "brno", "aarhus",
  "doha", "accra", "adelaide", "wiesbaden", "chicago", "canberra", "auckland", "wellington", "gothenburg", "lille",
  "minneapolis", "phoenix", "monterrey", "venice", "iasi", "hannover", "dusseldorf", "tampa", "san antonio",
  "colorado springs", "denver", "san diego", "san jose", "new delhi", "delhi", "mumbai", "hyderabad", "pune",
  "chennai", "shanghai", "beijing", "seoul", "taipei", "jakarta", "kuala lumpur", "bangkok", "manila", "cairo",
  "riyadh", "vancouver", "calgary", "ottawa", "hamburg", "cologne", "stuttgart", "lyon", "valencia", "seville",
  "malaga", "bilbao", "turin", "florence", "naples", "luxembourg city", "basel", "bern", "riga", "vilnius",
  "kyiv", "kiev", "minsk", "cluj", "cluj napoca", "wroclaw", "poznan", "lodz", "gothenburg", "uppsala",
]);

export const FOREIGN_CODES = new Set([
  "us", "ca", "ma", "nc", "ny", "fl", "ga", "az", "tx", "nj", "wa", "il", "co", "va", "pa", "oh", "mn", "dc", "d c",
  "on", "qc", "bc", "nsw", "vic", "qld", "de", "es", "nl", "ie", "pt", "sg", "cn", "fr", "ch", "it", "pl", "se",
  "dk", "fi", "no", "at", "be", "in", "jp", "au", "nz", "can", "la",
]);
