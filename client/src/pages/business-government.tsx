import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Landmark, DollarSign, FileText, Search,
  CheckCircle, Clock, AlertTriangle, Plus, Download,
  Shield, Globe, Users, TrendingUp, Calendar, Zap,
  Building2, BarChart3, Eye, ExternalLink
} from "lucide-react";

const demoPrevailingWages = [
  { id: 1, county: "Orange County", state: "FL", trade: "Electrician", wageRate: 32.50, fringe: 14.20, effectiveDate: "2025-01-01" },
  { id: 2, county: "Orange County", state: "FL", trade: "Plumber", wageRate: 30.75, fringe: 13.80, effectiveDate: "2025-01-01" },
  { id: 3, county: "Seminole County", state: "FL", trade: "HVAC Mechanic", wageRate: 33.10, fringe: 15.00, effectiveDate: "2025-01-01" },
  { id: 4, county: "Osceola County", state: "FL", trade: "Carpenter", wageRate: 28.90, fringe: 12.50, effectiveDate: "2025-01-01" },
];

const demoCertifiedPayrolls = [
  { id: 1, contractName: "City Hall HVAC Retrofit", weekEnding: "2025-02-07", employees: 8, totalHours: 320, totalWages: 12480, status: "submitted" },
  { id: 2, contractName: "County Library Renovation", weekEnding: "2025-02-07", employees: 12, totalHours: 480, totalWages: 18720, status: "approved" },
  { id: 3, contractName: "City Hall HVAC Retrofit", weekEnding: "2025-02-14", employees: 8, totalHours: 312, totalWages: 12168, status: "draft" },
];

const demoSamRegistration = {
  businessName: "UpTend Services LLC", cageCode: "8K4L2", uei: "JQFM7YXHK5E3",
  naicsCodes: ["561720", "562111", "238220"], status: "active", expiry: "2026-03-15",
  sbaCertifications: ["Small Business", "HUBZone"],
};

const demoDbeCerts = [
  { id: 1, vendorName: "Martinez Electric", certType: "MBE", percentage: 15, contractAmount: 45000, status: "active" },
  { id: 2, vendorName: "Women's Plumbing Co", certType: "WBE", percentage: 10, contractAmount: 30000, status: "active" },
  { id: 3, vendorName: "VetBuild LLC", certType: "SDVOSB", percentage: 8, contractAmount: 24000, status: "pending" },
];

const demoBids = [
  { id: 1, title: "Municipal Building Maintenance FY26", agency: "City of Orlando", dueDate: "2025-03-15", estimatedValue: 850000, status: "drafting" },
  { id: 2, title: "School District Janitorial Services", agency: "OCPS", dueDate: "2025-04-01", estimatedValue: 1200000, status: "submitted" },
  { id: 3, title: "VA Medical Center Grounds", agency: "US Dept of Veterans Affairs", dueDate: "2025-02-28", estimatedValue: 450000, status: "awarded" },
  { id: 4, title: "County Park Restoration", agency: "Seminole County", dueDate: "2025-05-10", estimatedValue: 320000, status: "reviewing" },
];

const demoFemaVendors = [
  { id: 1, proName: "Mike Johnson", certifications: ["FEMA IS-100", "FEMA IS-700"], equipment: "Box truck, chainsaws", radius: 150, activated: false },
  { id: 2, proName: "Sarah Williams", certifications: ["FEMA IS-100", "Hazmat Ops"], equipment: "Flatbed, pump", radius: 200, activated: true },
];

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    active: { variant: "default", label: "Active" },
    approved: { variant: "default", label: "Approved" },
    awarded: { variant: "default", label: "Awarded" },
    submitted: { variant: "outline", label: "Submitted" },
    reviewing: { variant: "outline", label: "Under Review" },
    drafting: { variant: "secondary", label: "Drafting" },
    draft: { variant: "secondary", label: "Draft" },
    pending: { variant: "secondary", label: "Pending" },
    expired: { variant: "destructive", label: "Expired" },
  };
  const c = config[status] || { variant: "secondary" as const, label: status };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

export default function BusinessGovernment() {
  const [wageSearch, setWageSearch] = useState("");

  const totalBidValue = demoBids.reduce((s, b) => s + b.estimatedValue, 0);
  const awardedValue = demoBids.filter(b => b.status === "awarded").reduce((s, b) => s + b.estimatedValue, 0);
  const dbeTotal = demoDbeCerts.reduce((s, d) => s + d.percentage, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/business/dashboard">
              <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Dashboard</Button>
            </Link>
            <div className="flex items-center gap-2">
              <Landmark className="w-6 h-6 text-orange-500" />
              <span className="text-xl font-bold">Government Contracts</span>
            </div>
          </div>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" /> New Bid
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg"><BarChart3 className="w-5 h-5 text-orange-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold">${(totalBidValue / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg"><DollarSign className="w-5 h-5 text-green-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Awarded</p>
                <p className="text-2xl font-bold">${(awardedValue / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Globe className="w-5 h-5 text-blue-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">SAM Status</p>
                <p className="text-lg font-bold text-green-600">Active</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg"><Users className="w-5 h-5 text-purple-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">DBE Utilization</p>
                <p className="text-2xl font-bold">{dbeTotal}%</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg"><Zap className="w-5 h-5 text-red-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">FEMA Ready</p>
                <p className="text-2xl font-bold">{demoFemaVendors.filter(f => f.activated).length}/{demoFemaVendors.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="bids" className="space-y-6">
          <TabsList className="flex overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="bids"><FileText className="w-4 h-4 mr-1" /> Bids & Proposals</TabsTrigger>
            <TabsTrigger value="wages"><DollarSign className="w-4 h-4 mr-1" /> Prevailing Wages</TabsTrigger>
            <TabsTrigger value="payroll"><Calendar className="w-4 h-4 mr-1" /> Certified Payroll</TabsTrigger>
            <TabsTrigger value="sam"><Globe className="w-4 h-4 mr-1" /> SAM.gov</TabsTrigger>
            <TabsTrigger value="dbe"><Users className="w-4 h-4 mr-1" /> DBE Tracking</TabsTrigger>
            <TabsTrigger value="fema"><Zap className="w-4 h-4 mr-1" /> FEMA</TabsTrigger>
          </TabsList>

          {/* Bids */}
          <TabsContent value="bids" className="space-y-4">
            <h2 className="text-xl font-semibold">Bid & Proposal Pipeline</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {demoBids.map(bid => (
                <Card key={bid.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{bid.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3" /> {bid.agency}</p>
                    </div>
                    <StatusBadge status={bid.status} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Due: {new Date(bid.dueDate).toLocaleDateString()}</span>
                    <span className="font-semibold text-orange-600">${(bid.estimatedValue / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-1" /> View</Button>
                    <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Docs</Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Prevailing Wages */}
          <TabsContent value="wages" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Davis-Bacon Prevailing Wage Rates</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by county or trade..." className="pl-9 w-72" value={wageSearch} onChange={e => setWageSearch(e.target.value)} />
              </div>
            </div>
            <Card>
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>County</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Trade</TableHead>
                    <TableHead className="text-right">Base Rate</TableHead>
                    <TableHead className="text-right">Fringe</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Effective</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demoPrevailingWages.filter(w => !wageSearch || w.county.toLowerCase().includes(wageSearch.toLowerCase()) || w.trade.toLowerCase().includes(wageSearch.toLowerCase())).map(w => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.county}</TableCell>
                      <TableCell>{w.state}</TableCell>
                      <TableCell>{w.trade}</TableCell>
                      <TableCell className="text-right">${w.wageRate.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${w.fringe.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">${(w.wageRate + w.fringe).toFixed(2)}</TableCell>
                      <TableCell>{new Date(w.effectiveDate).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </Card>
          </TabsContent>

          {/* Certified Payroll */}
          <TabsContent value="payroll" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Certified Payroll (WH-347)</h2>
              <Button className="bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-2" /> New Payroll</Button>
            </div>
            <Card>
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract</TableHead>
                    <TableHead>Week Ending</TableHead>
                    <TableHead className="text-right">Employees</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Total Wages</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demoCertifiedPayrolls.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.contractName}</TableCell>
                      <TableCell>{new Date(p.weekEnding).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">{p.employees}</TableCell>
                      <TableCell className="text-right">{p.totalHours}</TableCell>
                      <TableCell className="text-right font-semibold">${p.totalWages.toLocaleString()}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </Card>
          </TabsContent>

          {/* SAM.gov */}
          <TabsContent value="sam" className="space-y-4">
            <h2 className="text-xl font-semibold">SAM.gov Registration</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <CardTitle className="text-lg mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-orange-500" /> Registration Details</CardTitle>
                <div className="space-y-4">
                  <div className="flex justify-between"><span className="text-muted-foreground">Business Name</span><span className="font-medium">{demoSamRegistration.businessName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">CAGE Code</span><span className="font-mono font-medium">{demoSamRegistration.cageCode}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">UEI</span><span className="font-mono font-medium">{demoSamRegistration.uei}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="default">Active</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Renewal Date</span><span className="font-medium">{new Date(demoSamRegistration.expiry).toLocaleDateString()}</span></div>
                </div>
              </Card>
              <Card className="p-6">
                <CardTitle className="text-lg mb-4">NAICS Codes & Certifications</CardTitle>
                <div className="space-y-3 mb-4">
                  <p className="text-sm text-muted-foreground">NAICS Codes:</p>
                  <div className="flex flex-wrap gap-2">
                    {demoSamRegistration.naicsCodes.map(code => <Badge key={code} variant="outline" className="font-mono">{code}</Badge>)}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">SBA Certifications:</p>
                  <div className="flex flex-wrap gap-2">
                    {demoSamRegistration.sbaCertifications.map(cert => <Badge key={cert} className="bg-orange-500/10 text-orange-600 border-orange-200">{cert}</Badge>)}
                  </div>
                </div>
                <Button variant="outline" className="mt-4 w-full"><ExternalLink className="w-4 h-4 mr-2" /> View on SAM.gov</Button>
              </Card>
            </div>
          </TabsContent>

          {/* DBE */}
          <TabsContent value="dbe" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">DBE/MBE/SDVOSB Utilization</h2>
                <p className="text-sm text-muted-foreground">Track diversity compliance across contracts</p>
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-2" /> Add Vendor</Button>
            </div>
            <Card className="p-4 mb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Overall DBE Goal: 25%</span>
                <Progress value={dbeTotal} className="flex-1" />
                <span className="text-sm font-bold">{dbeTotal}%</span>
              </div>
            </Card>
            <Card>
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Certification</TableHead>
                    <TableHead className="text-right">Contract Amount</TableHead>
                    <TableHead className="text-right">Utilization %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demoDbeCerts.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.vendorName}</TableCell>
                      <TableCell><Badge variant="outline">{d.certType}</Badge></TableCell>
                      <TableCell className="text-right">${d.contractAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">{d.percentage}%</TableCell>
                      <TableCell><StatusBadge status={d.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </Card>
          </TabsContent>

          {/* FEMA */}
          <TabsContent value="fema" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">FEMA Disaster Response Pool</h2>
                <p className="text-sm text-muted-foreground">Pre-registered vendors for emergency activation</p>
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-2" /> Register Pro</Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {demoFemaVendors.map(v => (
                <Card key={v.id} className={`p-5 ${v.activated ? "border-red-500/50 bg-red-500/5" : ""}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{v.proName}</h3>
                      <p className="text-sm text-muted-foreground">{v.radius} mi radius</p>
                    </div>
                    <Badge variant={v.activated ? "destructive" : "secondary"}>{v.activated ? "ACTIVATED" : "Standby"}</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Certs:</span> <span className="font-medium">{v.certifications.join(", ")}</span></div>
                    <div><span className="text-muted-foreground">Equipment:</span> <span className="font-medium">{v.equipment}</span></div>
                  </div>
                  <Button variant={v.activated ? "destructive" : "outline"} size="sm" className="mt-3">
                    <Zap className="w-4 h-4 mr-1" /> {v.activated ? "Deactivate" : "Activate"}
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
