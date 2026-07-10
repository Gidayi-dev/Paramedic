import { Database, Q } from '@nozbe/watermelondb';
import NetInfo from '@react-native-community/netinfo';
import { SyncState } from '../types/triage';
import TriageRecord from '../data/models/TriageRecord';
import { MockApiService, mockApi } from './mockApi';

export class SyncQueueManager {
  private database: Database;
  private api: MockApiService;
  private isProcessing = false;

  constructor(database: Database, apiService = mockApi) {
    this.database = database;
    this.api = apiService;
  }

  async drainQueue(): Promise<void> {
    if (this.isProcessing) return;

    // Real offline interception: check actual device connectivity before
    // touching the network at all. If offline, bail out immediately —
    // records stay safely Pending in WatermelonDB and nothing is lost.
    // Without this check, the mock API's simulated delay/failure has no
    // relationship to the device's real network state, so toggling
    // airplane mode would have no observable effect.
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('[SyncQueue] Offline — skipping drain, records remain queued');
      return;
    }

    this.isProcessing = true;

    try {
      const collection = this.database.collections.get<TriageRecord>('triage_records');

      const pendingRecords = await collection
        .query(Q.where('sync_state', Q.oneOf([SyncState.Pending, SyncState.Failed])))
        .fetch();

      if (pendingRecords.length === 0) {
        return;
      }

      for (const record of pendingRecords) {
        await this.database.write(async () => {
          await record.update(r => { r.syncState = SyncState.Syncing; });
        });

        try {
          await this.api.submitTriage({
            id: record.id,
            patientName: record.patientName,
            conditionDescription: record.conditionDescription,
            priority: record.priority,
            status: record.status,
            createdAt: record.createdAt.getTime(),
          });

          await this.database.write(async () => {
            await record.update(r => { r.syncState = SyncState.Synced; });
          });
        } catch (error) {
          console.warn(`[SyncQueue] Upload failed for ${record.id}:`, error);
          await this.database.write(async () => {
            await record.update(r => { r.syncState = SyncState.Failed; });
          });
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
}