
export type TriagePriority = 1 | 2 | 3 | 4 | 5;

export enum TriageStatus {
  Pending = 'pending',
  InTransit = 'in_transit',
}

export enum SyncState {
  Pending = 'pending',
  Syncing = 'syncing',
  Synced = 'synced',
  Failed = 'failed',
}


export interface TriageRecordDTO {
  id: string;
  patientName: string;
  conditionDescription: string;
  priority: TriagePriority;
  status: TriageStatus;
  syncState: SyncState;
  createdAt: number; 
  updatedAt: number; 
}

export interface TriageSubmissionPayload {
  id: string;
  patientName: string;
  conditionDescription: string;
  priority: TriagePriority;
  status: TriageStatus;
  createdAt: number;
}

export const PRIORITY_LABELS: Record<TriagePriority, string> = {
  1: 'Priority 1 — Critical',
  2: 'Priority 2 — Severe',
  3: 'Priority 3 — Moderate',
  4: 'Priority 4 — Minor',
  5: 'Priority 5 — Non-urgent',
};

export const isCriticalPriority = (priority: TriagePriority): boolean =>
  priority === 1 || priority === 2;