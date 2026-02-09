/**
 * Test script for Home Listing US API
 * Usage: node test-property-lookup.js
 */

require('dotenv').config();

const testAddress = "10125 Peebles st 32827";

async function testPropertyLookup() {
  const rapidApiKey = process.env.RAPIDAPI_KEY;

  console.log("=== Property Lookup Test ===");
  console.log(`Address: ${testAddress}`);
  console.log(`RAPIDAPI_KEY configured: ${rapidApiKey ? '✅ Yes' : '❌ No'}`);
  console.log("");

  if (!rapidApiKey) {
    console.error("❌ RAPIDAPI_KEY is not set in .env file!");
    console.log("\nAdd this to your .env file:");
    console.log("RAPIDAPI_KEY=your_key_here");
    return;
  }

  try {
    // Test Home Listing US API
    const searchUrl = `https://home-listing-us.p.rapidapi.com/property`;
    const searchParams = new URLSearchParams({
      address: testAddress,
    });

    console.log("🔍 Calling Home Listing US API...");
    console.log(`URL: ${searchUrl}?${searchParams}`);
    console.log("");

    const response = await fetch(`${searchUrl}?${searchParams}`, {
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'home-listing-us.p.rapidapi.com'
      }
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    console.log("");

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error Response:");
      console.error(errorText);
      return;
    }

    const data = await response.json();
    console.log("✅ API Response:");
    console.log(JSON.stringify(data, null, 2));
    console.log("");

    // Parse and display key fields
    if (data && (data.property || data.address)) {
      const prop = data.property || data;
      console.log("📊 Parsed Property Data:");
      console.log(`  Address: ${prop.address || prop.fullAddress || testAddress}`);
      console.log(`  Price: $${prop.price || prop.estimatedValue || prop.zestimate || 'N/A'}`);
      console.log(`  Bedrooms: ${prop.bedrooms || prop.beds || 'N/A'}`);
      console.log(`  Bathrooms: ${prop.bathrooms || prop.baths || 'N/A'}`);
      console.log(`  Living Area: ${prop.livingArea || prop.squareFeet || prop.sqft || 'N/A'} sqft`);
      console.log(`  Year Built: ${prop.yearBuilt || 'N/A'}`);
      console.log(`  Property Type: ${prop.propertyType || prop.homeType || 'N/A'}`);
      console.log(`  County: ${prop.county || 'N/A'}`);
    } else {
      console.warn("⚠️ No property data found in response");
      console.log("Response structure doesn't match expected format.");
      console.log("You may need to adjust the field mappings in valuation.routes.ts");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  }
}

testPropertyLookup();
