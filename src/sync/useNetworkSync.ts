import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { triggerSyncAndRefresh } from './syncController';

export function useNetworkSync() {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    const runSync = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      triggerSyncAndRefresh().finally(() => {
        isSyncingRef.current = false;
      });
    };

    const unsubscribeNet = NetInfo.addEventListener(state => {
      if (state.isConnected) runSync();
    });

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        NetInfo.fetch().then(state => {
          if (state.isConnected) runSync();
        });
      }
    };
    const unsubscribeApp = AppState.addEventListener('change', handleAppStateChange);

    runSync(); // initial attempt on mount

    return () => {
      unsubscribeNet();
      unsubscribeApp.remove();
    };
  }, []);
}