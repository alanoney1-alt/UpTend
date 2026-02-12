import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  FileSearch,
  Upload,
  Loader2,
  ArrowLeft,
  CheckCircle,
  FileText,
  Calendar,
  DollarSign,
  Shield,
  Pencil,
  Save,
  X,
  Clock,
} from "lucide-react";

interface ExtractedField {
  key: string;
  label: string;
  value: string;
  type: "text" | "date" | "currency" | "coverage";
}

interface ScanResult {
  id: string;
  documentType: string;
  fileName: string;
  fields: ExtractedField[];
  summary: string;
  scannedAt: string;
}

export default function DocumentScanner() {
  const [, navigate] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: history } = useQuery<ScanResult[]>({
    queryKey: ["/api/ai/documents/scans"],
    enabled: !result,
  });

  const handleScan = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("document", file);
      const res = await fetch("/api/ai/documents/scan", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (err: any) {
      toast({
        title: "Scan failed",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fieldIcon = (type: string) => {
    switch (type) {
      case "date": return <Calendar className="w-4 h-4" />;
      case "currency": return <DollarSign className="w-4 h-4" />;
      case "coverage": return <Shield className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getFieldValue = (field: ExtractedField) =>
    editedFields[field.key] ?? field.value;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <button
          onClick={() => navigate("/ai")}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#F47C20] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> AI Features
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 rounded-full px-3 py-1 text-sm font-medium mb-3">
            <FileSearch className="w-4 h-4" /> Document AI
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Document Scanner
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload warranties, receipts, or insurance docs for instant AI extraction
          </p>
        </div>

        {!result ? (
          <>
            <Card className="p-6 mb-6">
              {!file ? (
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                    Upload a document
                  </p>
                  <p className="text-sm text-gray-400">
                    PDF, JPG, PNG — warranties, receipts, insurance docs
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </Card>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base"
              onClick={handleScan}
              disabled={loading || !file}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Scanning document...
                </>
              ) : (
                <>
                  <FileSearch className="w-5 h-5 mr-2" /> Scan Document
                </>
              )}
            </Button>

            {/* History */}
            {history && history.length > 0 && (
              <div className="mt-10">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Previous Scans
                </h2>
                <div className="space-y-3">
                  {history.map((doc) => (
                    <Card
                      key={doc.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setResult(doc)}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {doc.fileName}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Badge variant="secondary" className="text-xs">
                              {doc.documentType}
                            </Badge>
                            <Clock className="w-3 h-3" />
                            {new Date(doc.scannedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Results */
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Extracted Data
                  </h2>
                  <Badge variant="secondary">{result.documentType}</Badge>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                {result.summary}
              </p>

              <div className="space-y-3">
                {result.fields.map((field) => (
                  <div
                    key={field.key}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800"
                  >
                    <div className="text-gray-400">{fieldIcon(field.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">
                        {field.label}
                      </p>
                      {editingField === field.key ? (
                        <Input
                          value={getFieldValue(field)}
                          onChange={(e) =>
                            setEditedFields((prev) => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                          className="mt-1 h-8"
                          autoFocus
                        />
                      ) : (
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getFieldValue(field)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setEditingField(
                          editingField === field.key ? null : field.key,
                        )
                      }
                      className="text-gray-400 hover:text-[#F47C20]"
                    >
                      {editingField === field.key ? (
                        <Save className="w-4 h-4" />
                      ) : (
                        <Pencil className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-[#F47C20] hover:bg-[#e06b10] text-white"
                onClick={() => {
                  toast({ title: "Document saved!" });
                }}
              >
                <Save className="w-4 h-4 mr-2" /> Confirm & Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setFile(null);
                  setEditedFields({});
                  setEditingField(null);
                }}
              >
                New Scan
              </Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
