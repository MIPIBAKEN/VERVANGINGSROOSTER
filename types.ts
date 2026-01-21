export interface SickEntry {
  id: string;
  week: string;
  date: string;
  teacherAbbr: string;
  absentHours: number[]; 
  note?: string;
}

export interface ReplacementEntry {
  id: string;
  week: string;
  date: string;
  day: string; 
  lessonHour: number;
  absentTeacher: string;
  classGroup: string;
  room: string;
  replacementTeacher: string;
  hasTask: boolean; 
  note?: string;
}

export interface SubstituteDefinition {
  id: string;
  day: string; 
  lessonHour: number;
  availableTeachers: string[]; 
}

export interface HourConfig {
  number: number;
  start: string;
  end: string;
}

export type ViewMode = 'DASHBOARD' | 'SICK' | 'SUBSTITUTES' | 'PROCESSING' | 'TV' | 'ADMIN';

export interface UserSession {
  role: 'SECRETARIAAT' | 'WEERGAVE' | 'ADMIN' | null;
  isAuthenticated: boolean;
}