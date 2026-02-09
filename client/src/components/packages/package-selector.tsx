/**
 * Package Selector Component
 *
 * Displays named packages as attractive cards with service inclusions,
 * pricing, and savings messaging. Allows customers to select and customize.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getAllPackages,
  getPackageById,
  type NamedPackage,
} from "@/lib/named-packages";
import {
  Check,
  Sparkles,
  TrendingUp,
  ChevronRight,
  Info,
} from "lucide-react";

interface PackageSelectorProps {
  onSelectPackage: (packageId: string, selectedServices: string[]) => void;
}

export function PackageSelector({ onSelectPackage }: PackageSelectorProps) {
  const allPackages = getAllPackages();

  const [selectedPackage, setSelectedPackage] = useState<NamedPackage | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customizedServices, setCustomizedServices] = useState<Set<string>>(new Set());

  const handleSelectPackage = (pkg: NamedPackage) => {
    setSelectedPackage(pkg);

    // Pre-select required services
    const requiredServices = new Set(
      pkg.services.filter(s => s.required).map(s => s.serviceType)
    );
    setCustomizedServices(requiredServices);

    setIsCustomizing(true);
  };

  const handleConfirmPackage = () => {
    if (selectedPackage) {
      onSelectPackage(selectedPackage.id, Array.from(customizedServices));
      setIsCustomizing(false);
    }
  };

  const toggleService = (serviceType: string) => {
    const newSet = new Set(customizedServices);
    if (newSet.has(serviceType)) {
      newSet.delete(serviceType);
    } else {
      newSet.add(serviceType);
    }
    setCustomizedServices(newSet);
  };

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allPackages.map((pkg) => (
          <Card
            key={pkg.id}
            className="relative cursor-pointer transition-all hover:shadow-lg hover:border-primary"
            onClick={() => handleSelectPackage(pkg)}
          >
            {pkg.seasonalBadge && (
              <div className="absolute top-3 right-3">
                <Badge variant="secondary">{pkg.seasonalBadge}</Badge>
              </div>
            )}

            <CardHeader className="pb-3">
              <div className="text-4xl mb-2">{pkg.icon}</div>
              <CardTitle className="text-xl">{pkg.name}</CardTitle>
              <CardDescription className="font-medium">
                {pkg.tagline}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Description */}
              <p className="text-sm text-muted-foreground">
                {pkg.description}
              </p>

              {/* Services Included */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Includes:
                </p>
                <div className="space-y-1">
                  {pkg.services.map((service, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="flex-1">{service.serviceBranded}</span>
                      {!service.required && (
                        <Badge variant="outline" className="text-xs">
                          Optional
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="pt-3 border-t">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold text-primary">
                    ${pkg.estimatedPrice.from}
                  </span>
                  {pkg.estimatedPrice.to > pkg.estimatedPrice.from && (
                    <>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-2xl font-bold text-primary">
                        ${pkg.estimatedPrice.to}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-green-600 font-medium">
                  {pkg.savingsMessage}
                </p>
              </div>

              {/* Ideal For */}
              <div className="pt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Ideal for:
                </p>
                <div className="flex flex-wrap gap-1">
                  {pkg.idealFor.slice(0, 2).map((use, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {use}
                    </Badge>
                  ))}
                  {pkg.idealFor.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{pkg.idealFor.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>

              <Button className="w-full" variant="default">
                Select Package
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Customization Dialog */}
      {selectedPackage && (
        <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span className="text-3xl">{selectedPackage.icon}</span>
                {selectedPackage.name}
              </DialogTitle>
              <DialogDescription>
                Customize your package by selecting optional add-ons
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Package Details */}
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm mb-3">{selectedPackage.description}</p>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">{selectedPackage.savingsMessage}</span>
                </div>
              </div>

              {/* Service Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Services</Label>
                {selectedPackage.services.map((service) => {
                  const isSelected = customizedServices.has(service.serviceType);
                  const isRequired = service.required;

                  return (
                    <div
                      key={service.serviceType}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200'
                      } ${isRequired ? 'opacity-100' : 'cursor-pointer hover:border-gray-300'}`}
                      onClick={() => !isRequired && toggleService(service.serviceType)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          disabled={isRequired}
                          onCheckedChange={() => !isRequired && toggleService(service.serviceType)}
                        />
                        <div>
                          <p className="font-medium">{service.serviceBranded}</p>
                          {service.defaultOptions && (
                            <p className="text-xs text-muted-foreground">
                              {Object.entries(service.defaultOptions)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isRequired && (
                          <Badge variant="default" className="text-xs">
                            Required
                          </Badge>
                        )}
                        {!isRequired && !isSelected && (
                          <Badge variant="outline" className="text-xs">
                            Optional
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ideal For Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Perfect for:
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {selectedPackage.idealFor.map((use, index) => (
                        <li key={index}>• {use}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Estimated Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">
                      ${selectedPackage.estimatedPrice.from}
                    </span>
                    {selectedPackage.estimatedPrice.to > selectedPackage.estimatedPrice.from && (
                      <span className="text-xl text-primary"> - ${selectedPackage.estimatedPrice.to}</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Final price calculated based on your property details
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsCustomizing(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmPackage}
                  disabled={customizedServices.size === 0}
                  className="flex-1"
                >
                  Continue to Booking
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
