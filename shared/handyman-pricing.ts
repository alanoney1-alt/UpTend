/**
 * FixIt™ (Handyman Services) Pricing Catalog
 * Task-based pricing with AI photo estimation support
 */

export interface HandymanTask {
  id: string;
  name: string;
  category: 'mounting' | 'assembly' | 'repairs' | 'painting' | 'installation' | 'outdoor';
  basePrice: number;
  estimatedTime: number; // minutes
  description: string;
  aiAnalysisSupported: boolean;
  variables?: {
    name: string;
    type: 'size' | 'quantity' | 'complexity';
    options: { value: string; priceModifier: number; label: string }[];
  }[];
}

export const HANDYMAN_TASKS: HandymanTask[] = [
  // MOUNTING & HANGING
  {
    id: 'tv_mount_small',
    name: 'TV Mounting (up to 42")',
    category: 'mounting',
    basePrice: 79,
    estimatedTime: 60,
    description: 'Mount TV up to 42" on drywall, includes bracket, cable management, and leveling',
    aiAnalysisSupported: true,
    variables: [
      {
        name: 'wallType',
        type: 'complexity',
        options: [
          { value: 'drywall', priceModifier: 0, label: 'Drywall (standard)' },
          { value: 'brick', priceModifier: 40, label: 'Brick/Masonry (+$40)' },
          { value: 'concrete', priceModifier: 60, label: 'Concrete (+$60)' },
        ],
      },
    ],
  },
  {
    id: 'tv_mount_medium',
    name: 'TV Mounting (43"-65")',
    category: 'mounting',
    basePrice: 99,
    estimatedTime: 75,
    description: 'Mount TV 43"-65" on drywall, includes bracket, cable management, and leveling',
    aiAnalysisSupported: true,
    variables: [
      {
        name: 'wallType',
        type: 'complexity',
        options: [
          { value: 'drywall', priceModifier: 0, label: 'Drywall (standard)' },
          { value: 'brick', priceModifier: 50, label: 'Brick/Masonry (+$50)' },
          { value: 'concrete', priceModifier: 70, label: 'Concrete (+$70)' },
        ],
      },
    ],
  },
  {
    id: 'tv_mount_large',
    name: 'TV Mounting (66"+ or Above Fireplace)',
    category: 'mounting',
    basePrice: 139,
    estimatedTime: 90,
    description: 'Mount large TV 66"+ or above fireplace, includes bracket, cable management, and leveling',
    aiAnalysisSupported: true,
    variables: [
      {
        name: 'wallType',
        type: 'complexity',
        options: [
          { value: 'drywall', priceModifier: 0, label: 'Drywall (standard)' },
          { value: 'brick', priceModifier: 60, label: 'Brick/Masonry (+$60)' },
          { value: 'concrete', priceModifier: 80, label: 'Concrete (+$80)' },
        ],
      },
    ],
  },
  {
    id: 'picture_hanging',
    name: 'Picture/Mirror Hanging (per item)',
    category: 'mounting',
    basePrice: 25,
    estimatedTime: 15,
    description: 'Hang pictures, mirrors, or artwork with proper anchors and leveling',
    aiAnalysisSupported: true,
    variables: [
      {
        name: 'quantity',
        type: 'quantity',
        options: [
          { value: '1', priceModifier: 0, label: '1 item' },
          { value: '2-5', priceModifier: 15, label: '2-5 items (+$15)' },
          { value: '6-10', priceModifier: 40, label: '6-10 items (+$40)' },
          { value: '11+', priceModifier: 75, label: '11+ items (+$75)' },
        ],
      },
    ],
  },
  {
    id: 'shelf_mounting',
    name: 'Shelf/Floating Shelf Installation',
    category: 'mounting',
    basePrice: 49,
    estimatedTime: 45,
    description: 'Install shelves or floating shelves with proper anchors and leveling',
    aiAnalysisSupported: true,
    variables: [
      {
        name: 'quantity',
        type: 'quantity',
        options: [
          { value: '1', priceModifier: 0, label: '1 shelf' },
          { value: '2-3', priceModifier: 30, label: '2-3 shelves (+$30)' },
          { value: '4+', priceModifier: 60, label: '4+ shelves (+$60)' },
        ],
      },
    ],
  },
  {
    id: 'curtain_rod',
    name: 'Curtain Rod/Blind Installation',
    category: 'mounting',
    basePrice: 39,
    estimatedTime: 30,
    description: 'Install curtain rods or blinds with proper mounting hardware',
    aiAnalysisSupported: true,
    variables: [
      {
        name: 'quantity',
        type: 'quantity',
        options: [
          { value: '1', priceModifier: 0, label: '1 window' },
          { value: '2-4', priceModifier: 25, label: '2-4 windows (+$25)' },
          { value: '5+', priceModifier: 60, label: '5+ windows (+$60)' },
        ],
      },
    ],
  },

  // FURNITURE ASSEMBLY
  {
    id: 'furniture_simple',
    name: 'Simple Furniture Assembly',
    category: 'assembly',
    basePrice: 59,
    estimatedTime: 60,
    description: 'Assemble simple furniture: chairs, small tables, nightstands, bookshelves (under 30 pieces)',
    aiAnalysisSupported: true,
  },
  {
    id: 'furniture_medium',
    name: 'Medium Furniture Assembly',
    category: 'assembly',
    basePrice: 89,
    estimatedTime: 90,
    description: 'Assemble medium furniture: dressers, desks, entertainment centers, dining tables (30-100 pieces)',
    aiAnalysisSupported: true,
  },
  {
    id: 'furniture_complex',
    name: 'Complex Furniture Assembly',
    category: 'assembly',
    basePrice: 139,
    estimatedTime: 120,
    description: 'Assemble complex furniture: beds with storage, wardrobes, large cabinets (100+ pieces)',
    aiAnalysisSupported: true,
  },
  {
    id: 'ikea_assembly',
    name: 'IKEA Furniture Assembly',
    category: 'assembly',
    basePrice: 69,
    estimatedTime: 75,
    description: 'Assemble any IKEA furniture item with instructions',
    aiAnalysisSupported: true,
    variables: [
      {
        name: 'complexity',
        type: 'complexity',
        options: [
          { value: 'simple', priceModifier: 0, label: 'Simple (Billy, Lack)' },
          { value: 'medium', priceModifier: 30, label: 'Medium (Malm, Hemnes) (+$30)' },
          { value: 'complex', priceModifier: 70, label: 'Complex (PAX, kitchen) (+$70)' },
        ],
      },
    ],
  },

  // REPAIRS
  {
    id: 'door_adjustment',
    name: 'Door Adjustment/Repair',
    category: 'repairs',
    basePrice: 69,
    estimatedTime: 45,
    description: 'Adjust hinges, fix sticking doors, replace hardware, or minor repairs',
    aiAnalysisSupported: true,
  },
  {
    id: 'drywall_patch_small',
    name: 'Drywall Patch (Small - up to 6")',
    category: 'repairs',
    basePrice: 49,
    estimatedTime: 60,
    description: 'Patch small holes up to 6", includes sanding, mudding, and paint touch-up',
    aiAnalysisSupported: true,
  },
  {
    id: 'drywall_patch_medium',
    name: 'Drywall Patch (Medium - 6"-12")',
    category: 'repairs',
    basePrice: 89,
    estimatedTime: 90,
    description: 'Patch medium holes 6"-12", includes sanding, mudding, and paint touch-up',
    aiAnalysisSupported: true,
  },
  {
    id: 'drywall_patch_large',
    name: 'Drywall Patch (Large - 12"+)',
    category: 'repairs',
    basePrice: 139,
    estimatedTime: 120,
    description: 'Patch large holes 12"+, includes drywall replacement, mudding, sanding, and paint',
    aiAnalysisSupported: true,
  },
  {
    id: 'caulking',
    name: 'Caulking/Sealing',
    category: 'repairs',
    basePrice: 59,
    estimatedTime: 45,
    description: 'Caulk baseboards, windows, tubs, showers, or sinks',
    aiAnalysisSupported: true,
    variables: [
      {
        name: 'area',
        type: 'size',
        options: [
          { value: 'small', priceModifier: 0, label: 'Small area (1-2 spots)' },
          { value: 'medium', priceModifier: 30, label: 'Medium area (bathroom) (+$30)' },
          { value: 'large', priceModifier: 60, label: 'Large area (multiple rooms) (+$60)' },
        ],
      },
    ],
  },
  {
    id: 'cabinet_repair',
    name: 'Cabinet Door/Hinge Repair',
    category: 'repairs',
    basePrice: 59,
    estimatedTime: 45,
    description: 'Fix loose hinges, adjust cabinet doors, or replace hardware',
    aiAnalysisSupported: true,
  },

  // PAINTING
  {
    id: 'paint_touchup',
    name: 'Paint Touch-Up (Small Areas)',
    category: 'painting',
    basePrice: 49,
    estimatedTime: 45,
    description: 'Touch up paint on walls, trim, or doors (small areas, paint provided)',
    aiAnalysisSupported: true,
  },
  {
    id: 'paint_room',
    name: 'Single Room Painting',
    category: 'painting',
    basePrice: 249,
    estimatedTime: 240,
    description: 'Paint one room (walls only, up to 12x12 ft)',
    aiAnalysisSupported: true,
    variables: [
      {
        name: 'size',
        type: 'size',
        options: [
          { value: 'small', priceModifier: 0, label: 'Small (up to 10x10)' },
          { value: 'medium', priceModifier: 50, label: 'Medium (10x12 - 12x14) (+$50)' },
          { value: 'large', priceModifier: 100, label: 'Large (14x16+) (+$100)' },
        ],
      },
    ],
  },
  {
    id: 'paint_accent_wall',
    name: 'Accent Wall Painting',
    category: 'painting',
    basePrice: 99,
    estimatedTime: 90,
    description: 'Paint single accent wall (up to 12 ft wide)',
    aiAnalysisSupported: true,
  },
  {
    id: 'paint_trim',
    name: 'Trim/Baseboard Painting',
    category: 'painting',
    basePrice: 139,
    estimatedTime: 120,
    description: 'Paint trim, baseboards, or crown molding in one room',
    aiAnalysisSupported: true,
  },

  // INSTALLATIONS
  {
    id: 'light_fixture',
    name: 'Light Fixture Installation/Replacement',
    category: 'installation',
    basePrice: 79,
    estimatedTime: 60,
    description: 'Replace existing light fixture (ceiling or wall-mounted)',
    aiAnalysisSupported: true,
  },
  {
    id: 'ceiling_fan',
    name: 'Ceiling Fan Installation',
    category: 'installation',
    basePrice: 119,
    estimatedTime: 90,
    description: 'Install ceiling fan (replacing existing fixture, fan provided)',
    aiAnalysisSupported: true,
  },
  {
    id: 'smart_device',
    name: 'Smart Home Device Installation',
    category: 'installation',
    basePrice: 59,
    estimatedTime: 45,
    description: 'Install smart thermostat, doorbell, camera, or lock',
    aiAnalysisSupported: true,
  },
  {
    id: 'faucet_replacement',
    name: 'Faucet Replacement',
    category: 'installation',
    basePrice: 89,
    estimatedTime: 60,
    description: 'Replace kitchen or bathroom faucet (faucet provided)',
    aiAnalysisSupported: true,
  },
  {
    id: 'toilet_repair',
    name: 'Toilet Repair (Running/Leaking)',
    category: 'installation',
    basePrice: 79,
    estimatedTime: 45,
    description: 'Fix running toilet, replace flapper, or repair leaks',
    aiAnalysisSupported: true,
  },

  // OUTDOOR
  {
    id: 'fence_repair',
    name: 'Fence Panel Repair',
    category: 'outdoor',
    basePrice: 89,
    estimatedTime: 90,
    description: 'Repair or replace 1-2 fence panels or posts',
    aiAnalysisSupported: true,
  },
  {
    id: 'deck_board_replacement',
    name: 'Deck Board Replacement',
    category: 'outdoor',
    basePrice: 99,
    estimatedTime: 90,
    description: 'Replace damaged deck boards (up to 5 boards)',
    aiAnalysisSupported: true,
  },
  {
    id: 'grill_assembly',
    name: 'Outdoor Grill Assembly',
    category: 'outdoor',
    basePrice: 89,
    estimatedTime: 75,
    description: 'Assemble outdoor gas or charcoal grill',
    aiAnalysisSupported: true,
  },
];

export const HANDYMAN_CATEGORIES = {
  mounting: { label: 'Mounting & Hanging', icon: '🖼️' },
  assembly: { label: 'Furniture Assembly', icon: '🪑' },
  repairs: { label: 'Repairs & Fixes', icon: '🔧' },
  painting: { label: 'Painting', icon: '🎨' },
  installation: { label: 'Installations', icon: '💡' },
  outdoor: { label: 'Outdoor Work', icon: '🌳' },
};

/**
 * Calculate price for a handyman task with variables
 */
export function calculateHandymanTaskPrice(
  taskId: string,
  variables?: Record<string, string>
): number {
  const task = HANDYMAN_TASKS.find(t => t.id === taskId);
  if (!task) return 0;

  let price = task.basePrice;

  // Apply variable modifiers
  if (variables && task.variables) {
    task.variables.forEach(variable => {
      const selectedValue = variables[variable.name];
      if (selectedValue) {
        const option = variable.options.find(opt => opt.value === selectedValue);
        if (option) {
          price += option.priceModifier;
        }
      }
    });
  }

  return price;
}

/**
 * Get total price for multiple handyman tasks
 */
export function calculateHandymanQuoteTotal(
  tasks: Array<{ taskId: string; variables?: Record<string, string> }>
): { total: number; estimatedTime: number; breakdown: Array<{ taskId: string; name: string; price: number }> } {
  let total = 0;
  let estimatedTime = 0;
  const breakdown: Array<{ taskId: string; name: string; price: number }> = [];

  tasks.forEach(({ taskId, variables }) => {
    const task = HANDYMAN_TASKS.find(t => t.id === taskId);
    if (task) {
      const price = calculateHandymanTaskPrice(taskId, variables);
      total += price;
      estimatedTime += task.estimatedTime;
      breakdown.push({ taskId, name: task.name, price });
    }
  });

  return { total, estimatedTime, breakdown };
}

/**
 * Get recommended tasks based on AI photo analysis
 */
export function getRecommendedHandymanTasks(context: {
  hasTvVisible?: boolean;
  tvSize?: 'small' | 'medium' | 'large';
  hasUnassembledFurniture?: boolean;
  furnitureComplexity?: 'simple' | 'medium' | 'complex';
  hasDrywall Damage?: boolean;
  damageSize?: 'small' | 'medium' | 'large';
  needsPainting?: boolean;
  wallType?: 'drywall' | 'brick' | 'concrete';
}): string[] {
  const recommended: string[] = [];

  if (context.hasTvVisible) {
    if (context.tvSize === 'large') {
      recommended.push('tv_mount_large');
    } else if (context.tvSize === 'medium') {
      recommended.push('tv_mount_medium');
    } else {
      recommended.push('tv_mount_small');
    }
  }

  if (context.hasUnassembledFurniture) {
    if (context.furnitureComplexity === 'complex') {
      recommended.push('furniture_complex');
    } else if (context.furnitureComplexity === 'medium') {
      recommended.push('furniture_medium');
    } else {
      recommended.push('furniture_simple');
    }
  }

  if (context.hasDrywallDamage) {
    if (context.damageSize === 'large') {
      recommended.push('drywall_patch_large');
    } else if (context.damageSize === 'medium') {
      recommended.push('drywall_patch_medium');
    } else {
      recommended.push('drywall_patch_small');
    }
  }

  if (context.needsPainting) {
    recommended.push('paint_touchup');
  }

  return recommended;
}
