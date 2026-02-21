import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProTip, TipCategory } from '../types/models';

const BOOKMARKS_KEY = '@uptend_tip_bookmarks';
const tips: ProTip[] = [];

export function getTipOfDay(): ProTip {
  const dayIndex = Math.floor(Date.now() / 86400000) % Math.max(1, tips.length);
  return { ...tips[dayIndex], isTipOfDay: true };
}

export function getTips(category?: TipCategory): ProTip[] {
  if (!category) return tips;
  return tips.filter(t => t.category === category);
}

export function searchTips(query: string): ProTip[] {
  const q = query.toLowerCase();
  return tips.filter(t => t.title.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q));
}

export async function getBookmarkedIds(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export async function toggleBookmark(tipId: string): Promise<boolean> {
  const ids = await getBookmarkedIds();
  const index = ids.indexOf(tipId);
  if (index >= 0) { ids.splice(index, 1); } else { ids.push(tipId); }
  await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(ids));
  return index < 0;
}
