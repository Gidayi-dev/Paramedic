import {TriageStatus, SyncState} from '../../types/triage';
import TriageRecord from '../models/TriageRecord';
import {createTestDatabase} from '../testUtils/testDatabase';

describe('TriageRecord (WatermelonDB model)', () => {
  it('creates a record and reads it back with the correct fields', async () => {
    const database = createTestDatabase();
    const collection = database.collections.get<TriageRecord>('triage_records');

    const created = await database.write(async () => {
      return collection.create(record => {
        record.patientName = 'Jane Doe';
        record.conditionDescription = 'Suspected cardiac arrest';
        record.priority = 1;
        record.status = TriageStatus.Pending;
        record.syncState = SyncState.Pending;
      });
    });

    const fetched = await collection.find(created.id);

    expect(fetched.patientName).toBe('Jane Doe');
    expect(fetched.conditionDescription).toBe('Suspected cardiac arrest');
    expect(fetched.priority).toBe(1);
    expect(fetched.status).toBe(TriageStatus.Pending);
    expect(fetched.syncState).toBe(SyncState.Pending);
    expect(fetched.createdAt).toBeInstanceOf(Date);
    expect(fetched.updatedAt).toBeInstanceOf(Date);
  });

  it('toDTO() maps a model instance to a plain serializable object', async () => {
    const database = createTestDatabase();
    const collection = database.collections.get<TriageRecord>('triage_records');

    const created = await database.write(async () => {
      return collection.create(record => {
        record.patientName = 'John Smith';
        record.conditionDescription = 'Fractured tibia';
        record.priority = 3;
        record.status = TriageStatus.InTransit;
        record.syncState = SyncState.Synced;
      });
    });

    const dto = created.toDTO();

    expect(dto).toMatchObject({
      id: created.id,
      patientName: 'John Smith',
      conditionDescription: 'Fractured tibia',
      priority: 3,
      status: TriageStatus.InTransit,
      syncState: SyncState.Synced,
    });
    expect(typeof dto.createdAt).toBe('number');
    expect(typeof dto.updatedAt).toBe('number');
  });

  it('persists updates via update()', async () => {
    const database = createTestDatabase();
    const collection = database.collections.get<TriageRecord>('triage_records');

    const created = await database.write(async () => {
      return collection.create(record => {
        record.patientName = 'Unsynced Patient';
        record.conditionDescription = 'Laceration';
        record.priority = 4;
        record.status = TriageStatus.Pending;
        record.syncState = SyncState.Pending;
      });
    });

    await database.write(async () => {
      await created.update(record => {
        record.syncState = SyncState.Synced;
      });
    });

    const refetched = await collection.find(created.id);
    expect(refetched.syncState).toBe(SyncState.Synced);
  });
});