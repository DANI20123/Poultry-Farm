import { format, startOfDay } from 'date-fns';

// Устанавливаем начальную дату 20.11.2025
export const INITIAL_DATE = new Date(2025, 10, 20); // Ноябрь это 10 (0-indexed)

export const DateUtils = {
  formatDate: (date, formatStr = 'dd.MM.yyyy') => {
    return format(date, formatStr);
  },

  formatForDisplay: (date) => {
    return format(date, 'MMM dd, yyyy');
  },

  isToday: (date) => {
    return format(startOfDay(date), 'yyyy-MM-dd') === format(startOfDay(new Date()), 'yyyy-MM-dd');
  },

  getDaysBetween: (startDate, endDate) => {
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
};