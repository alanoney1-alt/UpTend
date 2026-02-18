/**
 * Auto Services — Vehicle profiles, maintenance tracking, diagnosis, parts search, OBD codes, tutorials
 *
 * Same model as home services: diagnose → coach → find parts → buy → or book a pro.
 */

import { pool } from "../db.js";
import { analyzeImages } from "./ai/openai-vision-client.js";

// ─── Vehicle Management ─────────────────────────────────────

export async function addVehicle(customerId: string, vehicleData: {
  year?: number; make?: string; model?: string; trim?: string; vin?: string;
  mileage?: number; color?: string; licensePlate?: string; purchaseDate?: string;
  purchasePrice?: number; oilType?: string; tireSize?: string; batterySize?: string;
  engineSize?: string; transmission?: string; fuelType?: string; photo?: string;
  nickname?: string;
}) {
  const v = vehicleData;
  const result = await pool.query(
    `INSERT INTO customer_vehicles (customer_id, year, make, model, trim, vin, mileage, color,
      license_plate, purchase_date, purchase_price, oil_type, tire_size, battery_size,
      engine_size, transmission, fuel_type, photo, nickname)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
     RETURNING *`,
    [customerId, v.year, v.make, v.model, v.trim, v.vin, v.mileage, v.color,
     v.licensePlate, v.purchaseDate, v.purchasePrice, v.oilType, v.tireSize, v.batterySize,
     v.engineSize, v.transmission, v.fuelType, v.photo, v.nickname]
  );
  return result.rows[0];
}

export async function getVehicleProfile(customerId: string, vehicleId: string) {
  const result = await pool.query(
    `SELECT * FROM customer_vehicles WHERE id = $1 AND customer_id = $2`, [vehicleId, customerId]
  );
  return result.rows[0] || null;
}

export async function getCustomerVehicles(customerId: string) {
  const result = await pool.query(
    `SELECT * FROM customer_vehicles WHERE customer_id = $1 ORDER BY created_at DESC`, [customerId]
  );
  return result.rows;
}

export async function getVehicleById(vehicleId: string) {
  const result = await pool.query(`SELECT * FROM customer_vehicles WHERE id = $1`, [vehicleId]);
  return result.rows[0] || null;
}

// ─── VIN Lookup (NHTSA free API) ────────────────────────────

export async function lookupVehicleByVIN(vin: string) {
  const resp = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
  const data = await resp.json();
  const results = data.Results || [];
  const get = (varId: number) => {
    const r = results.find((r: any) => r.VariableId === varId);
    return r?.Value && r.Value !== "Not Applicable" ? r.Value : null;
  };
  return {
    vin,
    year: get(29) ? parseInt(get(29)) : null,
    make: get(26),
    model: get(28),
    trim: get(109),
    engineSize: get(13),
    engineCylinders: get(9),
    transmission: get(37),
    fuelType: get(24),
    driveType: get(15),
    bodyClass: get(5),
    doors: get(14),
    plantCountry: get(75),
  };
}

// ─── Maintenance Schedule ───────────────────────────────────

const STANDARD_INTERVALS: Record<string, { miles: number; months: number; cost: number }> = {
  oil_change: { miles: 5000, months: 6, cost: 50 },
  tire_rotation: { miles: 5000, months: 6, cost: 30 },
  brake_pads: { miles: 30000, months: 36, cost: 250 },
  brake_fluid: { miles: 30000, months: 24, cost: 80 },
  transmission_fluid: { miles: 30000, months: 36, cost: 150 },
  coolant_flush: { miles: 30000, months: 36, cost: 100 },
  air_filter: { miles: 15000, months: 12, cost: 25 },
  cabin_filter: { miles: 15000, months: 12, cost: 30 },
  spark_plugs: { miles: 60000, months: 60, cost: 150 },
  battery: { miles: 50000, months: 48, cost: 180 },
  wipers: { miles: 15000, months: 12, cost: 25 },
  alignment: { miles: 15000, months: 12, cost: 100 },
  timing_belt: { miles: 80000, months: 84, cost: 800 },
  serpentine_belt: { miles: 60000, months: 60, cost: 150 },
  fuel_filter: { miles: 30000, months: 36, cost: 60 },
  inspection: { miles: 12000, months: 12, cost: 40 },
};

export async function getMaintenanceSchedule(vehicleId: string) {
  // Check for existing schedules
  const existing = await pool.query(
    `SELECT * FROM vehicle_maintenance_schedules WHERE vehicle_id = $1 ORDER BY priority DESC, next_due_mileage ASC`,
    [vehicleId]
  );
  if (existing.rows.length > 0) return existing.rows;

  // Generate default schedule based on vehicle mileage
  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle) return [];

  const mileage = vehicle.mileage || 0;
  const schedules = [];

  for (const [type, interval] of Object.entries(STANDARD_INTERVALS)) {
    const nextDueMileage = Math.ceil(mileage / interval.miles) * interval.miles;
    const milesUntil = nextDueMileage - mileage;
    let priority = 'routine';
    if (milesUntil < 0) priority = 'overdue';
    else if (milesUntil < 500) priority = 'critical';
    else if (milesUntil < 1500) priority = 'soon';

    const result = await pool.query(
      `INSERT INTO vehicle_maintenance_schedules
       (vehicle_id, maintenance_type, interval_miles, interval_months, next_due_mileage, priority, estimated_cost)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [vehicleId, type, interval.miles, interval.months, nextDueMileage, priority, interval.cost]
    );
    schedules.push(result.rows[0]);
  }
  return schedules;
}

// ─── Log Maintenance ────────────────────────────────────────

export async function logMaintenance(customerId: string, vehicleId: string, entry: {
  maintenanceType: string; performedBy?: string; shopName?: string;
  mileageAtService?: number; cost?: number; parts?: any[];
  nextDueMileage?: number; nextDueDate?: string; notes?: string; receiptUrl?: string;
}) {
  const e = entry;
  const result = await pool.query(
    `INSERT INTO vehicle_maintenance_log
     (customer_id, vehicle_id, maintenance_type, performed_by, shop_name, mileage_at_service,
      cost, parts, next_due_mileage, next_due_date, notes, receipt_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [customerId, vehicleId, e.maintenanceType, e.performedBy, e.shopName, e.mileageAtService,
     e.cost, JSON.stringify(e.parts || []), e.nextDueMileage, e.nextDueDate, e.notes, e.receiptUrl]
  );

  // Update vehicle mileage if provided
  if (e.mileageAtService) {
    await pool.query(`UPDATE customer_vehicles SET mileage = $1, updated_at = NOW() WHERE id = $2`,
      [e.mileageAtService, vehicleId]);
  }

  // Update maintenance schedule
  const interval = STANDARD_INTERVALS[e.maintenanceType];
  if (interval && e.mileageAtService) {
    await pool.query(
      `UPDATE vehicle_maintenance_schedules
       SET last_performed_mileage = $1, last_performed_date = NOW(),
           next_due_mileage = $2, priority = 'routine'
       WHERE vehicle_id = $3 AND maintenance_type = $4`,
      [e.mileageAtService, e.mileageAtService + interval.miles, vehicleId, e.maintenanceType]
    );
  }

  return result.rows[0];
}

// ─── Maintenance Due ────────────────────────────────────────

export async function getMaintenanceDue(customerId: string) {
  const vehicles = await getCustomerVehicles(customerId);
  const due: any[] = [];

  for (const vehicle of vehicles) {
    const schedules = await pool.query(
      `SELECT * FROM vehicle_maintenance_schedules
       WHERE vehicle_id = $1 AND priority IN ('overdue','critical','soon')
       ORDER BY CASE priority WHEN 'overdue' THEN 0 WHEN 'critical' THEN 1 WHEN 'soon' THEN 2 END`,
      [vehicle.id]
    );
    if (schedules.rows.length > 0) {
      due.push({
        vehicle: { id: vehicle.id, nickname: vehicle.nickname, year: vehicle.year, make: vehicle.make, model: vehicle.model },
        items: schedules.rows,
      });
    }
  }
  return due;
}

// ─── Diagnosis ──────────────────────────────────────────────

export async function diagnoseIssue(
  symptomDescription: string,
  vehicleInfo?: { year?: number; make?: string; model?: string },
  photoUrl?: string
) {
  // Search patterns by keyword matching
  const patterns = await pool.query(
    `SELECT * FROM auto_diagnosis_patterns
     WHERE symptom_description ILIKE $1
        OR symptom_category ILIKE $1
        OR possible_causes::text ILIKE $1
        OR obd_codes::text ILIKE $1`,
    [`%${symptomDescription.split(' ').slice(0, 3).join('%')}%`]
  );

  // Also do a broader search
  const keywords = symptomDescription.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  let broader: any[] = [];
  if (patterns.rows.length < 2 && keywords.length > 0) {
    const conditions = keywords.map((_, i) => `(symptom_description ILIKE $${i + 1} OR possible_causes::text ILIKE $${i + 1})`).join(' OR ');
    const broaderResult = await pool.query(
      `SELECT * FROM auto_diagnosis_patterns WHERE ${conditions}`,
      keywords.map(k => `%${k}%`)
    );
    broader = broaderResult.rows;
  }

  const allMatches = [...patterns.rows, ...broader].filter((p, i, arr) =>
    arr.findIndex(q => q.id === p.id) === i
  );

  let visionAnalysis = null;
  if (photoUrl) {
    try {
      visionAnalysis = await analyzeImages({
        imageUrls: [photoUrl],
        prompt: `Analyze this vehicle photo. The owner reports: "${symptomDescription}". ${
          vehicleInfo ? `Vehicle: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}.` : ''
        } Identify visible issues, damage, wear, leaks, or abnormalities. Provide diagnosis suggestions.`,
        maxTokens: 1000,
      });
    } catch (e) {
      console.error('Vision analysis failed:', e);
    }
  }

  return {
    symptom: symptomDescription,
    vehicle: vehicleInfo,
    matchedPatterns: allMatches.map(p => ({
      category: p.symptom_category,
      description: p.symptom_description,
      possibleCauses: p.possible_causes,
      diagnosticQuestions: p.diagnostic_questions,
      relatedOBDCodes: p.obd_codes,
    })),
    visionAnalysis,
    safetyNote: _getSafetyWarning(allMatches),
  };
}

// ─── Safety Guardrails ──────────────────────────────────────

const DANGEROUS_REPAIRS = [
  'brake line', 'fuel system', 'fuel line', 'fuel pump replacement',
  'airbag', 'srs', 'transmission rebuild', 'engine rebuild', 'engine internal',
  'spring compression', 'coil spring', 'ac refrigerant', 'r-134a', 'r-1234yf',
  'exhaust manifold', 'catalytic converter replacement',
];

function _getSafetyWarning(patterns: any[]): string | null {
  for (const p of patterns) {
    const causes = Array.isArray(p.possible_causes) ? p.possible_causes : [];
    for (const c of causes) {
      if (c.safetyRisk === 'critical' || c.diyDifficulty === 'hard') {
        const causeLower = (c.cause || '').toLowerCase();
        if (DANGEROUS_REPAIRS.some(d => causeLower.includes(d))) {
          return "⚠️ This repair involves dangerous/specialized work. I strongly recommend finding a trusted mechanic for this job.";
        }
      }
    }
  }
  return null;
}

export function isDangerousRepair(description: string): boolean {
  const lower = description.toLowerCase();
  return DANGEROUS_REPAIRS.some(d => lower.includes(d));
}

// ─── Parts Search ───────────────────────────────────────────

export async function searchAutoParts(
  partName: string, year?: number, make?: string, model?: string,
  customerId?: string, vehicleId?: string
) {
  const query = `${partName} ${year || ''} ${make || ''} ${model || ''}`.trim();
  const retailers = [
    { name: 'AutoZone', site: 'autozone.com' },
    { name: "O'Reilly Auto Parts", site: 'oreillyauto.com' },
    { name: 'Advance Auto Parts', site: 'advanceautoparts.com' },
    { name: 'RockAuto', site: 'rockauto.com' },
    { name: 'Amazon', site: 'amazon.com' },
    { name: 'Walmart Auto', site: 'walmart.com' },
  ];

  const results: any[] = [];
  // We'll construct search URLs for each retailer
  for (const retailer of retailers) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query + ' site:' + retailer.site)}`;
    results.push({
      retailer: retailer.name,
      searchUrl,
      directUrl: `https://www.${retailer.site}/search?q=${encodeURIComponent(query)}`,
    });
  }

  // Log the search
  if (customerId) {
    await pool.query(
      `INSERT INTO auto_parts_search (customer_id, vehicle_id, part_name, fitment, results)
       VALUES ($1,$2,$3,$4,$5)`,
      [customerId, vehicleId, partName, JSON.stringify({ year, make, model }), JSON.stringify(results)]
    );
  }

  return { partName, vehicle: { year, make, model }, retailers: results };
}

// ─── Tutorial Finder ────────────────────────────────────────

export async function findAutoTutorial(task: string, year?: number, make?: string, model?: string) {
  const query = `how to ${task} ${year || ''} ${make || ''} ${model || ''}`.trim();
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  return {
    task,
    vehicle: { year, make, model },
    searchQuery: query,
    youtubeUrl: youtubeSearchUrl,
    safetyWarning: isDangerousRepair(task)
      ? "⚠️ I found tutorials, but this is dangerous/specialized work. Let me find you a trusted mechanic nearby."
      : null,
  };
}

// ─── OBD Code Lookup ────────────────────────────────────────

const OBD_CODES: Record<string, { description: string; severity: string; common: string }> = {
  P0420: { description: "Catalyst System Efficiency Below Threshold (Bank 1)", severity: "moderate", common: "Catalytic converter degraded or O2 sensor issue" },
  P0430: { description: "Catalyst System Efficiency Below Threshold (Bank 2)", severity: "moderate", common: "Same as P0420 but for bank 2" },
  P0171: { description: "System Too Lean (Bank 1)", severity: "moderate", common: "Vacuum leak, weak fuel pump, or dirty MAF sensor" },
  P0174: { description: "System Too Lean (Bank 2)", severity: "moderate", common: "Same as P0171 for bank 2" },
  P0172: { description: "System Too Rich (Bank 1)", severity: "moderate", common: "Leaking fuel injector, faulty O2 sensor, or high fuel pressure" },
  P0300: { description: "Random/Multiple Cylinder Misfire Detected", severity: "high", common: "Spark plugs, ignition coils, fuel injectors, or vacuum leak" },
  P0301: { description: "Cylinder 1 Misfire Detected", severity: "high", common: "Spark plug, coil, or injector for cylinder 1" },
  P0302: { description: "Cylinder 2 Misfire Detected", severity: "high", common: "Spark plug, coil, or injector for cylinder 2" },
  P0303: { description: "Cylinder 3 Misfire Detected", severity: "high", common: "Spark plug, coil, or injector for cylinder 3" },
  P0304: { description: "Cylinder 4 Misfire Detected", severity: "high", common: "Spark plug, coil, or injector for cylinder 4" },
  P0135: { description: "O2 Sensor Heater Circuit Malfunction (Bank 1, Sensor 1)", severity: "moderate", common: "O2 sensor heater failure or wiring issue" },
  P0440: { description: "Evaporative Emission Control System Malfunction", severity: "low", common: "Gas cap loose, EVAP canister or purge valve issue" },
  P0455: { description: "Evaporative Emission Control System Leak Detected (Large Leak)", severity: "low", common: "Gas cap missing/damaged or major EVAP leak" },
  P0442: { description: "Evaporative Emission Control System Leak Detected (Small Leak)", severity: "low", common: "Small EVAP leak — gas cap, hose, or canister" },
  P0700: { description: "Transmission Control System Malfunction", severity: "high", common: "General transmission fault — check for additional trans codes" },
  P0730: { description: "Incorrect Gear Ratio", severity: "high", common: "Transmission slipping, worn clutches, or low fluid" },
  P0740: { description: "Torque Converter Clutch Circuit Malfunction", severity: "high", common: "TCC solenoid, wiring, or torque converter issue" },
  P0750: { description: "Shift Solenoid A Malfunction", severity: "high", common: "Failed shift solenoid or wiring" },
  P0755: { description: "Shift Solenoid B Malfunction", severity: "high", common: "Failed shift solenoid or wiring" },
  P0217: { description: "Engine Overtemperature Condition", severity: "critical", common: "Cooling system failure — thermostat, water pump, or radiator" },
  P0128: { description: "Coolant Thermostat Below Thermostat Regulating Temperature", severity: "low", common: "Thermostat stuck open — engine running too cold" },
  P0325: { description: "Knock Sensor 1 Circuit Malfunction", severity: "moderate", common: "Bad knock sensor or wiring" },
  P0335: { description: "Crankshaft Position Sensor A Circuit Malfunction", severity: "high", common: "Failed crank sensor — can cause no-start" },
  P0230: { description: "Fuel Pump Primary Circuit Malfunction", severity: "high", common: "Fuel pump relay, wiring, or fuel pump failure" },
  P0507: { description: "Idle Control System RPM Higher Than Expected", severity: "low", common: "Vacuum leak, dirty throttle body, or bad IAC valve" },
  P0116: { description: "Engine Coolant Temperature Circuit Range/Performance", severity: "moderate", common: "Coolant temp sensor or thermostat issue" },
  P0125: { description: "Insufficient Coolant Temperature for Closed Loop Fuel Control", severity: "low", common: "Thermostat stuck open or coolant temp sensor" },
};

export async function getOBDCodeInfo(code: string) {
  const upper = code.toUpperCase();
  const known = OBD_CODES[upper];

  // Also check if any diagnosis patterns reference this code
  const patterns = await pool.query(
    `SELECT * FROM auto_diagnosis_patterns WHERE obd_codes::text ILIKE $1`,
    [`%${upper}%`]
  );

  if (known) {
    return {
      code: upper,
      ...known,
      relatedPatterns: patterns.rows.map(p => ({
        category: p.symptom_category,
        description: p.symptom_description,
      })),
    };
  }

  // Generic decode by prefix
  const prefix = upper[0];
  const systems: Record<string, string> = {
    P: 'Powertrain', B: 'Body', C: 'Chassis', U: 'Network/Communication',
  };
  return {
    code: upper,
    system: systems[prefix] || 'Unknown',
    description: `${systems[prefix] || 'Unknown'} code — consult a mechanic or OBD scanner for details`,
    severity: 'unknown',
    common: 'Code not in our database. Try searching online or ask a mechanic.',
    relatedPatterns: patterns.rows.map(p => ({
      category: p.symptom_category,
      description: p.symptom_description,
    })),
  };
}

// ─── Repair Cost Estimate ───────────────────────────────────

const REPAIR_COST_ESTIMATES: Record<string, { low: number; high: number; laborHours: number }> = {
  oil_change: { low: 30, high: 75, laborHours: 0.5 },
  brake_pads: { low: 100, high: 300, laborHours: 1 },
  brake_rotors: { low: 200, high: 600, laborHours: 1.5 },
  tire_rotation: { low: 20, high: 50, laborHours: 0.5 },
  alignment: { low: 75, high: 150, laborHours: 1 },
  battery_replacement: { low: 100, high: 300, laborHours: 0.5 },
  alternator: { low: 300, high: 700, laborHours: 2 },
  starter: { low: 200, high: 600, laborHours: 1.5 },
  spark_plugs: { low: 50, high: 300, laborHours: 1 },
  timing_belt: { low: 500, high: 1500, laborHours: 4 },
  water_pump: { low: 300, high: 700, laborHours: 3 },
  thermostat: { low: 50, high: 200, laborHours: 1 },
  radiator: { low: 300, high: 900, laborHours: 2 },
  transmission_fluid: { low: 100, high: 250, laborHours: 1 },
  coolant_flush: { low: 75, high: 150, laborHours: 0.5 },
  air_filter: { low: 15, high: 40, laborHours: 0.1 },
  cabin_filter: { low: 20, high: 50, laborHours: 0.2 },
  serpentine_belt: { low: 100, high: 200, laborHours: 0.5 },
  struts_shocks: { low: 400, high: 1000, laborHours: 2 },
  catalytic_converter: { low: 500, high: 2500, laborHours: 2 },
  head_gasket: { low: 1000, high: 2500, laborHours: 8 },
  transmission_rebuild: { low: 2000, high: 5000, laborHours: 12 },
  ac_recharge: { low: 100, high: 250, laborHours: 0.5 },
  muffler: { low: 100, high: 400, laborHours: 1 },
  fuel_pump: { low: 400, high: 800, laborHours: 2 },
  oxygen_sensor: { low: 150, high: 350, laborHours: 0.5 },
  mass_airflow_sensor: { low: 100, high: 400, laborHours: 0.5 },
  tie_rods: { low: 100, high: 350, laborHours: 1 },
  ball_joints: { low: 200, high: 500, laborHours: 2 },
  cv_axle: { low: 200, high: 600, laborHours: 1.5 },
  wheel_bearing: { low: 200, high: 500, laborHours: 1.5 },
};

export async function estimateRepairCost(
  repairType: string, year?: number, make?: string, model?: string, zip?: string
) {
  // Normalize the repair type
  const normalized = repairType.toLowerCase().replace(/[\s-]+/g, '_');
  const match = Object.entries(REPAIR_COST_ESTIMATES).find(([key]) =>
    normalized.includes(key) || key.includes(normalized)
  );

  const laborRate = 100; // average $/hr

  if (match) {
    const [key, est] = match;
    return {
      repairType: key,
      vehicle: { year, make, model },
      estimate: {
        partsAndLabor: { low: est.low, high: est.high },
        laborHours: est.laborHours,
        laborCostEstimate: { low: est.laborHours * (laborRate * 0.8), high: est.laborHours * (laborRate * 1.3) },
      },
      diy: {
        partsCostEstimate: { low: est.low * 0.4, high: est.high * 0.5 },
        note: "DIY saves on labor — parts only cost",
      },
      disclaimer: "Estimates vary by location, vehicle, and shop. Get 2-3 quotes.",
      safetyWarning: isDangerousRepair(repairType)
        ? "⚠️ This is dangerous/specialized work. Please find a professional mechanic."
        : null,
    };
  }

  return {
    repairType,
    vehicle: { year, make, model },
    estimate: null,
    message: "I don't have a specific estimate for that repair. I'd recommend getting quotes from 2-3 local shops.",
  };
}
