import { SickEntry, ReplacementEntry, SubstituteDefinition } from '../types';

const SICK_KEY = 'school_sick_entries';
const REPLACEMENT_KEY = 'school_replacement_entries';
const SUBSTITUTE_KEY = 'school_substitute_definitions';

// Defensive parsing
const safeParse = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    return JSON.parse(data) as T;
  } catch (e) {
    console.warn(`StorageService: Failed to parse ${key}`, e);
    return fallback;
  }
};

// Defensive saving
const safeSave = async <T>(key: string, data: T): Promise<void> => {
  try {
    console.debug(`StorageService: Saving ${key}...`, data);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`StorageService: CRITICAL Error saving ${key}. Is localStorage full or blocked?`, e);
    throw e;
  }
};

export const StorageService = {
  getSickEntries: async (): Promise<SickEntry[]> => {
    return safeParse<SickEntry[]>(SICK_KEY, []);
  },

  saveSickEntries: async (entries: SickEntry[]): Promise<void> => {
    await safeSave(SICK_KEY, entries);
  },

  getReplacements: async (): Promise<ReplacementEntry[]> => {
    return safeParse<ReplacementEntry[]>(REPLACEMENT_KEY, []);
  },

  saveReplacements: async (entries: ReplacementEntry[]): Promise<void> => {
    await safeSave(REPLACEMENT_KEY, entries);
  },

  getSubstitutes: async (): Promise<SubstituteDefinition[]> => {
    return safeParse<SubstituteDefinition[]>(SUBSTITUTE_KEY, []);
  },

  saveSubstitutes: async (entries: SubstituteDefinition[]): Promise<void> => {
    await safeSave(SUBSTITUTE_KEY, entries);
  },

  isTeacherSickOnDate: async (date: string, teacherAbbr: string): Promise<boolean> => {
    const allSick = await StorageService.getSickEntries();
    return allSick.some(s => s.date === date && s.teacherAbbr === teacherAbbr.toUpperCase());
  }
};