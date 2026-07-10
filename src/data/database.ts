import { Database } from '@nozbe/watermelondb';
import { schema } from './schema/schema';
import { migrations } from './schema/migrations';
import TriageRecord from './models/TriageRecord';

let adapter;

if (__DEV__) {
  // Use memory-safe LokiJS adapter inside the Expo Go app during local testing
  const LokiJSAdapter = require('@nozbe/watermelondb/adapters/lokijs').default;
  adapter = new LokiJSAdapter({
    schema,
    migrations,
    useWebWorker: false,
    useIncrementalIndexedDB: false,
    dbName: 'paramedic_triage_dev',
  });
} else {
  // Use performance-native SQLite for actual production standalone builds
  const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default;
  adapter = new SQLiteAdapter({
    schema,
    migrations,
    jsi: true,
    onSetUpError: (error: any) => {
      console.error('Database failed to load natively:', error);
    },
  });
}

export const database = new Database({
  adapter,
  modelClasses: [TriageRecord],
});