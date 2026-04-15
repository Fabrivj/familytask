import { HabitFrequency } from '../models/habit.model';

export const HABIT_FREQUENCIES: HabitFrequency[] = [
  'DAILY', 'WEEKDAYS', 'WEEKENDS', 'WEEKLY', 'MONTHLY',
];

export function frequencyIcon(f: string): string {
  const icons: Record<string, string> = {
    DAILY: 'wb_sunny',
    WEEKDAYS: 'view_week',
    WEEKENDS: 'weekend',
    WEEKLY: 'date_range',
    MONTHLY: 'calendar_month',
  };
  return icons[f] ?? 'repeat';
}

export function frequencyLabel(f: string): string {
  const labels: Record<string, string> = {
    DAILY: 'Diario',
    WEEKLY: 'Semanal',
    WEEKDAYS: 'Lunes a Viernes',
    WEEKENDS: 'Fines de Semana',
    MONTHLY: 'Mensual',
  };
  return labels[f] ?? f;
}
