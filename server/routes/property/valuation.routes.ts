import type { Express } from "express";

/**
 * Property Valuation Routes
 * Uses Realty Mole API for accurate property data, with Census fallback
 */
export function registerPropertyValuationRoutes(app: Express) {
  app.get("/api/property/zillow", async (req, res) => {
    try {
      const address = req.query.address as string;
      if (!address || address.trim().length < 5) {
        return res.status(400).json({ error: "Address is required" });
      }

      // === Try Home Listing US API first (if configured) ===
      const rapidApiKey = process.env.RAPIDAPI_KEY;
      if (rapidApiKey) {
        try {
          // Home Listing US API endpoint
          const searchUrl = `https://home-listing-us.p.rapidapi.com/property`;
          const searchParams = new URLSearchParams({
            address: address,
          });

          console.log(`[Property] Calling Home Listing US API: ${searchUrl}?${searchParams}`);

          const homeListingRes = await fetch(`${searchUrl}?${searchParams}`, {
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': 'home-listing-us.p.rapidapi.com'
            }
          });

          console.log(`[Property] Home Listing US API response status: ${homeListingRes.status}`);

          if (homeListingRes.ok) {
            const data = await homeListingRes.json();
            console.log(`[Property] Home Listing US API full response:`, JSON.stringify(data, null, 2));

            // Home Listing US returns property data directly
            if (data && (data.property || data.address)) {
              const prop = data.property || data;

              console.log(`[Property] ✅ Using Home Listing US data for: ${address}`);
              console.log(`[Property] Parsed values - Price: ${prop.price || prop.estimatedValue || prop.zestimate}, Beds: ${prop.bedrooms || prop.beds}, Baths: ${prop.bathrooms || prop.baths}, SqFt: ${prop.livingArea || prop.squareFeet || prop.sqft}`);

              return res.json({
                found: true,
                property: {
                  zpid: prop.zpid || prop.propertyId || null,
                  address: prop.address || prop.fullAddress || address,
                  zestimate: prop.price || prop.estimatedValue || prop.zestimate || null,
                  rentZestimate: prop.rentEstimate || prop.rentalValue || null,
                  bedrooms: prop.bedrooms || prop.beds || null,
                  bathrooms: prop.bathrooms || prop.baths || null,
                  livingArea: prop.livingArea || prop.squareFeet || prop.sqft || null,
                  lotAreaValue: prop.lotSize || prop.lotSqft || null,
                  lotAreaUnit: "sqft",
                  yearBuilt: prop.yearBuilt || null,
                  homeType: prop.propertyType || prop.homeType || "SINGLE_FAMILY",
                  homeStatus: prop.status || prop.homeStatus || null,
                  imgSrc: prop.image || prop.imageUrl || prop.photo || null,
                  latitude: prop.latitude || prop.lat || null,
                  longitude: prop.longitude || prop.lng || prop.lon || null,
                  source: "home_listing_us",
                  county: prop.county || null,
                  state: prop.state || null,
                },
              });
            }
          }
        } catch (apiErr: any) {
          console.error("[Property] ❌ Home Listing US API error, falling back to Census:", apiErr.message);
          console.error("[Property] API Error details:", apiErr);
        }
      } else {
        console.warn("[Property] ⚠️ RAPIDAPI_KEY not configured in .env file - using Census fallback with estimated values");
      }

      // === FALLBACK: Census Bureau geocoder for property estimation ===
      // This is a FREE public API that provides location data
      try {
        const censusParams = new URLSearchParams({
          address: address,
          benchmark: "Public_AR_Current",
          vintage: "Current_Current",
          format: "json",
        });
        const censusRes = await fetch(
          `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?${censusParams}`
        );
        if (censusRes.ok) {
          const censusData = await censusRes.json();
          const match = censusData?.result?.addressMatches?.[0];
          if (match) {
            const geographies = match.geographies;
            const tract = geographies?.["Census Tracts"]?.[0];
            const county = geographies?.["Counties"]?.[0];
            const state = match.addressComponents?.state || "";
            const zip = match.addressComponents?.zip || "";
            const countyName = county?.NAME || "";

            // Florida county median home values (2024 estimates)
            const FL_COUNTY_MEDIANS: Record<string, number> = {
              "Orange": 380000, "Seminole": 395000, "Osceola": 340000,
              "Lake": 340000, "Volusia": 315000, "Brevard": 330000,
              "Polk": 290000, "Hillsborough": 370000, "Pinellas": 350000,
              "Pasco": 310000, "Manatee": 400000, "Sarasota": 450000,
              "Lee": 370000, "Collier": 550000, "Palm Beach": 470000,
              "Broward": 420000, "Miami-Dade": 490000, "Duval": 290000,
              "St. Johns": 430000, "Clay": 310000, "Alachua": 290000,
              "Leon": 265000, "Escambing": 245000, "Santa Rosa": 340000,
              "Bay": 310000, "Okaloosa": 380000, "Walton": 520000,
              "Marion": 260000, "Sumter": 320000, "Hernando": 295000,
              "Citrus": 270000, "Charlotte": 320000, "St. Lucie": 340000,
              "Martin": 430000, "Indian River": 360000, "Flagler": 340000,
            };

            let estimatedValue = 350000;
            const matchedCounty = Object.keys(FL_COUNTY_MEDIANS).find(
              (c) => countyName.toLowerCase().includes(c.toLowerCase())
            );
            if (matchedCounty) {
              estimatedValue = FL_COUNTY_MEDIANS[matchedCounty];
            }

            // ZIP code adjustments for high-value areas
            const zipNum = parseInt(zip, 10);
            if (zipNum >= 32800 && zipNum <= 32899) estimatedValue *= 1.05; // Winter Park area
            if (zipNum >= 33100 && zipNum <= 33199) estimatedValue *= 1.15; // Miami Beach
            if (zipNum >= 34200 && zipNum <= 34299) estimatedValue *= 1.10; // Sarasota waterfront

            estimatedValue = Math.round(estimatedValue / 1000) * 1000;

            const rentEstimate = Math.round(estimatedValue * 0.006);

            console.log(`[Property] ⚠️ Using Census fallback for: ${address}`);
            console.log(`[Property] County: ${countyName}, Estimated Value: $${estimatedValue}, Beds/Baths: 3/2 (generic), SqFt: ${Math.round(estimatedValue / 220)} (estimated)`);

            return res.json({
              found: true,
              property: {
                zpid: null,
                address: match.matchedAddress || address,
                zestimate: estimatedValue,
                rentZestimate: rentEstimate,
                bedrooms: 3,
                bathrooms: 2,
                livingArea: Math.round(estimatedValue / 220),
                lotAreaValue: null,
                lotAreaUnit: null,
                yearBuilt: null,
                homeType: "SINGLE_FAMILY",
                homeStatus: null,
                imgSrc: null,
                latitude: match.coordinates?.y || null,
                longitude: match.coordinates?.x || null,
                source: "census_estimate",
                county: countyName,
                state: state,
              },
            });
          }
        }
      } catch (censusErr) {
        console.log("[Property] Census fallback error:", censusErr);
      }

      return res.json({ found: false, message: "No property found at this address" });
    } catch (error) {
      console.error("[Property] Error:", error);
      res.status(500).json({ error: "Property valuation lookup failed" });
    }
  });
}
