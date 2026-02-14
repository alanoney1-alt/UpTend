import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Trash2, Sofa, Refrigerator, Home } from "lucide-react";
import { SERVICE_STARTING_PRICES, HOURLY_RATE_PER_PRO } from "@/lib/bundle-pricing";
import { MILEAGE_RATE } from "@/lib/distance-utils";

import junkImage from "@assets/stock_images/junk_removal_pile,_o_405748d1.jpg";
import furnitureImage from "@assets/stock_images/sofa_couch_furniture_a076eb82.jpg";
import emptyGarageImage from "@assets/generated_images/clean_empty_garage_interior.png";

const services = [
  {
    id: "junk_removal",
    title: "Junk Removal",
    description: "Clear out unwanted items, debris, and clutter from your home or office.",
    icon: Trash2,
    image: junkImage,
    startingPrice: SERVICE_STARTING_PRICES.junk_removal,
  },
  {
    id: "garage_cleanout",
    title: "Garage Cleanout",
    description: "Complete garage cleanout service. Clear all clutter, tools, and junk in one visit.",
    icon: Home,
    image: emptyGarageImage,
    startingPrice: SERVICE_STARTING_PRICES.garage_cleanout,
  },
  {
    id: "moving_labor",
    title: "Moving Labor",
    description: `Furniture moving, truck unloading, or general labor — all $${HOURLY_RATE_PER_PRO}/hr per Pro. You pick the task.`,
    icon: Sofa,
    image: furnitureImage,
    startingPrice: SERVICE_STARTING_PRICES.moving_labor || 80,
  },
];

export function ServiceTypes() {
  return (
    <section id="services" className="py-16 md:py-24" data-testid="section-services">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From single items to full property cleanouts, we've got you covered with reliable home services.
          </p>
          <p className="text-sm text-primary font-medium mt-2">
            Moving services include $1/mile - no hidden fees!
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <Card 
              key={service.id} 
              className="overflow-hidden group hover-elevate"
              data-testid={`card-service-${service.id}`}
            >
              <div className="relative h-40 overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <service.icon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {service.description}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">Starting at</span>
                    <p className="text-xl font-bold">${service.startingPrice}</p>
                  </div>
                  <Link href={`/book?service=${service.id}`}>
                    <Button size="sm" data-testid={`button-book-${service.id}`}>
                      Book
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
