import { configureStore } from '@reduxjs/toolkit';
import triageReducer from './triageSlice';

export const store = configureStore({
  reducer: {
    triage: triageReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;