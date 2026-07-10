import {Database} from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import {schema} from '../schema/schema';
import {migrations} from '../schema/migrations';
import TriageRecord from '../models/TriageRecord';

export function createTestDatabase(): Database {
  const adapter = new LokiJSAdapter({
    schema,
    migrations,
    useWebWorker: false,
    useIncrementalIndexedDB: false,
    dbName: `test-${Math.random().toString(36).slice(2)}`,
  });

  return new Database({
    adapter,
    modelClasses: [TriageRecord],
  });
}