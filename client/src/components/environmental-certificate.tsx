import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Leaf, Recycle, Heart, Trash2, Truck, Award, 
  Download, Share2, CheckCircle, Loader2, TreeDeciduous, FileText
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { EnvironmentalCertificate as EnvCertificateType } from "@shared/schema";

interface EnvironmentalCertificateProps {
  serviceRequestId: string;
  onGenerate?: () => void;
}

function DisposalBreakdownBar({ 
  recycled, 
  donated, 
  landfilled 
}: { 
  recycled: number; 
  donated: number; 
  landfilled: number;
}) {
  return (
    <div className="w-full">
      <div className="flex h-4 rounded-full overflow-hidden bg-muted">
        {recycled > 0 && (
          <div 
            className="bg-green-500 transition-all"
            style={{ width: `${recycled}%` }}
            title={`Recycled: ${recycled}%`}
          />
        )}
        {donated > 0 && (
          <div 
            className="bg-blue-500 transition-all"
            style={{ width: `${donated}%` }}
            title={`Donated: ${donated}%`}
          />
        )}
        {landfilled > 0 && (
          <div 
            className="bg-amber-500 transition-all"
            style={{ width: `${landfilled}%` }}
            title={`Landfilled: ${landfilled}%`}
          />
        )}
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Recycled {recycled}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Donated {donated}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Landfilled {landfilled}%</span>
        </div>
      </div>
    </div>
  );
}

export function EnvironmentalCertificate({ serviceRequestId, onGenerate }: EnvironmentalCertificateProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: certificate, isLoading, error } = useQuery<EnvCertificateType>({
    queryKey: ["/api/certificates", serviceRequestId],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/certificates/${serviceRequestId}/generate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates", serviceRequestId] });
      toast({
        title: "Certificate Generated",
        description: "Your environmental impact certificate is ready!",
      });
      onGenerate?.();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to generate certificate. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }

  if (error || !certificate) {
    const errorData = error as any;
    const errorCode = errorData?.code;
    const isForbidden = errorCode === "FORBIDDEN" || errorData?.status === 403;
    const isUnauthorized = errorCode === "UNAUTHORIZED" || errorData?.status === 401;
    
    if (isForbidden) {
      return (
        <Card className="p-6 border-dashed border-2 border-amber-200 bg-amber-50/50 dark:bg-amber-900/10">
          <div className="text-center">
            <Leaf className="w-12 h-12 text-amber-600 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">Access Restricted</h3>
            <p className="text-sm text-muted-foreground">
              You don't have permission to view this environmental certificate.
            </p>
          </div>
        </Card>
      );
    }
    
    return (
      <Card className="p-6 border-dashed border-2">
        <div className="text-center">
          <Leaf className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-2">Environmental Impact Report</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Generate your environmental certificate to see how your items were disposed responsibly.
          </p>
          {isUnauthorized ? (
            <p className="text-sm text-amber-600 mb-4">
              Please sign in to generate your certificate.
            </p>
          ) : (
            <Button 
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-generate-certificate"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Certificate
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" data-testid="card-environmental-certificate">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Environmental Certificate</h3>
              <p className="text-sm text-white/80">Proof of responsible disposal</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            {certificate.certificateNumber}
          </Badge>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Recycle className="w-5 h-5 text-green-600" />
            Disposal Report
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            See exactly where your items went:
          </p>
          <DisposalBreakdownBar
            recycled={certificate.recycledPercent}
            donated={certificate.donatedPercent}
            landfilled={certificate.landfilledPercent}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Recycle className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-600">{certificate.recycledPercent}%</p>
            <p className="text-xs text-muted-foreground">Recycled</p>
            {certificate.recycledWeightLbs && (
              <p className="text-xs text-green-600 mt-1">
                {Math.round(certificate.recycledWeightLbs)} lbs
              </p>
            )}
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Heart className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-600">{certificate.donatedPercent}%</p>
            <p className="text-xs text-muted-foreground">Donated</p>
            {certificate.donatedWeightLbs && (
              <p className="text-xs text-blue-600 mt-1">
                {Math.round(certificate.donatedWeightLbs)} lbs
              </p>
            )}
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <Trash2 className="w-6 h-6 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-600">{certificate.landfilledPercent}%</p>
            <p className="text-xs text-muted-foreground">Landfilled</p>
            {certificate.landfilledWeightLbs && (
              <p className="text-xs text-amber-600 mt-1">
                {Math.round(certificate.landfilledWeightLbs)} lbs
              </p>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <TreeDeciduous className="w-5 h-5 text-green-600" />
            Carbon Offset
          </h4>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Distance traveled</span>
              <span className="font-medium">{certificate.haulDistanceMiles?.toFixed(1)} miles</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Carbon footprint</span>
              <span className="font-medium">{certificate.carbonFootprintLbs?.toFixed(1)} lbs CO2</span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700 dark:text-green-400">Carbon offset status</span>
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Offset Purchased</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              UpTend calculates and offsets the carbon footprint of every haul automatically.
            </p>
          </div>
        </div>

        {certificate.facilities && certificate.facilities.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Truck className="w-5 h-5 text-green-600" />
                Disposal Facilities Used
              </h4>
              <ul className="space-y-2">
                {certificate.facilities.map((facility, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{facility}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" data-testid="button-download-certificate">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" className="flex-1" data-testid="button-share-certificate">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Issued: {new Date(certificate.issuedAt).toLocaleDateString()}
          {certificate.expiresAt && (
            <> | Valid until: {new Date(certificate.expiresAt).toLocaleDateString()}</>
          )}
        </p>
      </div>
    </Card>
  );
}

export function EnvironmentalImpactSummary({ certificate }: { certificate: EnvCertificateType }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
      <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
        <Leaf className="w-5 h-5 text-green-600" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-green-700 dark:text-green-400">Environmental Impact</p>
        <p className="text-sm text-muted-foreground">
          {certificate.recycledPercent}% recycled, {certificate.donatedPercent}% donated, carbon offset included
        </p>
      </div>
      <Badge className="bg-green-600 text-white">
        <CheckCircle className="w-3 h-3 mr-1" />
        Verified
      </Badge>
    </div>
  );
}
