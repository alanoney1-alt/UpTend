// InsuranceClaim.ts — Guided insurance claim filing
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLAIMS_KEY = 'uptend_insurance_claims';

export type ClaimStep = 'what_happened' | 'when' | 'photos' | 'description' | 'review' | 'submitted';

export interface InsuranceClaimData {
  id: string;
  jobId: string;
  proId: string;
  customerId: string;
  type: 'property_damage' | 'personal_injury' | 'vehicle_damage' | 'equipment_loss' | 'other';
  whatHappened: string;
  whenHappened: Date;
  photos: string[]; // URIs
  photoAnnotations: { uri: string; description: string }[];
  description: string;
  location: { lat: number; lng: number } | null;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'denied' | 'resolved';
  currentStep: ClaimStep;
  createdAt: Date;
  updatedAt: Date;
}

class InsuranceClaimService {
  private claims: InsuranceClaimData[] = [];

  async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(CLAIMS_KEY);
      if (stored) this.claims = JSON.parse(stored);
    } catch {}
  }

  createClaim(jobId: string, proId: string, customerId: string): InsuranceClaimData {
    const claim: InsuranceClaimData = {
      id: `claim_${Date.now()}`,
      jobId, proId, customerId,
      type: 'property_damage',
      whatHappened: '',
      whenHappened: new Date(),
      photos: [],
      photoAnnotations: [],
      description: '',
      location: null,
      status: 'draft',
      currentStep: 'what_happened',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.claims.push(claim);
    this.save();
    return claim;
  }

  updateClaim(claimId: string, updates: Partial<InsuranceClaimData>): InsuranceClaimData | null {
    const claim = this.claims.find(c => c.id === claimId);
    if (!claim) return null;
    Object.assign(claim, updates, { updatedAt: new Date() });
    this.save();
    return claim;
  }

  submitClaim(claimId: string): boolean {
    const claim = this.claims.find(c => c.id === claimId);
    if (!claim) return false;
    claim.status = 'submitted';
    claim.currentStep = 'submitted';
    this.save();
    return true;
  }

  getClaims(): InsuranceClaimData[] {
    return this.claims;
  }

  getClaim(claimId: string): InsuranceClaimData | undefined {
    return this.claims.find(c => c.id === claimId);
  }

  getSteps(): { step: ClaimStep; label: string; icon: string }[] {
    return [
      { step: 'what_happened', label: 'What Happened', icon: '❓' },
      { step: 'when', label: 'When', icon: '📅' },
      { step: 'photos', label: 'Photos', icon: '📸' },
      { step: 'description', label: 'Details', icon: '📝' },
      { step: 'review', label: 'Review', icon: '✅' },
    ];
  }

  private async save(): Promise<void> {
    await AsyncStorage.setItem(CLAIMS_KEY, JSON.stringify(this.claims));
  }
}

export const insuranceClaim = new InsuranceClaimService();
