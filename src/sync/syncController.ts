import { database } from '../data/database';
import TriageRecord from '../data/models/TriageRecord';
import { SyncQueueManager } from './syncQueue';
import { mockApi } from './mockApi';
import { store } from '../state/store';
import { setRecords } from '../state/triageSlice';

export const syncManager = new SyncQueueManager(database, mockApi);

export async function triggerSyncAndRefresh(): Promise<void> {
  await syncManager.drainQueue();
  const collection = database.collections.get<TriageRecord>('triage_records');
  const allRecords = await collection.query().fetch();
  store.dispatch(setRecords(allRecords.map(r => r.toDTO())));
}