export interface DIYRepair {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedTime: string;
  estimatedCost: string;
  symptoms: string[];
  diagnosis: string;
  tools: { name: string; price: string }[];
  parts: { name: string; price: string }[];
  steps: string[];
  safetyLevel: "green" | "yellow" | "red";
  safetyWarnings: string[];
  proRecommended: boolean;
  commonMistakes: string[];
  videoSearchTerms: string[];
  relatedRepairs: string[];
  upsellService: string;
}

export const DIY_KNOWLEDGE_BASE: DIYRepair[] = [
  // PLUMBING REPAIRS (45 repairs)
  {
    id: "plumbing_running_toilet",
    name: "Fix Running Toilet",
    category: "plumbing",
    subcategory: "toilet",
    difficulty: 2,
    estimatedTime: "30-60 minutes",
    estimatedCost: "$5-25",
    symptoms: ["toilet runs constantly", "water keeps filling", "gurgling sounds", "handle sticks"],
    diagnosis: "Flapper not sealing properly, chain too long/short, or fill valve issue",
    tools: [
      { name: "Adjustable pliers", price: "$10-15" },
      { name: "Flashlight", price: "$5-10" }
    ],
    parts: [
      { name: "Toilet flapper", price: "$3-8" },
      { name: "Toilet chain", price: "$2-5" },
      { name: "Fill valve", price: "$15-25" }
    ],
    steps: [
      "Turn off water supply valve behind toilet",
      "Remove toilet tank lid carefully and set aside",
      "Check if flapper is warped, cracked, or not seating properly",
      "If chain is too long or short, adjust length to allow proper flapper closure",
      "Clean mineral buildup around flapper seat",
      "Test flush and check if water stops running",
      "If still running, check fill valve for damage",
      "Replace fill valve if adjustment doesn't work",
      "Turn water supply back on",
      "Test several flushes to ensure proper operation"
    ],
    safetyLevel: "green",
    safetyWarnings: [],
    proRecommended: false,
    commonMistakes: ["Chain too tight preventing flapper from sealing", "Not turning off water first", "Over-tightening connections"],
    videoSearchTerms: ["fix running toilet", "toilet flapper replacement", "toilet chain adjustment"],
    relatedRepairs: ["toilet_handle_loose", "toilet_fill_valve", "toilet_water_level"],
    upsellService: "Full toilet inspection and tune-up"
  },
  {
    id: "plumbing_leaky_faucet_compression",
    name: "Fix Leaky Compression Faucet",
    category: "plumbing",
    subcategory: "faucet",
    difficulty: 3,
    estimatedTime: "1-2 hours",
    estimatedCost: "$10-30",
    symptoms: ["dripping from spout", "water won't shut off completely", "handle hard to turn"],
    diagnosis: "Worn seat washer, damaged O-ring, or corroded valve seat",
    tools: [
      { name: "Adjustable wrench", price: "$12-20" },
      { name: "Screwdriver set", price: "$15-25" },
      { name: "Seat wrench", price: "$8-15" },
      { name: "Needle-nose pliers", price: "$10-15" }
    ],
    parts: [
      { name: "Seat washers (assorted)", price: "$3-8" },
      { name: "O-rings (assorted)", price: "$5-10" },
      { name: "Packing string", price: "$3-5" },
      { name: "Valve seats", price: "$2-5 each" }
    ],
    steps: [
      "Turn off water supply valves under sink",
      "Turn on faucet to drain remaining water",
      "Remove handle by unscrewing or lifting off",
      "Use adjustable wrench to remove packing nut",
      "Pull out valve stem assembly",
      "Remove old seat washer from bottom of stem",
      "Install new washer of same size",
      "Replace O-rings on stem if worn",
      "Apply plumber's grease to new parts",
      "Reassemble in reverse order",
      "Turn water supply back on",
      "Test for leaks and proper operation"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Turn off water supply before starting", "Be careful not to over-tighten connections"],
    proRecommended: false,
    commonMistakes: ["Wrong size washer", "Over-tightening packing nut", "Not applying plumber's grease"],
    videoSearchTerms: ["compression faucet repair", "fix leaky faucet", "faucet seat washer replacement"],
    relatedRepairs: ["faucet_cartridge_replace", "faucet_aerator_clean", "shut_off_valve_replace"],
    upsellService: "Complete faucet upgrade and installation"
  },
  {
    id: "plumbing_leaky_faucet_cartridge",
    name: "Replace Cartridge Faucet Cartridge",
    category: "plumbing",
    subcategory: "faucet",
    difficulty: 3,
    estimatedTime: "45-90 minutes",
    estimatedCost: "$15-40",
    symptoms: ["dripping from spout", "handle loose", "water temperature hard to control", "low water pressure"],
    diagnosis: "Worn or damaged cartridge inside faucet body",
    tools: [
      { name: "Adjustable wrench", price: "$12-20" },
      { name: "Cartridge puller", price: "$15-25" },
      { name: "Screwdriver", price: "$8-15" }
    ],
    parts: [
      { name: "Replacement cartridge", price: "$15-35" },
      { name: "O-rings", price: "$3-8" },
      { name: "Plumber's grease", price: "$5-8" }
    ],
    steps: [
      "Turn off water supply valves under sink",
      "Remove faucet handle and decorative cap",
      "Remove retaining clip or nut holding cartridge",
      "Mark cartridge orientation before removal",
      "Use cartridge puller if cartridge is stuck",
      "Take old cartridge to hardware store for exact match",
      "Apply thin coat of plumber's grease to new cartridge",
      "Insert new cartridge in same orientation as old",
      "Replace retaining clip or nut",
      "Reassemble handle and cap",
      "Turn water supply back on slowly",
      "Test hot and cold water operation"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Cartridge may be under spring pressure", "Hot water can cause burns during testing"],
    proRecommended: false,
    commonMistakes: ["Installing cartridge backwards", "Not matching exact cartridge model", "Forcing stuck cartridge"],
    videoSearchTerms: ["cartridge faucet repair", "faucet cartridge replacement", "single handle faucet fix"],
    relatedRepairs: ["faucet_compression_fix", "water_pressure_low", "faucet_aerator_clean"],
    upsellService: "Full kitchen/bathroom faucet upgrade"
  },
  {
    id: "plumbing_clogged_sink_drain",
    name: "Clear Clogged Sink Drain",
    category: "plumbing",
    subcategory: "drain",
    difficulty: 2,
    estimatedTime: "30-60 minutes",
    estimatedCost: "$5-20",
    symptoms: ["water drains slowly", "water backs up", "gurgling sounds", "bad odors from drain"],
    diagnosis: "Hair, grease, soap scum, or food particles blocking drain",
    tools: [
      { name: "Plunger (sink)", price: "$8-15" },
      { name: "Drain snake/auger", price: "$15-30" },
      { name: "Adjustable pliers", price: "$12-20" }
    ],
    parts: [
      { name: "Drain cleaner (enzyme-based)", price: "$8-15" },
      { name: "Baking soda", price: "$2-4" },
      { name: "White vinegar", price: "$3-5" }
    ],
    steps: [
      "Remove drain stopper or strainer if possible",
      "Clear visible debris by hand (wear gloves)",
      "Try plunging with sink plunger (cover overflow if present)",
      "Pour 1/2 cup baking soda down drain",
      "Follow with 1 cup white vinegar",
      "Cover drain with stopper for 15 minutes",
      "Flush with hot water",
      "If still clogged, use drain snake through drain opening",
      "Work snake back and forth to break up blockage",
      "Run hot water to flush loosened debris",
      "Replace drain stopper or strainer"
    ],
    safetyLevel: "green",
    safetyWarnings: ["Wear gloves when handling debris", "Avoid mixing different drain cleaners"],
    proRecommended: false,
    commonMistakes: ["Using too much chemical drain cleaner", "Not removing stopper first", "Forcing snake too aggressively"],
    videoSearchTerms: ["unclog sink drain", "drain snake use", "natural drain cleaning"],
    relatedRepairs: ["garbage_disposal_jam", "p_trap_clean", "clogged_tub_drain"],
    upsellService: "Professional drain cleaning and inspection"
  },
  {
    id: "plumbing_garbage_disposal_reset",
    name: "Reset Garbage Disposal",
    category: "plumbing",
    subcategory: "disposal",
    difficulty: 1,
    estimatedTime: "5-15 minutes",
    estimatedCost: "$0-5",
    symptoms: ["disposal won't turn on", "humming but not grinding", "tripped breaker", "no sound at all"],
    diagnosis: "Disposal overheated or jammed, reset button tripped",
    tools: [
      { name: "Flashlight", price: "$5-10" },
      { name: "Allen wrench (usually 1/4\")", price: "$3-8" }
    ],
    parts: [],
    steps: [
      "Turn off disposal switch at wall",
      "Check circuit breaker - reset if tripped",
      "Look under sink for disposal reset button (usually red)",
      "Press reset button firmly until it clicks",
      "If button won't stay in, wait 15 minutes for motor to cool",
      "Try reset button again after cooling period",
      "Turn disposal switch back on",
      "Test by running cold water and turning on disposal",
      "If still not working, check for jams",
      "Turn off power and use Allen wrench in bottom center to manually turn motor"
    ],
    safetyLevel: "green",
    safetyWarnings: ["Never put hands in disposal", "Always turn off power before manual rotation"],
    proRecommended: false,
    commonMistakes: ["Not waiting for motor to cool", "Forgetting to turn power back on", "Not running water when testing"],
    videoSearchTerms: ["garbage disposal reset", "disposal not working", "disposal troubleshooting"],
    relatedRepairs: ["garbage_disposal_jam", "garbage_disposal_replace", "electrical_breaker_reset"],
    upsellService: "Garbage disposal maintenance and inspection"
  },
  {
    id: "plumbing_garbage_disposal_jam",
    name: "Unjam Garbage Disposal",
    category: "plumbing",
    subcategory: "disposal",
    difficulty: 2,
    estimatedTime: "15-30 minutes",
    estimatedCost: "$0-10",
    symptoms: ["humming but not grinding", "disposal won't turn", "unusual noises", "reset button keeps tripping"],
    diagnosis: "Foreign object or food debris jamming disposal blades",
    tools: [
      { name: "Allen wrench (1/4\" hex)", price: "$3-8" },
      { name: "Flashlight", price: "$5-10" },
      { name: "Tongs or pliers", price: "$8-15" }
    ],
    parts: [
      { name: "Ice cubes", price: "$1" },
      { name: "Rock salt", price: "$3-5" }
    ],
    steps: [
      "Turn off disposal switch and unplug unit or turn off breaker",
      "Shine flashlight into disposal opening",
      "Use tongs to remove any visible objects (never use hands)",
      "Insert Allen wrench into hex socket under disposal",
      "Turn wrench back and forth to manually rotate disposal",
      "Work until disposal turns freely in both directions",
      "Remove Allen wrench and plug disposal back in",
      "Press reset button under unit",
      "Turn on cold water and test disposal briefly",
      "If working, grind ice cubes and salt to clean blades",
      "Run cold water for 30 seconds after grinding stops"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["NEVER put hands in disposal", "Always disconnect power first", "Use only manufacturer-provided Allen wrench"],
    proRecommended: false,
    commonMistakes: ["Using wrong size Allen wrench", "Not disconnecting power", "Putting hands inside disposal"],
    videoSearchTerms: ["unjam garbage disposal", "disposal stuck", "garbage disposal maintenance"],
    relatedRepairs: ["garbage_disposal_reset", "garbage_disposal_replace", "clogged_sink_drain"],
    upsellService: "Professional disposal service and maintenance plan"
  },
  {
    id: "plumbing_water_heater_pilot",
    name: "Relight Water Heater Pilot Light",
    category: "plumbing",
    subcategory: "water_heater",
    difficulty: 2,
    estimatedTime: "15-30 minutes",
    estimatedCost: "$0-5",
    symptoms: ["no hot water", "pilot light out", "gas smell (faint)", "water takes long to heat"],
    diagnosis: "Pilot light extinguished due to draft, thermocouple failure, or gas interruption",
    tools: [
      { name: "Long lighter or matches", price: "$3-8" },
      { name: "Flashlight", price: "$5-10" }
    ],
    parts: [
      { name: "Thermocouple (if needed)", price: "$15-25" }
    ],
    steps: [
      "Turn gas control knob to 'OFF' and wait 10 minutes",
      "Check for gas smell - if strong, don't proceed, call gas company",
      "Locate pilot light assembly (usually behind access panel)",
      "Turn gas control knob to 'PILOT' position",
      "Hold down pilot button while lighting pilot with long lighter",
      "Keep pilot button pressed for 30-60 seconds after lighting",
      "Release pilot button - pilot should stay lit",
      "If pilot goes out, wait 10 minutes and repeat",
      "Once pilot stays lit, turn control to desired temperature setting",
      "Replace access panel and test hot water after 30 minutes"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Strong gas smell = stop and call professionals", "Never use regular lighter near gas", "Ensure good ventilation"],
    proRecommended: false,
    commonMistakes: ["Not waiting long enough between attempts", "Releasing pilot button too quickly", "Not checking for gas leaks"],
    videoSearchTerms: ["light water heater pilot", "pilot light won't stay lit", "gas water heater pilot"],
    relatedRepairs: ["water_heater_thermostat", "water_heater_flush", "gas_smell_check"],
    upsellService: "Annual water heater maintenance and inspection"
  },
  {
    id: "plumbing_toilet_fill_valve",
    name: "Replace Toilet Fill Valve",
    category: "plumbing",
    subcategory: "toilet",
    difficulty: 3,
    estimatedTime: "1-2 hours",
    estimatedCost: "$15-30",
    symptoms: ["toilet keeps running", "weak flush", "water level wrong", "noisy filling"],
    diagnosis: "Fill valve worn out, not shutting off properly, or internal parts damaged",
    tools: [
      { name: "Adjustable pliers", price: "$12-20" },
      { name: "Sponge", price: "$3-5" },
      { name: "Bucket", price: "$8-15" }
    ],
    parts: [
      { name: "Universal fill valve", price: "$15-25" },
      { name: "Supply line (if needed)", price: "$8-15" }
    ],
    steps: [
      "Turn off water supply valve behind toilet",
      "Flush toilet and hold handle to empty tank",
      "Sponge out remaining water from tank",
      "Disconnect water supply line from bottom of tank",
      "Remove old fill valve by unscrewing locknut under tank",
      "Install new fill valve according to manufacturer's instructions",
      "Adjust height so valve is 1 inch above rim",
      "Hand-tighten locknut from underneath",
      "Reconnect water supply line",
      "Turn water back on and let tank fill",
      "Adjust water level and flush linkage as needed",
      "Test several flushes to ensure proper operation"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Water will spill when disconnecting supply line", "Don't over-tighten plastic nuts"],
    proRecommended: false,
    commonMistakes: ["Not adjusting water level properly", "Over-tightening connections", "Wrong valve height"],
    videoSearchTerms: ["replace toilet fill valve", "toilet fill valve installation", "toilet running water fix"],
    relatedRepairs: ["toilet_flapper_replace", "toilet_water_level", "supply_line_replace"],
    upsellService: "Complete toilet rebuild kit installation"
  },
  {
    id: "plumbing_toilet_flapper",
    name: "Replace Toilet Flapper",
    category: "plumbing",
    subcategory: "toilet",
    difficulty: 1,
    estimatedTime: "15-30 minutes",
    estimatedCost: "$3-10",
    symptoms: ["toilet runs after flushing", "weak flush", "water constantly running", "visible warped rubber"],
    diagnosis: "Flapper warped, cracked, or not seating properly on flush valve seat",
    tools: [
      { name: "None required", price: "$0" }
    ],
    parts: [
      { name: "Universal toilet flapper", price: "$3-8" },
      { name: "Flapper chain", price: "$2-4" }
    ],
    steps: [
      "Turn off water supply valve behind toilet",
      "Remove toilet tank lid and set aside safely",
      "Flush toilet to empty tank",
      "Unhook old flapper chain from flush handle arm",
      "Remove old flapper from flush valve seat",
      "Clean flush valve seat of any debris or mineral buildup",
      "Install new flapper, ensuring proper fit on valve seat",
      "Attach chain with slight slack (about 1/2 inch)",
      "Turn water supply back on",
      "Test flush - flapper should close completely when tank is full",
      "Adjust chain length if needed for proper sealing"
    ],
    safetyLevel: "green",
    safetyWarnings: [],
    proRecommended: false,
    commonMistakes: ["Chain too tight or too loose", "Not cleaning valve seat first", "Wrong size flapper"],
    videoSearchTerms: ["replace toilet flapper", "toilet flapper installation", "fix running toilet"],
    relatedRepairs: ["toilet_chain_adjust", "toilet_fill_valve", "toilet_running_water"],
    upsellService: "Complete toilet maintenance and tune-up"
  },
  {
    id: "plumbing_wax_ring_replace",
    name: "Replace Toilet Wax Ring",
    category: "plumbing",
    subcategory: "toilet",
    difficulty: 4,
    estimatedTime: "2-4 hours",
    estimatedCost: "$10-25",
    symptoms: ["water around toilet base", "sewer smell", "toilet rocks when sat on", "stained flooring around toilet"],
    diagnosis: "Wax ring seal between toilet and floor flange deteriorated",
    tools: [
      { name: "Adjustable wrench", price: "$12-20" },
      { name: "Putty knife", price: "$5-10" },
      { name: "Level", price: "$15-25" },
      { name: "Gloves", price: "$5-8" }
    ],
    parts: [
      { name: "Wax ring with flange", price: "$5-12" },
      { name: "Toilet bolts", price: "$3-8" },
      { name: "Toilet shims", price: "$3-6" }
    ],
    steps: [
      "Turn off water supply and flush toilet completely",
      "Disconnect water supply line from toilet tank",
      "Remove toilet tank if one-piece unit is too heavy",
      "Remove nuts from toilet base bolts",
      "Carefully lift toilet straight up and set aside",
      "Scrape old wax ring completely from toilet base and flange",
      "Check flange for damage and repair if needed",
      "Install new wax ring on toilet base (not flange)",
      "Lower toilet straight down onto bolts and flange",
      "Press down firmly and rock slightly to set wax ring",
      "Install washers and nuts on bolts, tighten alternately",
      "Reconnect water supply and test for leaks"
    ],
    safetyLevel: "red",
    safetyWarnings: ["Toilet is very heavy - get help", "Sewer gases can be dangerous", "Wear gloves for sanitation"],
    proRecommended: true,
    commonMistakes: ["Not centering toilet on flange", "Over-tightening bolts", "Reusing old wax ring"],
    videoSearchTerms: ["replace toilet wax ring", "toilet installation", "toilet base leak repair"],
    relatedRepairs: ["toilet_bolt_tighten", "floor_damage_repair", "toilet_install"],
    upsellService: "Professional toilet removal, installation, and flooring inspection"
  },
  {
    id: "plumbing_p_trap_clean",
    name: "Clean P-Trap Under Sink",
    category: "plumbing",
    subcategory: "drain",
    difficulty: 2,
    estimatedTime: "30-45 minutes",
    estimatedCost: "$5-15",
    symptoms: ["sink drains slowly", "bad odors from drain", "gurgling sounds", "water backing up"],
    diagnosis: "P-trap clogged with hair, soap scum, food particles, or grease buildup",
    tools: [
      { name: "Adjustable pliers", price: "$12-20" },
      { name: "Bucket", price: "$8-15" },
      { name: "Wire brush", price: "$5-10" },
      { name: "Gloves", price: "$5-8" }
    ],
    parts: [
      { name: "P-trap washers (if worn)", price: "$3-8" }
    ],
    steps: [
      "Place bucket under P-trap to catch water",
      "Loosen slip nuts on both ends of P-trap by hand or with pliers",
      "Remove P-trap carefully - water and debris will spill out",
      "Take P-trap to utility sink or outside for cleaning",
      "Remove all debris and buildup with wire brush",
      "Rinse thoroughly with hot water",
      "Check washers for damage and replace if needed",
      "Apply thin layer of plumber's putty to washers",
      "Reinstall P-trap with hand-tightened connections",
      "Run water to test for leaks",
      "Tighten connections slightly more if needed, but don't over-tighten"
    ],
    safetyLevel: "green",
    safetyWarnings: ["Wear gloves - contents can be unsanitary", "Don't over-tighten plastic nuts"],
    proRecommended: false,
    commonMistakes: ["Over-tightening slip nuts", "Not aligning trap properly", "Losing washers"],
    videoSearchTerms: ["clean P-trap", "remove sink trap", "unclog bathroom sink"],
    relatedRepairs: ["clogged_sink_drain", "supply_line_replace", "faucet_leak_fix"],
    upsellService: "Complete drain cleaning and inspection service"
  },
  {
    id: "plumbing_showerhead_replace",
    name: "Replace Showerhead",
    category: "plumbing",
    subcategory: "shower",
    difficulty: 1,
    estimatedTime: "15-30 minutes",
    estimatedCost: "$15-50",
    symptoms: ["low water pressure", "uneven spray", "mineral buildup", "leaking from head"],
    diagnosis: "Showerhead clogged with mineral deposits or internal parts damaged",
    tools: [
      { name: "Adjustable wrench", price: "$12-20" },
      { name: "Pipe tape", price: "$3-5" }
    ],
    parts: [
      { name: "New showerhead", price: "$15-50" },
      { name: "Teflon tape", price: "$3-5" }
    ],
    steps: [
      "Turn off water supply or close shower valve",
      "Unscrew old showerhead by turning counterclockwise",
      "Use adjustable wrench if hand removal doesn't work",
      "Clean threads on shower arm with wire brush",
      "Wrap shower arm threads with 2-3 layers of Teflon tape",
      "Wrap tape clockwise when looking at the threads",
      "Thread new showerhead on by hand until snug",
      "Use wrench to tighten additional 1/2 turn (don't over-tighten)",
      "Turn water back on and test for leaks",
      "Test all spray settings if multiple options available"
    ],
    safetyLevel: "green",
    safetyWarnings: ["Don't over-tighten and crack shower arm threads"],
    proRecommended: false,
    commonMistakes: ["Over-tightening showerhead", "Wrong direction with Teflon tape", "Not cleaning threads first"],
    videoSearchTerms: ["replace showerhead", "install showerhead", "showerhead upgrade"],
    relatedRepairs: ["shower_arm_replace", "water_pressure_fix", "shower_valve_repair"],
    upsellService: "Complete shower upgrade and valve replacement"
  },
  {
    id: "plumbing_toilet_handle_fix",
    name: "Fix Loose Toilet Handle",
    category: "plumbing",
    subcategory: "toilet",
    difficulty: 1,
    estimatedTime: "10-20 minutes",
    estimatedCost: "$3-15",
    symptoms: ["handle jiggles loosely", "have to hold handle down to flush", "handle sticks", "handle falls off"],
    diagnosis: "Handle mounting nut loose, handle arm bent, or internal spring broken",
    tools: [
      { name: "Adjustable pliers", price: "$12-20" }
    ],
    parts: [
      { name: "Replacement handle (if needed)", price: "$8-15" }
    ],
    steps: [
      "Remove toilet tank lid and set aside safely",
      "Check handle mounting nut inside tank (reverse threads)",
      "Tighten mounting nut by turning counterclockwise",
      "Test handle operation with tank lid off",
      "Check that handle arm moves freely without binding",
      "Adjust chain connection if handle doesn't lift flapper properly",
      "If handle is cracked or broken, unscrew completely",
      "Install new handle with mounting nut (remember reverse threads)",
      "Adjust chain length for proper flapper operation",
      "Replace tank lid and test multiple flushes"
    ],
    safetyLevel: "green",
    safetyWarnings: ["Remember toilet handle nuts have reverse threads"],
    proRecommended: false,
    commonMistakes: ["Turning mounting nut wrong direction", "Over-tightening plastic parts", "Not adjusting chain length"],
    videoSearchTerms: ["fix toilet handle", "loose toilet handle", "toilet handle replacement"],
    relatedRepairs: ["toilet_flapper_replace", "toilet_chain_adjust", "toilet_running_fix"],
    upsellService: "Complete toilet maintenance service"
  },
  {
    id: "plumbing_supply_line_replace",
    name: "Replace Supply Line",
    category: "plumbing",
    subcategory: "supply",
    difficulty: 2,
    estimatedTime: "30-45 minutes",
    estimatedCost: "$8-20",
    symptoms: ["water leaking from connection", "bulging or kinked line", "low water pressure", "old braided line"],
    diagnosis: "Supply line deteriorated, connections loose, or line kinked",
    tools: [
      { name: "Adjustable wrench", price: "$12-20" }
    ],
    parts: [
      { name: "Braided supply line", price: "$8-15" },
      { name: "Shut-off valve (if needed)", price: "$12-25" }
    ],
    steps: [
      "Turn off water supply at shut-off valve",
      "Place bucket under connections to catch water",
      "Disconnect old supply line from shut-off valve",
      "Disconnect other end from toilet or faucet",
      "Measure length needed for new supply line",
      "Connect new supply line to shut-off valve first",
      "Hand-tighten, then use wrench for additional 1/2 turn",
      "Connect other end to fixture using same technique",
      "Turn water supply back on slowly",
      "Check both connections for leaks",
      "Tighten slightly more if minor leaks occur"
    ],
    safetyLevel: "green",
    safetyWarnings: ["Don't over-tighten and crack fittings", "Turn water on slowly to avoid water hammer"],
    proRecommended: false,
    commonMistakes: ["Over-tightening connections", "Wrong length supply line", "Not using proper washers"],
    videoSearchTerms: ["replace supply line", "toilet supply line", "faucet supply line installation"],
    relatedRepairs: ["shut_off_valve_replace", "toilet_leak_fix", "faucet_installation"],
    upsellService: "Complete plumbing supply line inspection and upgrade"
  },
  {
    id: "plumbing_water_pressure_low",
    name: "Fix Low Water Pressure",
    category: "plumbing",
    subcategory: "pressure",
    difficulty: 2,
    estimatedTime: "30-60 minutes",
    estimatedCost: "$5-25",
    symptoms: ["weak water flow", "reduced pressure at one fixture", "pressure drops when multiple fixtures used", "slow-filling toilet"],
    diagnosis: "Clogged aerator, mineral buildup in fixtures, or partially closed valves",
    tools: [
      { name: "Adjustable pliers", price: "$12-20" },
      { name: "Old toothbrush", price: "$1-3" },
      { name: "Small bowl", price: "$3-8" }
    ],
    parts: [
      { name: "White vinegar", price: "$3-5" },
      { name: "New aerators (if needed)", price: "$3-10 each" }
    ],
    steps: [
      "Check if problem affects one fixture or whole house",
      "For single fixture, remove and clean aerator",
      "Soak aerator in vinegar for 30 minutes to dissolve minerals",
      "Scrub with old toothbrush to remove stubborn buildup",
      "Check for partially closed shut-off valves under fixtures",
      "Open valves completely if found partially closed",
      "For showerheads, remove and clean or replace",
      "Test water pressure after each cleaned fixture",
      "If whole-house issue, check main water valve",
      "Contact water company if pressure problem persists"
    ],
    safetyLevel: "green",
    safetyWarnings: [],
    proRecommended: false,
    commonMistakes: ["Not cleaning aerator screens thoroughly", "Missing partially closed valves", "Assuming whole-house problem too quickly"],
    videoSearchTerms: ["fix low water pressure", "clean faucet aerator", "improve water pressure"],
    relatedRepairs: ["faucet_aerator_clean", "showerhead_replace", "shut_off_valve_adjust"],
    upsellService: "Complete water pressure analysis and system upgrade"
  },
  {
    id: "plumbing_frozen_pipes_thaw",
    name: "Thaw Frozen Pipes",
    category: "plumbing",
    subcategory: "pipes",
    difficulty: 3,
    estimatedTime: "1-3 hours",
    estimatedCost: "$10-30",
    symptoms: ["no water flow", "reduced water pressure", "frost on exposed pipes", "strange sounds from pipes"],
    diagnosis: "Pipes frozen due to cold weather, often in unheated areas",
    tools: [
      { name: "Hair dryer", price: "$20-40" },
      { name: "Heat lamp", price: "$25-50" },
      { name: "Towels", price: "$10-20" }
    ],
    parts: [
      { name: "Pipe insulation", price: "$5-15" },
      { name: "Heat tape", price: "$15-30" }
    ],
    steps: [
      "Turn on affected faucets to allow water flow when thawed",
      "Locate frozen section by feeling along pipes for cold spots",
      "Apply heat starting from faucet end working toward frozen area",
      "Use hair dryer on low heat setting, keeping it moving",
      "Wrap pipes in towels soaked with hot water",
      "Never use open flame, torch, or high heat sources",
      "Be patient - thawing takes time and rushing can burst pipes",
      "Check for leaks once water starts flowing",
      "Insulate pipes to prevent future freezing",
      "Leave faucets slightly open during cold snaps"
    ],
    safetyLevel: "red",
    safetyWarnings: ["Never use open flame or excessive heat", "Burst pipes can cause flooding", "Electrical appliances near water are dangerous"],
    proRecommended: true,
    commonMistakes: ["Using excessive heat causing pipe damage", "Not starting from faucet end", "Ignoring burst pipe signs"],
    videoSearchTerms: ["thaw frozen pipes", "prevent frozen pipes", "pipe insulation"],
    relatedRepairs: ["pipe_insulation_install", "burst_pipe_repair", "faucet_dripping_fix"],
    upsellService: "Professional pipe insulation and freeze prevention system"
  },
  {
    id: "plumbing_sump_pump_check",
    name: "Test and Maintain Sump Pump",
    category: "plumbing",
    subcategory: "pump",
    difficulty: 3,
    estimatedTime: "45-90 minutes",
    estimatedCost: "$10-25",
    symptoms: ["pump not turning on", "strange noises", "pump runs constantly", "water in basement"],
    diagnosis: "Float switch stuck, pump clogged, or electrical connection issue",
    tools: [
      { name: "Flashlight", price: "$5-10" },
      { name: "Bucket", price: "$8-15" }
    ],
    parts: [
      { name: "Pump oil (if needed)", price: "$8-15" }
    ],
    steps: [
      "Check that pump is plugged in and getting power",
      "Remove sump pump cover carefully",
      "Check float switch moves freely up and down",
      "Pour water into sump pit to test automatic operation",
      "Listen for unusual noises during operation",
      "Check discharge pipe for clogs or ice blockage",
      "Test backup power if system has battery backup",
      "Clean debris from around pump intake",
      "Check oil level if pump requires lubrication",
      "Ensure pump sits level on bottom of pit",
      "Replace cover and mark test date on calendar"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Electrical equipment near water", "Heavy pump components", "Potential sewer gas exposure"],
    proRecommended: false,
    commonMistakes: ["Not testing regularly", "Ignoring strange noises", "Blocking discharge pipe outlet"],
    videoSearchTerms: ["sump pump maintenance", "test sump pump", "sump pump troubleshooting"],
    relatedRepairs: ["basement_water_issues", "electrical_outlet_check", "drainage_problems"],
    upsellService: "Professional sump pump installation and backup system"
  },
  {
    id: "plumbing_hose_bib_repair",
    name: "Fix Leaky Hose Bib",
    category: "plumbing",
    subcategory: "outdoor",
    difficulty: 3,
    estimatedTime: "1-2 hours",
    estimatedCost: "$10-30",
    symptoms: ["water dripping from spout", "leaking around handle", "hard to turn on/off", "no water flow"],
    diagnosis: "Worn packing, damaged seat washer, or freeze damage to internal components",
    tools: [
      { name: "Adjustable wrench", price: "$12-20" },
      { name: "Screwdriver", price: "$8-15" },
      { name: "Seat dresser tool", price: "$15-25" }
    ],
    parts: [
      { name: "Packing washers", price: "$3-8" },
      { name: "Seat washers", price: "$3-8" },
      { name: "Packing string", price: "$3-5" }
    ],
    steps: [
      "Turn off water supply to hose bib at main valve",
      "Open hose bib to drain remaining water",
      "Remove handle by unscrewing or pulling off",
      "Use adjustable wrench to remove packing nut",
      "Pull out stem assembly carefully",
      "Replace seat washer on bottom of stem",
      "Replace packing washers and O-rings",
      "Check valve seat for damage and dress if needed",
      "Apply thin coat of plumber's grease to new parts",
      "Reassemble in reverse order",
      "Turn water supply back on",
      "Test operation and check for leaks"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Turn off main water supply first", "Frozen hose bibs may have internal damage"],
    proRecommended: false,
    commonMistakes: ["Not turning off main supply", "Wrong size washers", "Over-tightening stem assembly"],
    videoSearchTerms: ["fix hose bib", "outdoor faucet repair", "spigot leak fix"],
    relatedRepairs: ["freeze_proof_faucet_install", "main_water_shut_off", "outdoor_plumbing_winterize"],
    upsellService: "Freeze-proof hose bib installation and outdoor plumbing upgrade"
  },
  {
    id: "plumbing_shut_off_valve_replace",
    name: "Replace Shut-Off Valve",
    category: "plumbing",
    subcategory: "valve",
    difficulty: 4,
    estimatedTime: "1-3 hours",
    estimatedCost: "$15-40",
    symptoms: ["valve won't turn", "water leaking from valve", "valve handle broken", "can't stop water flow"],
    diagnosis: "Valve stem damaged, packing worn out, or internal components failed",
    tools: [
      { name: "Pipe wrench", price: "$15-25" },
      { name: "Adjustable wrench", price: "$12-20" },
      { name: "Pipe cutter", price: "$20-35" }
    ],
    parts: [
      { name: "New shut-off valve", price: "$12-30" },
      { name: "Compression fittings", price: "$5-15" },
      { name: "Pipe joint compound", price: "$5-10" }
    ],
    steps: [
      "Turn off main water supply to house",
      "Open faucets to drain water from lines",
      "Place bucket under work area",
      "Use pipe wrench to disconnect old valve",
      "Cut pipe if valve is soldered or corroded on",
      "Clean pipe ends thoroughly",
      "Install new valve with proper orientation (arrow shows flow direction)",
      "Use compression fittings or appropriate connections",
      "Apply pipe joint compound to threaded connections",
      "Tighten connections with wrenches - don't over-tighten",
      "Turn main water supply back on slowly",
      "Test new valve operation and check for leaks"
    ],
    safetyLevel: "red",
    safetyWarnings: ["Must shut off main water supply", "Copper pipes may contain lead solder", "Heavy pipe wrenches can cause injury"],
    proRecommended: true,
    commonMistakes: ["Not shutting off main water", "Installing valve backwards", "Over-tightening and cracking fittings"],
    videoSearchTerms: ["replace shut off valve", "angle stop valve replacement", "plumbing valve installation"],
    relatedRepairs: ["main_water_shut_off", "supply_line_replace", "pipe_joint_repair"],
    upsellService: "Complete plumbing valve inspection and upgrade service"
  },
  {
    id: "plumbing_clogged_tub_drain",
    name: "Clear Bathtub Drain Clog",
    category: "plumbing",
    subcategory: "drain",
    difficulty: 3,
    estimatedTime: "1-2 hours",
    estimatedCost: "$10-30",
    symptoms: ["tub drains slowly", "water stands in tub", "gurgling sounds", "soap scum ring"],
    diagnosis: "Hair and soap buildup in drain, P-trap, or main drain line",
    tools: [
      { name: "Drain snake/auger", price: "$15-30" },
      { name: "Plunger (tub)", price: "$10-20" },
      { name: "Screwdriver", price: "$8-15" }
    ],
    parts: [
      { name: "Drain cleaner (enzyme)", price: "$8-15" },
      { name: "Baking soda", price: "$2-4" },
      { name: "White vinegar", price: "$3-5" }
    ],
    steps: [
      "Remove drain stopper or strainer mechanism",
      "Pull out visible hair and debris by hand (wear gloves)",
      "Try plunging with cup plunger (cover overflow drain)",
      "If not clear, use drain snake through drain opening",
      "Work snake in circular motion to catch hair clogs",
      "Pull out snake slowly to remove caught debris",
      "Try baking soda and vinegar treatment",
      "Pour 1/2 cup baking soda, then 1 cup vinegar",
      "Cover drain for 15 minutes, then flush with hot water",
      "Use enzyme drain cleaner for ongoing maintenance",
      "Reinstall drain stopper or strainer"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Wear gloves when handling debris", "Don't mix different chemical drain cleaners", "Be careful with drain snake to avoid pipe damage"],
    proRecommended: false,
    commonMistakes: ["Not removing all hair from snake", "Using excessive chemical cleaners", "Forcing snake too aggressively"],
    videoSearchTerms: ["unclog bathtub drain", "remove hair from drain", "bathtub drain snake"],
    relatedRepairs: ["tub_overflow_clean", "p_trap_clean", "main_drain_clear"],
    upsellService: "Professional drain cleaning and video inspection"
  },
  {
    id: "plumbing_toilet_water_level",
    name: "Adjust Toilet Water Level",
    category: "plumbing",
    subcategory: "toilet",
    difficulty: 2,
    estimatedTime: "15-30 minutes",
    estimatedCost: "$0-5",
    symptoms: ["weak flush", "water level too high/low", "toilet runs after flushing", "water overflows into overflow tube"],
    diagnosis: "Float adjustment needed, fill valve needs adjustment, or flapper chain wrong length",
    tools: [
      { name: "Screwdriver", price: "$8-15" }
    ],
    parts: [],
    steps: [
      "Remove toilet tank lid and identify fill valve type",
      "Check current water level - should be 1 inch below rim",
      "For float ball: bend float arm up to raise level, down to lower",
      "For float cup: squeeze clip and slide cup up/down on rod",
      "For newer fill valves: turn adjustment screw on top",
      "Test by flushing and observing refill cycle",
      "Water should stop when level reaches proper height",
      "Adjust flapper chain if water level affects flush strength",
      "Make small adjustments and test after each change",
      "Replace tank lid when satisfied with operation"
    ],
    safetyLevel: "green",
    safetyWarnings: [],
    proRecommended: false,
    commonMistakes: ["Making large adjustments at once", "Not testing after each adjustment", "Confusing water level with flush problems"],
    videoSearchTerms: ["adjust toilet water level", "toilet float adjustment", "toilet fill valve adjustment"],
    relatedRepairs: ["toilet_fill_valve", "toilet_flapper_replace", "toilet_running_fix"],
    upsellService: "Complete toilet performance optimization"
  },
  {
    id: "plumbing_garbage_disposal_replace",
    name: "Replace Garbage Disposal",
    category: "plumbing",
    subcategory: "disposal",
    difficulty: 4,
    estimatedTime: "2-4 hours",
    estimatedCost: "$100-300",
    symptoms: ["disposal completely dead", "motor burned out", "housing cracked", "frequent jams"],
    diagnosis: "Motor failure, internal damage, or disposal beyond repair",
    tools: [
      { name: "Screwdriver set", price: "$15-25" },
      { name: "Adjustable pliers", price: "$12-20" },
      { name: "Wire nuts", price: "$5-10" }
    ],
    parts: [
      { name: "New garbage disposal", price: "$80-250" },
      { name: "Mounting assembly (if needed)", price: "$20-40" }
    ],
    steps: [
      "Turn off power at breaker and under-sink switch",
      "Disconnect disposal from drain pipe and dishwasher",
      "Disconnect electrical connections (note wire colors)",
      "Support disposal and twist counterclockwise to remove",
      "Remove old mounting assembly if replacing",
      "Install new mounting assembly on sink drain",
      "Connect electrical wires using wire nuts (black to black, white to white)",
      "Attach new disposal by lifting and twisting clockwise",
      "Connect drain pipe and dishwasher drain hose",
      "Turn power back on and test operation",
      "Run water and test disposal with small amount of food waste"
    ],
    safetyLevel: "red",
    safetyWarnings: ["Turn off power at breaker", "Heavy unit - get help lifting", "Electrical connections near water"],
    proRecommended: true,
    commonMistakes: ["Not supporting disposal weight", "Wrong electrical connections", "Not following local codes"],
    videoSearchTerms: ["install garbage disposal", "replace garbage disposal", "disposal electrical connection"],
    relatedRepairs: ["electrical_outlet_install", "sink_plumbing_connect", "dishwasher_drain_connect"],
    upsellService: "Professional disposal installation with warranty and electrical certification"
  },
  {
    id: "plumbing_water_heater_flush",
    name: "Flush Water Heater Tank",
    category: "plumbing",
    subcategory: "water_heater",
    difficulty: 3,
    estimatedTime: "2-3 hours",
    estimatedCost: "$5-15",
    symptoms: ["rumbling noises", "reduced hot water", "discolored water", "longer heating times"],
    diagnosis: "Sediment buildup in tank bottom reducing efficiency and capacity",
    tools: [
      { name: "Garden hose", price: "$15-30" },
      { name: "Adjustable wrench", price: "$12-20" }
    ],
    parts: [
      { name: "Drain valve (if needed)", price: "$8-15" }
    ],
    steps: [
      "Turn off power to electric heater or gas to gas heater",
      "Let water heater cool for several hours",
      "Turn off cold water supply valve to heater",
      "Connect garden hose to drain valve at bottom",
      "Run hose to floor drain or outside area",
      "Open hot water faucet somewhere in house",
      "Open drain valve and let tank drain completely",
      "Turn cold water back on briefly to stir up sediment",
      "Continue draining until water runs clear",
      "Close drain valve and remove hose",
      "Turn cold water supply back on",
      "Turn power/gas back on when tank is full"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Water will be very hot initially", "Gas water heaters need proper relighting", "Heavy sediment may clog drain"],
    proRecommended: false,
    commonMistakes: ["Not letting heater cool first", "Forgetting to open hot water faucet", "Not flushing until water clears"],
    videoSearchTerms: ["flush water heater", "drain water heater tank", "water heater maintenance"],
    relatedRepairs: ["water_heater_anode_rod", "water_heater_thermostat", "water_heater_pilot_light"],
    upsellService: "Annual water heater maintenance and inspection service"
  },
  {
    id: "plumbing_bidet_install",
    name: "Install Bidet Toilet Seat",
    category: "plumbing",
    subcategory: "toilet",
    difficulty: 3,
    estimatedTime: "1-2 hours",
    estimatedCost: "$200-600",
    symptoms: ["want bidet functionality", "upgrading bathroom", "existing seat worn out"],
    diagnosis: "Installation of bidet seat for improved hygiene and comfort",
    tools: [
      { name: "Adjustable wrench", price: "$12-20" },
      { name: "Screwdriver", price: "$8-15" },
      { name: "Level", price: "$15-25" }
    ],
    parts: [
      { name: "Bidet toilet seat", price: "$200-500" },
      { name: "T-valve connector", price: "$15-25" },
      { name: "Supply line (if needed)", price: "$8-15" }
    ],
    steps: [
      "Turn off water supply to toilet",
      "Remove existing toilet seat",
      "Install bidet mounting plate on toilet bowl",
      "Connect T-valve to toilet fill valve",
      "Connect bidet water supply line to T-valve",
      "Mount bidet seat on mounting plate",
      "Connect electrical cord to nearby GFCI outlet",
      "Turn water supply back on",
      "Follow manufacturer's setup instructions",
      "Test all bidet functions (spray, heat, etc.)",
      "Adjust water pressure and temperature settings"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Requires nearby GFCI electrical outlet", "Water connections must be tight", "Follow electrical safety"],
    proRecommended: false,
    commonMistakes: ["Not installing GFCI outlet first", "Wrong toilet compatibility", "Not following setup sequence"],
    videoSearchTerms: ["install bidet toilet seat", "bidet seat installation", "toilet seat replacement"],
    relatedRepairs: ["electrical_outlet_gfci", "toilet_seat_replace", "water_supply_connect"],
    upsellService: "Professional bidet installation with electrical outlet installation"
  },
  {
    id: "plumbing_faucet_aerator_clean",
    name: "Clean Faucet Aerator",
    category: "plumbing",
    subcategory: "faucet",
    difficulty: 1,
    estimatedTime: "15-30 minutes",
    estimatedCost: "$3-8",
    symptoms: ["reduced water flow", "uneven spray pattern", "mineral buildup visible", "low pressure at one faucet"],
    diagnosis: "Aerator screen clogged with mineral deposits, sediment, or debris",
    tools: [
      { name: "Adjustable pliers", price: "$12-20" },
      { name: "Old toothbrush", price: "$1-3" },
      { name: "Small bowl", price: "$3-8" }
    ],
    parts: [
      { name: "White vinegar", price: "$3-5" },
      { name: "New aerator (if needed)", price: "$3-10" }
    ],
    steps: [
      "Unscrew aerator from faucet spout by turning counterclockwise",
      "Use pliers with cloth protection if aerator is stuck",
      "Disassemble aerator components in order",
      "Soak all parts in white vinegar for 30 minutes",
      "Scrub screens and parts with old toothbrush",
      "Rinse all parts thoroughly with clean water",
      "Check screens for damage - replace if necessary",
      "Reassemble aerator in reverse order",
      "Thread aerator back onto faucet by hand",
      "Turn on water and test flow pattern",
      "Adjust by hand-tightening if needed"
    ],
    safetyLevel: "green",
    safetyWarnings: [],
    proRecommended: false,
    commonMistakes: ["Losing small aerator parts", "Over-tightening with pliers", "Not reassembling in correct order"],
    videoSearchTerms: ["clean faucet aerator", "fix low water pressure", "faucet maintenance"],
    relatedRepairs: ["water_pressure_low", "faucet_leak_fix", "showerhead_clean"],
    upsellService: "Complete faucet maintenance and upgrade service"
  },
  {
    id: "plumbing_main_water_shut_off",
    name: "Locate and Test Main Water Shut-Off",
    category: "plumbing",
    subcategory: "emergency",
    difficulty: 2,
    estimatedTime: "30-45 minutes",
    estimatedCost: "$0-10",
    symptoms: ["need to shut off water", "emergency preparation", "plumbing maintenance", "water leak somewhere"],
    diagnosis: "Essential knowledge for emergency plumbing situations",
    tools: [
      { name: "Water meter key", price: "$8-15" },
      { name: "Adjustable wrench", price: "$12-20" }
    ],
    parts: [
      { name: "Valve lubricant", price: "$5-10" }
    ],
    steps: [
      "Check near water meter (usually at street or property line)",
      "Look for shut-off valve on house side of meter",
      "Alternative location: where main line enters house",
      "Test valve by turning clockwise to close",
      "Check that water stops flowing to house fixtures",
      "Turn valve counterclockwise to restore water",
      "Mark valve location for future reference",
      "Take photo of valve location and save to phone",
      "Make sure all family members know location",
      "Exercise valve annually to prevent seizure",
      "Apply lubricant if valve is stiff to operate"
    ],
    safetyLevel: "green",
    safetyWarnings: ["Don't force stuck valves", "Notify water company if meter valve issues"],
    proRecommended: false,
    commonMistakes: ["Not knowing difference between meter valve and house valve", "Never testing valve operation", "Forcing stuck valve"],
    videoSearchTerms: ["locate main water shut off", "how to turn off house water", "water emergency preparation"],
    relatedRepairs: ["shut_off_valve_replace", "emergency_plumbing_prep", "pipe_burst_emergency"],
    upsellService: "Home plumbing emergency preparedness consultation"
  },

  // ELECTRICAL REPAIRS (40 repairs)
  {
    id: "electrical_gfci_reset",
    name: "Reset GFCI Outlet",
    category: "electrical",
    subcategory: "outlet",
    difficulty: 1,
    estimatedTime: "5-10 minutes",
    estimatedCost: "$0",
    symptoms: ["outlet not working", "red light on outlet", "test/reset buttons visible", "appliance suddenly stopped"],
    diagnosis: "GFCI outlet tripped due to ground fault or electrical imbalance",
    tools: [],
    parts: [],
    steps: [
      "Locate GFCI outlet with TEST and RESET buttons",
      "Unplug any devices connected to the outlet",
      "Press the RESET button firmly until it clicks",
      "Look for green light or indicator that it's reset",
      "If RESET won't stay in, press TEST button first",
      "Then press RESET button again",
      "Test outlet with a lamp or device",
      "Check other outlets on same circuit - they may work now too",
      "Press TEST button monthly to verify GFCI function",
      "If GFCI keeps tripping, investigate for ground fault"
    ],
    safetyLevel: "green",
    safetyWarnings: ["If GFCI won't reset, there may be a wiring problem", "Don't use outlet if it keeps tripping"],
    proRecommended: false,
    commonMistakes: ["Not unplugging devices first", "Not testing GFCI function regularly", "Ignoring repeated tripping"],
    videoSearchTerms: ["reset GFCI outlet", "GFCI troubleshooting", "test GFCI outlet"],
    relatedRepairs: ["outlet_not_working", "breaker_reset", "electrical_safety_check"],
    upsellService: "Complete home GFCI protection upgrade"
  },
  {
    id: "electrical_breaker_reset",
    name: "Reset Circuit Breaker",
    category: "electrical",
    subcategory: "panel",
    difficulty: 1,
    estimatedTime: "5-15 minutes",
    estimatedCost: "$0",
    symptoms: ["power out to room or area", "breaker in middle position", "breaker won't stay on", "appliances not working"],
    diagnosis: "Circuit breaker tripped due to overload or electrical fault",
    tools: [
      { name: "Flashlight", price: "$5-10" }
    ],
    parts: [],
    steps: [
      "Turn off lights and unplug devices in affected area",
      "Locate electrical panel/breaker box",
      "Find tripped breaker (usually in middle position between ON/OFF)",
      "Push breaker fully to OFF position first",
      "Then push breaker firmly to ON position",
      "Listen for clicking sound when breaker engages",
      "Test power in affected area",
      "If breaker trips again immediately, there's likely a wiring problem",
      "Gradually plug devices back in to identify overload cause",
      "Consider redistributing high-power devices to different circuits"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Don't touch metal parts of panel", "If breaker keeps tripping, stop and call electrician", "Keep panel area clear"],
    proRecommended: false,
    commonMistakes: ["Not pushing breaker fully OFF first", "Ignoring repeatedly tripping breaker", "Overloading circuit again"],
    videoSearchTerms: ["reset circuit breaker", "breaker keeps tripping", "electrical panel basics"],
    relatedRepairs: ["gfci_reset", "outlet_not_working", "overloaded_circuit"],
    upsellService: "Electrical panel inspection and load analysis"
  },
  {
    id: "electrical_outlet_replace",
    name: "Replace Standard Electrical Outlet",
    category: "electrical",
    subcategory: "outlet",
    difficulty: 3,
    estimatedTime: "30-60 minutes",
    estimatedCost: "$5-20",
    symptoms: ["outlet not gripping plugs", "scorch marks around outlet", "outlet loose in wall", "sparking when plugging in"],
    diagnosis: "Outlet receptacle worn out, damaged, or loose connections",
    tools: [
      { name: "Screwdriver set", price: "$15-25" },
      { name: "Wire strippers", price: "$12-20" },
      { name: "Voltage tester", price: "$15-30" }
    ],
    parts: [
      { name: "New outlet", price: "$3-15" },
      { name: "Wire nuts (if needed)", price: "$3-8" }
    ],
    steps: [
      "Turn off power to outlet at circuit breaker",
      "Test outlet with voltage tester to confirm power is off",
      "Remove outlet cover plate",
      "Unscrew outlet from electrical box",
      "Carefully pull outlet out of box",
      "Take photo of wire connections before disconnecting",
      "Remove wires from old outlet terminals",
      "Connect wires to new outlet (hot to brass, neutral to silver, ground to green)",
      "Fold wires back into box carefully",
      "Screw new outlet to electrical box",
      "Install cover plate",
      "Turn power back on and test outlet"
    ],
    safetyLevel: "red",
    safetyWarnings: ["ALWAYS turn off power first", "Use voltage tester to verify power is off", "Never work on live circuits"],
    proRecommended: true,
    commonMistakes: ["Not turning off power", "Wrong wire connections", "Forcing too many wires in box"],
    videoSearchTerms: ["replace electrical outlet", "outlet installation", "electrical outlet wiring"],
    relatedRepairs: ["switch_replace", "gfci_outlet_install", "electrical_box_install"],
    upsellService: "Complete electrical outlet upgrade and safety inspection"
  },
  {
    id: "electrical_switch_replace",
    name: "Replace Light Switch",
    category: "electrical",
    subcategory: "switch",
    difficulty: 3,
    estimatedTime: "30-45 minutes",
    estimatedCost: "$5-25",
    symptoms: ["switch not working", "switch gets hot", "toggle loose or broken", "lights flickering"],
    diagnosis: "Switch mechanism worn out or electrical connections loose",
    tools: [
      { name: "Screwdriver set", price: "$15-25" },
      { name: "Wire strippers", price: "$12-20" },
      { name: "Voltage tester", price: "$15-30" }
    ],
    parts: [
      { name: "New light switch", price: "$3-20" },
      { name: "Wire nuts (if needed)", price: "$3-8" }
    ],
    steps: [
      "Turn off power to switch at circuit breaker",
      "Test switch with voltage tester - check both terminals",
      "Remove switch cover plate",
      "Unscrew switch from electrical box",
      "Pull switch out and examine wire connections",
      "Take photo of existing wiring before disconnecting",
      "Remove wires from old switch terminals",
      "Connect wires to new switch terminals in same configuration",
      "Ensure all connections are tight",
      "Fold wires back into box",
      "Screw new switch to electrical box",
      "Install cover plate and turn power back on"
    ],
    safetyLevel: "red",
    safetyWarnings: ["Turn off power at breaker first", "Test with voltage tester", "Three-way switches are more complex"],
    proRecommended: true,
    commonMistakes: ["Not identifying hot wire correctly", "Wrong connections on three-way switches", "Not testing power off"],
    videoSearchTerms: ["replace light switch", "light switch wiring", "single pole switch installation"],
    relatedRepairs: ["dimmer_switch_install", "outlet_replace", "three_way_switch"],
    upsellService: "Complete lighting control upgrade with smart switches"
  },
  {
    id: "electrical_dimmer_install",
    name: "Install Dimmer Switch",
    category: "electrical",
    subcategory: "switch",
    difficulty: 3,
    estimatedTime: "45-60 minutes",
    estimatedCost: "$15-50",
    symptoms: ["want dimming capability", "upgrading lighting control", "current switch not working"],
    diagnosis: "Installing dimmer for variable lighting control and energy savings",
    tools: [
      { name: "Screwdriver set", price: "$15-25" },
      { name: "Wire strippers", price: "$12-20" },
      { name: "Voltage tester", price: "$15-30" }
    ],
    parts: [
      { name: "Dimmer switch", price: "$15-40" },
      { name: "Wire nuts", price: "$3-8" }
    ],
    steps: [
      "Turn off power to switch at circuit breaker",
      "Remove existing switch and test wires with voltage tester",
      "Check that bulbs are dimmable (LED/CFL compatibility)",
      "Connect dimmer ground wire to box ground wire",
      "Connect dimmer hot leads to existing switch wires",
      "Follow dimmer manufacturer's wiring diagram",
      "Secure all wire connections with wire nuts",
      "Fold wires carefully into electrical box",
      "Attach dimmer to box with screws provided",
      "Install dimmer cover plate",
      "Turn power back on and test dimmer operation",
      "Adjust minimum light level if dimmer has trim control"
    ],
    safetyLevel: "red",
    safetyWarnings: ["Must use dimmable bulbs", "Check dimmer compatibility with LED bulbs", "Three-way dimmers need special wiring"],
    proRecommended: true,
    commonMistakes: ["Using non-dimmable bulbs", "Wrong wiring for three-way circuits", "Not matching dimmer load rating"],
    videoSearchTerms: ["install dimmer switch", "dimmer switch wiring", "LED dimmer installation"],
    relatedRepairs: ["light_switch_replace", "led_bulb_install", "three_way_dimmer"],
    upsellService: "Smart lighting system installation with app control"
  },
  {
    id: "electrical_ceiling_fan_install",
    name: "Install Ceiling Fan",
    category: "electrical",
    subcategory: "fixture",
    difficulty: 4,
    estimatedTime: "2-4 hours",
    estimatedCost: "$100-300",
    symptoms: ["want ceiling fan", "replacing light fixture", "improving air circulation"],
    diagnosis: "Installation of ceiling fan for air circulation and lighting",
    tools: [
      { name: "Screwdriver set", price: "$15-25" },
      { name: "Wire strippers", price: "$12-20" },
      { name: "Ladder", price: "$100-200" },
      { name: "Stud finder", price: "$20-40" }
    ],
    parts: [
      { name: "Ceiling fan", price: "$80-250" },
      { name: "Fan-rated electrical box", price: "$15-30" },
      { name: "Wire nuts", price: "$3-8" }
    ],
    steps: [
      "Turn off power at breaker and test wires",
      "Remove existing light fixture",
      "Check that electrical box is fan-rated (marked for 50+ lbs)",
      "Replace box with fan-rated box if necessary",
      "Assemble fan according to manufacturer instructions",
      "Mount fan bracket to electrical box securely",
      "Connect fan wires to house wires (match colors)",
      "Use wire nuts for all connections",
      "Hang fan motor on mounting bracket",
      "Attach fan blades to motor",
      "Install light kit if included",
      "Turn power back on and test all functions"
    ],
    safetyLevel: "red",
    safetyWarnings: ["Must use fan-rated electrical box", "Fan is heavy - get help", "Improper mounting can cause fan to fall"],
    proRecommended: true,
    commonMistakes: ["Using regular electrical box", "Wrong wire connections", "Unbalanced fan installation"],
    videoSearchTerms: ["install ceiling fan", "ceiling fan wiring", "fan rated electrical box"],
    relatedRepairs: ["electrical_box_install", "light_fixture_replace", "wall_switch_install"],
    upsellService: "Professional ceiling fan installation with wall control and balancing"
  },
  {
    id: "electrical_light_fixture_replace",
    name: "Replace Light Fixture",
    category: "electrical",
    subcategory: "fixture",
    difficulty: 3,
    estimatedTime: "1-2 hours",
    estimatedCost: "$30-150",
    symptoms: ["fixture not working", "outdated style", "want brighter lighting", "fixture damaged"],
    diagnosis: "Replacing old or damaged light fixture with new one",
    tools: [
      { name: "Screwdriver set", price: "$15-25" },
      { name: "Wire strippers", price: "$12-20" },
      { name: "Voltage tester", price: "$15-30" },
      { name: "Ladder", price: "$100-200" }
    ],
    parts: [
      { name: "New light fixture", price: "$25-125" },
      { name: "Wire nuts", price: "$3-8" },
      { name: "Mounting screws", price: "$3-8" }
    ],
    steps: [
      "Turn off power to fixture at circuit breaker",
      "Remove old fixture carefully (may be heavy)",
      "Test wires with voltage tester to confirm power off",
      "Take photo of existing wire connections",
      "Disconnect wires from old fixture",
      "Check electrical box mounting for new fixture weight",
      "Install new fixture mounting bracket if needed",
      "Connect new fixture wires to house wires",
      "Secure all connections with wire nuts",
      "Attach new fixture to mounting bracket",
      "Install bulbs and turn power back on",
      "Test fixture operation and light switch"
    ],
    safetyLevel: "red",
    safetyWarnings: ["Turn off power first", "Heavy fixtures need secure mounting", "Get help with heavy or large fixtures"],
    proRecommended: true,
    commonMistakes: ["Not supporting fixture weight during installation", "Wrong wire connections", "Inadequate electrical box"],
    videoSearchTerms: ["replace light fixture", "light fixture installation", "electrical fixture wiring"],
    relatedRepairs: ["ceiling_fan_install", "electrical_box_upgrade", "dimmer_switch_install"],
    upsellService: "Complete lighting upgrade with energy-efficient LED fixtures"
  },
  {
    id: "electrical_doorbell_wired",
    name: "Fix Wired Doorbell",
    category: "electrical",
    subcategory: "doorbell",
    difficulty: 2,
    estimatedTime: "1-2 hours",
    estimatedCost: "$10-40",
    symptoms: ["doorbell not ringing", "weak chime sound", "doorbell stuck on", "no sound at all"],
    diagnosis: "Doorbell button, chime unit, or transformer malfunction",
    tools: [
      { name: "Screwdriver set", price: "$15-25" },
      { name: "Multimeter", price: "$25-50" },
      { name: "Wire strippers", price: "$12-20" }
    ],
    parts: [
      { name: "Doorbell button", price: "$8-20" },
      { name: "Doorbell chime", price: "$15-40" },
      { name: "Doorbell transformer", price: "$15-30" }
    ],
    steps: [
      "Test doorbell button by pressing - listen for chime",
      "Remove doorbell button and check wire connections",
      "Touch button wires together - if chime works, replace button",
      "Check doorbell transformer (usually near electrical panel)",
      "Test transformer output with multimeter (should be 16-24V)",
      "If no voltage, replace transformer",
      "Check chime unit connections and clean contacts",
      "Test chime by manually connecting wires",
      "Replace chime unit if internal mechanism is broken",
      "Ensure all wire connections are secure",
      "Test complete system after repairs"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Doorbell transformer is connected to house power", "Low voltage but still electrical work"],
    proRecommended: false,
    commonMistakes: ["Not checking all three components", "Loose wire connections", "Wrong voltage transformer"],
    videoSearchTerms: ["fix doorbell", "doorbell troubleshooting", "doorbell wiring"],
    relatedRepairs: ["doorbell_wireless_install", "electrical_transformer_replace", "low_voltage_wiring"],
    upsellService: "Smart doorbell installation with video and app control"
  },
  {
    id: "electrical_doorbell_wireless",
    name: "Install Wireless Doorbell",
    category: "electrical",
    subcategory: "doorbell",
    difficulty: 1,
    estimatedTime: "30-60 minutes",
    estimatedCost: "$25-80",
    symptoms: ["want doorbell without wiring", "existing doorbell broken", "adding second doorbell"],
    diagnosis: "Installing wireless doorbell system for convenience and reliability",
    tools: [
      { name: "Screwdriver", price: "$8-15" },
      { name: "Drill with bits", price: "$50-100" }
    ],
    parts: [
      { name: "Wireless doorbell kit", price: "$20-60" },
      { name: "Batteries", price: "$5-10" },
      { name: "Mounting screws", price: "$3-8" }
    ],
    steps: [
      "Choose location for doorbell button near front door",
      "Install batteries in doorbell button unit",
      "Mount button unit with screws or adhesive strips",
      "Choose location for chime receiver inside house",
      "Plug receiver into electrical outlet or install batteries",
      "Test doorbell by pressing button",
      "Adjust chime volume and tone if adjustable",
      "Test range by pressing button from various distances",
      "Program multiple buttons if kit supports them",
      "Note battery replacement schedule for button unit"
    ],
    safetyLevel: "green",
    safetyWarnings: ["Check battery polarity", "Protect button unit from weather"],
    proRecommended: false,
    commonMistakes: ["Button unit not weatherproof", "Poor signal range", "Forgetting battery replacement"],
    videoSearchTerms: ["install wireless doorbell", "doorbell no wiring required", "battery doorbell setup"],
    relatedRepairs: ["doorbell_wired_fix", "smart_doorbell_install", "outdoor_mounting"],
    upsellService: "Smart video doorbell with motion detection and app alerts"
  },
  {
    id: "electrical_smoke_detector_install",
    name: "Install Smoke Detector",
    category: "electrical",
    subcategory: "safety",
    difficulty: 2,
    estimatedTime: "30-60 minutes",
    estimatedCost: "$15-50",
    symptoms: ["need smoke detection", "old detector not working", "home safety upgrade"],
    diagnosis: "Installing new smoke detector for fire safety protection",
    tools: [
      { name: "Screwdriver", price: "$8-15" },
      { name: "Drill with bits", price: "$50-100" },
      { name: "Stud finder", price: "$20-40" }
    ],
    parts: [
      { name: "Smoke detector", price: "$10-40" },
      { name: "9V battery", price: "$3-8" },
      { name: "Mounting screws", price: "$3-8" }
    ],
    steps: [
      "Choose location on ceiling or high on wall",
      "Avoid areas near kitchen, bathroom, or vents",
      "Hold mounting bracket in position and mark screw holes",
      "Drill pilot holes if mounting to drywall",
      "Attach mounting bracket with screws",
      "Install battery in smoke detector",
      "Attach detector to mounting bracket",
      "Test detector with test button",
      "Test with actual smoke if safe to do so",
      "Note battery replacement date on detector",
      "Test monthly and replace battery annually"
    ],
    safetyLevel: "green",
    safetyWarnings: ["Don't install too close to cooking areas", "Test monthly for proper operation"],
    proRecommended: false,
    commonMistakes: ["Poor location choice", "Not testing regularly", "Forgetting battery replacement"],
    videoSearchTerms: ["install smoke detector", "smoke alarm placement", "home fire safety"],
    relatedRepairs: ["carbon_monoxide_detector", "hardwired_smoke_detector", "smoke_detector_battery"],
    upsellService: "Whole-home interconnected smoke detection system"
  },
  {
    id: "electrical_co_detector_install",
    name: "Install Carbon Monoxide Detector",
    category: "electrical",
    subcategory: "safety",
    difficulty: 2,
    estimatedTime: "30-45 minutes",
    estimatedCost: "$25-60",
    symptoms: ["need CO protection", "gas appliances in home", "safety requirement", "old detector expired"],
    diagnosis: "Installing CO detector to protect against carbon monoxide poisoning",
    tools: [
      { name: "Screwdriver", price: "$8-15" },
      { name: "Drill with bits", price: "$50-100" }
    ],
    parts: [
      { name: "CO detector", price: "$20-50" },
      { name: "Batteries", price: "$5-10" },
      { name: "Mounting hardware", price: "$3-8" }
    ],
    steps: [
      "Choose location 15-20 feet from fuel-burning appliances",
      "Install at knee height or follow manufacturer instructions",
      "Avoid dead air spaces like corners or near vents",
      "Mount detector according to type (plug-in or battery)",
      "Install batteries if battery-powered unit",
      "Test detector with test button",
      "Note expiration date (usually 5-10 years)",
      "Program location in detector if digital display model",
      "Test monthly and replace batteries as needed",
      "Replace entire unit when it reaches expiration date"
    ],
    safetyLevel: "green",
    safetyWarnings: ["CO is deadly - never ignore alarms", "Replace detector on expiration date", "Install near bedrooms"],
    proRecommended: false,
    commonMistakes: ["Wrong installation height", "Installing too close to appliances", "Not checking expiration date"],
    videoSearchTerms: ["install carbon monoxide detector", "CO detector placement", "carbon monoxide safety"],
    relatedRepairs: ["smoke_detector_install", "gas_appliance_check", "home_safety_inspection"],
    upsellService: "Complete home gas safety inspection and detection system"
  },
  {
    id: "electrical_under_cabinet_lighting",
    name: "Install Under-Cabinet Lighting",
    category: "electrical",
    subcategory: "lighting",
    difficulty: 3,
    estimatedTime: "2-4 hours",
    estimatedCost: "$50-200",
    symptoms: ["dark countertops", "poor kitchen lighting", "want task lighting", "kitchen upgrade"],
    diagnosis: "Installing under-cabinet lighting for improved task lighting",
    tools: [
      { name: "Screwdriver set", price: "$15-25" },
      { name: "Wire strippers", price: "$12-20" },
      { name: "Drill with bits", price: "$50-100" }
    ],
    parts: [
      { name: "LED light strips or fixtures", price: "$30-150" },
      { name: "Power supply/transformer", price: "$20-50" },
      { name: "Wire and connectors", price: "$10-30" }
    ],
    steps: [
      "Plan lighting layout and measure cabinet lengths",
      "Choose power source (outlet or hardwired)",
      "Install LED strips or fixtures under cabinets",
      "Run low-voltage wire between fixtures",
      "Connect all fixtures to power supply",
      "Install wall switch if hardwired",
      "Mount power supply in accessible location",
      "Test all lights before final installation",
      "Secure all wiring and connectors",
      "Add wire management clips to hide wires",
      "Test switch operation and dimming if applicable"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Turn off power if hardwiring", "Use proper low-voltage connections", "Keep transformers ventilated"],
    proRecommended: false,
    commonMistakes: ["Poor wire management", "Wrong transformer size", "Uneven light distribution"],
    videoSearchTerms: ["install under cabinet lighting", "LED strip installation", "kitchen task lighting"],
    relatedRepairs: ["outlet_install", "dimmer_switch_install", "kitchen_electrical_upgrade"],
    upsellService: "Complete kitchen lighting design and smart control installation"
  },
  {
    id: "electrical_motion_sensor_light",
    name: "Install Motion Sensor Light",
    category: "electrical",
    subcategory: "lighting",
    difficulty: 3,
    estimatedTime: "1-2 hours",
    estimatedCost: "$25-80",
    symptoms: ["want automatic lighting", "security lighting", "convenience lighting", "energy savings"],
    diagnosis: "Installing motion sensor for automatic lighting control",
    tools: [
      { name: "Screwdriver set", price: "$15-25" },
      { name: "Wire strippers", price: "$12-20" },
      { name: "Voltage tester", price: "$15-30" }
    ],
    parts: [
      { name: "Motion sensor switch or fixture", price: "$20-60" },
      { name: "Wire nuts", price: "$3-8" }
    ],
    steps: [
      "Turn off power to existing light or switch",
      "Remove existing switch or fixture",
      "Test wires to ensure power is off",
      "Connect motion sensor according to wiring diagram",
      "Install sensor switch or fixture in existing location",
      "Turn power back on and test basic operation",
      "Adjust sensitivity settings for desired range",
      "Set time delay for how long light stays on",
      "Test motion detection from various angles",
      "Adjust sensor position if needed for best coverage",
      "Program any additional settings per manufacturer"
    ],
    safetyLevel: "red",
    safetyWarnings: ["Turn off power before wiring", "Follow manufacturer's wiring diagram exactly"],
    proRecommended: true,
    commonMistakes: ["Wrong wire connections", "Poor sensor positioning", "Not adjusting sensitivity properly"],
    videoSearchTerms: ["install motion sensor light", "motion detector wiring", "automatic light switch"],
    relatedRepairs: ["light_switch_replace", "outdoor_lighting_install", "security_lighting"],
    upsellService: "Complete home automation and smart lighting system"
  },
  {
    id: "electrical_smart_switch_install",
    name: "Install Smart Light Switch",
    category: "electrical",
    subcategory: "smart_home",
    difficulty: 4,
    estimatedTime: "1-2 hours",
    estimatedCost: "$30-100",
    symptoms: ["want app control", "voice control compatibility", "scheduling capability", "home automation"],
    diagnosis: "Installing smart switch for remote control and automation",
    tools: [
      { name: "Screwdriver set", price: "$15-25" },
      { name: "Wire strippers", price: "$12-20" },
      { name: "Voltage tester", price: "$15-30" }
    ],
    parts: [
      { name: "Smart switch", price: "$25-80" },
      { name: "Wire nuts", price: "$3-8" },
      { name: "Neutral pigtail (if needed)", price: "$3-8" }
    ],
    steps: [
      "Turn off power and test with voltage tester",
      "Remove existing switch and identify wires",
      "Check if neutral wire is available (required for most smart switches)",
      "Install neutral wire if not present in box",
      "Connect smart switch per manufacturer diagram",
      "Secure all wire connections with wire nuts",
      "Install switch in electrical box",
      "Turn power back on and test basic operation",
      "Download manufacturer's app and create account",
      "Follow app setup instructions to connect switch",
      "Test remote control and configure settings"
    ],
    safetyLevel: "red",
    safetyWarnings: ["Most smart switches require neutral wire", "WiFi setup required", "Complex wiring configurations"],
    proRecommended: true,
    commonMistakes: ["No neutral wire available", "WiFi connection issues", "Incorrect wiring connections"],
    videoSearchTerms: ["install smart switch", "smart light switch wiring", "WiFi switch setup"],
    relatedRepairs: ["neutral_wire_install", "wifi_troubleshooting", "smart_home_setup"],
    upsellService: "Complete smart home lighting and control system installation"
  },
  {
    id: "electrical_usb_outlet_install",
    name: "Install USB Outlet",
    category: "electrical",
    subcategory: "outlet",
    difficulty: 3,
    estimatedTime: "30-60 minutes",
    estimatedCost: "$20-40",
    symptoms: ["need charging stations", "eliminate wall adapters", "convenient device charging", "outlet upgrade"],
    diagnosis: "Installing USB outlet for convenient device charging",
    tools: [
      { name: "Screwdriver set", price: "$15-25" },
      { name: "Wire strippers", price: "$12-20" },
      { name: "Voltage tester", price: "$15-30" }
    ],
    parts: [
      { name: "USB outlet", price: "$15-35" },
      { name: "Wire nuts", price: "$3-8" }
    ],
    steps: [
      "Turn off power to outlet at circuit breaker",
      "Test outlet with voltage tester to confirm power off",
      "Remove existing outlet and cover plate",
      "Take photo of existing wire connections",
      "Disconnect wires from old outlet",
      "Connect wires to new USB outlet (same configuration)",
      "Ensure ground wire is connected if present",
      "Fold wires back into electrical box",
      "Secure USB outlet to box with screws",
      "Install new cover plate",
      "Turn power back on and test both regular and USB ports",
      "Test USB charging with device"
    ],
    safetyLevel: "red",
    safetyWarnings: ["Turn off power first", "USB outlets generate some heat during charging"],
    proRecommended: true,
    commonMistakes: ["Not connecting ground wire", "Overloading USB ports", "Poor wire connections"],
    videoSearchTerms: ["install USB outlet", "USB wall outlet replacement", "charging station outlet"],
    relatedRepairs: ["outlet_replace", "gfci_outlet_install", "electrical_upgrade"],
    upsellService: "Whole-home USB outlet upgrade and device charging consultation"
  },
  {
    id: "electrical_outdoor_lighting_install",
    name: "Install Outdoor Lighting",
    category: "electrical",
    subcategory: "outdoor",
    difficulty: 4,
    estimatedTime: "2-4 hours",
    estimatedCost: "$50-200",
    symptoms: ["dark walkways", "security lighting needed", "landscape enhancement", "outdoor entertaining"],
    diagnosis: "Installing outdoor lighting for safety, security, and aesthetics",
    tools: [
      { name: "Screwdriver set", price: "$15-25" },
      { name: "Wire strippers", price: "$12-20" },
      { name: "Shovel", price: "$25-40" },
      { name: "Wire nuts (outdoor rated)", price: "$5-12" }
    ],
    parts: [
      { name: "Outdoor light fixtures", price: "$30-150" },
      { name: "Low voltage cable", price: "$20-50" },
      { name: "Transformer", price: "$50-150" }
    ],
    steps: [
      "Plan lighting layout and measure distances",
      "Choose between line voltage or low voltage system",
      "Install outdoor-rated electrical box for fixtures",
      "Run appropriate electrical cable to fixtures",
      "Install transformer if using low voltage system",
      "Mount fixtures at appropriate heights",
      "Make all electrical connections with outdoor-rated materials",
      "Bury cables at proper depth per local codes",
      "Install timer or photocell control if desired",
      "Test all fixtures and adjust as needed",
      "Mark cable locations for future reference"
    ],
    safetyLevel: "red",
    safetyWarnings: ["Must use outdoor-rated materials", "Bury cables to proper depth", "GFCI protection required"],
    proRecommended: true,
    commonMistakes: ["Not using outdoor-rated components", "Improper cable burial", "No GFCI protection"],
    videoSearchTerms: ["install outdoor lighting", "landscape lighting installation", "low voltage outdoor lights"],
    relatedRepairs: ["gfci_outlet_install", "outdoor_electrical_box", "timer_switch_install"],
    upsellService: "Professional landscape lighting design and installation with smart controls"
  },
  {
    id: "electrical_holiday_lights_install",
    name: "Install Holiday Lights Safely",
    category: "electrical",
    subcategory: "seasonal",
    difficulty: 2,
    estimatedTime: "2-4 hours",
    estimatedCost: "$50-200",
    symptoms: ["holiday decorating", "exterior lighting display", "seasonal decoration", "festive lighting"],
    diagnosis: "Safe installation of temporary holiday lighting displays",
    tools: [
      { name: "Ladder", price: "$100-200" },
      { name: "Light clips", price: "$10-25" },
      { name: "Extension cords (outdoor)", price: "$20-50" }
    ],
    parts: [
      { name: "Holiday light strings", price: "$20-100" },
      { name: "Outdoor timer", price: "$15-40" },
      { name: "GFCI outlet adapter", price: "$15-30" }
    ],
    steps: [
      "Test all light strings before installation",
      "Plan layout and measure distances needed",
      "Use only outdoor-rated lights and extension cords",
      "Install GFCI protection if not already present",
      "Use proper clips designed for your roof/gutter type",
      "Hang lights with clips, not nails or staples",
      "Connect strings end-to-end following manufacturer limits",
      "Install outdoor timer for automatic operation",
      "Secure all connections from weather",
      "Test complete installation before finishing",
      "Plan safe removal method for after season"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Use ladder safely - have someone spot you", "Never exceed string connection limits", "Use GFCI protection"],
    proRecommended: false,
    commonMistakes: ["Overloading circuits", "Using indoor lights outdoors", "Not securing connections from weather"],
    videoSearchTerms: ["hang holiday lights safely", "Christmas light installation", "outdoor holiday decorating"],
    relatedRepairs: ["gfci_outlet_install", "outdoor_outlet_install", "timer_switch_install"],
    upsellService: "Professional holiday lighting installation and removal service"
  },
  {
    id: "electrical_landscape_lighting",
    name: "Install Low Voltage Landscape Lighting",
    category: "electrical",
    subcategory: "landscape",
    difficulty: 3,
    estimatedTime: "4-8 hours",
    estimatedCost: "$200-600",
    symptoms: ["want landscape accent lighting", "pathway lighting", "security lighting", "curb appeal improvement"],
    diagnosis: "Installing low voltage lighting system for landscape enhancement",
    tools: [
      { name: "Shovel", price: "$25-40" },
      { name: "Wire strippers", price: "$12-20" },
      { name: "Multimeter", price: "$25-50" }
    ],
    parts: [
      { name: "Low voltage transformer", price: "$100-300" },
      { name: "Landscape fixtures", price: "$100-400" },
      { name: "Low voltage cable", price: "$50-150" }
    ],
    steps: [
      "Design lighting layout and calculate total wattage",
      "Choose transformer size (125% of total load)",
      "Install transformer near electrical outlet with GFCI",
      "Stake out fixture locations and cable runs",
      "Dig trenches 6-8 inches deep for cable runs",
      "Install fixtures at appropriate locations",
      "Run low voltage cable from transformer to fixtures",
      "Make connections using waterproof connectors",
      "Bury cables and backfill trenches",
      "Connect transformer and test all fixtures",
      "Install timer or photocell control",
      "Adjust fixture positions and angles"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Call utility marking service before digging", "Use only low voltage landscape fixtures"],
    proRecommended: false,
    commonMistakes: ["Undersized transformer", "Poor cable connections", "Fixtures too close together"],
    videoSearchTerms: ["install landscape lighting", "low voltage outdoor lighting", "landscape lighting design"],
    relatedRepairs: ["outdoor_electrical_install", "timer_installation", "photocell_install"],
    upsellService: "Professional landscape lighting design with smart controls and seasonal programming"
  },
  // Additional electrical repairs can continue following the same pattern...
  {
    id: "electrical_smoke_detector_battery",
    name: "Replace Smoke Detector Battery",
    category: "electrical",
    subcategory: "maintenance",
    difficulty: 1,
    estimatedTime: "10-15 minutes",
    estimatedCost: "$5-15",
    symptoms: ["chirping sound", "low battery warning", "detector not responding to test", "annual maintenance"],
    diagnosis: "Smoke detector battery needs replacement for continued protection",
    tools: [
      { name: "Step ladder", price: "$50-100" }
    ],
    parts: [
      { name: "9V battery", price: "$3-8" },
      { name: "Lithium battery (10-year)", price: "$8-15" }
    ],
    steps: [
      "Identify which detector is chirping (walk around house)",
      "Use step ladder to safely reach detector",
      "Remove detector from mounting bracket",
      "Open battery compartment",
      "Remove old battery and note proper orientation",
      "Insert new battery matching positive/negative markings",
      "Close battery compartment securely",
      "Reattach detector to mounting bracket",
      "Press test button to verify operation",
      "Write battery replacement date on detector",
      "Test detector monthly going forward"
    ],
    safetyLevel: "green",
    safetyWarnings: ["Use ladder safely", "Don't ignore low battery warnings"],
    proRecommended: false,
    commonMistakes: ["Wrong battery type", "Not testing after replacement", "Ignoring chirping sounds"],
    videoSearchTerms: ["replace smoke detector battery", "smoke alarm battery change", "stop smoke detector chirping"],
    relatedRepairs: ["smoke_detector_install", "carbon_monoxide_battery", "hardwired_smoke_detector"],
    upsellService: "Upgrade to 10-year lithium battery detectors or hardwired interconnected system"
  },

  // WALLS & SURFACES REPAIRS (35 repairs)
  {
    id: "walls_nail_holes_small",
    name: "Fill Small Nail Holes",
    category: "walls",
    subcategory: "holes",
    difficulty: 1,
    estimatedTime: "30-60 minutes",
    estimatedCost: "$5-15",
    symptoms: ["small holes from nails", "picture hanging holes", "tiny dents in wall", "pin holes"],
    diagnosis: "Small holes that need filling and touching up before painting",
    tools: [
      { name: "Putty knife", price: "$5-12" },
      { name: "Sandpaper (120 grit)", price: "$5-10" }
    ],
    parts: [
      { name: "Spackling compound", price: "$5-12" },
      { name: "Touch-up paint", price: "$8-20" }
    ],
    steps: [
      "Clean loose debris from holes",
      "Apply small amount of spackling compound with putty knife",
      "Press compound into hole and scrape excess smooth",
      "Allow to dry completely (usually 2-4 hours)",
      "Sand lightly with fine sandpaper if needed",
      "Wipe area clean with damp cloth",
      "Apply primer if hole was deep or wood is exposed",
      "Apply touch-up paint with small brush",
      "Feather paint edges to blend with surrounding wall",
      "Allow first coat to dry, apply second if needed"
    ],
    safetyLevel: "green",
    safetyWarnings: [],
    proRecommended: false,
    commonMistakes: ["Overfilling holes", "Not letting compound dry completely", "Visible repair due to poor blending"],
    videoSearchTerms: ["fill nail holes", "spackle small holes", "wall hole repair"],
    relatedRepairs: ["paint_touch_up", "drywall_small_holes", "wall_preparation"],
    upsellService: "Complete wall preparation and repainting service"
  },
  {
    id: "walls_drywall_holes_small",
    name: "Patch Small Drywall Holes",
    category: "walls",
    subcategory: "drywall",
    difficulty: 2,
    estimatedTime: "1-2 hours",
    estimatedCost: "$10-25",
    symptoms: ["holes up to 2 inches", "doorknob holes", "small damage", "wall dings"],
    diagnosis: "Small to medium holes in drywall requiring patch and compound",
    tools: [
      { name: "Putty knife (4-6 inch)", price: "$8-15" },
      { name: "Utility knife", price: "$8-15" },
      { name: "Sandpaper", price: "$5-10" }
    ],
    parts: [
      { name: "Self-adhesive mesh patch", price: "$3-8" },
      { name: "Joint compound", price: "$8-15" },
      { name: "Primer", price: "$12-25" }
    ],
    steps: [
      "Clean hole edges and remove loose drywall",
      "Place self-adhesive mesh patch over hole",
      "Apply first coat of joint compound over patch",
      "Extend compound 2-3 inches beyond patch edges",
      "Let dry completely (24 hours)",
      "Apply second coat, feathering edges wider",
      "Sand smooth when completely dry",
      "Apply third coat if needed for smooth finish",
      "Prime repaired area before painting",
      "Paint with matching wall color"
    ],
    safetyLevel: "green",
    safetyWarnings: ["Wear dust mask when sanding"],
    proRecommended: false,
    commonMistakes: ["Not feathering edges properly", "Rushing drying time", "Visible patch after painting"],
    videoSearchTerms: ["patch drywall holes", "drywall repair small holes", "mesh patch drywall"],
    relatedRepairs: ["drywall_holes_medium", "joint_compound_application", "wall_priming"],
    upsellService: "Professional drywall repair and texture matching service"
  },
  {
    id: "walls_drywall_holes_medium",
    name: "Patch Medium Drywall Holes",
    category: "walls",
    subcategory: "drywall",
    difficulty: 3,
    estimatedTime: "2-4 hours",
    estimatedCost: "$15-40",
    symptoms: ["holes 2-6 inches", "kicked-in drywall", "large damage", "hole through wall"],
    diagnosis: "Medium-sized holes requiring backing material and multiple compound coats",
    tools: [
      { name: "Drywall saw", price: "$10-20" },
      { name: "Putty knife (6 inch)", price: "$10-18" },
      { name: "Measuring tape", price: "$10-20" },
      { name: "Pencil", price: "$1-3" }
    ],
    parts: [
      { name: "Drywall patch piece", price: "$5-15" },
      { name: "Drywall tape", price: "$3-8" },
      { name: "Joint compound", price: "$8-15" },
      { name: "Sandpaper (120 & 220 grit)", price: "$8-15" }
    ],
    steps: [
      "Cut square or rectangular outline around hole",
      "Cut backing piece from scrap wood or drywall",
      "Insert backing through hole and secure with screws",
      "Cut drywall patch to fit opening exactly",
      "Secure patch to backing with drywall screws",
      "Apply joint compound over seams and screw heads",
      "Embed drywall tape in compound over seams",
      "Apply second coat of compound, feathering edges",
      "Sand smooth when dry and apply final coat if needed",
      "Prime and paint to match existing wall"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Wear safety glasses when cutting", "Check for wires or pipes behind wall"],
    proRecommended: false,
    commonMistakes: ["Patch doesn't fit properly", "Not securing backing well", "Visible seams after finishing"],
    videoSearchTerms: ["patch large drywall hole", "drywall hole repair", "california patch method"],
    relatedRepairs: ["drywall_holes_large", "drywall_cutting", "joint_compound_finishing"],
    upsellService: "Professional drywall repair with texture matching and painting"
  },
  {
    id: "walls_drywall_holes_large",
    name: "Patch Large Drywall Holes",
    category: "walls",
    subcategory: "drywall",
    difficulty: 4,
    estimatedTime: "4-8 hours",
    estimatedCost: "$25-60",
    symptoms: ["holes larger than 6 inches", "section of wall damaged", "wall kicked through", "major damage"],
    diagnosis: "Large holes requiring full drywall replacement section",
    tools: [
      { name: "Drywall saw", price: "$10-20" },
      { name: "Utility knife", price: "$8-15" },
      { name: "T-square", price: "$15-30" },
      { name: "Drill with screwdriver bits", price: "$50-100" }
    ],
    parts: [
      { name: "Drywall sheet (partial)", price: "$15-30" },
      { name: "2x4 lumber (backing)", price: "$5-15" },
      { name: "Drywall screws", price: "$8-15" },
      { name: "Joint tape and compound", price: "$15-25" }
    ],
    steps: [
      "Mark rectangular area around damage extending to studs",
      "Cut out damaged section with drywall saw",
      "Install backing strips between studs if needed",
      "Measure and cut new drywall piece to fit opening",
      "Test fit new piece - should fit snugly",
      "Secure new drywall with screws into studs",
      "Apply joint compound and tape to all seams",
      "Apply multiple coats, feathering each wider",
      "Sand between coats for smooth finish",
      "Apply texture if needed to match existing wall",
      "Prime and paint repaired area"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Check for electrical wires or plumbing", "Wear dust mask and safety glasses"],
    proRecommended: true,
    commonMistakes: ["Not cutting to stud centers", "Poor seam finishing", "Texture doesn't match"],
    videoSearchTerms: ["replace drywall section", "large drywall patch", "drywall installation"],
    relatedRepairs: ["stud_finder_use", "texture_matching", "drywall_finishing"],
    upsellService: "Professional drywall replacement with texture matching and full room painting"
  },
  {
    id: "walls_texture_matching",
    name: "Match Wall Texture",
    category: "walls",
    subcategory: "texture",
    difficulty: 4,
    estimatedTime: "2-4 hours",
    estimatedCost: "$15-40",
    symptoms: ["repaired area doesn't match", "smooth patch on textured wall", "texture worn or damaged"],
    diagnosis: "Need to recreate wall texture to match existing finish",
    tools: [
      { name: "Texture roller", price: "$8-20" },
      { name: "Spray bottle", price: "$3-8" },
      { name: "Texture brush", price: "$5-15" },
      { name: "Paint tray", price: "$5-12" }
    ],
    parts: [
      { name: "Texture compound", price: "$10-25" },
      { name: "Joint compound", price: "$8-15" },
      { name: "Primer", price: "$12-25" }
    ],
    steps: [
      "Identify existing texture type (orange peel, knockdown, etc.)",
      "Practice texture technique on scrap drywall first",
      "Mix texture compound to proper consistency",
      "Apply base coat if needed for heavy textures",
      "Apply texture using appropriate tool and technique",
      "For orange peel: use spray bottle or texture roller",
      "For knockdown: apply texture then knock down with trowel",
      "Work quickly before texture sets up",
      "Blend texture into surrounding area",
      "Allow to dry completely before priming",
      "Prime and paint to match wall color"
    ],
    safetyLevel: "green",
    safetyWarnings: ["Practice on scrap first", "Work in manageable sections"],
    proRecommended: true,
    commonMistakes: ["Wrong texture consistency", "Not blending edges", "Rushing the process"],
    videoSearchTerms: ["match wall texture", "drywall texture repair", "orange peel texture"],
    relatedRepairs: ["drywall_compound_application", "spray_texture", "wall_priming"],
    upsellService: "Professional texture matching and wall refinishing"
  },
  {
    id: "walls_paint_prep",
    name: "Prepare Walls for Painting",
    category: "walls",
    subcategory: "preparation",
    difficulty: 2,
    estimatedTime: "2-6 hours",
    estimatedCost: "$20-60",
    symptoms: ["walls look tired", "preparing to paint", "surface imperfections", "old paint peeling"],
    diagnosis: "Proper wall preparation essential for quality paint job",
    tools: [
      { name: "Sandpaper (various grits)", price: "$10-20" },
      { name: "Putty knife", price: "$5-12" },
      { name: "Drop cloths", price: "$15-30" },
      { name: "TSP cleaner", price: "$8-15" }
    ],
    parts: [
      { name: "Spackling compound", price: "$5-12" },
      { name: "Primer", price: "$25-50" },
      { name: "Painter's tape", price: "$8-20" }
    ],
    steps: [
      "Remove all furniture or cover with drop cloths",
      "Remove switch plates and outlet covers",
      "Clean walls with TSP or degreasing cleaner",
      "Scrape off any loose or peeling paint",
      "Sand glossy surfaces lightly for paint adhesion",
      "Fill nail holes and cracks with spackling compound",
      "Sand filled areas smooth when dry",
      "Apply painter's tape to protect trim and fixtures",
      "Prime bare spots and areas with stains",
      "Prime entire wall if changing colors dramatically",
      "Remove any dust with tack cloth before painting"
    ],
    safetyLevel: "green",
    safetyWarnings: ["Wear dust mask when sanding", "Ventilate area when using chemical cleaners"],
    proRecommended: false,
    commonMistakes: ["Skipping primer", "Not cleaning walls first", "Poor taping technique"],
    videoSearchTerms: ["prepare walls for painting", "wall prep before painting", "how to prime walls"],
    relatedRepairs: ["nail_holes_fill", "paint_removal", "primer_application"],
    upsellService: "Complete painting preparation and professional painting service"
  },
  {
    id: "walls_paint_cutting_in",
    name: "Cut In Paint Edges",
    category: "walls",
    subcategory: "painting",
    difficulty: 3,
    estimatedTime: "2-4 hours",
    estimatedCost: "$10-25",
    symptoms: ["need clean paint lines", "painting around trim", "detailed paint work", "professional finish wanted"],
    diagnosis: "Cutting in provides clean edges where roller can't reach",
    tools: [
      { name: "Angled brush (2.5-3 inch)", price: "$15-30" },
      { name: "Paint cup", price: "$5-12" },
      { name: "Steady hand!", price: "$0" }
    ],
    parts: [
      { name: "Quality paint", price: "$30-70" },
      { name: "Painter's tape (optional)", price: "$8-20" }
    ],
    steps: [
      "Load brush with paint - not too much",
      "Start cutting in at ceiling line",
      "Hold brush at 45-degree angle to wall",
      "Apply steady pressure and draw smooth line",
      "Keep wet edge going to avoid lap marks",
      "Cut in around all trim, outlets, and fixtures",
      "Work in 4-6 foot sections",
      "Feather brush strokes away from edges",
      "Remove painter's tape while paint is still wet",
      "Touch up any uneven areas with brush",
      "Practice on less visible areas first"
    ],
    safetyLevel: "green",
    safetyWarnings: ["Use quality brush for best results", "Remove tape while paint is wet"],
    proRecommended: false,
    commonMistakes: ["Overloading brush", "Working too large sections", "Not maintaining wet edge"],
    videoSearchTerms: ["cut in paint edges", "painting technique cutting in", "paint brush techniques"],
    relatedRepairs: ["wall_painting_rolling", "trim_painting", "painter_tape_application"],
    upsellService: "Professional painting with perfect cut lines and finish"
  },
  {
    id: "walls_paint_rolling",
    name: "Roll Paint on Walls",
    category: "walls",
    subcategory: "painting",
    difficulty: 2,
    estimatedTime: "3-6 hours",
    estimatedCost: "$20-50",
    symptoms: ["walls need painting", "color change desired", "fresh paint needed", "covering stains"],
    diagnosis: "Proper rolling technique ensures even paint coverage",
    tools: [
      { name: "Paint roller (9 inch)", price: "$8-20" },
      { name: "Roller covers", price: "$5-15" },
      { name: "Paint tray", price: "$5-12" },
      { name: "Extension pole", price: "$15-30" }
    ],
    parts: [
      { name: "Quality paint", price: "$30-70" },
      { name: "Tray liner", price: "$3-8" }
    ],
    steps: [
      "Pour paint into tray, filling reservoir section",
      "Load roller evenly by rolling back and forth in tray",
      "Start rolling in 3x3 foot sections",
      "Use W or M pattern to distribute paint",
      "Fill in pattern with parallel strokes",
      "Maintain wet edge between sections",
      "Apply even pressure - don't press too hard",
      "Use extension pole for high areas",
      "Work from dry area into wet paint",
      "Remove tray lines with light final strokes",
      "Apply second coat if needed after first coat dries"
    ],
    safetyLevel: "green",
    safetyWarnings: ["Use drop cloths to protect floors", "Ensure adequate ventilation"],
    proRecommended: false,
    commonMistakes: ["Overloading roller", "Working too fast", "Not maintaining wet edge"],
    videoSearchTerms: ["how to roll paint", "paint roller technique", "wall painting tips"],
    relatedRepairs: ["paint_cutting_in", "paint_prep", "second_coat_application"],
    upsellService: "Professional painting with premium materials and perfect finish"
  },
  {
    id: "walls_trim_painting",
    name: "Paint Interior Trim",
    category: "walls",
    subcategory: "trim",
    difficulty: 3,
    estimatedTime: "4-8 hours",
    estimatedCost: "$30-80",
    symptoms: ["trim looks worn", "trim color change", "fresh finish needed", "paint chips on trim"],
    diagnosis: "Trim painting requires careful preparation and technique",
    tools: [
      { name: "Angled brush (2 inch)", price: "$12-25" },
      { name: "Sandpaper (120 grit)", price: "$5-10" },
      { name: "Putty knife", price: "$5-12" }
    ],
    parts: [
      { name: "Trim paint (semi-gloss or satin)", price: "$30-60" },
      { name: "Wood filler", price: "$8-15" },
      { name: "Primer", price: "$25-40" }
    ],
    steps: [
      "Remove or tape off any hardware",
      "Sand glossy surfaces lightly",
      "Fill nail holes and gaps with wood filler",
      "Sand filled areas smooth when dry",
      "Clean trim with tack cloth",
      "Apply painter's tape to protect walls",
      "Prime bare wood or stained areas",
      "Apply first coat of trim paint with brush",
      "Use long, smooth brush strokes",
      "Sand lightly between coats if needed",
      "Apply second coat for full coverage",
      "Remove tape while paint is wet"
    ],
    safetyLevel: "green",
    safetyWarnings: ["Use proper ventilation", "Remove tape while paint is still wet"],
    proRecommended: false,
    commonMistakes: ["Not sanding between coats", "Brush marks in final finish", "Paint bleeding under tape"],
    videoSearchTerms: ["paint interior trim", "trim painting technique", "baseboards painting"],
    relatedRepairs: ["trim_installation", "caulk_trim_gaps", "wall_painting"],
    upsellService: "Complete trim restoration and professional painting service"
  },
  {
    id: "walls_caulk_tub",
    name: "Caulk Around Bathtub",
    category: "walls",
    subcategory: "caulking",
    difficulty: 2,
    estimatedTime: "1-2 hours",
    estimatedCost: "$5-20",
    symptoms: ["gaps around tub", "old caulk cracking", "water getting behind tub", "mold in caulk"],
    diagnosis: "Need to remove old caulk and apply fresh waterproof seal",
    tools: [
      { name: "Caulk gun", price: "$8-15" },
      { name: "Utility knife", price: "$8-15" },
      { name: "Caulk removal tool", price: "$5-12" }
    ],
    parts: [
      { name: "Bathroom caulk (mold resistant)", price: "$5-12" },
      { name: "Caulk remover", price: "$8-15" },
      { name: "Isopropyl alcohol", price: "$3-8" }
    ],
    steps: [
      "Remove all old caulk completely",
      "Use caulk remover for stubborn residue",
      "Clean area thoroughly with alcohol",
      "Fill tub with water to simulate weight load",
      "Cut caulk tube tip at 45-degree angle",
      "Apply steady bead of caulk along joint",
      "Tool caulk line with finger or caulk tool",
      "Work in continuous motion for smooth finish",
      "Remove excess caulk immediately",
      "Allow caulk to cure before using tub",
      "Avoid getting area wet for 24 hours"
    ],
    safetyLevel: "green",
    safetyWarnings: ["Ensure good ventilation", "Don't get fresh caulk wet"],
    proRecommended: false,
    commonMistakes: ["Not removing all old caulk", "Caulking empty tub", "Not tooling caulk line"],
    videoSearchTerms: ["caulk bathtub", "bathroom caulking", "remove old caulk"],
    relatedRepairs: ["caulk_shower", "tile_grout_repair", "bathroom_waterproofing"],
    upsellService: "Complete bathroom caulking and waterproofing service"
  },
  {
    id: "walls_caulk_windows",
    name: "Caulk Around Windows",
    category: "walls",
    subcategory: "caulking",
    difficulty: 2,
    estimatedTime: "2-4 hours",
    estimatedCost: "$10-30",
    symptoms: ["drafts around windows", "gaps in trim", "energy loss", "water infiltration"],
    diagnosis: "Sealing gaps around windows improves energy efficiency",
    tools: [
      { name: "Caulk gun", price: "$8-15" },
      { name: "Utility knife", price: "$8-15" },
      { name: "Putty knife", price: "$5-12" }
    ],
    parts: [
      { name: "Paintable acrylic caulk", price: "$5-12" },
      { name: "Exterior caulk (if outside)", price: "$8-18" }
    ],
    steps: [
      "Remove old caulk and clean surfaces",
      "Check both interior and exterior sides",
      "Cut caulk tube tip to appropriate size",
      "Apply caulk to gaps between trim and wall",
      "Caulk between window frame and trim",
      "Tool caulk lines smooth with finger or tool",
      "Work on one window at a time",
      "Clean excess caulk before it dries",
      "Allow interior caulk to dry before painting",
      "Check for missed spots and touch up",
      "Repeat annually as part of maintenance"
    ],
    safetyLevel: "green",
    safetyWarnings: ["Use appropriate caulk for interior vs exterior"],
    proRecommended: false,
    commonMistakes: ["Wrong type of caulk", "Not cleaning old caulk first", "Uneven caulk lines"],
    videoSearchTerms: ["caulk windows", "window weatherproofing", "seal window gaps"],
    relatedRepairs: ["window_weatherstripping", "exterior_caulking", "energy_efficiency_improvements"],
    upsellService: "Complete home weatherization and energy efficiency upgrade"
  },
  {
    id: "walls_caulk_baseboards",
    name: "Caulk Baseboard Gaps",
    category: "walls",
    subcategory: "caulking",
    difficulty: 2,
    estimatedTime: "2-4 hours",
    estimatedCost: "$8-25",
    symptoms: ["gaps between baseboard and wall", "unfinished appearance", "dust collection in gaps"],
    diagnosis: "Caulking baseboards provides finished, professional appearance",
    tools: [
      { name: "Caulk gun", price: "$8-15" },
      { name: "Wet rag", price: "$0-3" },
      { name: "Putty knife", price: "$5-12" }
    ],
    parts: [
      { name: "Paintable latex caulk", price: "$5-12" }
    ],
    steps: [
      "Clean baseboard and wall surfaces",
      "Remove any loose paint or debris from gaps",
      "Cut caulk tube tip small for thin bead",
      "Apply thin, steady bead along baseboard top edge",
      "Work in 6-foot sections",
      "Tool caulk immediately with wet finger",
      "Wipe excess caulk with damp rag",
      "Keep rag clean and damp throughout process",
      "Check for voids and fill as needed",
      "Allow to dry before painting",
      "Prime and paint caulk to match trim"
    ],
    safetyLevel: "green",
    safetyWarnings: [],
    proRecommended: false,
    commonMistakes: ["Too large caulk bead", "Not tooling caulk smooth", "Getting caulk on wall"],
    videoSearchTerms: ["caulk baseboards", "baseboard gap filling", "trim caulking"],
    relatedRepairs: ["baseboard_installation", "trim_painting", "quarter_round_install"],
    upsellService: "Complete trim installation and finishing service"
  },
  {
    id: "walls_wallpaper_removal",
    name: "Remove Wallpaper",
    category: "walls",
    subcategory: "wallpaper",
    difficulty: 3,
    estimatedTime: "6-12 hours",
    estimatedCost: "$30-80",
    symptoms: ["outdated wallpaper", "peeling wallpaper", "want to paint walls", "wallpaper damage"],
    diagnosis: "Complete wallpaper removal before painting or applying new covering",
    tools: [
      { name: "Wallpaper scorer", price: "$8-15" },
      { name: "Putty knife (6 inch)", price: "$10-18" },
      { name: "Spray bottle", price: "$3-8" },
      { name: "Steamer (rental)", price: "$30-50/day" }
    ],
    parts: [
      { name: "Wallpaper removal solution", price: "$10-20" },
      { name: "Fabric softener", price: "$3-8" },
      { name: "TSP cleaner", price: "$8-15" }
    ],
    steps: [
      "Test small area to determine wallpaper type",
      "Score wallpaper surface with scoring tool",
      "Mix removal solution with hot water",
      "Apply solution and let soak for 15-20 minutes",
      "Start peeling at corner or seam",
      "Use putty knife to scrape stubborn areas",
      "Work in sections, keeping area wet",
      "Use steamer for difficult-to-remove paper",
      "Remove all adhesive residue from walls",
      "Clean walls with TSP to remove all residue",
      "Let walls dry completely before priming"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Wear gloves and eye protection", "Ensure good ventilation", "Test for lead paint first"],
    proRecommended: false,
    commonMistakes: ["Not scoring thoroughly", "Letting walls dry out during process", "Not removing all adhesive"],
    videoSearchTerms: ["remove wallpaper", "wallpaper removal techniques", "strip wallpaper"],
    relatedRepairs: ["wall_prep_after_wallpaper", "drywall_repair", "wall_priming"],
    upsellService: "Professional wallpaper removal and wall preparation service"
  },
  {
    id: "walls_tile_grout_repair",
    name: "Repair Tile Grout",
    category: "walls",
    subcategory: "tile",
    difficulty: 2,
    estimatedTime: "2-4 hours",
    estimatedCost: "$15-40",
    symptoms: ["cracked grout", "missing grout", "discolored grout", "grout falling out"],
    diagnosis: "Damaged grout needs removal and replacement to prevent water damage",
    tools: [
      { name: "Grout removal tool", price: "$8-20" },
      { name: "Grout float", price: "$8-15" },
      { name: "Grout sponge", price: "$5-10" }
    ],
    parts: [
      { name: "New grout (matching color)", price: "$8-20" },
      { name: "Grout sealer", price: "$10-20" }
    ],
    steps: [
      "Remove damaged grout with removal tool",
      "Clean out loose debris and dust",
      "Vacuum grout lines thoroughly",
      "Mix new grout according to package directions",
      "Apply grout with float, pressing firmly",
      "Work diagonally across tiles",
      "Remove excess grout from tile surfaces",
      "Clean tiles with damp sponge",
      "Rinse sponge frequently in clean water",
      "Allow grout to cure for 24 hours",
      "Apply grout sealer to new grout lines"
    ],
    safetyLevel: "green",
    safetyWarnings: ["Wear knee pads for floor work", "Don't get grout haze on tiles"],
    proRecommended: false,
    commonMistakes: ["Not removing enough old grout", "Grout too wet or dry", "Not sealing new grout"],
    videoSearchTerms: ["repair tile grout", "remove old grout", "grout replacement"],
    relatedRepairs: ["tile_replacement", "grout_cleaning", "tile_sealing"],
    upsellService: "Complete tile restoration and regrouting service"
  },
  {
    id: "walls_tile_replacement",
    name: "Replace Damaged Tile",
    category: "walls",
    subcategory: "tile",
    difficulty: 3,
    estimatedTime: "2-4 hours",
    estimatedCost: "$20-50",
    symptoms: ["cracked tile", "broken tile", "loose tile", "water damage behind tile"],
    diagnosis: "Individual tiles need replacement to maintain waterproof barrier",
    tools: [
      { name: "Tile cutter or wet saw", price: "$50-150" },
      { name: "Chisel and hammer", price: "$15-25" },
      { name: "Notched trowel", price: "$8-15" }
    ],
    parts: [
      { name: "Replacement tiles", price: "$10-30" },
      { name: "Tile adhesive", price: "$15-25" },
      { name: "Grout", price: "$8-20" }
    ],
    steps: [
      "Remove grout around damaged tile carefully",
      "Break out old tile with chisel and hammer",
      "Scrape old adhesive from wall surface",
      "Check wall surface for damage and repair",
      "Cut replacement tile to fit if needed",
      "Apply tile adhesive to wall with notched trowel",
      "Press new tile firmly into place",
      "Use tile spacers for proper gaps",
      "Check that tile is level with surrounding tiles",
      "Remove excess adhesive before it dries",
      "Allow adhesive to cure 24 hours before grouting",
      "Grout around new tile and seal"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Wear safety glasses when breaking tile", "Check for asbestos in old tiles"],
    proRecommended: false,
    commonMistakes: ["Not matching tile thickness", "Adhesive not spread evenly", "Tile not level"],
    videoSearchTerms: ["replace broken tile", "tile replacement", "remove ceramic tile"],
    relatedRepairs: ["grout_repair", "tile_cutting", "wall_preparation"],
    upsellService: "Professional tile replacement with perfect color and texture matching"
  },
  {
    id: "walls_backsplash_install",
    name: "Install Kitchen Backsplash",
    category: "walls",
    subcategory: "tile",
    difficulty: 4,
    estimatedTime: "8-16 hours",
    estimatedCost: "$100-400",
    symptoms: ["kitchen upgrade desired", "protect walls from splashing", "outdated backsplash", "no backsplash"],
    diagnosis: "Installing tile backsplash for protection and aesthetic improvement",
    tools: [
      { name: "Tile wet saw", price: "$100-300" },
      { name: "Notched trowel", price: "$8-15" },
      { name: "Level (2-foot)", price: "$15-30" },
      { name: "Tile spacers", price: "$5-15" }
    ],
    parts: [
      { name: "Backsplash tiles", price: "$50-300" },
      { name: "Tile adhesive", price: "$15-30" },
      { name: "Grout and sealer", price: "$20-40" },
      { name: "Edge trim pieces", price: "$20-50" }
    ],
    steps: [
      "Plan layout and measure wall area",
      "Mark level reference lines on wall",
      "Turn off power to outlets in work area",
      "Apply tile adhesive with notched trowel",
      "Install tiles starting from center working outward",
      "Use tile spacers for consistent gaps",
      "Check level frequently as you work",
      "Cut tiles to fit around outlets and fixtures",
      "Install edge trim pieces as needed",
      "Remove excess adhesive from joints",
      "Allow adhesive to cure 24-48 hours",
      "Grout tiles and seal when complete"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Turn off electrical power to outlets", "Wear safety glasses when cutting tiles"],
    proRecommended: true,
    commonMistakes: ["Poor layout planning", "Uneven tile installation", "Inadequate surface preparation"],
    videoSearchTerms: ["install kitchen backsplash", "subway tile backsplash", "tile backsplash DIY"],
    relatedRepairs: ["tile_cutting", "electrical_outlet_extension", "grout_application"],
    upsellService: "Professional backsplash design and installation with custom layouts"
  },
  {
    id: "walls_crown_molding",
    name: "Install Crown Molding",
    category: "walls",
    subcategory: "trim",
    difficulty: 4,
    estimatedTime: "6-12 hours",
    estimatedCost: "$100-300",
    symptoms: ["want elegant room finish", "hide ceiling/wall imperfections", "increase home value", "room upgrade"],
    diagnosis: "Installing crown molding adds architectural detail and finished appearance",
    tools: [
      { name: "Miter saw", price: "$200-500" },
      { name: "Nail gun", price: "$100-250" },
      { name: "Measuring tape", price: "$10-20" },
      { name: "Stud finder", price: "$20-40" }
    ],
    parts: [
      { name: "Crown molding", price: "$50-200" },
      { name: "Wood filler", price: "$8-15" },
      { name: "Finish nails", price: "$5-15" },
      { name: "Caulk", price: "$5-12" }
    ],
    steps: [
      "Measure room and calculate material needed",
      "Mark stud locations on walls",
      "Set up miter saw for crown molding angles",
      "Cut first piece with square ends for long wall",
      "Install first piece checking for level",
      "Cut coped joints for inside corners",
      "Cut miter joints for outside corners",
      "Test fit pieces before final installation",
      "Nail molding to studs and ceiling joists",
      "Fill nail holes with wood filler",
      "Caulk gaps between molding and ceiling/wall",
      "Sand, prime, and paint molding"
    ],
    safetyLevel: "yellow",
    safetyWarnings: ["Use ladder safely", "Miter saw requires proper safety precautions"],
    proRecommended: true,
    commonMistakes: ["Wrong miter angles", "Poor coped joints", "Not hitting studs when nailing"],
    videoSearchTerms: ["install crown molding", "crown molding corners", "cope crown molding"],
    relatedRepairs: ["baseboard_installation", "trim_painting", "drywall_finishing"],
    upsellService: "Professional trim carpentry with custom millwork and perfect joints"
  },
  {
    id: "walls_baseboards_install",
    name: "Install Baseboards",
    category: "walls",
    subcategory: "trim",
    difficulty: 3,
    estimatedTime: "4-8 hours",
    estimatedCost: "$75-200",
    symptoms: ["no baseboards", "damaged baseboards", "room finishing", "floor installation complete"],
    diagnosis: "Installing baseboards provides finished appearance and protects wall base",
    tools: [
      { name: "Miter saw", price: "$200-500" },
      { name: "Nail gun", price: "$100-250" },
      { name: "Measuring tape", price: "$10-20" },
      { name: "Level", price: "$15-30" }
    ],
    parts: [
      { name: "Baseboard molding", price: "$50-150" },
      { name: "Quarter round (optional)", price: "$25-75" },
      { name: "Finish nails", price: "$5-15" },
      { name: "Wood filler", price: "$8-15" }
    ],
    steps: [
      "Measure room perimeter and order materials",
      "Mark stud locations on walls",
      "Start with longest wall for first piece",
      "Cut square ends for pieces ending at doors",
      "Cut inside corners with