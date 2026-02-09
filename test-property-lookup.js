/**
 * Test script for Home Listing US API
 * Usage: node test-property-lookup.js
 */

import dotenv from 'dotenv';
dotenv.config();

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
    // Test Your Home Value Estimator API
    const searchUrl = `https://your-home-value-estimator.p.rapidapi.com/search`;
    const searchParams = new URLSearchParams({
      query: testAddress,
    });

    console.log("🔍 Calling Your Home Value Estimator API...");
    console.log(`URL: ${searchUrl}?${searchParams}`);
    console.log("");

    const response = await fetch(`${searchUrl}?${searchParams}`, {
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'your-home-value-estimator.p.rapidapi.com'
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

    const searchData = await response.json();
    console.log("✅ Search API Response:");
    console.log(JSON.stringify(searchData, null, 2));
    console.log("");

    // Step 1: Extract ZPID
    if (searchData.success && searchData.results && searchData.results.length > 0) {
      const result = searchData.results[0];
      const zpid = result.metaData?.zpid;

      console.log(`📍 Found ZPID: ${zpid}`);
      console.log(`📍 Address: ${result.display}`);
      console.log("");

      if (zpid) {
        // Step 2: Get property details
        console.log("🔍 Fetching property details...");
        const propertyRes = await fetch(`https://your-home-value-estimator.p.rapidapi.com/get-property?zpid=${zpid}`, {
          headers: {
            'x-rapidapi-key': rapidApiKey,
            'x-rapidapi-host': 'your-home-value-estimator.p.rapidapi.com'
          }
        });

        const propertyData = await propertyRes.json();
        console.log("✅ Property Details:");
        console.log(JSON.stringify(propertyData, null, 2));
        console.log("");

        // Step 3: Get zestimate
        console.log("🔍 Fetching zestimate...");
        const zestimateRes = await fetch(`https://your-home-value-estimator.p.rapidapi.com/zestimate?zpid=${zpid}&includeRentZestimate=true&includeZpid=true`, {
          headers: {
            'x-rapidapi-key': rapidApiKey,
            'x-rapidapi-host': 'your-home-value-estimator.p.rapidapi.com'
          }
        });

        const zestimateData = await zestimateRes.json();
        console.log("✅ Zestimate Data:");
        console.log(JSON.stringify(zestimateData, null, 2));
        console.log("");

        // Display combined results
        const prop = propertyData.property || {};
        const homeValue = zestimateData.zestimate || prop.price;
        const rentValue = zestimateData.rentZestimate || prop.rentZestimate;

        console.log("📊 Final Property Data:");
        console.log(`  Address: ${result.display}`);
        console.log(`  ZPID: ${zpid}`);
        console.log(`  Home Value: $${homeValue?.toLocaleString() || 'N/A'}`);
        console.log(`  Rent Estimate: $${rentValue?.toLocaleString() || 'N/A'}/mo`);
        console.log(`  Bedrooms: ${prop.bedrooms || 'N/A'}`);
        console.log(`  Bathrooms: ${prop.bathrooms || 'N/A'}`);
        console.log(`  Living Area: ${prop.livingArea?.toLocaleString() || 'N/A'} sqft`);
        console.log(`  Year Built: ${prop.yearBuilt || 'N/A'}`);
        console.log(`  Property Type: ${prop.homeType || 'N/A'}`);
        console.log(`  Home Status: ${prop.homeStatus || 'N/A'}`);
        console.log(`  Coordinates: ${result.metaData.lat}, ${result.metaData.lng}`);
      }
    } else {
      console.warn("⚠️ No results found for this address");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  }
}

testPropertyLookup();
