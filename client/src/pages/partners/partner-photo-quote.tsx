/**
 * Partner Photo Quote Page — /partners/:slug/quote
 *
 * Standalone public page Alex texts to customers.
 * No auth required.
 *
 * Flow:
 * 1. Customer fills in name, email, phone, address
 * 2. Uploads 1–3 photos of their HVAC unit
 * 3. George AI analyzes: make, model, age, condition, issues
 * 4. Summary sent to Alex's partner dashboard
 * 5. Alex calls customer with quote
 */

import { useState, useRef } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Camera, CheckCircle, Loader2, Phone, Upload, X, ArrowRight,
  Thermometer, Wrench, AlertCircle, Shield,
} from "lucide-react";
import { getPartnerConfig } from "@/config/partner-configs";

interface PhotoPreview {
  file: File;
  dataUrl: string;
}

type Step = "form" | "uploading" | "success" | "error";

export default function PartnerPhotoQuote() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "comfort-solutions-tech";
  const config = getPartnerConfig(slug);

  const [step, setStep] = useState<Step>("form");
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [dragging, setDragging] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    notes: "",
  });

  const handleField = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const newPhotos: PhotoPreview[] = [];
    const remaining = 3 - photos.length;
    Array.from(files)
      .slice(0, remaining)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          newPhotos.push({ file, dataUrl: reader.result as string });
          if (newPhotos.length === Math.min(files.length, remaining)) {
            setPhotos((prev) => [...prev, ...newPhotos]);
          }
        };
        reader.readAsDataURL(file);
      });
  };

  const removePhoto = (index: number) =>
    setPhotos((prev) => prev.filter((_, i) => i !== index));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addPhotos(e.dataTransfer.files);
  };

  const isFormValid =
    form.customerName.trim() &&
    form.customerEmail.trim() &&
    form.customerPhone.trim() &&
    form.customerAddress.trim() &&
    photos.length > 0;

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setStep("uploading");
    setSubmitError("");

    try {
      const formData = new FormData();
      formData.append("customerName", form.customerName);
      formData.append("customerEmail", form.customerEmail);
      formData.append("customerPhone", form.customerPhone);
      formData.append("customerAddress", form.customerAddress);
      if (form.notes) formData.append("notes", form.notes);
      photos.forEach(({ file }) => formData.append("photos", file));

      const res = await fetch(`/api/partners/${slug}/photo-quote/submit`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Submission failed");
      }

      setSuccessMessage(data.message || "Your request was submitted successfully!");
      setStep("success");
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
      setStep("error");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-3xl">
          <div>
            <span className="font-bold text-sm sm:text-base">{config.companyName}</span>
            <span className="hidden sm:inline text-muted-foreground text-sm ml-2">
              — {config.tagline}
            </span>
          </div>
          <a
            href={`tel:${config.phone.replace(/\D/g, "")}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">{config.phone}</span>
            <span className="sm:hidden">Call</span>
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* ── Success State ─────────────────────────────────────────── */}
        {step === "success" && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Photos Received!</h1>
            <p className="text-muted-foreground mb-2 max-w-md mx-auto">
              {successMessage}
            </p>
            <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
              {config.ownerName} and the team will review your photos and call you back shortly with pricing.
            </p>
            <Card className="max-w-sm mx-auto text-left">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Call anytime: <a href={`tel:${config.phone.replace(/\D/g, "")}`} className="font-medium text-primary">{config.phone}</a></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Thermometer className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>AC out? We offer same-day emergency service</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Licensed, insured, background-checked techs</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Error State ────────────────────────────────────────────── */}
        {step === "error" && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-destructive/15 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold mb-3">Submission Failed</h1>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{submitError}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setStep("form")} variant="outline">Try Again</Button>
              <Button asChild>
                <a href={`tel:${config.phone.replace(/\D/g, "")}`}>
                  <Phone className="w-4 h-4 mr-2" /> Call {config.ownerName}
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* ── Uploading / Analyzing State ───────────────────────────── */}
        {step === "uploading" && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h1 className="text-xl font-bold mb-2">Analyzing Your Photos…</h1>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Our AI is identifying your unit's make, model, and condition. This takes about 10–15 seconds.
            </p>
          </div>
        )}

        {/* ── Main Form ─────────────────────────────────────────────── */}
        {step === "form" && (
          <>
            {/* Hero */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold mb-4">
                <Camera className="w-3.5 h-3.5" />
                Free HVAC Photo Scope
              </div>
              <h1 className="text-3xl font-bold mb-3">
                Get Your HVAC Quote — No Waiting
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Send us photos of your unit. {config.ownerName}'s team analyzes them and calls you back with a real quote — no in-home estimate wait time.
              </p>
            </div>

            {/* How it works */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { icon: Camera, step: "1", title: "Snap Photos", desc: "AC unit, thermostat, or area of concern" },
                { icon: Wrench, step: "2", title: "AI Analyzes", desc: "Identifies make, model, age, issues" },
                { icon: Phone, step: "3", title: "Alex Calls You", desc: "Real quote, no surprises" },
              ].map(({ icon: Icon, step: n, title, desc }) => (
                <div key={n} className="text-center">
                  <div className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2">
                    {n}
                  </div>
                  <p className="font-semibold text-sm mb-0.5">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {/* Contact Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Your Contact Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Jane Smith"
                        value={form.customerName}
                        onChange={handleField("customerName")}
                        autoComplete="name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(407) 555-0100"
                        value={form.customerPhone}
                        onChange={handleField("customerPhone")}
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="jane@example.com"
                      value={form.customerEmail}
                      onChange={handleField("customerEmail")}
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="address">Service Address *</Label>
                    <Input
                      id="address"
                      placeholder="123 Main St, Orlando, FL 32801"
                      value={form.customerAddress}
                      onChange={handleField("customerAddress")}
                      autoComplete="street-address"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Describe the problem</Label>
                    <textarea
                      id="notes"
                      placeholder="Tell us what's going on — e.g. 'AC stopped cooling yesterday, making a clicking noise, thermostat is set to 72 but house is 82'"
                      value={form.notes}
                      onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                    />
                    <p className="text-xs text-muted-foreground">The more detail you give, the more accurate the quote</p>
                  </div>
                </CardContent>
              </Card>

              {/* Photo Upload */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" />
                    Upload HVAC Photos *
                    <span className="text-xs font-normal text-muted-foreground ml-auto">
                      {photos.length}/3 photos
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Drop Zone */}
                  {photos.length < 3 && (
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors mb-4 ${
                        dragging
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/30"
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="font-medium text-sm mb-1">
                        Tap to add photos or drag & drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, HEIC — up to 3 photos, 15MB each
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => addPhotos(e.target.files)}
                      />
                    </div>
                  )}

                  {/* Photo Previews */}
                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {photos.map((p, i) => (
                        <div key={i} className="relative aspect-square">
                          <img
                            src={p.dataUrl}
                            alt={`HVAC photo ${i + 1}`}
                            className="w-full h-full object-cover rounded-lg border border-border"
                          />
                          <button
                            onClick={() => removePhoto(i)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-sm hover:bg-destructive/90 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {/* Add more slot */}
                      {photos.length < 3 && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                        >
                          <Camera className="w-5 h-5 mb-1" />
                          <span className="text-xs">Add more</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tips */}
                  <div className="mt-4 bg-muted/40 rounded-lg p-3">
                    <p className="text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">
                      Best photos to send
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" /> Outdoor condenser / compressor unit</li>
                      <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" /> Indoor air handler / furnace</li>
                      <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" /> Thermostat display (if showing error)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <Button
                size="lg"
                className="w-full text-base"
                onClick={handleSubmit}
                disabled={!isFormValid}
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Send Photos to {config.ownerName}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Your info is only shared with {config.companyName}. We don't spam.
              </p>
            </div>

            {/* Footer trust */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Shield className="w-6 h-6 text-primary mx-auto mb-1" />
                  <p className="text-xs font-semibold">Licensed &amp; Insured</p>
                </div>
                <div>
                  <Thermometer className="w-6 h-6 text-primary mx-auto mb-1" />
                  <p className="text-xs font-semibold">Same-Day Available</p>
                </div>
                <div>
                  <CheckCircle className="w-6 h-6 text-primary mx-auto mb-1" />
                  <p className="text-xs font-semibold">Free Scoping</p>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-6">
                Powered by <span className="font-semibold text-foreground">UpTend</span>
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
