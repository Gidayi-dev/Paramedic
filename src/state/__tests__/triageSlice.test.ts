import triageReducer, {
  addRecord,
  updateRecordSyncState,
  setSyncing,
} from '../triageSlice';
import { TriageStatus, SyncState, TriagePriority } from '../../types/triage';

const sampleRecord = {
  id: 'test1',
  patientName: 'John Doe',
  conditionDescription: 'Fracture',
  priority: 3 as TriagePriority,
  status: TriageStatus.Pending,
  syncState: SyncState.Pending,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe('triage slice', () => {
  it('should add a record', () => {
    const state = triageReducer(undefined, addRecord(sampleRecord));
    expect(state.records).toHaveLength(1);
    expect(state.records[0].patientName).toBe('John Doe');
  });

  it('should update sync state of a record', () => {
    const initialState = triageReducer(undefined, addRecord(sampleRecord));
    const updated = triageReducer(
      initialState,
      updateRecordSyncState({ id: 'test1', syncState: SyncState.Synced })
    );
    expect(updated.records[0].syncState).toBe(SyncState.Synced);
  });

  it('should toggle isSyncing', () => {
    let state = triageReducer(undefined, setSyncing(true));
    expect(state.isSyncing).toBe(true);
    state = triageReducer(state, setSyncing(false));
    expect(state.isSyncing).toBe(false);
  });
});