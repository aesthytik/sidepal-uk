// Loads .env for scripts (Next.js does this itself for the app). CI passes real env vars instead.
try {
  process.loadEnvFile();
} catch {
  // no .env file
}
