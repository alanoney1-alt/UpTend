// MaterialCalculator.ts — Calculate materials needed for jobs
export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  purchased: boolean;
  notes?: string;
}

export interface MaterialList {
  id: string;
  jobId: string;
  serviceType: string;
  sqft?: number;
  materials: Material[];
  totalEstimatedCost: number;
  createdAt: Date;
}

const MATERIAL_DB: Record<string, (sqft: number) => Material[]> = {
  pressure_washing: (sqft) => [
    { id: 'm1', name: 'Pressure washer solution', quantity: Math.ceil(sqft / 200), unit: 'gallons', estimatedCost: 15, purchased: false },
    { id: 'm2', name: '25° nozzle tip', quantity: 1, unit: 'pc', estimatedCost: 8, purchased: false },
    { id: 'm3', name: '40° nozzle tip', quantity: 1, unit: 'pc', estimatedCost: 8, purchased: false },
    { id: 'm4', name: 'Surface cleaner attachment', quantity: sqft > 500 ? 1 : 0, unit: 'pc', estimatedCost: 45, purchased: false },
  ],
  landscaping: (sqft) => [
    { id: 'm1', name: 'Mulch bags', quantity: Math.ceil(sqft / 10), unit: 'bags', estimatedCost: 4.50, purchased: false },
    { id: 'm2', name: 'Landscape fabric', quantity: Math.ceil(sqft / 50), unit: 'rolls', estimatedCost: 25, purchased: false },
    { id: 'm3', name: 'Edging', quantity: Math.ceil(Math.sqrt(sqft) * 4 / 20), unit: 'sections', estimatedCost: 12, purchased: false },
    { id: 'm4', name: 'Fertilizer', quantity: Math.ceil(sqft / 1000), unit: 'bags', estimatedCost: 18, purchased: false },
  ],
  painting: (sqft) => [
    { id: 'm1', name: 'Paint (1 gal covers ~350 sqft)', quantity: Math.ceil(sqft / 350) * 2, unit: 'gallons', estimatedCost: 35, purchased: false, notes: '2 coats' },
    { id: 'm2', name: 'Primer', quantity: Math.ceil(sqft / 400), unit: 'gallons', estimatedCost: 28, purchased: false },
    { id: 'm3', name: 'Painter\'s tape', quantity: Math.ceil(sqft / 200), unit: 'rolls', estimatedCost: 7, purchased: false },
    { id: 'm4', name: 'Drop cloths', quantity: Math.ceil(sqft / 500) + 1, unit: 'pcs', estimatedCost: 12, purchased: false },
    { id: 'm5', name: 'Roller covers', quantity: 3, unit: 'pcs', estimatedCost: 8, purchased: false },
    { id: 'm6', name: 'Brushes (2" + 4")', quantity: 2, unit: 'set', estimatedCost: 15, purchased: false },
  ],
  lawn_care: (sqft) => [
    { id: 'm1', name: 'Trimmer line', quantity: 1, unit: 'spool', estimatedCost: 12, purchased: false },
    { id: 'm2', name: 'Lawn bags', quantity: Math.ceil(sqft / 2000), unit: 'packs', estimatedCost: 8, purchased: false },
    { id: 'm3', name: 'Blade sharpening', quantity: 1, unit: 'service', estimatedCost: 10, purchased: false },
  ],
  junk_removal: (cubicYards) => [
    { id: 'm1', name: 'Moving blankets', quantity: 4, unit: 'pcs', estimatedCost: 15, purchased: false },
    { id: 'm2', name: 'Ratchet straps', quantity: 4, unit: 'pcs', estimatedCost: 10, purchased: false },
    { id: 'm3', name: 'Work gloves', quantity: 2, unit: 'pairs', estimatedCost: 8, purchased: false },
    { id: 'm4', name: 'Dump fee', quantity: cubicYards, unit: 'cubic yards', estimatedCost: 35, purchased: false },
  ],
};

class MaterialCalculatorService {
  calculate(serviceType: string, measurement: number): MaterialList {
    const key = serviceType.toLowerCase().replace(/\s+/g, '_');
    const calculator = MATERIAL_DB[key] || MATERIAL_DB['lawn_care'];
    const materials = calculator(measurement).filter(m => m.quantity > 0);
    const totalEstimatedCost = materials.reduce((sum, m) => sum + m.quantity * m.estimatedCost, 0);

    return {
      id: `matlist_${Date.now()}`,
      jobId: '',
      serviceType,
      sqft: measurement,
      materials,
      totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
      createdAt: new Date(),
    };
  }

  togglePurchased(list: MaterialList, materialId: string): MaterialList {
    return {
      ...list,
      materials: list.materials.map(m => m.id === materialId ? { ...m, purchased: !m.purchased } : m),
    };
  }

  getServiceTypes(): string[] {
    return Object.keys(MATERIAL_DB).map(k => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
  }
}

export const materialCalculator = new MaterialCalculatorService();
