import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, Scale, Leaf, CheckCircle, ArrowRight, ArrowLeft, AlertTriangle } from "lucide-react";

const MATERIAL_MULTIPLIERS: Record<string, number> = {
  Metal: 4.0,
  Cardboard: 1.2,
  "E-Waste": 6.5,
  Furniture: 0.8,
  Wood: 0.6,
  Appliances: 3.5,
  Yard: 0.3,
  Mixed: 1.5,
};

export default function ProVerification() {
  const [weight, setWeight] = useState("");
  const [material, setMaterial] = useState("Metal");
  const [photoTaken, setPhotoTaken] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const weightNum = parseFloat(weight) || 0;
  const multiplier = MATERIAL_MULTIPLIERS[material] || 1.5;
  const co2Avoided = (weightNum * multiplier * 0.453592).toFixed(1);

  if (submitted) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center p-6 bg-background" data-testid="page-verification-success">
        <div className="bg-green-500 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <CheckCircle className="text-white w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-center mb-2">Impact Verified</h1>
        <p className="text-muted-foreground text-center mb-2">
          {weightNum} lbs of {material} logged
        </p>
        <p className="text-green-600 dark:text-green-400 font-bold text-lg mb-6">{co2Avoided}kg CO2 Avoided</p>
        <p className="text-xs text-muted-foreground text-center mb-8">
          The homeowner has been notified. Your Sustainability Badge has been updated.
        </p>
        <Link href="/pro/dashboard">
          <Button className="w-full" data-testid="button-back-to-dashboard">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen pb-20" data-testid="page-pro-verification">
      <div className="bg-card-foreground dark:bg-slate-900 text-card dark:text-white p-6 rounded-b-2xl shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <Link href="/pro/dashboard">
            <Button variant="ghost" size="sm" className="text-white/70 gap-1" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <Badge variant="outline" className="border-primary/50 text-primary text-[10px] font-black uppercase tracking-widest">
            Verification Mode
          </Badge>
        </div>
        <h2 className="text-2xl font-black" data-testid="text-verification-title">Final Impact Log</h2>
        <p className="text-sm opacity-60 mt-1">Every entry builds your Sustainability Badge.</p>
      </div>

      <div className="p-4 space-y-6 -mt-4">
        <Card className="overflow-hidden" data-testid="card-photo-proof">
          <CardContent className="p-0">
            <button
              type="button"
              className={`w-full aspect-video flex flex-col items-center justify-center transition-colors ${
                photoTaken ? "bg-green-500 dark:bg-green-600" : "bg-muted"
              }`}
              onClick={() => setPhotoTaken(!photoTaken)}
              data-testid="button-take-photo"
            >
              {photoTaken ? (
                <div className="text-center text-white">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-bold">Receipt / Empty Space Logged</p>
                  <p className="text-xs opacity-80 mt-1">Tap to retake</p>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Camera className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm font-bold">Snap Receipt or Empty Space</p>
                  <p className="text-[10px] uppercase tracking-widest mt-1">Required for Insurance Shield</p>
                </div>
              )}
            </button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
            Material Type
          </label>
          <div className="grid grid-cols-2 gap-3" data-testid="grid-material-types">
            {Object.keys(MATERIAL_MULTIPLIERS).map((m) => (
              <Button
                key={m}
                type="button"
                variant={material === m ? "default" : "outline"}
                onClick={() => setMaterial(m)}
                className="font-bold"
                data-testid={`button-material-${m.toLowerCase().replace(/[^a-z]/g, "")}`}
              >
                {m}
              </Button>
            ))}
          </div>

          <div className="relative">
            <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="number"
              placeholder="Enter Weight (lbs)"
              className="pl-12 text-lg font-bold"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              data-testid="input-weight"
            />
          </div>
        </div>

        <div className="bg-green-600 dark:bg-green-700 p-6 rounded-md text-white shadow-lg flex items-center justify-between gap-4" data-testid="card-impact-preview">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Your Verified Impact</p>
              <p className="text-2xl font-black" data-testid="text-co2-avoided">{co2Avoided}kg CO2 Saved</p>
            </div>
          </div>
        </div>

        <Button
          disabled={!photoTaken || !weight || weightNum <= 0}
          className="w-full h-14 font-black text-lg shadow-xl"
          onClick={() => setSubmitted(true)}
          data-testid="button-verify-complete"
        >
          Verify & Complete Job <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>

      <div className="px-6 mt-4 flex gap-3 items-start opacity-60">
        <AlertTriangle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-[9px] leading-tight text-muted-foreground">
          Fraudulent logging results in immediate suspension from the UpTend network. All data is cross-referenced with facility GPS and 360 video.
        </p>
      </div>
    </div>
  );
}
