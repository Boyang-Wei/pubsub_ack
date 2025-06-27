export interface OnDemandScreenRequest {
  name: string;
  id: number;
}

export interface OnDemandScrapingStartRequest {
  startDate: string;
  endDate: string;
  screens: OnDemandScreenRequest[];
}

export enum RunningStatus {
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed'
}

export interface ScreenSummaryItem {
  screenId: string;
  klaId: string;
  name: string;
  startTimeSlot: string;
  endTimeSlot: string;
  deliveryDate: string | null;
  runningStatus: RunningStatus;
  priority: number;
} 