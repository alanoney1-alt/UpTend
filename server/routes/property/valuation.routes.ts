import type { Express } from "express";

const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY || "";
const RENTCAST_BASE = "https://api.rentcast.io/v1";

// Simple cache to avoid burning RentCast free-tier calls
const propertyCache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 min

function parseAddress(address: string): { street: string; city: string; state: string; zip: string } {
  const parts = address.split(",").map(s => s.trim());
  const street = parts[0] || "";
  const city = parts[1] || "";
  const stateZip = parts[2] || parts[1] || "";
  const stateMatch = stateZip.match(/([A-Z]{2})\s*(\d{5})?/i);
  return {
    street,
    city: parts.length >= 3 ? city : "",
    state: stateMatch?.[1]?.toUpperCase() || "FL",
    zip: stateMatch?.[2] || "",
  };
}

/**
 * Property Valuation Routes
 * Uses RentCast API for real property data, with Census fallback
 */
export function registerPropertyValuationRoutes(app: Express) {
  app.get("/api/property/zillow", async (req, res) => {
    try {
      const address = req.query.address as string;
      if (!address || address.trim().length < 5) {
        return res.status(400).json({ error: "Address is required" });
      }

      // Check cache first
      const cacheKey = address.toLowerCase().trim();
      const cached = propertyCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return res.json(cached.data);
      }

      // === Try RentCast API first ===
      if (RENTCAST_API_KEY) {
        try {
          const parsed = parseAddress(address);
          const params = new URLSearchParams({ address: parsed.street });
          if (parsed.city) params.set("city", parsed.city);
          if (parsed.state) params.set("state", parsed.state);
          if (parsed.zip) params.set("zipCode", parsed.zip);

          console.log(`[Property] Calling RentCast API for: ${address}`);
          const rcRes = await fetch(`${RENTCAST_BASE}/properties?${params.toString()}`, {
            headers: { "X-Api-Key": RENTCAST_API_KEY, Accept: "application/json" },
          });

          if (rcRes.ok) {
            const rcData = await rcRes.json();
            const prop = Array.isArray(rcData) ? rcData[0] : rcData;

            if (prop && (prop.bedrooms || prop.squareFootage || prop.yearBuilt)) {
              console.log(`[Property] RentCast found: ${prop.formattedAddress || address} - ${prop.bedrooms}bd/${prop.bathrooms}ba, ${prop.squareFootage}sqft, built ${prop.yearBuilt}`);
              
              const result = {
                found: true,
                property: {
                  zpid: prop.id || null,
                  address: prop.formattedAddress || address,
                  zestimate: null, // No home values per Alan's directive
                  rentZestimate: null,
                  bedrooms: prop.bedrooms || null,
                  bathrooms: prop.bathrooms || null,
                  livingArea: prop.squareFootage || null,
                  lotAreaValue: prop.lotSize || null,
                  lotAreaUnit: "sqft",
                  yearBuilt: prop.yearBuilt || null,
                  homeType: prop.propertyType || "SINGLE_FAMILY",
                  homeStatus: null,
                  imgSrc: null,
                  latitude: prop.latitude || null,
                  longitude: prop.longitude || null,
                  source: "rentcast",
                  county: prop.county || null,
                  state: prop.state || null,
                  // Extra fields from RentCast
                  roofType: prop.features?.roofType || null,
                  exteriorType: prop.features?.exteriorType || null,
                  cooling: prop.features?.coolingType || (prop.features?.cooling ? "Central" : null),
                  heating: prop.features?.heatingType || (prop.features?.heating ? "Central" : null),
                  pool: prop.features?.pool || false,
                  garage: prop.features?.garage || false,
                  garageType: prop.features?.garageType || null,
                  stories: prop.features?.floorCount || null,
                  lastSaleDate: prop.lastSaleDate || null,
                  lastSalePrice: prop.lastSalePrice || null,
                },
              };
              propertyCache.set(cacheKey, { data: result, ts: Date.now() });
              return res.json(result);
            }
          } else {
            console.error(`[Property] RentCast API error: ${rcRes.status}`);
          }
        } catch (rcErr: any) {
          console.error("[Property] RentCast error, falling back:", rcErr.message);
        }
      }

      // === Fallback: Try RapidAPI Zillow if configured ===
      const rapidApiKey = process.env.RAPIDAPI_KEY;
      if (rapidApiKey) {
        try {
          // Your Home Value Estimator API endpoint
          const searchUrl = `https://your-home-value-estimator.p.rapidapi.com/search`;
          const searchParams = new URLSearchParams({
            query: address,
          });

          console.log(`[Property] Calling Your Home Value Estimator API: ${searchUrl}?${searchParams}`);

          const homeListingRes = await fetch(`${searchUrl}?${searchParams}`, {
            headers: {
              'x-rapidapi-key': rapidApiKey,
              'x-rapidapi-host': 'your-home-value-estimator.p.rapidapi.com'
            }
          });

          console.log(`[Property] Your Home Value Estimator API response status: ${homeListingRes.status}`);

          if (homeListingRes.ok) {
            const searchData = await homeListingRes.json();
            console.log(`[Property] Search API response:`, JSON.stringify(searchData, null, 2));

            // Step 1: Extract ZPID from search results - only use exact address matches
            if (searchData.success && searchData.results && searchData.results.length > 0) {
              // Only use results that are actual addresses (not regions/cities/zips)
              const addressResult = searchData.results.find((r: any) => 
                r.metaData?.zpid && r.resultType !== "Region"
              );
              const result = addressResult || searchData.results[0];
              const zpid = result.metaData?.zpid;

              if (!zpid) {
                console.log(`[Property] ⚠️ No ZPID found in search results (resultType: ${result.resultType})`);
              } else {
                console.log(`[Property] ✅ Found ZPID: ${zpid}, fetching property details...`);

                // Step 2: Get property details and zestimate in parallel
                const [propertyRes, zestimateRes] = await Promise.all([
                  fetch(`https://your-home-value-estimator.p.rapidapi.com/get-property?zpid=${zpid}`, {
                    headers: {
                      'x-rapidapi-key': rapidApiKey,
                      'x-rapidapi-host': 'your-home-value-estimator.p.rapidapi.com'
                    }
                  }),
                  fetch(`https://your-home-value-estimator.p.rapidapi.com/zestimate?zpid=${zpid}&includeRentZestimate=true&includeZpid=true`, {
                    headers: {
                      'x-rapidapi-key': rapidApiKey,
                      'x-rapidapi-host': 'your-home-value-estimator.p.rapidapi.com'
                    }
                  })
                ]);

                const propertyData = propertyRes.ok ? await propertyRes.json() : null;
                const zestimateData = zestimateRes.ok ? await zestimateRes.json() : null;

                console.log(`[Property] Property details:`, JSON.stringify(propertyData, null, 2));
                console.log(`[Property] Zestimate data:`, JSON.stringify(zestimateData, null, 2));

                // Extract property from nested structure
                const prop = propertyData?.property || {};
                const zest = zestimateData || {};
                const meta = result.metaData || {};

                // Use price from property data if zestimate unavailable
                const homeValue = zest.zestimate || prop.price || null;
                const rentValue = zest.rentZestimate || prop.rentZestimate || null;

                console.log(`[Property] ✅ Using Your Home Value Estimator data for: ${address}`);
                console.log(`[Property] Parsed values - Price: ${homeValue || 'N/A'}, Beds: ${prop.bedrooms || 'N/A'}, Baths: ${prop.bathrooms || 'N/A'}, Year: ${prop.yearBuilt || 'N/A'}`);

                return res.json({
                  found: true,
                  property: {
                    zpid: zpid,
                    address: result.display || address,
                    zestimate: homeValue,
                    rentZestimate: rentValue,
                    bedrooms: prop.bedrooms || null,
                    bathrooms: prop.bathrooms || null,
                    livingArea: prop.livingArea || null,
                    lotAreaValue: prop.lotAreaValue || null,
                    lotAreaUnit: prop.lotAreaUnit || "sqft",
                    yearBuilt: prop.yearBuilt || null,
                    homeType: prop.homeType || "SINGLE_FAMILY",
                    homeStatus: prop.homeStatus || null,
                    imgSrc: prop.imgSrc || prop.hiResImageLink || null,
                    latitude: meta.lat || null,
                    longitude: meta.lng || null,
                    source: "your_home_value_estimator",
                    county: prop.county || null,
                    state: meta.state || null,
                  },
                });
              }
            }
          }
        } catch (apiErr: any) {
          console.error("[Property] ❌ Your Home Value Estimator API error, falling back to Census:", apiErr.message);
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

            console.log(`[Property] ⚠️ Using Census fallback for: ${address}`);
            console.log(`[Property] County: ${countyName}, address matched: ${match.matchedAddress}`);

            // Census only gives us location - we don't have real property details
            // Return what we know honestly and let the frontend handle editable fields
            return res.json({
              found: true,
              property: {
                zpid: null,
                address: match.matchedAddress || address,
                zestimate: null,
                rentZestimate: null,
                bedrooms: null,
                bathrooms: null,
                livingArea: null,
                lotAreaValue: null,
                lotAreaUnit: null,
                yearBuilt: null,
                homeType: null,
                homeStatus: null,
                imgSrc: null,
                latitude: match.coordinates?.y || null,
                longitude: match.coordinates?.x || null,
                source: "census_geocode",
                county: countyName,
                state: state,
                editable: true,
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
