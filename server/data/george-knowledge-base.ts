/**
 * George Knowledge Base -- Comprehensive Florida Homeowner Intelligence
 *
 * Sources: InterNACHI Florida Life Expectancy Chart, Florida Building Code (FBC 8th Ed),
 * HVAC.com, Angi, Remodeling Magazine Cost vs Value 2024, FPL, FEMA, FL Statutes,
 * EnergySage, Progressive, Citizens Property Insurance, and Orlando metro contractor data.
 *
 * All costs reflect Orlando metro area averages as of 2024-2025.
 * All lifespans reflect Florida-specific adjustments for heat, humidity, UV, and salt air.
 */

// ---------------------------------------------------------------------------
// HOME SYSTEM LIFESPANS (Florida-adjusted, sourced from InterNACHI FL chart)
// ---------------------------------------------------------------------------
export interface SystemLifespan {
  system: string;
  category: string;
  avgLifespanYears: { low: number; high: number };
  floridaAdjustment: string;
  failureSigns: string[];
  maintenanceTips: string[];
}

export const HOME_SYSTEM_LIFESPANS: SystemLifespan[] = [
  {
    system: "Central Air Conditioner",
    category: "HVAC",
    avgLifespanYears: { low: 10, high: 15 },
    floridaAdjustment: "Florida AC units run 8-10 months per year vs 4-6 in northern states. Expect 10-12 years with maintenance, closer to 8-10 near the coast due to salt corrosion.",
    failureSigns: [
      "Rising electric bills without usage change",
      "Uneven cooling between rooms",
      "Frequent cycling on and off",
      "Unusual noises (grinding, squealing, banging)",
      "Moisture or leaks around the unit",
      "Refrigerant leaks or ice on coils",
      "System blowing warm air"
    ],
    maintenanceTips: [
      "Change filter every 30-60 days in Florida (dust and humidity)",
      "Annual professional tune-up before summer",
      "Keep 2 feet clearance around outdoor condenser",
      "Clean condenser coils twice per year",
      "Check and clear condensate drain line monthly with vinegar"
    ]
  },
  {
    system: "Heat Pump",
    category: "HVAC",
    avgLifespanYears: { low: 10, high: 15 },
    floridaAdjustment: "Heat pumps in Florida primarily cool, so compressor wear is similar to central AC. 10-15 years typical.",
    failureSigns: [
      "Reduced heating or cooling output",
      "Ice forming on outdoor unit in cooling mode",
      "Higher than normal energy bills",
      "Strange odors from vents",
      "System not reaching set temperature"
    ],
    maintenanceTips: [
      "Same filter and coil maintenance as central AC",
      "Check reversing valve annually",
      "Keep outdoor unit clear of debris"
    ]
  },
  {
    system: "Mini-Split / Ductless",
    category: "HVAC",
    avgLifespanYears: { low: 12, high: 20 },
    floridaAdjustment: "No ductwork loss is an advantage in Florida. Units last 12-20 years with proper maintenance.",
    failureSigns: [
      "Water dripping from indoor unit",
      "Foul smell from indoor head",
      "Inconsistent temperatures",
      "Remote control unresponsive",
      "Loud operation"
    ],
    maintenanceTips: [
      "Clean indoor unit filters every 2-4 weeks",
      "Professional deep clean of indoor coils annually",
      "Check drain line for clogs monthly"
    ]
  },
  {
    system: "Furnace (Gas)",
    category: "HVAC",
    avgLifespanYears: { low: 15, high: 20 },
    floridaAdjustment: "Rarely used in Central Florida. Many homes have heat pump or electric heat strip instead. If present, long lifespan due to low usage.",
    failureSigns: [
      "Yellow or flickering burner flame (should be blue)",
      "Unusual smells when heating",
      "Cracked heat exchanger"
    ],
    maintenanceTips: [
      "Annual inspection if present",
      "Check for carbon monoxide leaks"
    ]
  },
  {
    system: "Water Heater (Tank - Electric)",
    category: "Plumbing",
    avgLifespanYears: { low: 8, high: 12 },
    floridaAdjustment: "Florida hard water and high ambient temps accelerate sediment buildup. Expect 8-10 years without anode rod replacement. Closer to 6-8 in areas with very hard water.",
    failureSigns: [
      "Rusty or discolored hot water",
      "Rumbling or popping sounds (sediment buildup)",
      "Water pooling around the base",
      "Takes longer to heat water",
      "Age over 10 years (check serial number for manufacture date)",
      "Metallic taste in hot water"
    ],
    maintenanceTips: [
      "Flush tank annually to remove sediment",
      "Check and replace anode rod every 3-5 years",
      "Set temperature to 120F (prevents scalding and saves energy)",
      "Inspect T&P relief valve annually",
      "Consider a drain pan if in living space"
    ]
  },
  {
    system: "Water Heater (Tank - Gas)",
    category: "Plumbing",
    avgLifespanYears: { low: 8, high: 12 },
    floridaAdjustment: "Same hard water issues as electric. Gas units less common in Orlando metro.",
    failureSigns: [
      "Pilot light frequently goes out",
      "Gas smell near the unit",
      "Same signs as electric tank units"
    ],
    maintenanceTips: [
      "Same as electric plus annual gas connection inspection",
      "Check flue pipe for proper venting"
    ]
  },
  {
    system: "Water Heater (Tankless)",
    category: "Plumbing",
    avgLifespanYears: { low: 15, high: 20 },
    floridaAdjustment: "Hard water scale buildup is the primary threat. Annual descaling is critical in Florida.",
    failureSigns: [
      "Fluctuating water temperature",
      "Error codes on display",
      "Reduced flow rate",
      "Scale visible on heat exchanger"
    ],
    maintenanceTips: [
      "Descale with vinegar annually (or every 6 months with hard water)",
      "Clean inlet filter screen",
      "Consider a whole-house water softener to extend life"
    ]
  },
  {
    system: "Electrical Panel",
    category: "Electrical",
    avgLifespanYears: { low: 40, high: 60 },
    floridaAdjustment: "Panels last decades. However, Federal Pacific (FPE StabLok) and Zinsco panels are safety hazards and should be replaced regardless of age. Florida humidity can corrode connections over time.",
    failureSigns: [
      "Breakers trip frequently",
      "Burning smell near panel",
      "Visible rust or corrosion",
      "Flickering lights throughout home",
      "Panel is warm to the touch",
      "Federal Pacific or Zinsco brand (replace immediately)"
    ],
    maintenanceTips: [
      "Visual inspection annually for corrosion or burn marks",
      "Test GFCI and AFCI breakers monthly",
      "Ensure panel cover is secure and no moisture intrusion"
    ]
  },
  {
    system: "Plumbing Supply Pipes (Copper)",
    category: "Plumbing",
    avgLifespanYears: { low: 50, high: 70 },
    floridaAdjustment: "Copper lasts well in Florida. However, pinhole leaks from acidic water or electrolysis can appear at 20-30 years in some areas.",
    failureSigns: [
      "Green patina or blue stains at joints",
      "Pinhole leaks",
      "Reduced water pressure",
      "Water stains on walls or ceilings"
    ],
    maintenanceTips: [
      "Monitor water pressure (40-80 psi ideal)",
      "Watch for green staining on fixtures"
    ]
  },
  {
    system: "Plumbing Supply Pipes (CPVC)",
    category: "Plumbing",
    avgLifespanYears: { low: 20, high: 25 },
    floridaAdjustment: "CPVC becomes brittle in Florida heat, especially in attics and near water heaters. Common failure point in homes built 1985-2005.",
    failureSigns: [
      "Pipes become brittle and crack when touched",
      "Yellow discoloration of pipes",
      "Leaks at fittings",
      "Cracking sound when bumped"
    ],
    maintenanceTips: [
      "Do not hang anything from CPVC pipes",
      "Avoid chemical drain cleaners",
      "Consider proactive repipe to PEX if 20+ years old"
    ]
  },
  {
    system: "Plumbing Supply Pipes (Polybutylene)",
    category: "Plumbing",
    avgLifespanYears: { low: 10, high: 15 },
    floridaAdjustment: "Known defective material. Common in FL homes built 1978-1995. Fails from the inside out due to chlorine in water. Replacement strongly recommended.",
    failureSigns: [
      "Gray flexible pipes at water heater or under sinks",
      "Unexplained leaks",
      "Water damage without visible source"
    ],
    maintenanceTips: [
      "Replace with PEX or copper. Not a matter of if, but when.",
      "Check insurance -- some carriers refuse to cover poly-b homes"
    ]
  },
  {
    system: "Plumbing Drain Pipes (Cast Iron)",
    category: "Plumbing",
    avgLifespanYears: { low: 50, high: 75 },
    floridaAdjustment: "Florida soil conditions and humidity accelerate exterior corrosion. Interior corrosion from constant use. Homes built before 1975 often have cast iron approaching end of life.",
    failureSigns: [
      "Slow drains throughout house",
      "Sewage odor",
      "Discolored water",
      "Visible rust on exposed pipes",
      "Foundation cracks near drain lines"
    ],
    maintenanceTips: [
      "Camera inspection every 5 years for homes 40+ years old",
      "Avoid chemical drain cleaners (accelerates corrosion)"
    ]
  },
  {
    system: "Roof - Asphalt Shingles",
    category: "Roofing",
    avgLifespanYears: { low: 15, high: 20 },
    floridaAdjustment: "Intense UV, heat, and hurricane-force winds shorten shingle life. 15-20 years in Central FL vs 20-30 in northern states. Architectural shingles last longer than 3-tab.",
    failureSigns: [
      "Curling or buckling shingles",
      "Missing shingles after storms",
      "Granules accumulating in gutters",
      "Visible daylight through roof boards from attic",
      "Dark streaks or moss growth",
      "Sagging roof deck",
      "Water stains on interior ceilings"
    ],
    maintenanceTips: [
      "Annual roof inspection, especially after hurricane season",
      "Trim overhanging tree branches",
      "Keep gutters clear to prevent water backup",
      "Check attic for signs of leaks after storms",
      "Address missing or damaged shingles immediately"
    ]
  },
  {
    system: "Roof - Concrete/Clay Tile",
    category: "Roofing",
    avgLifespanYears: { low: 40, high: 50 },
    floridaAdjustment: "Tiles themselves last 40-50 years but the underlayment beneath fails in 15-20 years in Florida heat. Underlayment replacement is a major expense often overlooked.",
    failureSigns: [
      "Cracked or broken tiles",
      "Leaks despite tiles looking intact (underlayment failure)",
      "Tiles sliding out of position",
      "Visible deterioration of tile edges"
    ],
    maintenanceTips: [
      "Walk inspections should be done by professionals only (tiles crack under foot)",
      "Replace cracked tiles promptly to protect underlayment",
      "Plan for underlayment replacement at 15-20 years"
    ]
  },
  {
    system: "Roof - Metal Standing Seam",
    category: "Roofing",
    avgLifespanYears: { low: 40, high: 70 },
    floridaAdjustment: "Excellent for Florida. Wind-resistant, reflects heat, long lifespan. Galvalume or aluminum recommended for coastal areas to prevent rust.",
    failureSigns: [
      "Loose or lifted panels",
      "Rust spots (steel roofs)",
      "Sealant deterioration at seams",
      "Fading or chalking of coating"
    ],
    maintenanceTips: [
      "Annual inspection of fasteners and sealants",
      "Clear debris from valleys",
      "Touch up scratches to prevent rust"
    ]
  },
  {
    system: "Roof - Flat/Built-Up (TPO/Modified Bitumen)",
    category: "Roofing",
    avgLifespanYears: { low: 10, high: 20 },
    floridaAdjustment: "Florida sun and heat degrade flat roof membranes faster. TPO 15-20 years, modified bitumen 10-15 years.",
    failureSigns: [
      "Ponding water after rain",
      "Blistering or bubbling membrane",
      "Seam separation",
      "Interior water stains below flat roof area"
    ],
    maintenanceTips: [
      "Inspect twice yearly and after every storm",
      "Keep drains and scuppers clear",
      "Apply reflective coating to extend life"
    ]
  },
  {
    system: "Pool Pump",
    category: "Pool",
    avgLifespanYears: { low: 8, high: 12 },
    floridaAdjustment: "Year-round pool use in Florida means pumps run more hours. Variable-speed pumps last longer and use 70% less energy.",
    failureSigns: [
      "Loud grinding or screeching noises",
      "Pump losing prime frequently",
      "Visible leaks from pump housing",
      "Motor is hot to the touch",
      "Reduced water flow to pool"
    ],
    maintenanceTips: [
      "Clean pump basket weekly",
      "Check for air leaks at pump lid O-ring",
      "Run pump 8-12 hours daily (variable speed at low RPM is ideal)"
    ]
  },
  {
    system: "Pool Heater (Gas)",
    category: "Pool",
    avgLifespanYears: { low: 5, high: 10 },
    floridaAdjustment: "Less usage needed in FL (warm climate) extends life slightly. But humidity and outdoor exposure accelerate corrosion.",
    failureSigns: [
      "Pool not reaching set temperature",
      "Soot or black residue on top",
      "Error codes on display",
      "Unusual smell during operation"
    ],
    maintenanceTips: [
      "Annual professional service",
      "Keep area around heater clear of debris",
      "Check for proper ventilation"
    ]
  },
  {
    system: "Pool Heater (Heat Pump)",
    category: "Pool",
    avgLifespanYears: { low: 10, high: 15 },
    floridaAdjustment: "Ideal for Florida climate. Works efficiently when air temp is above 50F, which is most of the year.",
    failureSigns: [
      "Reduced heating efficiency",
      "Fan not running",
      "Ice on coils in cool weather (normal briefly, not prolonged)",
      "Refrigerant leaks"
    ],
    maintenanceTips: [
      "Keep coils clean",
      "Ensure good airflow around unit",
      "Annual professional check"
    ]
  },
  {
    system: "Salt Chlorinator (Pool)",
    category: "Pool",
    avgLifespanYears: { low: 3, high: 7 },
    floridaAdjustment: "Salt cells degrade with use. 3-5 year cell life is typical. Control board lasts longer (7-10 years).",
    failureSigns: [
      "Low chlorine readings despite cell running",
      "Calcium buildup on cell plates",
      "Error lights on control unit",
      "Cell inspection light on"
    ],
    maintenanceTips: [
      "Inspect and clean cell every 3 months with muriatic acid solution",
      "Maintain proper salt level (2700-3400 ppm)",
      "Check pH regularly (salt systems tend to raise pH)"
    ]
  },
  {
    system: "Pool Surface (Plaster)",
    category: "Pool",
    avgLifespanYears: { low: 7, high: 12 },
    floridaAdjustment: "Florida water chemistry and year-round use mean replastering every 7-12 years. Pebble finishes last 15-20 years.",
    failureSigns: [
      "Rough texture (etching)",
      "Staining that won't brush away",
      "Plaster chipping or delaminating",
      "Visible aggregate or base beneath plaster"
    ],
    maintenanceTips: [
      "Maintain balanced water chemistry (especially calcium hardness and pH)",
      "Brush pool walls weekly",
      "Address stains early"
    ]
  },
  {
    system: "Garage Door Opener",
    category: "Exterior",
    avgLifespanYears: { low: 10, high: 15 },
    floridaAdjustment: "Humidity can affect electronics. Belt-drive openers last longer than chain-drive in Florida.",
    failureSigns: [
      "Slow or inconsistent operation",
      "Excessive noise",
      "Door reverses unexpectedly",
      "Remote range decreasing",
      "Safety sensors misaligned"
    ],
    maintenanceTips: [
      "Lubricate chain/belt and rollers every 6 months",
      "Test auto-reverse safety feature monthly",
      "Replace batteries in remotes annually"
    ]
  },
  {
    system: "Smoke Detectors",
    category: "Safety",
    avgLifespanYears: { low: 8, high: 10 },
    floridaAdjustment: "Humidity can cause false alarms. Replace units every 10 years regardless of battery status.",
    failureSigns: [
      "Frequent false alarms",
      "Yellow discoloration (age indicator)",
      "Chirping that persists after battery replacement",
      "Unit older than 10 years"
    ],
    maintenanceTips: [
      "Test monthly by pressing test button",
      "Replace batteries every 6 months (or use 10-year sealed lithium)",
      "Vacuum dust from sensor annually",
      "Replace entire unit every 10 years"
    ]
  },
  {
    system: "Carbon Monoxide Detectors",
    category: "Safety",
    avgLifespanYears: { low: 5, high: 7 },
    floridaAdjustment: "Required in homes with gas appliances or attached garages. Shorter lifespan than smoke detectors.",
    failureSigns: [
      "End-of-life chirp pattern (different from low battery)",
      "Unit older than 7 years",
      "Display not functioning"
    ],
    maintenanceTips: [
      "Test monthly",
      "Replace every 5-7 years per manufacturer guidelines",
      "Install near sleeping areas and on every level"
    ]
  },
  {
    system: "Dishwasher",
    category: "Appliances",
    avgLifespanYears: { low: 9, high: 13 },
    floridaAdjustment: "Hard water accelerates wear on seals and heating elements.",
    failureSigns: [
      "Dishes not getting clean",
      "Water not draining",
      "Leaking from door seal",
      "Unusual noises during cycle",
      "Rust inside tub"
    ],
    maintenanceTips: [
      "Clean filter monthly",
      "Run a vinegar cycle monthly to remove mineral buildup",
      "Check and clean spray arms quarterly"
    ]
  },
  {
    system: "Washing Machine",
    category: "Appliances",
    avgLifespanYears: { low: 5, high: 15 },
    floridaAdjustment: "Humidity increases mold risk in front-loaders. Leave door open between loads.",
    failureSigns: [
      "Excessive vibration during spin cycle",
      "Musty smell (mold in gasket)",
      "Leaking from bottom",
      "Not draining properly",
      "Loud banging during agitation"
    ],
    maintenanceTips: [
      "Leave door open between loads to prevent mold",
      "Clean gasket (front-loader) monthly",
      "Replace rubber supply hoses every 5 years (use braided stainless)",
      "Run cleaning cycle monthly"
    ]
  },
  {
    system: "Dryer",
    category: "Appliances",
    avgLifespanYears: { low: 13, high: 15 },
    floridaAdjustment: "Clean lint vent thoroughly -- Florida humidity makes lint stick more.",
    failureSigns: [
      "Clothes taking multiple cycles to dry",
      "Drum not spinning",
      "Excessive heat",
      "Burning smell",
      "Loud thumping or squealing"
    ],
    maintenanceTips: [
      "Clean lint trap after every load",
      "Professional dryer vent cleaning annually (fire prevention)",
      "Check exterior vent flap for blockage quarterly"
    ]
  },
  {
    system: "Refrigerator",
    category: "Appliances",
    avgLifespanYears: { low: 9, high: 13 },
    floridaAdjustment: "Garage refrigerators work harder in Florida heat. May last only 6-8 years in unconditioned spaces.",
    failureSigns: [
      "Not maintaining temperature",
      "Excessive frost in freezer",
      "Loud compressor noise",
      "Water pooling under unit",
      "Constantly running"
    ],
    maintenanceTips: [
      "Clean condenser coils every 6 months (dust buildup reduces efficiency)",
      "Check door gaskets for airtight seal",
      "Keep temperature at 37F fridge / 0F freezer",
      "Do not place in direct sunlight or next to heat sources"
    ]
  },
  {
    system: "Insulation (Attic)",
    category: "Envelope",
    avgLifespanYears: { low: 20, high: 40 },
    floridaAdjustment: "Florida attics reach 140-160F in summer, degrading fiberglass insulation over time. Blown-in settles. Check R-value every 10 years. Target R-38 minimum for Central FL.",
    failureSigns: [
      "High energy bills",
      "Upstairs rooms significantly hotter",
      "Visible compression or settling in attic",
      "Insulation is thin or has gaps",
      "Moisture or mold on insulation"
    ],
    maintenanceTips: [
      "Inspect attic insulation depth annually",
      "Add insulation if below R-30",
      "Seal air leaks around penetrations before adding insulation",
      "Ensure soffit vents are not blocked"
    ]
  },
  {
    system: "Windows (Single Pane)",
    category: "Envelope",
    avgLifespanYears: { low: 15, high: 20 },
    floridaAdjustment: "Single pane windows are energy-inefficient and provide no hurricane protection. Replacement with impact windows provides insurance discounts.",
    failureSigns: [
      "Drafts around frames",
      "Condensation between panes (double-pane failure)",
      "Difficulty opening/closing",
      "Visible rot in wood frames",
      "High energy bills"
    ],
    maintenanceTips: [
      "Inspect caulking and weatherstripping annually",
      "Consider impact window upgrade for insurance savings and hurricane protection"
    ]
  },
  {
    system: "Windows (Impact/Hurricane)",
    category: "Envelope",
    avgLifespanYears: { low: 25, high: 40 },
    floridaAdjustment: "Excellent investment in Florida. Qualifies for wind mitigation insurance discounts. Laminated glass blocks UV and reduces noise.",
    failureSigns: [
      "Seal failure (fogging between laminate layers)",
      "Frame deterioration",
      "Hardware malfunction",
      "Visible delamination"
    ],
    maintenanceTips: [
      "Clean tracks and hardware annually",
      "Lubricate hardware with silicone spray",
      "Inspect seals and weatherstripping"
    ]
  }
];

// ---------------------------------------------------------------------------
// FLORIDA HOMEOWNER GUIDE
// ---------------------------------------------------------------------------
export interface FloridaGuideSection {
  topic: string;
  content: string;
  actionItems: string[];
}

export const FLORIDA_HOMEOWNER_GUIDE: FloridaGuideSection[] = [
  {
    topic: "Hurricane Preparation",
    content: "Central Florida is not immune to hurricanes. Orlando took direct hits from Charley (2004), Irma (2017), and Ian (2022). Preparation saves lives and property. The season runs June 1 through November 30.",
    actionItems: [
      "Install hurricane shutters or impact windows on all openings",
      "Ensure roof-to-wall connections have hurricane straps/clips (visible from attic)",
      "Trim trees within 10 feet of the house -- especially dead branches",
      "Know your flood zone (FEMA map) and whether you need flood insurance",
      "Stock hurricane kit: water (1 gal/person/day for 7 days), non-perishable food, medications, flashlights, batteries, important documents in waterproof bag",
      "Test and fuel generator before season starts (never run indoors)",
      "Clear gutters and downspouts to handle heavy rain",
      "Secure or store outdoor furniture, grills, and pool equipment",
      "Know where your water main shutoff, gas shutoff, and electrical panel are",
      "Take photos/video of every room and exterior for insurance documentation before the storm",
      "Fill bathtubs with water before storm (flushing toilets if water goes out)",
      "Charge all devices and portable batteries"
    ]
  },
  {
    topic: "Wind Mitigation Inspection",
    content: "A wind mitigation inspection evaluates your home's resistance to wind damage. Florida law (FL Statute 627.0629) requires insurers to offer discounts for wind-resistant features. The inspection costs $75-150 and can save 20-45% on the wind portion of your homeowners premium -- often $500-2,000+ per year in savings. The inspection evaluates: roof covering, roof deck attachment, roof-to-wall connection, roof geometry, secondary water resistance, and opening protection (shutters/impact windows). A single inspection is valid for 5 years.",
    actionItems: [
      "Get a wind mitigation inspection -- average savings far exceed the $75-150 cost",
      "If your home was built after 2002, you likely qualify for the best credits (built to FBC)",
      "Hurricane straps/clips are one of the biggest discount factors",
      "Impact windows or shutters on all openings qualifies for the opening protection credit",
      "Secondary water barrier (peel-and-stick under roof) provides additional credit",
      "Hip roofs get better credits than gable roofs",
      "Send the completed OIR-B1-1802 form to your insurance agent immediately"
    ]
  },
  {
    topic: "4-Point Inspection",
    content: "Most Florida insurers require a 4-point inspection for homes 20+ years old when issuing a new policy or at renewal. The inspection covers: (1) Roof -- age, material, condition. (2) Electrical -- panel type, wiring type, capacity. (3) Plumbing -- pipe material, water heater age/condition. (4) HVAC -- age, type, condition. Cost is typically $100-200. Fail any section and the insurer may refuse coverage or require repairs first. Federal Pacific and Zinsco panels are automatic fails. Polybutylene plumbing is often a fail or surcharge.",
    actionItems: [
      "Schedule a 4-point inspection before shopping for insurance on older homes",
      "Replace Federal Pacific or Zinsco electrical panels before inspection",
      "If you have polybutylene pipes (gray flexible), get a repipe quote",
      "Update your water heater if it is 15+ years old",
      "Ensure HVAC is functional and reasonably maintained",
      "Document any recent roof, electrical, plumbing, or HVAC work with permits"
    ]
  },
  {
    topic: "Flood Zones and Insurance",
    content: "Orlando is not all flat and dry. Many neighborhoods sit in FEMA flood zones A, AE, AH, or X (shaded). Properties in high-risk zones (A/AE) with a federally-backed mortgage are required to carry flood insurance. Flood insurance is separate from homeowners insurance. NFIP (National Flood Insurance Program) caps at $250K dwelling / $100K contents. Private flood insurance often offers better coverage and competitive pricing since 2019. Check your flood zone at FEMA's map service center (msc.fema.gov).",
    actionItems: [
      "Look up your property's flood zone on FEMA's flood map",
      "Even if you are in Zone X (low risk), consider flood insurance -- 25% of flood claims come from low-risk zones",
      "Compare NFIP vs private flood carriers (Neptuno, Wright, Palomar)",
      "Elevation certificates can lower premiums if your home sits above base flood elevation",
      "After major storms, FEMA may remap your area -- check periodically"
    ]
  },
  {
    topic: "Sinkhole Awareness",
    content: "Central Florida sits on a limestone karst geology prone to sinkholes. Orange, Seminole, Lake, Osceola, and Polk counties all have elevated sinkhole risk. Florida law (FL Statute 627.706) requires insurers to offer sinkhole coverage. Catastrophic ground cover collapse (complete structural failure) is included in standard policies. Sinkhole coverage (partial settlement/cracking) is optional and costs extra.",
    actionItems: [
      "Check your area's sinkhole history at the Florida Geological Survey subsidence reports",
      "Consider sinkhole coverage if in a known risk area -- costs $200-800/year extra",
      "Warning signs: cracks in foundation or walls, doors/windows sticking, depressions in yard, fence posts tilting",
      "If you suspect sinkhole activity, contact your insurer and a geotechnical engineer immediately"
    ]
  },
  {
    topic: "Mold and Humidity Management",
    content: "Florida's average relative humidity is 70-80%. Mold can grow on any surface within 24-48 hours if moisture is present. AC systems are the primary dehumidification tool. A properly sized AC should maintain indoor humidity at 45-55%. Mold remediation costs $1,500-6,000 for typical cases and $10,000-30,000 for severe cases. Most homeowners insurance does NOT cover mold unless it results from a covered peril (like a burst pipe).",
    actionItems: [
      "Keep indoor humidity below 55% (buy a hygrometer for $10-15)",
      "Run bathroom exhaust fans during and 20 minutes after showers",
      "Fix any leaks immediately -- mold starts in 24-48 hours",
      "Clean AC drain line monthly with vinegar",
      "Ensure dryer vents to outside (not into attic or garage)",
      "Inspect under sinks, behind toilets, and around windows monthly",
      "If AC runs constantly but humidity stays high, the system may be oversized (common Florida issue)"
    ]
  },
  {
    topic: "Termites and Pest Management",
    content: "Subterranean termites are active year-round in Florida but swarm most heavily March through May. Drywood termites swarm April through July. Florida is the heaviest termite state in the US. Formosan termites (aggressive subtype) are present in Central FL. Annual termite inspections are critical. Treatment options: liquid barrier treatment ($800-2,500), bait stations ($1,200-3,500 installed + annual monitoring $250-400), tent fumigation for drywood ($1,200-2,500 for average home).",
    actionItems: [
      "Annual termite inspection (many companies offer free inspections)",
      "Watch for mud tubes on foundation walls (subterranean termites)",
      "Watch for small piles of pellets near wood (drywood termites)",
      "Keep mulch 12+ inches from foundation",
      "Fix any wood-to-soil contact around the home",
      "Repair any moisture issues -- termites are attracted to damp wood",
      "If buying a home, always get a WDO (Wood Destroying Organism) inspection"
    ]
  },
  {
    topic: "HOA Law (FL Statute 720)",
    content: "Florida Statute 720 governs homeowners associations. Key homeowner rights: right to inspect all HOA records within 10 business days of written request, right to attend all board meetings, right to speak at meetings, right to vote on budget increases over 115% of prior year. HOAs must provide 14-day notice before board meetings. Fines cannot exceed $100/day per violation ($1,000 cap) without a hearing. The Division of Condominiums, Timeshares, and Mobile Homes handles complaints. Recent reforms (2024 SB 4-D) require reserve studies, financial transparency, and milestone inspections for condos (primarily 3+ stories).",
    actionItems: [
      "Request a copy of CC&Rs, bylaws, and current budget before buying",
      "Know exactly what the HOA covers vs what is the homeowner's responsibility",
      "Attend at least one board meeting per year",
      "Get written approval (Architectural Review Board) BEFORE any exterior modification",
      "Keep copies of all HOA correspondence",
      "Know your right to request records -- they must comply within 10 business days"
    ]
  },
  {
    topic: "Homestead Exemption",
    content: "Florida's homestead exemption reduces the assessed value of your primary residence by up to $50,000 for property tax purposes. The first $25,000 applies to all property taxes. The second $25,000 applies to assessed value between $50,000 and $75,000 (and only to non-school taxes). You must file by March 1 of the year following purchase. The Save Our Homes amendment caps annual assessment increases at 3% or CPI, whichever is lower. Portability allows you to transfer up to $500,000 in accumulated Save Our Homes benefit to a new homestead within 3 years.",
    actionItems: [
      "File for homestead exemption at the Orange County Property Appraiser within one year of purchase",
      "Deadline is March 1 each year -- file as soon as you close",
      "If you move within Florida, file for portability within 3 years to transfer your assessment cap",
      "Additional exemptions available: widow/widower ($5,000), disability, senior (65+ with income limit), veteran",
      "Losing homestead (renting out, leaving FL) resets your assessed value to market -- can be a massive tax increase"
    ]
  },
  {
    topic: "Insurance Intelligence",
    content: "Florida homeowners insurance averaged $4,419/year in 2024 -- the highest in the nation. Citizens Property Insurance is the state-run insurer of last resort, historically 30-40% below market rates but rapidly offloading policies to private carriers. Recent legislative reforms (elimination of one-way attorney fees, AOB reform) are stabilizing the market. Private carriers are returning and some are cutting rates. Key savings strategies: wind mitigation inspection (20-45% savings on wind premium), bundling home+auto, raising deductible (2% hurricane deductible vs flat dollar saves premium), claims-free discount, new roof discount, security system discount.",
    actionItems: [
      "Get a wind mitigation inspection -- single biggest discount available",
      "Shop your insurance annually -- the market is changing rapidly",
      "Compare Citizens vs private carriers (Heritage, Slide, TypTap, Security First)",
      "Consider a higher hurricane deductible (2% vs 5%) to lower premiums",
      "Maintain claims-free history -- even small claims raise rates for years",
      "Document your home thoroughly (photos, receipts, Home DNA Scan) for faster claims",
      "Separate flood insurance is required in high-risk zones, recommended everywhere",
      "Install a monitored security system and water leak detection for additional discounts"
    ]
  }
];

// ---------------------------------------------------------------------------
// SEASONAL MAINTENANCE CALENDAR (Florida / Orlando metro)
// ---------------------------------------------------------------------------
export interface MonthlyMaintenance {
  month: string;
  tasks: { task: string; why: string; priority: "critical" | "important" | "recommended" }[];
}

export const SEASONAL_MAINTENANCE: MonthlyMaintenance[] = [
  {
    month: "January",
    tasks: [
      { task: "Test smoke and CO detectors, replace batteries", why: "National Fire Prevention -- battery-operated detectors should be tested monthly, batteries replaced twice yearly", priority: "critical" },
      { task: "Inspect water heater for leaks and flush sediment", why: "Annual flush extends life by 2-3 years", priority: "important" },
      { task: "Check weather stripping on doors and windows", why: "Cool-season energy savings", priority: "recommended" },
      { task: "Inspect attic insulation depth", why: "Prep for summer cooling load", priority: "recommended" },
      { task: "Service fireplace or gas logs if present", why: "Peak usage season", priority: "recommended" }
    ]
  },
  {
    month: "February",
    tasks: [
      { task: "HVAC pre-season tune-up (schedule now for spring)", why: "Beat the rush -- March-April bookings fill fast", priority: "important" },
      { task: "Inspect roof for winter storm damage", why: "Catch issues before rainy season", priority: "important" },
      { task: "Pressure wash driveway and exterior", why: "Algae growth is heavy in winter humidity", priority: "recommended" },
      { task: "Check irrigation system for leaks and proper coverage", why: "Spring lawn growth season approaching", priority: "recommended" },
      { task: "Trim trees and hedges", why: "Dormant season pruning is ideal for most Florida trees", priority: "recommended" }
    ]
  },
  {
    month: "March",
    tasks: [
      { task: "Termite inspection", why: "Subterranean termite swarm season begins (March-May)", priority: "critical" },
      { task: "Change AC filter and clean condensate drain line", why: "Prep for heavy cooling season", priority: "important" },
      { task: "File homestead exemption if not yet done (deadline March 1)", why: "Saves $500-1,500+ annually in property taxes", priority: "critical" },
      { task: "Check pool equipment before swim season", why: "Pump, filter, heater, and chemistry check", priority: "important" },
      { task: "Inspect exterior caulking and paint", why: "Rainy season starts in May", priority: "recommended" }
    ]
  },
  {
    month: "April",
    tasks: [
      { task: "AC maintenance tune-up (if not done in March)", why: "System will run almost continuously for next 6 months", priority: "critical" },
      { task: "Inspect and clean gutters", why: "Clear before summer thunderstorm season", priority: "important" },
      { task: "Check for drywood termite swarmers", why: "Drywood termite swarm season April-July", priority: "important" },
      { task: "Test GFCI outlets (kitchen, bath, outdoor, garage)", why: "Rainy season electrical safety", priority: "important" },
      { task: "Service pool -- balance chemistry, clean filter", why: "Pool usage increases", priority: "recommended" }
    ]
  },
  {
    month: "May",
    tasks: [
      { task: "Hurricane season prep begins -- check shutters and supplies", why: "Season officially starts June 1", priority: "critical" },
      { task: "Inspect roof for loose or damaged shingles/tiles", why: "Last chance before hurricane season", priority: "critical" },
      { task: "Stock hurricane kit (water, food, batteries, first aid)", why: "Stores sell out during active storms", priority: "important" },
      { task: "Test sump pump if you have one", why: "Heaviest rain months ahead (June-September)", priority: "important" },
      { task: "Check water heater T&P relief valve", why: "Annual safety check", priority: "recommended" }
    ]
  },
  {
    month: "June",
    tasks: [
      { task: "Hurricane season is active -- review insurance coverage", why: "Verify policy covers wind, review deductibles", priority: "critical" },
      { task: "Change AC filter (monthly during heavy use)", why: "System running near-constantly", priority: "important" },
      { task: "Check for standing water around foundation after storms", why: "Drainage issues cause foundation problems", priority: "important" },
      { task: "Inspect attic for leaks after heavy rains", why: "Catch roof leaks early", priority: "recommended" },
      { task: "Check outdoor lighting and motion sensors", why: "Longer evening hours, safety", priority: "recommended" }
    ]
  },
  {
    month: "July",
    tasks: [
      { task: "Change AC filter", why: "Peak cooling month -- dirty filter makes system work 15% harder", priority: "important" },
      { task: "Inspect AC condensate drain line", why: "Clogs cause water damage -- pour vinegar down monthly", priority: "important" },
      { task: "Check pool chemistry twice weekly", why: "High heat and UV deplete chlorine faster", priority: "important" },
      { task: "Test smoke detectors and replace batteries", why: "Mid-year battery check", priority: "important" },
      { task: "Inspect caulking around showers and tubs", why: "Prevent water damage behind walls", priority: "recommended" }
    ]
  },
  {
    month: "August",
    tasks: [
      { task: "Change AC filter", why: "Peak hurricane month -- AC failures in August are emergencies", priority: "important" },
      { task: "Check and test hurricane shutters/panels", why: "Peak of hurricane season (August-October)", priority: "critical" },
      { task: "Inspect garage door opener and weatherseal", why: "Garage doors are vulnerable in high winds", priority: "recommended" },
      { task: "Check irrigation system compliance with local water restrictions", why: "Summer water restrictions typically in effect", priority: "recommended" },
      { task: "Inspect plumbing under all sinks for leaks", why: "Routine leak check prevents water damage", priority: "recommended" }
    ]
  },
  {
    month: "September",
    tasks: [
      { task: "Remain hurricane-ready through end of season (Nov 30)", why: "September and October are historically active months", priority: "critical" },
      { task: "Change AC filter", why: "Continued heavy use", priority: "important" },
      { task: "Inspect exterior paint and stucco for cracks", why: "Summer storms may have caused damage", priority: "recommended" },
      { task: "Check water heater anode rod (every 3-5 years)", why: "Protects tank from corrosion", priority: "recommended" },
      { task: "Deep clean dryer vent", why: "Annual fire prevention -- #1 cause of home dryer fires is lint buildup", priority: "important" }
    ]
  },
  {
    month: "October",
    tasks: [
      { task: "Fall HVAC tune-up (heat pump or furnace check)", why: "Prep for cool season -- minor issue now, emergency in a cold snap", priority: "important" },
      { task: "Clean and inspect gutters after summer storms", why: "Remove debris buildup from thunderstorm season", priority: "important" },
      { task: "Pest inspection and treatment refresh", why: "Rodents seek shelter as temps drop", priority: "recommended" },
      { task: "Inspect and reseal driveway if needed", why: "Cooler temps are ideal for sealant application", priority: "recommended" },
      { task: "Check weather stripping on all exterior doors", why: "Prep for cooler weather energy efficiency", priority: "recommended" }
    ]
  },
  {
    month: "November",
    tasks: [
      { task: "Hurricane season ends Nov 30 -- store shutters and supplies", why: "Clean and store properly for next season", priority: "recommended" },
      { task: "Winterize irrigation system (minimal in Central FL)", why: "Reduce watering schedule for dormant grass", priority: "recommended" },
      { task: "Inspect fireplace or chimney if applicable", why: "Before first use of season", priority: "important" },
      { task: "Check exterior lighting and holiday decorations for safety", why: "Inspect wiring, use outdoor-rated lights only", priority: "recommended" },
      { task: "Review homeowners insurance before renewal", why: "Shop for better rates during renewal period", priority: "important" }
    ]
  },
  {
    month: "December",
    tasks: [
      { task: "Year-end home maintenance review", why: "Document what was done, plan next year", priority: "recommended" },
      { task: "Insulate exposed pipes if a freeze is forecast", why: "Orlando gets 1-3 freeze nights per winter on average", priority: "critical" },
      { task: "Change AC/heat filter", why: "Quarterly minimum", priority: "important" },
      { task: "Test all smoke and CO detectors", why: "Holiday cooking and heating increase fire risk", priority: "important" },
      { task: "Review energy usage and consider efficiency upgrades", why: "Plan for spring projects to save on summer cooling costs", priority: "recommended" }
    ]
  }
];

// ---------------------------------------------------------------------------
// REPAIR COST ESTIMATES (Orlando metro, 2024-2025 data)
// ---------------------------------------------------------------------------
export interface RepairCostEstimate {
  service: string;
  category: string;
  lowCost: number;
  avgCost: number;
  highCost: number;
  unit: string;
  notes: string;
}

export const REPAIR_COST_ESTIMATES: RepairCostEstimate[] = [
  // HVAC
  { service: "AC Replacement (Central, 3-ton)", category: "HVAC", lowCost: 3800, avgCost: 5300, highCost: 6800, unit: "per unit", notes: "3-ton is standard for 1,500-1,800 sqft. 14-16 SEER. Includes installation." },
  { service: "Full HVAC System (AC + Air Handler)", category: "HVAC", lowCost: 7000, avgCost: 10500, highCost: 14000, unit: "per system", notes: "Complete system for 2,000-2,500 sqft home. Higher end for 18+ SEER or heat pump." },
  { service: "Mini-Split Installation (Single Zone)", category: "HVAC", lowCost: 2000, avgCost: 3500, highCost: 5000, unit: "per zone", notes: "Great for additions, garages, or supplemental cooling." },
  { service: "AC Repair (General)", category: "HVAC", lowCost: 150, avgCost: 350, highCost: 600, unit: "per visit", notes: "Capacitor, contactor, fan motor replacements. Compressor replacement is higher ($1,500-2,500)." },
  { service: "Duct Cleaning", category: "HVAC", lowCost: 300, avgCost: 450, highCost: 700, unit: "per home", notes: "Every 3-5 years or after renovation. Beware of $99 scam offers." },
  { service: "AC Tune-Up / Maintenance", category: "HVAC", lowCost: 75, avgCost: 125, highCost: 200, unit: "per visit", notes: "Annual preventive maintenance. Includes coil cleaning, refrigerant check, electrical test." },

  // Roofing
  { service: "Roof Replacement (Asphalt Shingle)", category: "Roofing", lowCost: 7000, avgCost: 10000, highCost: 15000, unit: "per roof", notes: "Standard 2,000 sqft roof. Architectural shingles. Includes tear-off, felt, flashing." },
  { service: "Roof Replacement (Tile)", category: "Roofing", lowCost: 15000, avgCost: 22000, highCost: 35000, unit: "per roof", notes: "Concrete or clay tile. Much higher material and labor cost. Includes underlayment." },
  { service: "Roof Replacement (Metal Standing Seam)", category: "Roofing", lowCost: 15000, avgCost: 25000, highCost: 40000, unit: "per roof", notes: "Premium option. 40-70 year lifespan. Best wind rating. Insurance discounts." },
  { service: "Roof Repair (Minor)", category: "Roofing", lowCost: 200, avgCost: 500, highCost: 1200, unit: "per repair", notes: "Patch, re-seal flashing, replace a few shingles/tiles." },
  { service: "Roof Inspection", category: "Roofing", lowCost: 100, avgCost: 200, highCost: 350, unit: "per inspection", notes: "Includes drone or ladder inspection with photo report." },

  // Plumbing
  { service: "Water Heater Replacement (50-gal Tank Electric)", category: "Plumbing", lowCost: 900, avgCost: 1500, highCost: 2100, unit: "per unit", notes: "Most common type in Orlando. Includes removal of old unit." },
  { service: "Water Heater Replacement (50-gal Tank Gas)", category: "Plumbing", lowCost: 1400, avgCost: 1750, highCost: 2100, unit: "per unit", notes: "Less common in Orlando. Gas line and venting add complexity." },
  { service: "Tankless Water Heater Installation", category: "Plumbing", lowCost: 2500, avgCost: 4000, highCost: 5500, unit: "per unit", notes: "Electric tankless less common for whole-home in FL. Gas tankless or hybrid heat pump recommended." },
  { service: "Whole-House Repipe (PEX)", category: "Plumbing", lowCost: 3000, avgCost: 5500, highCost: 8000, unit: "per home", notes: "2-3 bath home. Polybutylene or CPVC to PEX. 1-2 day job. Drywall repair extra." },
  { service: "Drain Cleaning", category: "Plumbing", lowCost: 100, avgCost: 200, highCost: 400, unit: "per drain", notes: "Standard snake. Camera inspection extra ($150-300)." },
  { service: "Slab Leak Repair", category: "Plumbing", lowCost: 1500, avgCost: 3000, highCost: 5000, unit: "per repair", notes: "Depends on access. May require rerouting if under foundation." },
  { service: "Toilet Replacement", category: "Plumbing", lowCost: 200, avgCost: 350, highCost: 600, unit: "per toilet", notes: "Includes toilet, wax ring, supply line, and labor." },

  // Electrical
  { service: "Electrical Panel Upgrade (200 Amp)", category: "Electrical", lowCost: 2000, avgCost: 2750, highCost: 3500, unit: "per panel", notes: "Standard upgrade for modern homes. Required for EV chargers, pool equipment, etc." },
  { service: "Electrical Panel Replacement (Same Amp)", category: "Electrical", lowCost: 1200, avgCost: 1600, highCost: 2000, unit: "per panel", notes: "Replacing FPE/Zinsco with modern panel, same amperage." },
  { service: "Whole-House Generator (Standby)", category: "Electrical", lowCost: 6000, avgCost: 10000, highCost: 15000, unit: "installed", notes: "Natural gas or propane. 20-24kW covers most homes. Includes transfer switch." },
  { service: "Ceiling Fan Installation", category: "Electrical", lowCost: 150, avgCost: 250, highCost: 400, unit: "per fan", notes: "Assumes existing wiring. New wiring adds $200-500." },
  { service: "EV Charger Installation (Level 2)", category: "Electrical", lowCost: 500, avgCost: 1000, highCost: 2000, unit: "installed", notes: "Depends on panel capacity and distance to garage." },

  // Windows and Insulation
  { service: "Window Replacement (Standard Vinyl)", category: "Envelope", lowCost: 300, avgCost: 500, highCost: 800, unit: "per window", notes: "Non-impact vinyl double-pane. Installed." },
  { service: "Impact Window Replacement", category: "Envelope", lowCost: 500, avgCost: 900, highCost: 1500, unit: "per window", notes: "Hurricane-rated laminated glass. Insurance discount offsets cost over time." },
  { service: "Whole-House Impact Windows (avg 15 windows)", category: "Envelope", lowCost: 8000, avgCost: 13000, highCost: 22000, unit: "per home", notes: "PACE financing available (repaid via property tax). Wind mitigation discount applies." },
  { service: "Attic Insulation (Blown-In)", category: "Envelope", lowCost: 1000, avgCost: 1800, highCost: 3000, unit: "per attic", notes: "To reach R-38. FPL may offer rebates." },
  { service: "Spray Foam Insulation (Attic)", category: "Envelope", lowCost: 3000, avgCost: 5000, highCost: 8000, unit: "per attic", notes: "Closed-cell. Superior air seal. Best for Florida attics." },

  // Pool
  { service: "Pool Resurfacing (Plaster)", category: "Pool", lowCost: 4000, avgCost: 6000, highCost: 8000, unit: "per pool", notes: "Standard white plaster. Average residential pool (12,000-15,000 gallons)." },
  { service: "Pool Resurfacing (Pebble/Quartz)", category: "Pool", lowCost: 7000, avgCost: 10000, highCost: 15000, unit: "per pool", notes: "PebbleTec or similar. Lasts 15-20 years vs 7-12 for plaster." },
  { service: "Pool Pump Replacement (Variable Speed)", category: "Pool", lowCost: 800, avgCost: 1500, highCost: 2500, unit: "per pump", notes: "FL law requires variable-speed pumps on new/replacement installations (since 2021)." },
  { service: "Pool Heater Installation (Heat Pump)", category: "Pool", lowCost: 3000, avgCost: 4500, highCost: 6000, unit: "per unit", notes: "Most energy-efficient option for FL pools." },
  { service: "Salt Chlorinator Cell Replacement", category: "Pool", lowCost: 400, avgCost: 700, highCost: 1000, unit: "per cell", notes: "Every 3-5 years. OEM cells cost more but last longer." },

  // Exterior
  { service: "Fence Replacement (Wood, 150 linear ft)", category: "Exterior", lowCost: 2500, avgCost: 4000, highCost: 6000, unit: "per project", notes: "Pressure-treated pine. Cedar or vinyl costs 30-50% more." },
  { service: "Fence Replacement (Vinyl, 150 linear ft)", category: "Exterior", lowCost: 3500, avgCost: 5500, highCost: 8000, unit: "per project", notes: "More durable in Florida humidity. No painting/staining needed." },
  { service: "Driveway Repaving (Asphalt)", category: "Exterior", lowCost: 3000, avgCost: 5000, highCost: 7000, unit: "per driveway", notes: "Standard 2-car driveway (~600 sqft). Concrete is more common in FL." },
  { service: "Driveway Replacement (Concrete)", category: "Exterior", lowCost: 4000, avgCost: 6500, highCost: 9000, unit: "per driveway", notes: "Standard 2-car driveway. Includes removal of old surface." },
  { service: "Exterior Paint (Stucco Home)", category: "Exterior", lowCost: 3000, avgCost: 5000, highCost: 8000, unit: "per home", notes: "2,000 sqft home. Includes pressure wash, prep, and 2 coats. FL sun degrades exterior paint in 5-7 years." },
  { service: "Pressure Washing (Whole House + Driveway)", category: "Exterior", lowCost: 200, avgCost: 400, highCost: 700, unit: "per service", notes: "Annual service recommended in Florida." }
];

// ---------------------------------------------------------------------------
// EMERGENCY PROTOCOLS
// ---------------------------------------------------------------------------
export interface EmergencyProtocol {
  emergency: string;
  immediateSteps: string[];
  doNotDo: string[];
  whenToCall911: string;
  proServiceNeeded: string;
  estimatedCost: string;
}

export const EMERGENCY_PROTOCOLS: EmergencyProtocol[] = [
  {
    emergency: "Burst Pipe / Major Water Leak",
    immediateSteps: [
      "1. SHUT OFF MAIN WATER VALVE immediately (usually near the street or where the main line enters the house)",
      "2. Turn off water heater (electric: flip breaker; gas: set to pilot)",
      "3. Open faucets to drain remaining pressure",
      "4. Turn off electricity to affected areas if water is near outlets/appliances",
      "5. Move valuables away from water. Lift furniture onto blocks or plastic.",
      "6. Start removing standing water with towels, mops, wet-vac if available",
      "7. Take photos and video of ALL damage BEFORE cleanup for insurance",
      "8. Call your insurance company to start a claim",
      "9. Call a plumber for emergency repair and a water mitigation company for drying"
    ],
    doNotDo: [
      "Do NOT ignore even a small leak -- they get worse fast",
      "Do NOT use electrical appliances in standing water",
      "Do NOT wait more than 24 hours to start drying -- mold starts in 24-48 hours"
    ],
    whenToCall911: "Only if water is near active electrical hazards you cannot safely shut off, or if flooding is from an external source threatening safety.",
    proServiceNeeded: "Emergency plumber + water mitigation company",
    estimatedCost: "Plumber: $150-500 emergency repair. Water mitigation: $1,500-5,000 depending on scope."
  },
  {
    emergency: "Gas Leak / Gas Smell",
    immediateSteps: [
      "1. Do NOT flip any light switches, use phones, or create any spark",
      "2. Do NOT start a car in the garage",
      "3. Open windows and doors as you exit if safe to do so",
      "4. Evacuate everyone from the home immediately",
      "5. Move at least 100 feet away from the house",
      "6. Call 911 from outside or a neighbor's phone",
      "7. Call your gas utility company's emergency line",
      "8. Do NOT re-enter until emergency responders clear the home"
    ],
    doNotDo: [
      "Do NOT use any electrical switches or appliances",
      "Do NOT use your phone inside the house",
      "Do NOT try to find or fix the leak yourself",
      "Do NOT re-enter until cleared by fire department"
    ],
    whenToCall911: "ALWAYS call 911 for gas leaks. This is a life-threatening emergency.",
    proServiceNeeded: "Fire department first, then licensed gas plumber",
    estimatedCost: "Gas line repair: $200-800. Full line replacement if needed: $1,000-3,000."
  },
  {
    emergency: "Electrical Fire / Burning Smell from Panel",
    immediateSteps: [
      "1. If fire is small and contained: use a Class C (electrical) fire extinguisher ONLY",
      "2. If fire is spreading: evacuate immediately, close doors behind you",
      "3. Call 911 from outside the home",
      "4. If safe, shut off main breaker at the electrical panel (only if no active fire at panel)",
      "5. Do NOT use water on an electrical fire",
      "6. After fire department clears, call a licensed electrician for inspection",
      "7. Do NOT turn power back on until electrician approves"
    ],
    doNotDo: [
      "Do NOT use water on an electrical fire",
      "Do NOT touch the electrical panel if it is smoking, sparking, or on fire",
      "Do NOT try to fight a spreading fire -- evacuate",
      "Do NOT reset breakers after a burning smell -- have an electrician inspect first"
    ],
    whenToCall911: "ALWAYS call 911 for any fire or smoke. No exceptions.",
    proServiceNeeded: "Licensed electrician for inspection and repair. May need full panel replacement.",
    estimatedCost: "Emergency electrician: $200-500 visit. Panel replacement if needed: $2,000-3,500."
  },
  {
    emergency: "Flooding (Weather-Related)",
    immediateSteps: [
      "1. If flood water is entering home, evacuate to higher ground if safe",
      "2. Turn off electrical at main breaker before water reaches outlets",
      "3. Move to upper floors if available",
      "4. Do NOT walk or drive through floodwater (6 inches can knock you down, 12 inches can carry a car)",
      "5. After water recedes, document all damage with photos/video before touching anything",
      "6. Contact your flood insurance provider (separate from homeowners)",
      "7. Hire a water mitigation company immediately -- mold starts in 24-48 hours",
      "8. Discard any food or medication that contacted floodwater",
      "9. Have electrical, gas, and HVAC inspected before turning back on"
    ],
    doNotDo: [
      "Do NOT enter a flooded building if water may be electrically charged",
      "Do NOT use any appliance that was submerged without professional inspection",
      "Do NOT pump out a basement too quickly (hydrostatic pressure can collapse walls)"
    ],
    whenToCall911: "If water is rapidly rising, if anyone is trapped, or if you smell gas.",
    proServiceNeeded: "Water mitigation company, general contractor for repairs",
    estimatedCost: "Water mitigation: $2,000-10,000+. Drywall/flooring repairs: $5,000-30,000+ depending on severity."
  },
  {
    emergency: "Hurricane Damage",
    immediateSteps: [
      "1. Wait for all-clear from local authorities before going outside",
      "2. Watch for downed power lines -- assume all are live. Call 911 if lines are down.",
      "3. Check for gas leaks (smell, hissing). If suspected, evacuate and call 911.",
      "4. Document ALL damage with photos and video immediately -- date-stamped",
      "5. Make temporary repairs to prevent further damage (tarps on roof, board broken windows) -- SAVE RECEIPTS for insurance",
      "6. Do NOT turn on AC or appliances until systems are inspected",
      "7. Contact your insurance company within 24 hours to file a claim",
      "8. Keep all receipts for temporary housing, repairs, and damaged items",
      "9. Be cautious of contractor scams -- verify licenses at myfloridalicense.com",
      "10. Apply for FEMA assistance if damage is severe (disasterassistance.gov)"
    ],
    doNotDo: [
      "Do NOT sign contracts with door-to-door storm chasers without verifying license",
      "Do NOT give large deposits -- legitimate contractors take 10-30% down maximum",
      "Do NOT make permanent repairs before insurance adjuster inspects",
      "Do NOT drink tap water until utility confirms safety"
    ],
    whenToCall911: "For any immediate danger: downed lines, gas leak, structural collapse, injuries.",
    proServiceNeeded: "Roofer for tarping/repair, tree service, general contractor, water mitigation if flooded",
    estimatedCost: "Emergency tarp: $300-1,500. Tree removal: $500-5,000. Full roof replacement: $7,000-35,000."
  },
  {
    emergency: "AC Failure in Summer",
    immediateSteps: [
      "1. Check thermostat -- make sure it's set to COOL and temperature is set below current temp",
      "2. Check air filter -- a clogged filter is the #1 cause of AC failure. Replace if dirty.",
      "3. Check circuit breaker for AC (may be two breakers -- one for condenser, one for air handler)",
      "4. If breaker tripped, reset ONCE. If it trips again, do NOT reset -- call a pro.",
      "5. Check condensate drain line -- if clogged, the safety switch may have shut down the system",
      "6. Go outside and check if condenser fan is running. If not, the capacitor may have failed.",
      "7. If none of these fix it, call for emergency AC service",
      "8. While waiting: close blinds, use fans to circulate air, stay hydrated, avoid using oven",
      "9. If anyone in the home is elderly, very young, or has health conditions -- consider going to a cooled location"
    ],
    doNotDo: [
      "Do NOT keep resetting a breaker that keeps tripping -- this indicates a serious fault",
      "Do NOT open windows if outdoor temp is higher than indoor",
      "Do NOT try to add refrigerant yourself -- it requires EPA certification"
    ],
    whenToCall911: "Only if someone is showing signs of heat stroke (confusion, loss of consciousness, hot dry skin, temp above 103F).",
    proServiceNeeded: "HVAC technician -- most companies offer same-day emergency service",
    estimatedCost: "Service call: $75-150. Common repairs: capacitor $150-300, fan motor $300-500, compressor $1,500-2,500."
  },
  {
    emergency: "Roof Leak (Active)",
    immediateSteps: [
      "1. Place buckets or containers under active drips",
      "2. Move furniture and valuables away from leak area",
      "3. If ceiling is bulging with water, poke a small hole at the lowest point to drain into a bucket (prevents ceiling collapse)",
      "4. Take photos of the leak location, ceiling damage, and any visible roof damage",
      "5. If safe, place a tarp over the exterior roof area (only in calm weather -- never in storms or on wet roofs)",
      "6. Check attic if accessible to identify the entry point (water often travels far from the actual hole)",
      "7. Call a roofer for emergency tarping/repair",
      "8. Contact insurance if damage is significant -- deductible may apply"
    ],
    doNotDo: [
      "Do NOT climb on a wet roof or during a storm",
      "Do NOT ignore a small leak -- water damage compounds rapidly",
      "Do NOT patch from inside only -- exterior source must be addressed"
    ],
    whenToCall911: "Only if the leak has caused structural collapse or electrical hazard.",
    proServiceNeeded: "Roofer for emergency tarping and permanent repair",
    estimatedCost: "Emergency tarp: $200-800. Repair: $200-1,200. If full roof replacement needed: $7,000-35,000."
  }
];

// ---------------------------------------------------------------------------
// ENERGY EFFICIENCY
// ---------------------------------------------------------------------------
export interface EnergyEfficiencyData {
  topic: string;
  details: string;
  savingsPotential: string;
}

export const ENERGY_EFFICIENCY: EnergyEfficiencyData[] = [
  {
    topic: "SEER Ratings Explained",
    details: "SEER (Seasonal Energy Efficiency Ratio) measures AC cooling efficiency. Federal minimum is 15 SEER for new installs in the Southeast (as of Jan 2023). Higher SEER = lower energy bills. A 16 SEER system uses about 12% less energy than 14 SEER. A 20+ SEER system uses about 30% less. For Orlando, where AC runs 8-10 months, the energy savings compound significantly. SEER2 is the new rating standard but numbers are comparable. Look for ENERGY STAR certification (meets efficiency standards set by EPA).",
    savingsPotential: "Upgrading from 10 SEER to 16 SEER saves approximately $400-700/year in Orlando on a 2,000 sqft home."
  },
  {
    topic: "FPL Rebate Programs",
    details: "Florida Power & Light offers residential rebates: HVAC rebates for high-efficiency systems (amount varies by SEER -- check fpl.com/save for current offers), duct testing and repair rebates, ceiling insulation rebates, pool pump rebates for variable-speed pumps, building envelope improvements, and free home energy surveys. Apply through fpl.com/save/programs. FPL also offers on-bill financing for qualifying improvements.",
    savingsPotential: "HVAC rebates typically $150-500 depending on system efficiency. Combined improvements can save 20-30% on cooling costs."
  },
  {
    topic: "Solar Panel ROI in Florida",
    details: "Average solar installation cost in Florida: $12,000-18,000 for a 6-8kW system (before incentives). Federal ITC provides 30% tax credit through 2032 (reducing to 26% in 2033). Florida has no state income tax so no state credit, but Florida offers a property tax exemption for solar installations (added home value is not taxed) and a sales tax exemption on solar equipment. Net metering with FPL allows selling excess power back at retail rate. Average payback period in Central FL: 6-9 years. System lifespan: 25-30 years. After payback, it is essentially free electricity.",
    savingsPotential: "Average FL homeowner saves $1,500-2,500/year on electricity. $37,000-60,000+ lifetime savings over 25 years."
  },
  {
    topic: "Smart Thermostat Savings",
    details: "Programmable and smart thermostats (Nest, Ecobee, Honeywell) save 10-15% on cooling/heating by optimizing schedules. In Orlando, setting AC to 78F when home and 82-85F when away provides optimal savings without discomfort. Every degree cooler costs roughly 3-5% more energy. FPL On Call program offers a free smart thermostat with permission for FPL to adjust during peak demand events.",
    savingsPotential: "$100-200/year in Orlando. FPL On Call also provides $5/month bill credit."
  },
  {
    topic: "LED Lighting",
    details: "Replacing all incandescent and CFL bulbs with LED saves 75% on lighting energy. LEDs last 25,000-50,000 hours vs 1,000 for incandescent. Average home has 30-40 light sockets. FPL offers rebates of up to $20 per qualifying LED fixture.",
    savingsPotential: "$100-200/year for a typical home. Bulb cost recouped in 6-12 months."
  },
  {
    topic: "Attic Insulation Upgrade",
    details: "Florida code requires R-30 minimum for new construction. Many older homes have R-13 to R-19. Upgrading to R-38 or R-49 reduces cooling costs significantly because the attic is the #1 source of heat gain. Radiant barriers in the attic (reflective foil) can reduce attic temperatures by 30F. FPL offers insulation rebates.",
    savingsPotential: "15-25% reduction in cooling costs. Typical savings: $200-500/year."
  },
  {
    topic: "Variable-Speed Pool Pump",
    details: "Florida law (effective July 2021) requires variable-speed pumps for new or replacement pool pump installations. Variable-speed pumps use up to 70% less energy than single-speed by running at lower RPM for longer periods. Average pool pump runs 8-12 hours daily and can be the second-largest energy consumer after AC.",
    savingsPotential: "$50-100/month energy savings. FPL offers pool pump rebates. Payback period: 1-2 years."
  },
  {
    topic: "Home Value Impact of Renovations",
    details: "Based on 2024 Cost vs. Value Report (Remodeling Magazine): Garage door replacement: 194% ROI. Steel entry door replacement: 188% ROI. Manufactured stone veneer: 153% ROI. Minor kitchen remodel: 96% ROI. Siding replacement (fiber cement): 88% ROI. Window replacement (vinyl): 68-75% ROI. Major kitchen remodel: 49% ROI. Bathroom remodel (midrange): 64% ROI. Exterior improvements consistently outperform interior renovations for ROI.",
    savingsPotential: "Exterior curb appeal projects return $1.50-2.00 for every $1 spent at resale."
  }
];

// ---------------------------------------------------------------------------
// APPLIANCE DATABASE (Major Brands, Lifespans, Maintenance)
// ---------------------------------------------------------------------------
export interface ApplianceInfo {
  type: string;
  majorBrands: string[];
  avgLifespanYears: { low: number; high: number };
  floridaNote: string;
  maintenanceSchedule: string[];
  commonFailureModes: string[];
}

export const APPLIANCE_DATABASE: ApplianceInfo[] = [
  {
    type: "Central Air Conditioner",
    majorBrands: ["Carrier", "Trane", "Lennox", "Rheem", "Goodman", "American Standard", "Daikin", "York", "Bryant", "Ruud"],
    avgLifespanYears: { low: 10, high: 15 },
    floridaNote: "Goodman and Rheem dominate the Florida market due to value. Trane and Carrier are premium. In Florida, AC runs 3,000+ hours/year vs 1,500 in northern states, so all brands have shorter effective lifespan.",
    maintenanceSchedule: [
      "Every 30-60 days: Replace air filter",
      "Monthly (summer): Clear condensate drain with vinegar",
      "Twice yearly: Clean condenser coils (hose down)",
      "Annually: Professional tune-up (spring)",
      "Every 5 years: Duct inspection and sealing"
    ],
    commonFailureModes: [
      "Capacitor failure (most common, $150-300 repair)",
      "Compressor failure (most expensive, $1,500-2,500 -- often worth replacing entire unit)",
      "Fan motor burnout ($300-500)",
      "Refrigerant leak ($200-1,500 depending on location)",
      "Condensate drain clog (causes water damage and system shutdown)",
      "Contactor failure ($150-250)",
      "Frozen evaporator coil (usually caused by low refrigerant or restricted airflow)"
    ]
  },
  {
    type: "Water Heater (Tank)",
    majorBrands: ["Rheem", "A.O. Smith", "Bradford White", "GE", "State", "Whirlpool", "Kenmore"],
    avgLifespanYears: { low: 8, high: 12 },
    floridaNote: "Florida hard water causes faster sediment buildup. Without annual flushing and anode rod replacement, tanks often fail in 6-8 years. Electric tank heaters dominate Orlando market.",
    maintenanceSchedule: [
      "Annually: Flush tank to remove sediment (attach hose to drain valve, drain until clear)",
      "Every 3-5 years: Check and replace anode rod ($20-50 DIY, $150-250 pro)",
      "Annually: Test T&P relief valve (lift lever, water should flow freely, then stop)",
      "Check: Temperature set to 120F (factory default is often 140F)"
    ],
    commonFailureModes: [
      "Tank corrosion and leak from bottom (non-repairable -- replacement required)",
      "Heating element failure (electric, $150-300 repair)",
      "Thermostat failure ($100-200 repair)",
      "T&P valve dripping (may indicate excessive pressure or temperature)",
      "Anode rod depleted (accelerates tank corrosion)"
    ]
  },
  {
    type: "Water Heater (Tankless)",
    majorBrands: ["Rinnai", "Navien", "Noritz", "Rheem", "Takagi", "EcoSmart (electric)", "Stiebel Eltron"],
    avgLifespanYears: { low: 15, high: 20 },
    floridaNote: "Scale buildup from hard water is the biggest threat to tankless units in Florida. Annual descaling is essential. Electric tankless units are often undersized for whole-home use in multi-bathroom FL homes.",
    maintenanceSchedule: [
      "Annually: Descale with vinegar (flush kit, 45-60 minutes DIY)",
      "Every 6 months: Clean inlet water filter screen",
      "Annually: Check for error codes and system performance"
    ],
    commonFailureModes: [
      "Scale buildup reducing flow and efficiency",
      "Ignition failure (gas units)",
      "Flow sensor failure",
      "Heat exchanger corrosion (expensive -- $500-1,200)"
    ]
  },
  {
    type: "Dishwasher",
    majorBrands: ["Bosch", "KitchenAid", "Whirlpool", "Samsung", "LG", "GE", "Maytag", "Frigidaire"],
    avgLifespanYears: { low: 9, high: 13 },
    floridaNote: "Hard water deposits reduce efficiency. Monthly vinegar cycle helps.",
    maintenanceSchedule: [
      "Monthly: Clean filter (most modern dishwashers have a removable filter)",
      "Monthly: Run empty cycle with vinegar or dishwasher cleaner",
      "Quarterly: Clean spray arms (remove and rinse)",
      "Check: Door gasket for mold or debris"
    ],
    commonFailureModes: [
      "Pump motor failure",
      "Control board failure (Samsung and LG known for this)",
      "Door latch/gasket leak",
      "Drain pump clog",
      "Spray arm clog from hard water deposits"
    ]
  },
  {
    type: "Refrigerator",
    majorBrands: ["Samsung", "LG", "Whirlpool", "GE", "Frigidaire", "KitchenAid", "Maytag", "Sub-Zero"],
    avgLifespanYears: { low: 9, high: 13 },
    floridaNote: "Garage refrigerators in unconditioned Florida garages (90-100F+) work extremely hard and may last only 6-8 years. Consider a garage-rated model.",
    maintenanceSchedule: [
      "Every 6 months: Vacuum condenser coils (back or bottom of fridge)",
      "Monthly: Check and clean door gaskets",
      "Quarterly: Clean drain pan (under the unit)",
      "Check: Temperature settings (37F fridge, 0F freezer)"
    ],
    commonFailureModes: [
      "Compressor failure (most expensive, often not worth repairing on older units)",
      "Defrost system failure (frost buildup in freezer)",
      "Ice maker failure (very common, especially Samsung)",
      "Control board failure",
      "Refrigerant leak (sealed system repair is expensive)"
    ]
  },
  {
    type: "Washing Machine",
    majorBrands: ["LG", "Samsung", "Whirlpool", "Maytag", "GE", "Speed Queen", "Electrolux"],
    avgLifespanYears: { low: 10, high: 14 },
    floridaNote: "Front-loaders are prone to mold in FL humidity. Leave door open between loads. Speed Queen is the most durable brand (commercial-grade residential).",
    maintenanceSchedule: [
      "After every load: Leave door open (front-loader) to dry gasket",
      "Monthly: Run cleaning cycle with washer cleaner or bleach",
      "Monthly: Clean front-loader gasket with vinegar",
      "Every 5 years: Replace rubber supply hoses with braided stainless steel",
      "Check: Level the machine to prevent excessive vibration"
    ],
    commonFailureModes: [
      "Bearing failure (loud banging during spin)",
      "Door gasket mold (front-loader)",
      "Drain pump failure",
      "Control board failure",
      "Shock absorber or suspension spring failure"
    ]
  },
  {
    type: "Clothes Dryer",
    majorBrands: ["LG", "Samsung", "Whirlpool", "Maytag", "GE", "Speed Queen", "Electrolux"],
    avgLifespanYears: { low: 13, high: 15 },
    floridaNote: "Lint buildup in vents is a fire hazard. Florida humidity makes lint stick more. Annual professional vent cleaning is strongly recommended.",
    maintenanceSchedule: [
      "Every load: Clean lint trap",
      "Annually: Professional dryer vent cleaning ($100-150)",
      "Quarterly: Check exterior vent flap for blockage",
      "Check: Vent run is under 25 feet and uses rigid metal (not plastic/foil flex)"
    ],
    commonFailureModes: [
      "Thermal fuse blown (often from restricted airflow/dirty vent)",
      "Heating element failure ($100-250 repair)",
      "Drum roller or bearing wear (thumping noise)",
      "Belt failure (drum stops spinning)",
      "Gas valve failure (gas dryers)"
    ]
  },
  {
    type: "Garage Door Opener",
    majorBrands: ["LiftMaster", "Chamberlain", "Genie", "Craftsman", "Ryobi"],
    avgLifespanYears: { low: 10, high: 15 },
    floridaNote: "Belt-drive openers are quieter and last longer in Florida humidity than chain-drive. Smart openers with battery backup are recommended for hurricane power outages.",
    maintenanceSchedule: [
      "Every 6 months: Lubricate chain/belt, rollers, hinges with silicone spray",
      "Monthly: Test auto-reverse safety (place a 2x4 under door)",
      "Annually: Check and adjust force settings",
      "Annually: Replace remote batteries"
    ],
    commonFailureModes: [
      "Gear/sprocket wear (grinding noise)",
      "Capacitor failure",
      "Logic board failure",
      "Photo-eye sensor misalignment",
      "Spring failure (torsion springs -- DANGEROUS to DIY, always call a pro)"
    ]
  },
  {
    type: "Pool Pump",
    majorBrands: ["Pentair", "Hayward", "Jandy (Zodiac)", "Sta-Rite"],
    avgLifespanYears: { low: 8, high: 12 },
    floridaNote: "Variable-speed pumps required by FL law since 2021 for new/replacement. Pentair IntelliFlo and Hayward Super Pump VS dominate the Florida market.",
    maintenanceSchedule: [
      "Weekly: Clean pump basket",
      "Monthly: Check pump lid O-ring for cracks",
      "Quarterly: Inspect for water leaks at unions",
      "Annually: Professional motor inspection"
    ],
    commonFailureModes: [
      "Motor bearing failure (loud screeching)",
      "Seal failure (water dripping from pump body)",
      "Capacitor failure",
      "Impeller clog or wear",
      "Air leak at lid O-ring (pump loses prime)"
    ]
  }
];
