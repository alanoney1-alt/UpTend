import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Upload,
  Download,
  File,
  FileImage,
  FileCode,
  Folder,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropertyDocument } from "@shared/schema";

interface DocumentVaultProps {
  propertyId: string;
}

export function DocumentVault({ propertyId }: DocumentVaultProps) {
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchDocuments();
  }, [propertyId]);

  async function fetchDocuments() {
    try {
      const response = await fetch(`/api/properties/${propertyId}/documents`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  }

  function getFileIcon(fileType?: string) {
    if (!fileType) return <File className="h-5 w-5" />;
    if (fileType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes("image")) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (fileType.includes("video")) return <FileCode className="h-5 w-5 text-purple-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  }

  function formatFileSize(bytes?: number) {
    if (!bytes) return "Unknown";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      searchQuery === "" ||
      doc.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentType?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || doc.documentType === filterType;
    return matchesSearch && matchesType;
  });

  const documentTypes = Array.from(new Set(documents.map((d) => d.documentType).filter(Boolean)));

  const documentsByCategory = filteredDocuments.reduce((acc, doc) => {
    const category = doc.documentType || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, PropertyDocument[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Document Vault</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Centralized storage for all property-related documents
              </p>
            </div>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                    Upload a property-related document to your vault
                  </DialogDescription>
                </DialogHeader>
                <UploadDocumentForm
                  propertyId={propertyId}
                  onSuccess={() => {
                    setUploadDialogOpen(false);
                    fetchDocuments();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {documentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type?.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{documents.length}</p>
              <p className="text-sm text-muted-foreground">Total Documents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{documentTypes.length}</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">
                {formatFileSize(
                  documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0)
                )}
              </p>
              <p className="text-sm text-muted-foreground">Total Size</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents by Category */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Folder className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || filterType !== "all" ? "No documents found" : "No documents yet"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || filterType !== "all"
                  ? "Try adjusting your search or filter"
                  : "Start building your document library"}
              </p>
              {!searchQuery && filterType === "all" && (
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Document
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(documentsByCategory).map(([category, docs]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg capitalize">
                  <Folder className="h-5 w-5" />
                  {category.replace(/_/g, " ")}
                  <Badge variant="secondary" className="ml-2">
                    {docs.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getFileIcon(doc.fileType || undefined)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.documentName}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span>{formatFileSize(doc.fileSize || undefined)}</span>
                            <span>•</span>
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                            {doc.description && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-xs">{doc.description}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.fileUrl && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Document Organization Tips */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-purple-900 mb-3"> Document Organization Tips</h3>
          <ul className="text-sm text-purple-800 space-y-2">
            <li>• Keep all purchase receipts for appliances and improvements</li>
            <li>• Store warranty documents for easy access when needed</li>
            <li>• Maintain inspection reports and permits for compliance</li>
            <li>• Document before/after photos of renovations</li>
            <li>• Save utility bills to track consumption patterns</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function UploadDocumentForm({
  propertyId,
  onSuccess,
}: {
  propertyId: string;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    documentType: "",
    documentName: "",
    description: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !formData.documentType) {
      alert("Please select a file and document type");
      return;
    }

    setUploading(true);
    try {
      // In production, upload to cloud storage first and get URL
      const fileUrl = URL.createObjectURL(file);

      const response = await fetch(`/api/properties/${propertyId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: crypto.randomUUID(),
          propertyId,
          documentType: formData.documentType,
          documentName: formData.documentName || file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl,
          description: formData.description,
          createdAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        alert("Failed to upload document");
      }
    } catch (error) {
      console.error("Failed to upload document:", error);
      alert("Failed to upload document");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="file">Select File *</Label>
        <Input
          id="file"
          type="file"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) {
              setFile(selectedFile);
              if (!formData.documentName) {
                setFormData({ ...formData, documentName: selectedFile.name });
              }
            }
          }}
          required
        />
        {file && (
          <p className="text-sm text-muted-foreground mt-1">
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="documentType">Document Type *</Label>
        <Select
          value={formData.documentType}
          onValueChange={(value) => setFormData({ ...formData, documentType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deed">Deed</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="inspection_report">Inspection Report</SelectItem>
            <SelectItem value="appraisal">Appraisal</SelectItem>
            <SelectItem value="warranty">Warranty</SelectItem>
            <SelectItem value="insurance_policy">Insurance Policy</SelectItem>
            <SelectItem value="permit">Permit</SelectItem>
            <SelectItem value="receipt">Receipt</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="invoice">Invoice</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="photo">Photo</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="documentName">Display Name</Label>
        <Input
          id="documentName"
          value={formData.documentName}
          onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
          placeholder={file?.name}
        />
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of this document"
        />
      </div>

      <Button type="submit" disabled={uploading || !file} className="w-full">
        {uploading ? "Uploading..." : "Upload Document"}
      </Button>
    </form>
  );
}
