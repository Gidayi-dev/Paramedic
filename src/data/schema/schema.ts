import {appSchema, tableSchema} from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'triage_records',
      columns: [
        {name: 'patient_name', type: 'string'},
        {name: 'condition_description', type: 'string'},
        {name: 'priority', type: 'number', isIndexed: true},
        {name: 'status', type: 'string', isIndexed: true},
        {name: 'sync_state', type: 'string', isIndexed: true},
        {name: 'created_at', type: 'number'},
        {name: 'updated_at', type: 'number'},
      ],
    }),
  ],
});