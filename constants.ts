import { HourConfig } from './types';

export const LESSON_HOURS: HourConfig[] = [
  { number: 1, start: "08:50", end: "09:40" },
  { number: 2, start: "09:40", end: "10:30" },
  { number: 3, start: "10:40", end: "11:30" },
  { number: 4, start: "11:30", end: "12:20" },
  { number: 5, start: "12:20", end: "13:05" }, 
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

export const getISOWeek = (d: Date = new Date()) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    const weekNo = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${date.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
};

export const generateId = (prefix: string = 'ID') => {
  const randomPart = Math.random().toString(36).substr(2, 9);
  const timePart = Date.now().toString(36);
  return `${prefix}-${randomPart}-${timePart}`.toUpperCase();
};

export const isValidLessonHour = (dayName: string, hourNumber: number): boolean => {
  if (hourNumber === 5) return false; 
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