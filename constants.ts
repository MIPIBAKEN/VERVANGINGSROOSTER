import { HourConfig } from './types';

export const LESSON_HOURS: HourConfig[] = [
  { number: 1, start: "08:50", end: "09:40" },
  { number: 2, start: "09:40", end: "10:30" },
  { number: 3, start: "10:40", end: "11:30" },
  { number: 4, start: "11:30", end: "12:20" },
  { number: 5, start: "12:20", end: "13:05" }, // Lunch break for most days
  { number: 6, start: "13:05", end: "13:55" },
  { number: 7, start: "13:55", end: "14:45" },
  { number: 8, start: "14:55", end: "15:45" },
  { number: 9, start: "15:45", end: "16:35" },
];

export const WEEK_DAYS = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag'];

export const SHARED_SECRET = "school123";

export const formatDateNL = (date: Date): string => {
  return new Intl.DateTimeFormat('nl-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

export const getDayName = (date: Date): string => {
  const day = date.getDay();
  const map = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
  return map[day];
};

/**
 * Custom logic for school hours per day:
 * Maandag: 1, 2, 3, 4, 6, 7, 8, 9 (Geen 5)
 * Dinsdag: 1, 2, 3, 4, 6, 7, 8 (Geen 5, Geen 9)
 * Woensdag: 1, 2, 3, 4 (Geen 5 t/m 9)
 * Donderdag: 1, 2, 3, 4, 6, 7, 8 (Geen 5, Geen 9)
 * Vrijdag: 1, 2, 3, 4, 6, 7, 8, 9 (Geen 5)
 */
export const isValidLessonHour = (dayName: string, hourNumber: number): boolean => {
  if (hourNumber === 5) return false; // Altijd middagpauze
  
  switch (dayName) {
    case 'Maandag':
    case 'Vrijdag':
      return hourNumber >= 1 && hourNumber <= 9;
    case 'Dinsdag':
    case 'Donderdag':
      return hourNumber >= 1 && hourNumber <= 8;
    case 'Woensdag':
      return hourNumber >= 1 && hourNumber <= 4;
    default:
      return false;
  }
};

export const getMaxHoursForDay = (dayName: string): number => {
  if (dayName === 'Woensdag') return 4;
  if (dayName === 'Dinsdag' || dayName === 'Donderdag') return 8;
  return 9;
};