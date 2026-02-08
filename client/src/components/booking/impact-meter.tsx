import { ShieldCheck } from "lucide-react";

interface ImpactMeterProps {
  selectedServices: string[];
  address?: string;
}

const SERVICE_VALUES: Record<string, number> = {
  junk_removal: 1200,
  furniture_moving: 800,
  garage_cleanout: 2400,
  estate_cleanout: 4200,
  truck_unloading: 600,
  moving_labor: 500,
  pressure_washing: 450,
  gutter_cleaning: 950,
  light_demolition: 1800,
  home_consultation: 8450,
  hvac: 1200,
  cleaning: 350,
};

export function ImpactMeter({ selectedServices, address }: ImpactMeterProps) {
  const totalValue = selectedServices.reduce(
    (sum, svc) => sum + (SERVICE_VALUES[svc] || 500),
    0
  );

  const scorePercent = Math.min(100, Math.round((selectedServices.length / 5) * 100));

  if (selectedServices.length === 0) return null;

  return (
    <div
      className="sticky top-4 z-40 bg-card-foreground dark:bg-slate-900 text-card dark:text-white p-4 sm:p-6 rounded-md shadow-xl border border-white/10 mb-6"
      data-testid="widget-impact-meter"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-3 rounded-lg shadow-lg">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">
              Estimated Protected Value
            </p>
            <h3 className="text-2xl sm:text-3xl font-black" data-testid="text-protected-value">
              ${totalValue.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
          <div className="hidden sm:block text-right">
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
              Home Intelligence Score
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-2 w-28 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 transition-all duration-700"
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
              <span className="text-xs font-bold text-green-400" data-testid="text-score-percent">
                {scorePercent}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
