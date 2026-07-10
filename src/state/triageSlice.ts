import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { TriageRecordDTO, TriagePriority, TriageStatus } from '../types/triage';
import { SyncState } from '../types/triage';

interface TriageState {
  records: TriageRecordDTO[];
  isSyncing: boolean;
}

const initialState: TriageState = {
  records: [],
  isSyncing: false,
};

const triageSlice = createSlice({
  name: 'triage',
  initialState,
  reducers: {
    
    setRecords(state, action: PayloadAction<TriageRecordDTO[]>) {
      state.records = action.payload;
    },

    addRecord(state, action: PayloadAction<TriageRecordDTO>) {
      state.records.push(action.payload);
    },
   
    updateRecordSyncState(
      state,
      action: PayloadAction<{ id: string; syncState: SyncState }>
    ) {
      const record = state.records.find(r => r.id === action.payload.id);
      if (record) {
        record.syncState = action.payload.syncState;
      }
    },
    setSyncing(state, action: PayloadAction<boolean>) {
      state.isSyncing = action.payload;
    },
  },
});

export const { setRecords, addRecord, updateRecordSyncState, setSyncing } = triageSlice.actions;
export default triageSlice.reducer;