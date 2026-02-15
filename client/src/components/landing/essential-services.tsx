import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Droplets, Shield as LadderIcon, Package, Hammer, Stethoscope } from "lucide-react";
import { useTranslation } from "react-i18next";

export function EssentialServices() {
  const { t } = useTranslation();

  const services = [
    {
      icon: Stethoscope,
      title: t("essential.ai_home_scan"),
      shortTitle: t("essential.ai_home_scan_short"),
      tagline: t("essential.ai_home_scan_tagline"),
      spin: t("essential.ai_home_scan_spin"),
      price: t("essential.ai_home_scan_price"),
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
      bookParam: "home_consultation",
    },
    {
      icon: Truck,
      title: t("essential.junk_removal"),
      shortTitle: t("essential.junk_removal_short"),
      tagline: t("essential.junk_removal_tagline"),
      spin: t("essential.junk_removal_spin"),
      price: t("essential.junk_removal_price"),
      color: "text-primary",
      bgColor: "bg-primary/10",
      bookParam: "junk_removal",
    },
    {
      icon: Package,
      title: t("essential.moving_helpers"),
      shortTitle: t("essential.moving_helpers_short"),
      tagline: t("essential.moving_helpers_tagline"),
      spin: t("essential.moving_helpers_spin"),
      price: t("essential.moving_helpers_price"),
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-500/10",
      bookParam: "moving_labor",
    },
    {
      icon: LadderIcon,
      title: t("essential.gutter_cleaning"),
      shortTitle: t("essential.gutter_cleaning_short"),
      tagline: t("essential.gutter_cleaning_tagline"),
      spin: t("essential.gutter_cleaning_spin"),
      price: t("essential.gutter_cleaning_price"),
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
      bookParam: "gutter_cleaning",
    },
    {
      icon: Droplets,
      title: t("essential.pressure_washing"),
      shortTitle: t("essential.pressure_washing_short"),
      tagline: t("essential.pressure_washing_tagline"),
      spin: t("essential.pressure_washing_spin"),
      price: t("essential.pressure_washing_price"),
      color: "text-primary",
      bgColor: "bg-primary/10",
      bookParam: "pressure_washing",
    },
    {
      icon: Hammer,
      title: t("essential.light_demo"),
      shortTitle: t("essential.light_demo_short"),
      tagline: t("essential.light_demo_tagline"),
      spin: t("essential.light_demo_spin"),
      price: t("essential.light_demo_price"),
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
      bookParam: "light_demolition",
    },
  ];

  return (
    <section id="services" className="py-16 md:py-24" data-testid="section-essential-services">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
            {t("essential.suite_label")}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-services-headline">
            {t("essential.headline")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("essential.subhead")}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {services.map((service) => (
            <Link
              key={service.bookParam}
              href={`/book?service=${service.bookParam}`}
              data-testid={`link-book-${service.bookParam}`}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              <Card
                className="p-4 md:p-6 hover-elevate flex flex-col items-center text-center h-full"
                data-testid={`card-service-${service.bookParam}`}
              >
                <div className={`flex items-center justify-center w-14 h-14 rounded-lg ${service.bgColor} ${service.color} shrink-0 mb-3`}>
                  <service.icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-sm md:text-base" data-testid={`text-service-title-${service.bookParam}`}>
                  {service.shortTitle}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 mb-3">
                  {service.tagline}
                </p>
                <Badge variant="secondary" className="mt-auto" data-testid={`badge-price-${service.bookParam}`}>
                  {service.price}
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
