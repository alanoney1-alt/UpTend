// VoiceJobNotes.ts — Record voice → transcribe → attach to job
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTES_KEY = 'uptend_voice_notes';

export type NoteTag = 'scope_change' | 'customer_request' | 'issue' | 'general';

export interface VoiceNote {
  id: string;
  jobId: string;
  audioUri: string;
  transcript: string;
  tag: NoteTag;
  createdAt: Date;
  duration: number; // seconds
}

const TAG_KEYWORDS: Record<NoteTag, string[]> = {
  scope_change: ['add', 'extra', 'additional', 'more', 'change', 'modify', 'price', 'cost', 'adding'],
  customer_request: ['customer', 'client', 'wants', 'asked', 'prefer', 'request'],
  issue: ['problem', 'issue', 'broken', 'damage', 'concern', 'wrong', 'difficult', 'can\'t'],
  general: [],
};

class VoiceJobNotesService {
  private notes: VoiceNote[] = [];

  async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(NOTES_KEY);
      if (stored) this.notes = JSON.parse(stored);
    } catch {}
  }

  autoTag(transcript: string): NoteTag {
    const lower = transcript.toLowerCase();
    for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
      if (tag === 'general') continue;
      if (keywords.some(k => lower.includes(k))) return tag as NoteTag;
    }
    return 'general';
  }

  async addNote(jobId: string, audioUri: string, transcript: string, duration: number): Promise<VoiceNote> {
    const note: VoiceNote = {
      id: `vnote_${Date.now()}`,
      jobId,
      audioUri,
      transcript,
      tag: this.autoTag(transcript),
      createdAt: new Date(),
      duration,
    };
    this.notes.unshift(note);
    await this.save();
    return note;
  }

  getNotesForJob(jobId: string): VoiceNote[] {
    return this.notes.filter(n => n.jobId === jobId);
  }

  getAllNotes(): VoiceNote[] {
    return this.notes;
  }

  async updateTag(noteId: string, tag: NoteTag): Promise<void> {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      note.tag = tag;
      await this.save();
    }
  }

  private async save(): Promise<void> {
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(this.notes));
  }
}

export const voiceJobNotes = new VoiceJobNotesService();
