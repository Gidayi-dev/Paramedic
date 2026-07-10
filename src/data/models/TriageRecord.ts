import {Model} from '@nozbe/watermelondb';
import {field, readonly, date} from '@nozbe/watermelondb/decorators';
import type {
  TriagePriority,
  TriageRecordDTO,
  TriageStatus,
  SyncState,
} from '../../types/triage';

export default class TriageRecord extends Model {
  static table = 'triage_records';

  @field('patient_name') patientName!: string;
  @field('condition_description') conditionDescription!: string;
  @field('priority') priority!: TriagePriority;
  @field('status') status!: TriageStatus;
  @field('sync_state') syncState!: SyncState;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  toDTO(): TriageRecordDTO {
    return {
      id: this.id,
      patientName: this.patientName,
      conditionDescription: this.conditionDescription,
      priority: this.priority,
      status: this.status,
      syncState: this.syncState,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
    };
  }
}