#!/usr/bin/env ts-node

/**
 * Test script for the update-sponsors API
 * Run with: ts-node scripts/test-update-sponsors.ts
 */
async function testUpdateSponsors() {
  try {
    console.log("Testing update-sponsors API...");

    // Get CRON_SECRET from environment if set
    const cronSecret = process.env.CRON_SECRET;

    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (cronSecret) {
      headers["Authorization"] = `Bearer ${cronSecret}`;
    }

    // Make request to the API
    const response = await fetch("http://localhost:3000/api/update-sponsors", {
      method: "POST",
      headers,
    });

    // Parse response
    const data = await response.json();

    // Log results
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error testing update-sponsors:", error);
    process.exit(1);
  }
}

testUpdateSponsors();
