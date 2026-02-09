import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Sofa,
  Home,
  Truck,
  Droplets,
  Hammer,
  Users,
  ClipboardCheck,
  Sparkles,
  Leaf,
  Waves,
} from "lucide-react";

export interface Service {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  requiresCertification?: boolean;
  requiresEquipment?: string[];
}

const ALL_SERVICES: Service[] = [
  {
    id: "junk_removal",
    label: "BulkSnap™ (Junk Removal)",
    icon: Trash2,
    description: "Material recovery and junk removal",
  },
  {
    id: "furniture_moving",
    label: "LiftCrew™ (Furniture Moving)",
    icon: Sofa,
    description: "Furniture moving and transport",
  },
  {
    id: "garage_cleanout",
    label: "GarageReset™ (Garage Cleanout)",
    icon: Home,
    description: "Complete garage cleanout service",
  },
  {
    id: "truck_unloading",
    label: "UnloadPro™ (Truck Unloading)",
    icon: Truck,
    description: "Unload rental trucks and moving trailers",
  },
  {
    id: "pressure_washing",
    label: "FreshWash™ (Pressure Washing)",
    icon: Droplets,
    description: "Driveways, patios, walkways, and siding",
    requiresEquipment: ["pressure_washer"],
  },
  {
    id: "gutter_cleaning",
    label: "GutterFlush™ (Gutter Cleaning)",
    icon: Home,
    description: "Clean and flush gutters and downspouts",
    requiresEquipment: ["tall_ladder"],
  },
  {
    id: "moving_labor",
    label: "LiftCrew™ (Moving Labor)",
    icon: Users,
    description: "Hourly help for loading and unloading",
  },
  {
    id: "light_demolition",
    label: "TearDown™ (Light Demolition)",
    icon: Hammer,
    description: "Cabinets, sheds, fencing, decks",
    requiresEquipment: ["demo_tools"],
  },
  {
    id: "home_consultation",
    label: "DwellScan™ (Home Audit)",
    icon: ClipboardCheck,
    description: "Home walkthrough and consultation",
    requiresCertification: true,
  },
  {
    id: "home_cleaning",
    label: "PolishUp™ (Home Cleaning)",
    icon: Sparkles,
    description: "Professional home cleaning service",
  },
  {
    id: "pool_cleaning",
    label: "PoolSpark™ (Pool Cleaning)",
    icon: Waves,
    description: "Pool maintenance and cleaning",
    requiresEquipment: ["pool_equipment"],
  },
  {
    id: "landscaping",
    label: "FreshCut™ (Landscaping)",
    icon: Leaf,
    description: "Lawn care and landscaping services",
    requiresEquipment: ["lawn_mower", "edger", "blower"],
  },
  {
    id: "carpet_cleaning",
    label: "DeepFiber™ (Carpet Cleaning)",
    icon: Home,
    description: "Deep carpet and upholstery cleaning",
    requiresEquipment: ["truck_mount", "portable_extractor"],
  },
];

interface ServicesSelectorProps {
  selectedServices: string[];
  onSelectionChange: (services: string[]) => void;
  showEquipmentInfo?: boolean;
}

export function ServicesSelector({
  selectedServices,
  onSelectionChange,
  showEquipmentInfo = true,
}: ServicesSelectorProps) {
  const handleToggle = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      onSelectionChange(selectedServices.filter((id) => id !== serviceId));
    } else {
      onSelectionChange([...selectedServices, serviceId]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Services You Can Provide</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select all services you're equipped and willing to provide. You'll only receive job
          requests for selected services.
        </p>
      </div>

      <div className="grid gap-3">
        {ALL_SERVICES.map((service) => {
          const isSelected = selectedServices.includes(service.id);
          const Icon = service.icon;

          return (
            <Card
              key={service.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "border-primary ring-2 ring-primary"
                  : "hover:border-primary/50"
              }`}
              onClick={() => handleToggle(service.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(service.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-primary" />
                      <Label className="font-semibold cursor-pointer">
                        {service.label}
                      </Label>
                      {service.requiresCertification && (
                        <Badge variant="secondary" className="text-xs">
                          Certification Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {service.description}
                    </p>
                    {showEquipmentInfo && service.requiresEquipment && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="font-medium">Equipment needed:</span>
                        <span>{service.requiresEquipment.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm">
          <strong>Selected: {selectedServices.length} services</strong>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          You can always update your service offerings later in your profile settings.
        </p>
      </div>
    </div>
  );
}

export { ALL_SERVICES };
