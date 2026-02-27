/**
 * Equipment Checklist Generator
 * Generates service-specific equipment and supply checklists based on
 * AI scope analysis for Snap & Book pro preparation.
 */

const BASE_CHECKLISTS: Record<string, string[]> = {
  gutter_cleaning: [
    "Extension ladder (minimum 24ft for single story)",
    "Gutter scoop/trowel",
    "Leaf blower",
    "5-gallon bucket with hook",
    "Trash bags (heavy duty)",
    "Garden hose with spray nozzle for flush test",
    "Work gloves (waterproof)",
    "Safety glasses",
    "Tarp for ground debris collection",
  ],
  junk_removal: [
    "Work gloves (heavy duty)",
    "Dolly/hand truck",
    "Moving blankets",
    "Tarps for truck bed",
    "Ratchet straps",
    "Broom and dustpan for cleanup",
    "Trash bags (contractor grade)",
    "PPE: dust mask, steel-toe boots",
  ],
  home_cleaning: [
    "Vacuum cleaner with attachments",
    "Mop and bucket",
    "Microfiber cloths (pack of 10+)",
    "All-purpose cleaner",
    "Glass cleaner",
    "Bathroom disinfectant",
    "Toilet brush",
    "Duster with extension pole",
    "Trash bags",
    "Rubber gloves",
    "Scrub brushes",
  ],
  carpet_cleaning: [
    "Carpet extractor/steam cleaner",
    "Pre-treatment spray",
    "Spot treatment solution",
    "Carpet rake/groomer",
    "Corner and edge tool",
    "Furniture sliders/protectors",
    "Fan for drying",
    "Clean water supply (5+ gallons per room)",
    "Wet/dry vacuum for extraction",
  ],
  pressure_washing: [
    "Pressure washer (minimum 2500 PSI)",
    "Surface cleaner attachment (for flat surfaces)",
    "Detergent/degreaser (biodegradable)",
    "Safety goggles",
    "Waterproof boots",
    "Extension wand (12ft)",
    "Multiple nozzle tips (15-degree, 25-degree, 40-degree)",
    "Garden hose (minimum 50ft for water supply)",
    "Tarps for plant/fixture protection",
  ],
  landscaping: [
    "Commercial mower",
    "String trimmer/weed eater",
    "Edger",
    "Leaf blower",
    "Hedge trimmers",
    "Pruning shears",
    "Rake (leaf and garden)",
    "Wheelbarrow",
    "Trash bags (lawn and leaf)",
    "Work gloves",
    "Safety glasses",
    "Ear protection",
  ],
  pool_cleaning: [
    "Telescoping pole (minimum 16ft)",
    "Skimmer net",
    "Pool brush (wall and floor)",
    "Vacuum head and hose",
    "Water test kit (pH, chlorine, alkalinity)",
    "Chlorine/shock treatment",
    "pH adjuster (up and down)",
    "Algaecide",
    "Filter cleaner",
    "Leaf rake (deep bag)",
    "O-ring lubricant",
  ],
  handyman: [
    "Basic tool kit (hammer, screwdrivers, pliers, adjustable wrench)",
    "Cordless drill/driver with bit set",
    "Tape measure",
    "Level",
    "Utility knife",
    "Stud finder",
    "Electrical tester (non-contact voltage detector)",
    "Plumber's tape and basic plumbing fittings",
    "Assorted screws, nails, anchors",
    "Caulk gun and silicone caulk",
    "Flashlight/headlamp",
    "Drop cloth",
  ],
  moving_labor: [
    "Furniture dolly",
    "Appliance dolly (if large items noted)",
    "Moving blankets (minimum 12)",
    "Stretch wrap",
    "Ratchet straps",
    "Furniture sliders",
    "Tool kit (for furniture disassembly)",
    "Work gloves",
    "Floor runners/protection",
    "Tape and markers for labeling",
  ],
  garage_cleanout: [
    "Heavy-duty trash bags (contractor grade)",
    "Broom and dustpan",
    "Shop vacuum",
    "Dolly/hand truck",
    "Sorting bins/tarps (keep, donate, trash)",
    "Work gloves",
    "Dust mask/respirator",
    "Shelving/organization supplies if requested",
    "Ratchet straps for hauling",
    "PPE: safety glasses, steel-toe boots",
  ],
  light_demolition: [
    "Sledgehammer (8lb and 16lb)",
    "Pry bar/crowbar",
    "Reciprocating saw with demolition blades",
    "Heavy-duty trash bags",
    "Wheelbarrow or debris cart",
    "Dust mask/respirator (N95 minimum)",
    "Safety goggles",
    "Hard hat",
    "Steel-toe boots",
    "Work gloves (cut-resistant)",
    "Tarps and plastic sheeting for containment",
    "Shop vacuum for dust cleanup",
  ],
  home_consultation: [
    "Tablet or clipboard for notes",
    "Measuring tape (25ft)",
    "Moisture meter",
    "Infrared thermometer",
    "Camera/phone for documentation",
    "Flashlight",
    "Level",
    "Inspection mirror",
    "PPE: shoe covers, gloves",
    "Report templates/forms",
  ],
};

/**
 * Context-aware additions based on AI analysis keywords.
 */
const CONTEXTUAL_ADDITIONS: Record<string, Array<{ keywords: string[]; items: string[] }>> = {
  gutter_cleaning: [
    { keywords: ["2-story", "two story", "second floor", "2 story"], items: ["Safety harness and roof anchor", "32ft extension ladder or taller"] },
    { keywords: ["3-story", "three story", "3 story"], items: ["Safety harness and roof anchor (required)", "40ft extension ladder", "Rope and pulley system for debris lowering"] },
    { keywords: ["heavy debris", "clogged", "packed"], items: ["Extra contractor bags (10+)", "Pressure nozzle attachment for stubborn clogs"] },
    { keywords: ["guard", "screen", "mesh"], items: ["Gutter guard removal tool", "Replacement clips if guards are brittle"] },
  ],
  junk_removal: [
    { keywords: ["full", "large", "a lot", "entire"], items: ["Full-size truck or trailer", "Extra tarps for multiple loads"] },
    { keywords: ["half", "medium", "moderate"], items: ["Pickup truck or small trailer"] },
    { keywords: ["heavy", "appliance", "fridge", "washer", "piano", "safe"], items: ["Appliance dolly", "Furniture straps rated for 800+ lbs", "Second crew member recommended"] },
    { keywords: ["electronics", "tv", "computer", "ewaste"], items: ["E-waste recycling plan (do not landfill)", "Anti-static handling gloves"] },
    { keywords: ["yard", "outdoor", "branches", "tree"], items: ["Chainsaw or pruning saw for large branches", "Yard waste bags"] },
  ],
  pressure_washing: [
    { keywords: ["house", "siding", "exterior"], items: ["Soft wash system for delicate siding", "Extension wand (18ft+ for 2-story)", "House wash detergent"] },
    { keywords: ["driveway", "concrete", "patio", "garage floor"], items: ["Surface cleaner attachment (required for flat work)", "Concrete degreaser"] },
    { keywords: ["deck", "wood", "fence"], items: ["Wood brightener/restorer", "Low-pressure tip (40-degree) to prevent wood damage"] },
    { keywords: ["2-story", "two story", "tall"], items: ["18ft+ extension wand", "Telescoping wand adapter"] },
    { keywords: ["mold", "mildew", "algae", "green"], items: ["Sodium hypochlorite solution", "Pump sprayer for pre-treatment"] },
  ],
  landscaping: [
    { keywords: ["overgrown", "cleanup", "neglected"], items: ["Chainsaw for thick growth", "Extra yard waste bags (20+)", "Heavy-duty brush cutter"] },
    { keywords: ["tree", "branch", "trim"], items: ["Pole saw", "Chainsaw", "Chipper/shredder if available"] },
    { keywords: ["mulch", "bed", "flower"], items: ["Garden fork and spade", "Wheelbarrow for mulch spreading", "Landscape fabric"] },
    { keywords: ["irrigation", "sprinkler"], items: ["Sprinkler head wrench", "PVC cutter and fittings", "Teflon tape"] },
  ],
  pool_cleaning: [
    { keywords: ["green", "algae", "neglect", "swamp"], items: ["Triple shock treatment supply", "Extra algaecide (double dose)", "Clarifier", "Submersible pump if water replacement needed"] },
    { keywords: ["filter", "cartridge", "DE"], items: ["Replacement filter cartridge or DE powder", "Filter cleaning solution"] },
    { keywords: ["equipment", "pump", "motor"], items: ["Multimeter for electrical testing", "Replacement pump seal kit", "Lubricant for o-rings"] },
  ],
  handyman: [
    { keywords: ["plumbing", "leak", "faucet", "pipe", "drain"], items: ["Pipe wrench", "Basin wrench", "Plumber's putty", "Replacement supply lines", "Drain snake"] },
    { keywords: ["electrical", "outlet", "switch", "light", "fixture"], items: ["Wire strippers", "Wire nuts assortment", "Electrical tape", "Replacement outlets/switches"] },
    { keywords: ["drywall", "hole", "patch", "wall"], items: ["Drywall patch kit", "Joint compound", "Sanding block", "Putty knife set", "Primer and paint"] },
    { keywords: ["door", "hinge", "lock", "knob"], items: ["Chisel set", "Replacement hinges and screws", "Door shim set", "Deadbolt/knob replacement if needed"] },
    { keywords: ["paint", "touch up", "wall"], items: ["Paint roller and tray", "Painter's tape", "Drop cloths", "Paint brushes (2-inch and 4-inch)"] },
    { keywords: ["shelf", "mount", "hang", "tv", "bracket"], items: ["Stud finder", "Toggle bolts for hollow walls", "Mounting hardware", "Level (48-inch)"] },
  ],
  carpet_cleaning: [
    { keywords: ["pet", "urine", "animal", "dog", "cat"], items: ["Enzyme-based pet odor treatment", "UV blacklight for stain detection", "Extra pre-treatment solution"] },
    { keywords: ["deep", "stain", "heavy traffic", "commercial"], items: ["Rotary extraction tool", "Heavy-duty pre-spray", "Extra passes planned"] },
    { keywords: ["stairs", "staircase"], items: ["Stair tool attachment", "Hand sprayer for edges"] },
  ],
  moving_labor: [
    { keywords: ["piano", "gun safe", "pool table"], items: ["Piano board/skid", "Heavy-duty straps rated 1000+ lbs", "4-person crew minimum"] },
    { keywords: ["stairs", "second floor", "upstairs", "walk-up"], items: ["Stair climbing dolly", "Extra moving blankets for wall protection", "Floor runners for stairs"] },
    { keywords: ["disassemble", "bed", "furniture"], items: ["Allen key set", "Socket wrench set", "Ziplock bags for hardware", "Labeling tape"] },
  ],
  garage_cleanout: [
    { keywords: ["3-car", "large", "packed", "full"], items: ["Full-size trailer or dumpster rental", "Extended crew time (4+ hours)"] },
    { keywords: ["hazardous", "paint", "chemical", "oil"], items: ["Hazmat disposal plan (separate from regular waste)", "Chemical-resistant gloves", "Containment bins"] },
  ],
  light_demolition: [
    { keywords: ["tile", "floor", "ceramic"], items: ["Floor scraper (long-handle)", "Tile chisel set", "Knee pads"] },
    { keywords: ["wall", "drywall", "partition"], items: ["Drywall saw", "Stud finder", "Utility knife for scoring"] },
    { keywords: ["deck", "wood", "fence"], items: ["Circular saw", "Cat's paw nail puller", "Sawzall with wood blades"] },
    { keywords: ["concrete", "block", "masonry"], items: ["Rotary hammer drill", "Masonry chisel set", "Concrete saw or grinder"] },
    { keywords: ["asbestos", "old", "pre-1980"], items: ["WARNING: Potential asbestos - professional abatement assessment required before demolition", "N100 respirator minimum", "Disposable coveralls"] },
  ],
};

export function generateEquipmentChecklist(serviceType: string, analysis: string): string[] {
  const base = BASE_CHECKLISTS[serviceType] || BASE_CHECKLISTS["handyman"];
  const checklist = [...base];

  const contextRules = CONTEXTUAL_ADDITIONS[serviceType];
  if (contextRules && analysis) {
    const lowerAnalysis = analysis.toLowerCase();
    for (const rule of contextRules) {
      if (rule.keywords.some(kw => lowerAnalysis.includes(kw))) {
        for (const item of rule.items) {
          if (!checklist.includes(item)) {
            checklist.push(item);
          }
        }
      }
    }
  }

  return checklist;
}
