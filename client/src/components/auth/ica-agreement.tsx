import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, ArrowLeft, ArrowRight, CheckCircle, Loader2 } from "lucide-react";

const ICA_VERSION = "v1.0";

interface ICAAcceptanceData {
  signedName: string;
  acceptedAt: string;
  icaVersion: string;
}

interface ICAAgreementProps {
  contractorName: string;
  onAccept: (data: ICAAcceptanceData) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

function ICAText({ contractorName }: { contractorName: string }) {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
      <h2 className="text-center text-lg font-bold mb-1">INDEPENDENT CONTRACTOR AGREEMENT</h2>
      <p className="text-center text-xs text-muted-foreground mb-6">Version {ICA_VERSION} — Effective Date: Date of Electronic Acceptance</p>

      <p>This Independent Contractor Agreement ("Agreement") is entered into as of the date of electronic acceptance below, by and between:</p>

      <p><strong>UPYCK, Inc.</strong>, a Delaware C-Corporation doing business as <strong>UpTend</strong>, with its principal place of business in Orlando, Florida ("Company"), and</p>

      <p><strong>{contractorName || "[Contractor Name]"}</strong> ("Contractor"), an independent service provider who has registered on the UpTend platform.</p>

      <p>Company and Contractor are each referred to herein as a "Party" and collectively as the "Parties."</p>

      <hr />

      <h3 className="font-bold">1. INDEPENDENT CONTRACTOR STATUS</h3>
      <p>Contractor is an independent contractor and is <strong>not</strong> an employee, agent, joint venturer, or partner of Company. Nothing in this Agreement shall be construed to create an employer-employee relationship between the Parties. Contractor shall not be entitled to any employee benefits from Company, including but not limited to health insurance, retirement benefits, paid time off, workers' compensation, unemployment insurance, or any other benefits typically afforded to employees. Company shall not withhold any federal, state, or local income taxes, Social Security taxes, or any other payroll taxes from payments made to Contractor.</p>

      <h3 className="font-bold">2. RIGHT TO CONTROL METHOD OF PERFORMANCE</h3>
      <p>Contractor retains the sole and exclusive right to control the method, means, and manner of performing services. Company does not and shall not dictate how, when, or in what sequence work is performed, provided that Contractor completes accepted jobs in accordance with general quality standards and applicable law. The Parties acknowledge that the absence of behavioral control over the manner of performance is a material term of this Agreement and evidence of Contractor's independent contractor status.</p>

      <h3 className="font-bold">3. NO EXCLUSIVITY</h3>
      <p>Contractor is free to engage in other business activities, provide services to other companies, platforms, or clients, and maintain other contractual relationships simultaneously with this Agreement. Company does not require exclusivity of any kind, and Contractor's engagement with other entities shall not constitute a breach of this Agreement.</p>

      <h3 className="font-bold">4. OWN TOOLS AND EQUIPMENT</h3>
      <p>Contractor shall provide all tools, equipment, vehicles, supplies, and other materials necessary to perform services. Company does not furnish, and is not obligated to furnish, any tools, equipment, or vehicles to Contractor. Contractor is solely responsible for the maintenance, repair, insurance, and operational costs of all tools, equipment, and vehicles used in the performance of services.</p>

      <h3 className="font-bold">5. RIGHT TO ACCEPT OR REJECT WORK</h3>
      <p>Contractor may accept or decline any job offered through the UpTend platform at Contractor's sole discretion. There is no obligation to accept any minimum number of jobs, work any minimum number of hours, or be available at any particular time. Company shall not penalize Contractor for declining jobs, except that Contractor's visibility on the platform may be affected by activity metrics as disclosed in the platform's operational guidelines.</p>

      <h3 className="font-bold">6. PAYMENT TERMS</h3>
      <p>(a) <strong>Per-Job Compensation.</strong> Contractor is compensated on a per-job basis, not by hourly wage or salary. Payment amounts are determined by the job scope as agreed upon through the platform prior to job commencement.</p>
      <p>(b) <strong>Platform Fee Structure.</strong> Company retains a platform service fee from each completed job as follows:</p>
      <ul>
        <li>Contractors who maintain a verified LLC or equivalent business entity and carry verified general liability insurance: <strong>15% platform fee</strong> (Contractor receives 85%).</li>
        <li>Contractors without verified LLC status or without verified insurance documentation: <strong>15% platform fee</strong> (Contractor receives 85%).</li>
      </ul>
      <p>(c) <strong>Payment Processing.</strong> Payments are processed via Stripe and shall be disbursed within forty-eight (48) hours of confirmed job completion, subject to any applicable holds or dispute resolution processes.</p>
      <p>(d) <strong>Tax Reporting.</strong> Company will issue IRS Form 1099-NEC to Contractor for all earnings of six hundred dollars ($600.00) or more in any calendar year, in accordance with applicable IRS regulations.</p>

      <h3 className="font-bold">7. INSURANCE</h3>
      <p>(a) Contractor is solely responsible for obtaining and maintaining adequate general liability insurance coverage for all services performed. Company strongly recommends a minimum of $1,000,000 in general liability coverage.</p>
      <p>(b) Every job is insured. New Contractors are covered by Company's platform policy. As Contractors grow their earnings on the platform, they will transition to their own coverage through the tiered insurance model outlined in the platform dashboard.</p>
      <p>(c) Company maintains its own general liability insurance policy for the purpose of covering Company's obligations under business-to-business ("B2B") and government prime contracts. Company's insurance does not extend coverage to Contractor.</p>

      <h3 className="font-bold">8. INDEMNIFICATION</h3>
      <p>Contractor shall indemnify, defend, and hold harmless Company, its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) Contractor's performance or failure to perform services; (b) any act or omission of Contractor, including negligence or willful misconduct; (c) any breach by Contractor of this Agreement; or (d) any violation of applicable law by Contractor.</p>

      <h3 className="font-bold">9. NO AUTHORITY TO BIND</h3>
      <p>Contractor has no authority to bind Company, enter into contracts on behalf of Company, or make representations or warranties on behalf of Company. Contractor shall not hold themselves out as an employee, agent, or authorized representative of Company to any third party.</p>

      <h3 className="font-bold">10. TERM AND TERMINATION</h3>
      <p>(a) This Agreement is effective as of the date of electronic acceptance and shall continue until terminated by either Party.</p>
      <p>(b) Either Party may terminate this Agreement at any time, for any reason or no reason, with or without notice.</p>
      <p>(c) Company does not guarantee any minimum volume of work, job availability, or income to Contractor.</p>
      <p>(d) Upon termination, all outstanding payments for completed and verified jobs shall be disbursed in accordance with the payment terms set forth herein.</p>

      <h3 className="font-bold">11. TAX RESPONSIBILITY</h3>
      <p>Contractor is solely responsible for the payment of all applicable taxes arising from compensation received under this Agreement, including but not limited to federal and state income taxes, self-employment taxes (Social Security and Medicare), and any applicable local or municipal taxes. Contractor acknowledges that Company will not withhold any taxes from payments to Contractor.</p>

      <h3 className="font-bold">12. DISPUTE RESOLUTION</h3>
      <p>(a) Any dispute, claim, or controversy arising out of or relating to this Agreement, or the breach, termination, enforcement, interpretation, or validity thereof, shall be resolved by binding arbitration administered in Orange County, Florida.</p>
      <p>(b) This Agreement shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of laws principles.</p>
      <p>(c) The prevailing party in any arbitration or legal proceeding shall be entitled to recover reasonable attorneys' fees and costs from the non-prevailing party.</p>

      <h3 className="font-bold">13. BACKGROUND CHECK CONSENT</h3>
      <p>Contractor consents to Company conducting a background check, which may include criminal history, driving record, and identity verification, as a condition of participation on the UpTend platform. Contractor understands that the results of such background check may affect Contractor's eligibility to use the platform.</p>

      <h3 className="font-bold">14. PLATFORM QUALITY STANDARDS</h3>
      <p>Contractor agrees to maintain professional conduct and quality standards while performing services, including but not limited to: (a) completing accepted jobs in a workmanlike manner; (b) responding to customer ratings and feedback constructively; (c) maintaining professional communication with customers; and (d) complying with all applicable local, state, and federal laws and regulations. The Parties acknowledge that these are quality standards for the purpose of ensuring customer satisfaction and platform integrity, and <strong>do not constitute behavioral control</strong> indicative of an employer-employee relationship.</p>

      <h3 className="font-bold">15. DATA AND PRIVACY</h3>
      <p>Contractor acknowledges and agrees to the UpTend Privacy Policy, available at <span className="text-primary">https://uptend.com/privacy</span>, which governs the collection, use, and disclosure of personal information. Contractor consents to the collection and use of location data, performance metrics, and other operational data as necessary for the operation of the platform.</p>

      <h3 className="font-bold">16. ELECTRONIC SIGNATURE</h3>
      <p>The Parties agree that this Agreement may be executed by electronic signature, consisting of Contractor's typed full legal name and the date of acceptance, which shall constitute a binding electronic signature under the Electronic Signatures in Global and National Commerce Act ("E-SIGN Act"), 15 U.S.C. § 7001 et seq., and the Uniform Electronic Transactions Act ("UETA"). Contractor acknowledges that their electronic signature has the same legal force and effect as a handwritten signature.</p>

      <h3 className="font-bold">17. ENTIRE AGREEMENT</h3>
      <p>This Agreement constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior and contemporaneous agreements, understandings, negotiations, and discussions, whether oral or written.</p>

      <hr />

      <p className="text-xs text-muted-foreground mt-4">
        <strong>Company:</strong> UPYCK, Inc., a Delaware C-Corporation, d/b/a UpTend, Orlando, FL
      </p>
    </div>
  );
}

export function ICAAgreement({ contractorName, onAccept, onBack, isSubmitting }: ICAAgreementProps) {
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const atBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;
    if (atBottom) setHasScrolledToBottom(true);
  }, []);

  const canSubmit = signedName.trim().length >= 2 && agreed && hasScrolledToBottom;

  const handleAccept = () => {
    if (!canSubmit) return;
    onAccept({
      signedName: signedName.trim(),
      acceptedAt: new Date().toISOString(),
      icaVersion: ICA_VERSION,
    });
  };

  return (
    <Card className="p-6" data-testid="card-ica-agreement">
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Independent Contractor Agreement
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Please read the following agreement carefully. You must scroll through the entire agreement, type your full legal name, and check the box below to proceed.
      </p>

      <div
        className="border rounded-lg mb-4 h-[400px] overflow-y-auto p-4 bg-muted/30"
        onScroll={handleScroll}
        ref={scrollRef}
        data-testid="ica-scroll-area"
      >
        <ICAText contractorName={contractorName} />
      </div>

      {!hasScrolledToBottom && (
        <p className="text-sm text-amber-600 mb-4 flex items-center gap-2">
          ↓ Please scroll to the bottom of the agreement to continue
        </p>
      )}

      {hasScrolledToBottom && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="ica-signature" className="text-sm font-medium">
              Electronic Signature — Type Your Full Legal Name
            </Label>
            <Input
              id="ica-signature"
              placeholder="e.g., John Michael Smith"
              value={signedName}
              onChange={(e) => setSignedName(e.target.value)}
              className="mt-1 font-serif text-lg"
              data-testid="input-ica-signature"
            />
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="ica-agree"
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
              data-testid="checkbox-ica-agree"
            />
            <Label htmlFor="ica-agree" className="text-sm leading-snug cursor-pointer">
              I have read and agree to the Independent Contractor Agreement. I understand that by typing my name above and checking this box, I am creating a legally binding electronic signature.
            </Label>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <Button type="button" variant="outline" onClick={onBack} data-testid="button-ica-back">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          type="button"
          onClick={handleAccept}
          disabled={!canSubmit || isSubmitting}
          data-testid="button-ica-accept"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Accept & Submit Application
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

/** Standalone ICA banner for existing pros who haven't signed */
export function ICABanner({ onSign }: { onSign: () => void }) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <FileText className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-amber-700 dark:text-amber-400">Independent Contractor Agreement Required</h3>
          <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
            You must review and sign the Independent Contractor Agreement before you can accept jobs on UpTend.
          </p>
          <Button size="sm" className="mt-3" onClick={onSign} data-testid="button-sign-ica">
            Review & Sign Agreement
          </Button>
        </div>
      </div>
    </div>
  );
}

export { ICA_VERSION };
export type { ICAAcceptanceData };
