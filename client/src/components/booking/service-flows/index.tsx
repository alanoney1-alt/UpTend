import { HomeScanFlow } from "./home-scan-flow";
import { HandymanFlow } from "./handyman-flow";
import { JunkRemovalFlow } from "./junk-removal-flow";
import { GarageCleanoutFlow } from "./garage-cleanout-flow";
import { MovingLaborFlow } from "./moving-labor-flow";
import { HomeCleaningFlow } from "./home-cleaning-flow";
import { CarpetCleaningFlow } from "./carpet-cleaning-flow";
import { LandscapingFlow } from "./landscaping-flow";
import { GutterCleaningFlow } from "./gutter-cleaning-flow";
import { PressureWashingFlow } from "./pressure-washing-flow";
import { PoolCleaningFlow } from "./pool-cleaning-flow";
import { LightDemolitionFlow } from "./light-demolition-flow";
import type { ServiceFlowProps } from "./types";

export type { ServiceFlowProps, ServiceFlowResult } from "./types";

type FlowComponent = React.ComponentType<ServiceFlowProps>;

const SERVICE_FLOWS: Record<string, FlowComponent> = {
  home_consultation: HomeScanFlow,
  home_scan: HomeScanFlow,
  handyman: HandymanFlow,
  junk_removal: JunkRemovalFlow,
  "material-recovery": JunkRemovalFlow,
  garage_cleanout: GarageCleanoutFlow,
  moving_labor: MovingLaborFlow,
  "staging-labor": MovingLaborFlow,
  home_cleaning: HomeCleaningFlow,
  polishup: HomeCleaningFlow,
  carpet_cleaning: CarpetCleaningFlow,
  deepfiber: CarpetCleaningFlow,
  landscaping: LandscapingFlow,
  freshcut: LandscapingFlow,
  gutter_cleaning: GutterCleaningFlow,
  "gutter-flush": GutterCleaningFlow,
  pressure_washing: PressureWashingFlow,
  "surface-wash": PressureWashingFlow,
  freshwash: PressureWashingFlow,
  pool_cleaning: PoolCleaningFlow,
  poolspark: PoolCleaningFlow,
  light_demolition: LightDemolitionFlow,
};

export function getServiceFlow(serviceId: string): FlowComponent | null {
  return SERVICE_FLOWS[serviceId] || null;
}

export function ServiceFlowRouter({
  serviceId,
  ...props
}: ServiceFlowProps & { serviceId: string }) {
  const Flow = SERVICE_FLOWS[serviceId];
  if (!Flow) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          No pricing flow available for this service yet. Please use AI Photo Quote.
        </p>
      </div>
    );
  }
  return <Flow {...props} />;
}
