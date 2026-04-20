export interface DailyActivity {
  date: string;
  tasksCompleted: number;
  habitsCompleted: number;
}

export interface MemberWeeklyStats {
  memberId: number;
  memberName: string;
  pictureUrl: string | null;
  tasksCompleted: number;
  habitsCompleted: number;
}

export interface WeeklyReportResponse {
  weekStart: string;
  weekEnd: string;
  tasksCompleted: number;
  tasksPending: number;
  tasksInProgress: number;
  tasksInReview: number;
  taskCompletionRate: number;
  habitsCompleted: number;
  habitsActive: number;
  dailyTrend: DailyActivity[];
  members: MemberWeeklyStats[];
}
