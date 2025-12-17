
export interface ChatterStats {
  username: string;
  totalMessages: number;
  textMessages: number;
  emoteMessages: number;
  lastActive: number;
}

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'alltime';

export interface StreamData {
  title: string;
  viewers: number;
  isLive: boolean;
  startTime: string | null;
  avatarUrl: string | null;
}

export interface PeriodStats {
  [username: string]: ChatterStats;
}

export interface AppState {
  // Buckets for different time ranges
  daily: PeriodStats;
  weekly: PeriodStats;
  monthly: PeriodStats;
  alltime: PeriodStats;
  
  emotes: Record<string, number>;
  totalMessages: number;
  sessionStartTime: number;
  streamInfo: StreamData;
}
