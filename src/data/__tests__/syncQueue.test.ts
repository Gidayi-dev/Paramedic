import { TriageStatus, SyncState } from '../../types/triage';
import TriageRecord from '../../data/models/TriageRecord';
import { createTestDatabase } from '../../data/testUtils/testDatabase';
import { MockApiService } from '../../sync/mockApi';
import { SyncQueueManager } from '../../sync/syncQueue';

describe('SyncQueueManager', () => {
  let db: ReturnType<typeof createTestDatabase>;
  let api: MockApiService;
  let queue: SyncQueueManager;

  beforeEach(() => {
    db = createTestDatabase();
    api = new MockApiService(0.0, 0); // zero delay for tests
    queue = new SyncQueueManager(db, api);
  });

  it('marks a pending record as synced on successful upload', async () => {
    const collection = db.collections.get<TriageRecord>('triage_records');
    const record = await db.write(async () => {
      return collection.create(r => {
        r.patientName = 'Test Patient';
        r.conditionDescription = 'Laceration';
        r.priority = 4;
        r.status = TriageStatus.Pending;
        r.syncState = SyncState.Pending;
      });
    });

    await queue.drainQueue();

    const updated = await collection.find(record.id);
    expect(updated.syncState).toBe(SyncState.Synced);
  });

  it('gracefully fails records when network is down, then syncs after network heals', async () => {
    const collection = db.collections.get<TriageRecord>('triage_records');
    const record = await db.write(async () => {
      return collection.create(r => {
        r.patientName = 'Cardiac Emergency';
        r.conditionDescription = 'Chest pain, unstable';
        r.priority = 1;
        r.status = TriageStatus.Pending;
        r.syncState = SyncState.Pending;
      });
    });

    api.setFailureRate(1.0);
    await queue.drainQueue();

    let checked = await collection.find(record.id);
    expect(checked.syncState).toBe(SyncState.Failed);

    api.setFailureRate(0.0);
    await queue.drainQueue();

    checked = await collection.find(record.id);
    expect(checked.syncState).toBe(SyncState.Synced);
  });
});