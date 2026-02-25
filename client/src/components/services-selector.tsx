import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Wrench,
} from "lucide-react";
import { getEquipmentForService } from "@shared/equipment-requirements";

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
    id: "home_consultation",
    label: "Home DNA Scan",
    icon: ClipboardCheck,
    description: "Home walkthrough and consultation",
    requiresCertification: true,
  },
  {
    id: "handyman",
    label: "Handyman Services",
    icon: Wrench,
    description: "Assembly, mounting, repairs, painting, installations",
    requiresEquipment: ["basic_tools"],
  },
  {
    id: "junk_removal",
    label: "Junk Removal",
    icon: Trash2,
    description: "Responsible junk removal and hauling",
  },
  {
    id: "garage_cleanout",
    label: "Garage Cleanout",
    icon: Home,
    description: "Complete garage cleanout service",
  },
  {
    id: "moving_labor",
    label: "Moving Labor",
    icon: Users,
    description: "Hourly help for loading and unloading",
  },
  {
    id: "home_cleaning",
    label: "Home Cleaning",
    icon: Sparkles,
    description: "Professional home cleaning service",
  },
  {
    id: "carpet_cleaning",
    label: "Carpet Cleaning",
    icon: Home,
    description: "Deep carpet and upholstery cleaning",
    requiresEquipment: ["truck_mount", "portable_extractor"],
  },
  {
    id: "landscaping",
    label: "Landscaping",
    icon: Leaf,
    description: "Lawn care and landscaping services",
    requiresEquipment: ["lawn_mower", "edger", "blower"],
  },
  {
    id: "gutter_cleaning",
    label: "Gutter Cleaning",
    icon: Home,
    description: "Clean and flush gutters and downspouts",
    requiresEquipment: ["tall_ladder"],
  },
  {
    id: "pressure_washing",
    label: "Pressure Washing",
    icon: Droplets,
    description: "Driveways, patios, walkways, and siding",
    requiresEquipment: ["pressure_washer"],
  },
  {
    id: "pool_cleaning",
    label: "Pool Cleaning",
    icon: Waves,
    description: "Pool maintenance and cleaning",
    requiresEquipment: ["pool_equipment"],
  },
  {
    id: "light_demolition",
    label: "Light Demolition",
    icon: Hammer,
    description: "Cabinets, sheds, fencing, decks",
    requiresEquipment: ["demo_tools"],
  },
  {
    id: "truck_unloading",
    label: "Truck Unloading",
    icon: Truck,
    description: "Unload rental trucks and moving trailers",
  },
  {
    id: "furniture_moving",
    label: "Moving Labor",
    icon: Sofa,
    description: "Furniture moving and transport",
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
  const [expandedService, setExpandedService] = useState<string | null>(null);

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
          const equipmentDetails = getEquipmentForService(service.id);
          const hasEquipmentDetails = equipmentDetails && showEquipmentInfo;

          return (
            <Card
              key={service.id}
              className={`transition-all ${
                isSelected
                  ? "border-primary ring-2 ring-primary"
                  : "hover:border-primary/50"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(service.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-primary" />
                      <Label className="font-semibold cursor-pointer" onClick={() => handleToggle(service.id)}>
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

                    {hasEquipmentDetails && (
                      <Collapsible
                        open={expandedService === service.id}
                        onOpenChange={(open) => setExpandedService(open ? service.id : null)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                          >
                            <AlertCircle className="w-3 h-3 mr-1" />
                            View equipment requirements
                            <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${expandedService === service.id ? "rotate-180" : ""}`} />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 space-y-3">
                          {/* Minimum Equipment */}
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs font-semibold mb-2">Minimum Equipment Required:</p>
                            <ul className="space-y-1.5">
                              {equipmentDetails.minimumEquipment.map((item) => (
                                <li key={item.id} className="flex items-start gap-2 text-xs">
                                  <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="font-medium">{item.label}</span>
                                    {item.description && (
                                      <span className="text-muted-foreground"> - {item.description}</span>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Recommended Equipment */}
                          {equipmentDetails.recommendedEquipment && equipmentDetails.recommendedEquipment.length > 0 && (
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs font-semibold mb-2">Recommended (Optional):</p>
                              <ul className="space-y-1.5">
                                {equipmentDetails.recommendedEquipment.map((item) => (
                                  <li key={item.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                                    <span className="mt-0.5">•</span>
                                    <span>{item.label}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Certifications */}
                          {equipmentDetails.certifications && equipmentDetails.certifications.length > 0 && (
                            <div className="flex items-start gap-2 text-xs">
                              <Badge variant="secondary" className="text-xs">Certifications</Badge>
                              <span className="text-muted-foreground">
                                {equipmentDetails.certifications.join(", ")}
                              </span>
                            </div>
                          )}

                          {/* Insurance */}
                          {equipmentDetails.insuranceRequired && (
                            <div className="flex items-start gap-2 text-xs">
                              <Badge variant="outline" className="text-xs">Insurance</Badge>
                              <span className="text-muted-foreground">
                                {equipmentDetails.insuranceRequired}
                              </span>
                            </div>
                          )}

                          {/* Vehicle Requirements */}
                          {equipmentDetails.vehicleRequirements && equipmentDetails.vehicleRequirements.length > 0 && (
                            <div className="flex items-start gap-2 text-xs">
                              <Badge variant="outline" className="text-xs">Vehicle</Badge>
                              <span className="text-muted-foreground">
                                {equipmentDetails.vehicleRequirements.join(", ")}
                              </span>
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
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
