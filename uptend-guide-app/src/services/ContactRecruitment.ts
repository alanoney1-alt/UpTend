// ContactRecruitment.ts — Scan contacts for potential pro recruits
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECRUITS_KEY = 'uptend_recruits';

export interface RecruitCandidate {
  id: string;
  contactName: string;
  phone: string;
  matchedKeywords: string[];
  confidence: number; // 0-1
  status: 'found' | 'invited' | 'signed_up' | 'completed_first_job' | 'declined';
  invitedAt?: Date;
}

const SERVICE_KEYWORDS = [
  'lawn', 'landscap', 'mow', 'clean', 'maid', 'pool', 'handyman', 'plumb',
  'electric', 'paint', 'roof', 'gutter', 'pressure wash', 'junk', 'haul',
  'moving', 'pest', 'tree', 'fence', 'deck', 'tile', 'carpet', 'hvac',
  'ac repair', 'appliance', 'garage', 'drywall',
];

class ContactRecruitmentService {
  private candidates: RecruitCandidate[] = [];

  async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(RECRUITS_KEY);
      if (stored) this.candidates = JSON.parse(stored);
    } catch {}
  }

  async scanContacts(): Promise<RecruitCandidate[]> {
    // In real app: Contacts.getContactsAsync({ fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Note] })
    // Mock results
    const mockContacts = [
      { name: "Mike's Lawn Care", phone: '(407) 555-1234', note: 'landscaping guy' },
      { name: 'Clean Queen Maria', phone: '(407) 555-5678', note: 'house cleaner' },
      { name: 'Dave Pool Service', phone: '(321) 555-9012', note: '' },
      { name: 'HandyMan Joe', phone: '(407) 555-3456', note: 'fixed kitchen sink' },
      { name: 'Tom R. Painter', phone: '(321) 555-7890', note: 'interior painting' },
    ];

    const found: RecruitCandidate[] = mockContacts.map(c => {
      const text = `${c.name} ${c.note}`.toLowerCase();
      const matched = SERVICE_KEYWORDS.filter(k => text.includes(k));
      return {
        id: `recruit_${c.phone.replace(/\D/g, '')}`,
        contactName: c.name,
        phone: c.phone,
        matchedKeywords: matched,
        confidence: Math.min(matched.length * 0.3 + 0.2, 1),
        status: 'found' as const,
      };
    }).filter(c => c.matchedKeywords.length > 0);

    // Merge with existing
    for (const f of found) {
      if (!this.candidates.find(c => c.id === f.id)) {
        this.candidates.push(f);
      }
    }
    await this.save();
    return found;
  }

  async sendInvite(candidateId: string): Promise<boolean> {
    const candidate = this.candidates.find(c => c.id === candidateId);
    if (!candidate) return false;
    candidate.status = 'invited';
    candidate.invitedAt = new Date();
    await this.save();
    // In real app: SMS.sendSMSAsync([candidate.phone], message)
    console.log('[Recruit] Invite sent to:', candidate.contactName);
    return true;
  }

  getCandidates(): RecruitCandidate[] {
    return this.candidates;
  }

  getByStatus(status: RecruitCandidate['status']): RecruitCandidate[] {
    return this.candidates.filter(c => c.status === status);
  }

  private async save(): Promise<void> {
    await AsyncStorage.setItem(RECRUITS_KEY, JSON.stringify(this.candidates));
  }
}

export const contactRecruitment = new ContactRecruitmentService();
