/**
 * PolishUp (Home Cleaning) Checklist Templates
 *
 * Room-by-room task definitions for different clean types
 */

export interface ChecklistTask {
  id: string;
  roomType: "kitchen" | "bathroom" | "bedroom" | "living_room" | "dining_room" | "office" | "general";
  taskName: string;
  cleanTypes: ("standard" | "deep" | "moveInOut")[]; // Which clean types include this task
  isAddOn?: boolean; // True if task is from an add-on
}

// ==========================================
// KITCHEN TASKS
// ==========================================

export const KITCHEN_STANDARD_TASKS: ChecklistTask[] = [
  { id: "kitchen_countertops", roomType: "kitchen", taskName: "Countertops wiped and sanitized", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "kitchen_sink", roomType: "kitchen", taskName: "Sink cleaned and sanitized", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "kitchen_stovetop", roomType: "kitchen", taskName: "Stovetop cleaned", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "kitchen_microwave", roomType: "kitchen", taskName: "Microwave interior/exterior wiped", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "kitchen_appliances_exterior", roomType: "kitchen", taskName: "Exterior of all appliances wiped", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "kitchen_cabinet_fronts", roomType: "kitchen", taskName: "Cabinet fronts wiped", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "kitchen_floor", roomType: "kitchen", taskName: "Floor swept and mopped", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "kitchen_trash", roomType: "kitchen", taskName: "Trash emptied and bag replaced", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "kitchen_switches", roomType: "kitchen", taskName: "Light switches and door handles wiped", cleanTypes: ["standard", "deep", "moveInOut"] },
];

export const KITCHEN_DEEP_TASKS: ChecklistTask[] = [
  { id: "kitchen_inside_oven", roomType: "kitchen", taskName: "Inside oven cleaned", cleanTypes: ["deep", "moveInOut"], isAddOn: true },
  { id: "kitchen_inside_refrigerator", roomType: "kitchen", taskName: "Inside refrigerator cleaned", cleanTypes: ["deep", "moveInOut"], isAddOn: true },
  { id: "kitchen_inside_cabinets", roomType: "kitchen", taskName: "Inside cabinets wiped", cleanTypes: ["deep", "moveInOut"] },
  { id: "kitchen_backsplash", roomType: "kitchen", taskName: "Backsplash scrubbed", cleanTypes: ["deep", "moveInOut"] },
  { id: "kitchen_baseboards", roomType: "kitchen", taskName: "Baseboards wiped", cleanTypes: ["deep", "moveInOut"] },
];

// ==========================================
// BATHROOM TASKS
// ==========================================

export const BATHROOM_STANDARD_TASKS: ChecklistTask[] = [
  { id: "bathroom_toilet", roomType: "bathroom", taskName: "Toilet cleaned inside and out", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "bathroom_shower_tub", roomType: "bathroom", taskName: "Shower/tub scrubbed", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "bathroom_sink_vanity", roomType: "bathroom", taskName: "Sink and vanity cleaned", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "bathroom_mirror", roomType: "bathroom", taskName: "Mirror cleaned", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "bathroom_floor", roomType: "bathroom", taskName: "Floor swept and mopped", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "bathroom_trash", roomType: "bathroom", taskName: "Trash emptied", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "bathroom_towels", roomType: "bathroom", taskName: "Towels folded or rehung", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "bathroom_switches", roomType: "bathroom", taskName: "Light switches and door handles wiped", cleanTypes: ["standard", "deep", "moveInOut"] },
];

export const BATHROOM_DEEP_TASKS: ChecklistTask[] = [
  { id: "bathroom_grout", roomType: "bathroom", taskName: "Grout scrubbed", cleanTypes: ["deep", "moveInOut"] },
  { id: "bathroom_inside_cabinets", roomType: "bathroom", taskName: "Inside cabinets wiped", cleanTypes: ["deep", "moveInOut"] },
  { id: "bathroom_exhaust_fan", roomType: "bathroom", taskName: "Exhaust fan cleaned", cleanTypes: ["deep", "moveInOut"] },
  { id: "bathroom_baseboards", roomType: "bathroom", taskName: "Baseboards wiped", cleanTypes: ["deep", "moveInOut"] },
];

// ==========================================
// BEDROOM TASKS
// ==========================================

export const BEDROOM_STANDARD_TASKS: ChecklistTask[] = [
  { id: "bedroom_bed", roomType: "bedroom", taskName: "Bed made (or sheets changed if provided)", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "bedroom_surfaces", roomType: "bedroom", taskName: "Surfaces dusted (nightstands, dressers, shelves)", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "bedroom_floor", roomType: "bedroom", taskName: "Floor vacuumed or swept/mopped", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "bedroom_trash", roomType: "bedroom", taskName: "Trash emptied", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "bedroom_mirror", roomType: "bedroom", taskName: "Mirror/glass surfaces cleaned", cleanTypes: ["standard", "deep", "moveInOut"] },
];

export const BEDROOM_DEEP_TASKS: ChecklistTask[] = [
  { id: "bedroom_baseboards", roomType: "bedroom", taskName: "Baseboards wiped", cleanTypes: ["deep", "moveInOut"] },
  { id: "bedroom_ceiling_fan", roomType: "bedroom", taskName: "Ceiling fan dusted", cleanTypes: ["deep", "moveInOut"] },
  { id: "bedroom_under_bed", roomType: "bedroom", taskName: "Under bed vacuumed", cleanTypes: ["deep", "moveInOut"] },
  { id: "bedroom_window_sills", roomType: "bedroom", taskName: "Window sills wiped", cleanTypes: ["deep", "moveInOut"] },
];

// ==========================================
// LIVING AREA TASKS
// ==========================================

export const LIVING_AREA_STANDARD_TASKS: ChecklistTask[] = [
  { id: "living_surfaces", roomType: "living_room", taskName: "All surfaces dusted", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "living_floor", roomType: "living_room", taskName: "Floor vacuumed or swept/mopped", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "living_couch", roomType: "living_room", taskName: "Couch cushions straightened", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "living_tv", roomType: "living_room", taskName: "TV screen dusted (dry cloth only)", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "living_trash", roomType: "living_room", taskName: "Trash emptied", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "living_switches", roomType: "living_room", taskName: "Light switches and door handles wiped", cleanTypes: ["standard", "deep", "moveInOut"] },
];

export const LIVING_AREA_DEEP_TASKS: ChecklistTask[] = [
  { id: "living_baseboards", roomType: "living_room", taskName: "Baseboards wiped", cleanTypes: ["deep", "moveInOut"] },
  { id: "living_ceiling_fans", roomType: "living_room", taskName: "Ceiling fans dusted", cleanTypes: ["deep", "moveInOut"] },
  { id: "living_blinds", roomType: "living_room", taskName: "Blinds/shutters dusted", cleanTypes: ["deep", "moveInOut"] },
  { id: "living_window_sills", roomType: "living_room", taskName: "Window sills wiped", cleanTypes: ["deep", "moveInOut"] },
];

// ==========================================
// GENERAL TASKS (ALL CLEANS)
// ==========================================

export const GENERAL_TASKS: ChecklistTask[] = [
  { id: "general_trash_bins", roomType: "general", taskName: "All trash taken to outdoor bins", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "general_lights_off", roomType: "general", taskName: "All lights turned off except entry", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "general_doors_locked", roomType: "general", taskName: "Doors locked (if customer provided key/code)", cleanTypes: ["standard", "deep", "moveInOut"] },
  { id: "general_alarm", roomType: "general", taskName: "Alarm re-set (if applicable)", cleanTypes: ["standard", "deep", "moveInOut"] },
];

// ==========================================
// MOVE-IN/MOVE-OUT ADDITIONAL TASKS
// ==========================================

export const MOVE_IN_OUT_TASKS: ChecklistTask[] = [
  { id: "moveout_closets", roomType: "general", taskName: "Inside all closets wiped and vacuumed", cleanTypes: ["moveInOut"] },
  { id: "moveout_drawers", roomType: "general", taskName: "Inside all cabinets and drawers wiped", cleanTypes: ["moveInOut"] },
  { id: "moveout_light_fixtures", roomType: "general", taskName: "All light fixtures dusted", cleanTypes: ["moveInOut"] },
  { id: "moveout_vents", roomType: "general", taskName: "All vents/registers wiped", cleanTypes: ["moveInOut"] },
  { id: "moveout_garage", roomType: "general", taskName: "Garage swept", cleanTypes: ["moveInOut"] },
  { id: "moveout_patio", roomType: "general", taskName: "Patio/balcony swept", cleanTypes: ["moveInOut"] },
  { id: "moveout_interior_windows", roomType: "general", taskName: "Interior of all windows cleaned", cleanTypes: ["moveInOut"], isAddOn: true },
  { id: "moveout_door_frames", roomType: "general", taskName: "Door frames and trim wiped", cleanTypes: ["moveInOut"] },
];

// ==========================================
// ADD-ON TASKS
// ==========================================

export const ADDON_TASKS: ChecklistTask[] = [
  { id: "addon_interior_windows", roomType: "general", taskName: "Interior windows cleaned", cleanTypes: ["standard", "deep"], isAddOn: true },
  { id: "addon_laundry", roomType: "general", taskName: "Laundry (wash, dry, fold - 2 loads)", cleanTypes: ["standard", "deep"], isAddOn: true },
  { id: "addon_organize_closet", roomType: "general", taskName: "Organize one closet", cleanTypes: ["standard", "deep"], isAddOn: true },
  { id: "addon_pet_hair", roomType: "general", taskName: "Pet hair deep treatment", cleanTypes: ["standard", "deep"], isAddOn: true },
];

// ==========================================
// CHECKLIST GENERATOR
// ==========================================

export interface GenerateChecklistOptions {
  bedrooms: string; // "1-2", "3", "4", "5+"
  bathrooms: string; // "1", "2", "2-3", "3+"
  cleanType: "standard" | "deep" | "moveInOut";
  addOns: string[]; // ["inside_oven", "inside_refrigerator", "interior_windows", "laundry", "organize_closet", "pet_hair_treatment"]
}

export function generatePolishUpChecklist(options: GenerateChecklistOptions): ChecklistTask[] {
  const { bedrooms, bathrooms, cleanType, addOns } = options;

  let checklist: ChecklistTask[] = [];

  // KITCHEN (always 1)
  checklist.push(...KITCHEN_STANDARD_TASKS);
  if (cleanType === "deep" || cleanType === "moveInOut") {
    checklist.push(...KITCHEN_DEEP_TASKS.filter(task => {
      // Filter out add-on tasks unless explicitly requested
      if (task.isAddOn) {
        if (task.id === "kitchen_inside_oven") return addOns.includes("inside_oven");
        if (task.id === "kitchen_inside_refrigerator") return addOns.includes("inside_refrigerator");
        return false;
      }
      return true;
    }));
  }

  // BATHROOMS (multiply based on count)
  const bathroomCount = bathrooms === "1" ? 1 : bathrooms === "2" ? 2 : bathrooms === "2-3" ? 2 : 3;
  for (let i = 1; i <= bathroomCount; i++) {
    // Add bathroom number to task names
    const bathroomStandardTasks = BATHROOM_STANDARD_TASKS.map(task => ({
      ...task,
      id: `${task.id}_${i}`,
      taskName: `[Bathroom ${i}] ${task.taskName}`,
    }));
    checklist.push(...bathroomStandardTasks);

    if (cleanType === "deep" || cleanType === "moveInOut") {
      const bathroomDeepTasks = BATHROOM_DEEP_TASKS.map(task => ({
        ...task,
        id: `${task.id}_${i}`,
        taskName: `[Bathroom ${i}] ${task.taskName}`,
      }));
      checklist.push(...bathroomDeepTasks);
    }
  }

  // BEDROOMS (multiply based on count)
  const bedroomCount = bedrooms === "1-2" ? 2 : bedrooms === "3" ? 3 : bedrooms === "4" ? 4 : 5;
  for (let i = 1; i <= bedroomCount; i++) {
    const bedroomStandardTasks = BEDROOM_STANDARD_TASKS.map(task => ({
      ...task,
      id: `${task.id}_${i}`,
      taskName: `[Bedroom ${i}] ${task.taskName}`,
    }));
    checklist.push(...bedroomStandardTasks);

    if (cleanType === "deep" || cleanType === "moveInOut") {
      const bedroomDeepTasks = BEDROOM_DEEP_TASKS.map(task => ({
        ...task,
        id: `${task.id}_${i}`,
        taskName: `[Bedroom ${i}] ${task.taskName}`,
      }));
      checklist.push(...bedroomDeepTasks);
    }
  }

  // LIVING AREAS (assume 1 living room + 1 dining room for 3+ bedrooms)
  checklist.push(...LIVING_AREA_STANDARD_TASKS);
  if (cleanType === "deep" || cleanType === "moveInOut") {
    checklist.push(...LIVING_AREA_DEEP_TASKS);
  }

  if (bedroomCount >= 3) {
    const diningTasks = LIVING_AREA_STANDARD_TASKS.map(task => ({
      ...task,
      id: `dining_${task.id}`,
      taskName: task.taskName.replace("living", "dining"),
      roomType: "dining_room" as const,
    }));
    checklist.push(...diningTasks);

    if (cleanType === "deep" || cleanType === "moveInOut") {
      const diningDeepTasks = LIVING_AREA_DEEP_TASKS.map(task => ({
        ...task,
        id: `dining_${task.id}`,
        taskName: task.taskName.replace("living", "dining"),
        roomType: "dining_room" as const,
      }));
      checklist.push(...diningDeepTasks);
    }
  }

  // GENERAL TASKS (always included)
  checklist.push(...GENERAL_TASKS);

  // MOVE-IN/MOVE-OUT TASKS
  if (cleanType === "moveInOut") {
    checklist.push(...MOVE_IN_OUT_TASKS.filter(task => {
      // Filter interior windows unless requested as add-on
      if (task.id === "moveout_interior_windows") {
        return addOns.includes("interior_windows");
      }
      return true;
    }));
  }

  // ADD-ON TASKS (for standard and deep cleans)
  if (cleanType === "standard" || cleanType === "deep") {
    if (addOns.includes("interior_windows")) {
      checklist.push(ADDON_TASKS.find(t => t.id === "addon_interior_windows")!);
    }
    if (addOns.includes("laundry")) {
      checklist.push(ADDON_TASKS.find(t => t.id === "addon_laundry")!);
    }
    if (addOns.includes("organize_closet")) {
      checklist.push(ADDON_TASKS.find(t => t.id === "addon_organize_closet")!);
    }
    if (addOns.includes("pet_hair_treatment")) {
      checklist.push(ADDON_TASKS.find(t => t.id === "addon_pet_hair")!);
    }
  }

  return checklist;
}

/**
 * Get task count for a given configuration (for quoting/estimation)
 */
export function getTaskCount(options: GenerateChecklistOptions): number {
  return generatePolishUpChecklist(options).length;
}

/**
 * Get estimated time for completion based on task count and clean type
 */
export function getEstimatedTime(options: GenerateChecklistOptions): { hours: number; description: string } {
  const taskCount = getTaskCount(options);
  const { cleanType, bedrooms } = options;

  // Base time calculation: ~3-5 minutes per task
  const baseMinutes = taskCount * 4;

  // Add overhead for home size
  const bedroomCount = bedrooms === "1-2" ? 2 : bedrooms === "3" ? 3 : bedrooms === "4" ? 4 : 5;
  const overheadMinutes = bedroomCount * 10; // 10 mins per bedroom for transitions

  // Clean type multiplier
  const multiplier = cleanType === "standard" ? 1 : cleanType === "deep" ? 1.3 : 1.5;

  const totalMinutes = (baseMinutes + overheadMinutes) * multiplier;
  const hours = Math.ceil(totalMinutes / 60 * 2) / 2; // Round up to nearest 0.5 hour

  let description = "";
  if (hours <= 2) description = "1-2 hours";
  else if (hours <= 3) description = "2-3 hours";
  else if (hours <= 4) description = "3-4 hours";
  else if (hours <= 5) description = "4-5 hours";
  else description = "5-6 hours";

  return { hours, description };
}
