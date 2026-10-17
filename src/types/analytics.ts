export interface AnalyticsPoint {
  label: string;
  value: number;
  comparison?: number;
}

export interface AnalyticsSummary {
  total: number;
  change: number;
  series: AnalyticsPoint[];
}
