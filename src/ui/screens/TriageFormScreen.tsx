// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import { useDispatch, useSelector } from 'react-redux';
// import { database } from '../../data/database';
// import TriageRecord from '../../data/models/TriageRecord';
// import { addRecord, setRecords, setSyncing } from '../../state/triageSlice';
// import { RootState } from '../../state/store';
// import { TriageStatus, TriagePriority, SyncState, isCriticalPriority } from '../../types/triage';
// import { SyncQueueManager } from '../../sync/syncQueue';
// import { mockApi } from '../../sync/mockApi';

// const PRIORITY_COLORS: Record<TriagePriority, string> = {
//   1: '#8B0000', // Dark Red
//   2: '#FF4500', // Orange Red
//   3: '#FFD700', // Gold
//   4: '#1E90FF', // Dodger Blue
//   5: '#2E8B57', // Sea Green
// };

// const TriageFormScreen: React.FC = () => {
//   const dispatch = useDispatch();
//   const { records, isSyncing } = useSelector((state: RootState) => state.triage);

//   // Local form state
//   const [patientName, setPatientName] = useState('');
//   const [condition, setCondition] = useState('');
//   const [selectedPriority, setSelectedPriority] = useState<TriagePriority | null>(null);
//   const [status, setStatus] = useState<TriageStatus>(TriageStatus.Pending);

//   // Load existing records from DB when component mounts
//   useEffect(() => {
//     const loadRecords = async () => {
//       const collection = database.collections.get<TriageRecord>('triage_records');
//       const allRecords = await collection.query().fetch();
//       dispatch(setRecords(allRecords.map(r => r.toDTO())));
//     };
//     loadRecords();
//   }, []);

//   const handleSubmit = async () => {
//     // Validate
//     if (!patientName.trim() || !condition.trim() || selectedPriority === null) {
//       Alert.alert('Missing Fields', 'Please fill all fields and select a priority.');
//       return;
//     }

//     const newRecord = {
//       id: Date.now().toString(), // simple unique ID
//       patientName,
//       conditionDescription: condition,
//       priority: selectedPriority,
//       status,
//       syncState: SyncState.Pending,
//       createdAt: Date.now(),
//       updatedAt: Date.now(),
//     };

//     // Persist locally (WatermelonDB)
//     const collection = database.collections.get<TriageRecord>('triage_records');
//     await database.write(async () => {
//       await collection.create((record: any) => {
//         record._raw.id = newRecord.id;
//         record.patientName = newRecord.patientName;
//         record.conditionDescription = newRecord.conditionDescription;
//         record.priority = newRecord.priority;
//         record.status = newRecord.status;
//         record.syncState = SyncState.Pending;
//       });
//     });

//     // Add to Redux store for UI
//     dispatch(addRecord(newRecord));

//     // Clear form
//     setPatientName('');
//     setCondition('');
//     setSelectedPriority(null);

//     // Trigger an immediate sync attempt (the queue will run in background)
//     const syncManager = new SyncQueueManager(database, mockApi);
//     dispatch(setSyncing(true));
//     try {
//       await syncManager.drainQueue();
//     } finally {
//       dispatch(setSyncing(false));
//     }
//   };

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <Text style={styles.title}>Paramedic Triage Intake</Text>

//       {/* Patient Name */}
//       <Text style={styles.label}>Patient Name</Text>
//       <TextInput
//         style={styles.input}
//         value={patientName}
//         onChangeText={setPatientName}
//         placeholder="Enter patient name"
//         placeholderTextColor="#999"
//       />

//       {/* Condition Description */}
//       <Text style={styles.label}>Condition Description</Text>
//       <TextInput
//         style={[styles.input, styles.textArea]}
//         value={condition}
//         onChangeText={setCondition}
//         placeholder="Describe condition"
//         placeholderTextColor="#999"
//         multiline
//         numberOfLines={3}
//       />

//       {/* Priority Selection */}
//       <Text style={styles.label}>Priority Level (1 = Critical, 5 = Non‑urgent)</Text>
//       <View style={styles.priorityGrid}>
//         {([1, 2, 3, 4, 5] as TriagePriority[]).map(level => (
//           <TouchableOpacity
//             key={level}
//             style={[
//               styles.priorityButton,
//               { backgroundColor: PRIORITY_COLORS[level] },
//               selectedPriority === level && styles.selectedPriority,
//             ]}
//             onPress={() => setSelectedPriority(level)}
//           >
//             <Text style={styles.priorityText}>P{level}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* Status (could be a toggle, but we'll keep as a Picker or simple buttons) */}
//       <Text style={styles.label}>Status</Text>
//       <View style={styles.statusRow}>
//         <TouchableOpacity
//           style={[
//             styles.statusButton,
//             status === TriageStatus.Pending && styles.statusActive,
//           ]}
//           onPress={() => setStatus(TriageStatus.Pending)}
//         >
//           <Text style={styles.statusText}>Pending</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[
//             styles.statusButton,
//             status === TriageStatus.InTransit && styles.statusActive,
//           ]}
//           onPress={() => setStatus(TriageStatus.InTransit)}
//         >
//           <Text style={styles.statusText}>In‑Transit</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Submit Button */}
//       <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSyncing}>
//         {isSyncing ? (
//           <ActivityIndicator color="#fff" />
//         ) : (
//           <Text style={styles.submitText}>Submit Triage</Text>
//         )}
//       </TouchableOpacity>

//       {/* Sync Status Indicator */}
//       {records.length > 0 && (
//         <View style={styles.syncInfo}>
//           <Text style={styles.syncInfoText}>
//             {records.filter(r => r.syncState === SyncState.Synced).length} of {records.length} records synced
//           </Text>
//         </View>
//       )}
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     padding: 20,
//     backgroundColor: '#f4f4f4',
//     flexGrow: 1,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: '700',
//     marginBottom: 20,
//     textAlign: 'center',
//     color: '#222',
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     marginTop: 15,
//     marginBottom: 5,
//     color: '#333',
//   },
//   input: {
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     padding: 12,
//     fontSize: 16,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     color: '#000',
//   },
//   textArea: {
//     height: 80,
//     textAlignVertical: 'top',
//   },
//   priorityGrid: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginVertical: 10,
//   },
//   priorityButton: {
//     flex: 1,
//     marginHorizontal: 4,
//     height: 55,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   selectedPriority: {
//     borderWidth: 3,
//     borderColor: '#fff',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.4,
//   },
//   priorityText: {
//     color: '#fff',
//     fontSize: 20,
//     fontWeight: '900',
//   },
//   statusRow: {
//     flexDirection: 'row',
//     marginVertical: 10,
//   },
//   statusButton: {
//     flex: 1,
//     padding: 12,
//     marginHorizontal: 4,
//     borderRadius: 8,
//     backgroundColor: '#ddd',
//     alignItems: 'center',
//   },
//   statusActive: {
//     backgroundColor: '#007AFF',
//   },
//   statusText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#fff',
//   },
//   submitButton: {
//     backgroundColor: '#34C759',
//     padding: 16,
//     borderRadius: 8,
//     marginTop: 20,
//     alignItems: 'center',
//   },
//   submitText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '700',
//   },
//   syncInfo: {
//     marginTop: 20,
//     alignItems: 'center',
//   },
//   syncInfoText: {
//     fontSize: 14,
//     color: '#666',
//   },
// });

// export default TriageFormScreen;
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { database } from '../../data/database';
import TriageRecord from '../../data/models/TriageRecord';
import { Collection } from '@nozbe/watermelondb';
import { setRecords, setSyncing } from '../../state/triageSlice';
import { RootState } from '../../state/store';
import { TriageStatus, TriagePriority, SyncState } from '../../types/triage';
import { SyncQueueManager } from '../../sync/syncQueue';
import { mockApi } from '../../sync/mockApi';
import { triggerSyncAndRefresh } from '../../sync/syncController';

const PRIORITY_COLORS: Record<TriagePriority, string> = {
  1: '#8B0000', // Dark Red
  2: '#FF4500', // Orange Red
  3: '#FFD700', // Gold
  4: '#1E90FF', // Dodger Blue
  5: '#2E8B57', // Sea Green
};

const TriageFormScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { records, isSyncing } = useSelector((state: RootState) => state.triage);

  // Local form state
  const [patientName, setPatientName] = useState('');
  const [condition, setCondition] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TriagePriority | null>(null);
  const [status, setStatus] = useState<TriageStatus>(TriageStatus.Pending);

  // Load existing records from DB when component mounts
  useEffect(() => {
    const loadRecords = async () => {
      const collection = database.collections.get('triage_records') as Collection<TriageRecord>;
      const allRecords = await collection.query().fetch();
      dispatch(setRecords(allRecords.map(r => r.toDTO())));
    };
    loadRecords();
  }, [dispatch]);

  const handleSubmit = async () => {
    if (!patientName.trim() || !condition.trim() || selectedPriority === null) {
      Alert.alert('Missing Fields', 'Please fill all fields and select a priority.');
      return;
    }

    const collection = database.collections.get('triage_records') as Collection<TriageRecord>;
    
    try {
      // 1. Persist locally via safe WatermelonDB creation closure syntax
      await database.write(async () => {
        await collection.create((record) => {
          record.patientName = patientName.trim();
          record.conditionDescription = condition.trim();
          record.priority = selectedPriority;
          record.status = status;
          record.syncState = SyncState.Pending;
        });
      });

      // 2. Refetch full state and update Redux directly to keep data uniform
      const allRecords = await collection.query().fetch();
      dispatch(setRecords(allRecords.map(r => r.toDTO())));

      // 3. Clear local interactive input states
      setPatientName('');
      setCondition('');
      setSelectedPriority(null);
      setStatus(TriageStatus.Pending);

      // 4. Trigger an immediate background synchronization queue drain
      const syncManager = new SyncQueueManager(database, mockApi);
      dispatch(setSyncing(true));
        try {
          await triggerSyncAndRefresh();
        } finally {
          dispatch(setSyncing(false));
        }
      
      // Post-sync state reload to match updated records state
      const postSyncRecords = await collection.query().fetch();
      dispatch(setRecords(postSyncRecords.map(r => r.toDTO())));
    } catch (error: any) {
      Alert.alert('Database Error', error?.message || 'Failed to capture triage incident');
    } finally {
      dispatch(setSyncing(false));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Paramedic Triage Intake</Text>

      {/* Patient Name */}
      <Text style={styles.label}>Patient Name</Text>
      <TextInput
        style={styles.input}
        value={patientName}
        onChangeText={setPatientName}
        placeholder="Enter patient name"
        placeholderTextColor="#999"
      />

      {/* Condition Description */}
      <Text style={styles.label}>Condition Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={condition}
        onChangeText={setCondition}
        placeholder="Describe condition"
        placeholderTextColor="#999"
        multiline
        numberOfLines={3}
      />

      {/* Priority Selection */}
      <Text style={styles.label}>Priority Level (1 = Critical, 5 = Non‑urgent)</Text>
      <View style={styles.priorityGrid}>
        {([1, 2, 3, 4, 5] as TriagePriority[]).map(level => (
          <TouchableOpacity
            key={level}
            style={[
              styles.priorityButton,
              { backgroundColor: PRIORITY_COLORS[level] },
              selectedPriority === level && styles.selectedPriority,
            ]}
            onPress={() => setSelectedPriority(level)}
          >
            <Text style={styles.priorityText}>P{level}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status Selection Buttons */}
      <Text style={styles.label}>Status</Text>
      <View style={styles.statusRow}>
        <TouchableOpacity
          style={[
            styles.statusButton,
            status === TriageStatus.Pending && styles.statusActive,
          ]}
          onPress={() => setStatus(TriageStatus.Pending)}
        >
          <Text style={styles.statusText}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statusButton,
            status === TriageStatus.InTransit && styles.statusActive,
          ]}
          onPress={() => setStatus(TriageStatus.InTransit)}
        >
          <Text style={styles.statusText}>In‑Transit</Text>
        </TouchableOpacity>
      </View>

      {/* Submit Action Button Container */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSyncing}>
        {isSyncing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Submit Triage</Text>
        )}
      </TouchableOpacity>

      {/* Sync Metrics Bar */}
      {records.length > 0 && (
        <View style={styles.syncInfo}>
          <Text style={styles.syncInfoText}>
            {records.filter(r => r.syncState === SyncState.Synced).length} of {records.length} records synced
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f4f4f4', flexGrow: 1 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20, textAlign: 'center', color: '#222' },
  label: { fontSize: 16, fontWeight: '600', marginTop: 15, marginBottom: 5, color: '#333' },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#ddd', color: '#000' },
  textArea: { height: 80, textAlignVertical: 'top' },
  priorityGrid: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  priorityButton: { flex: 1, marginHorizontal: 4, height: 55, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  selectedPriority: { borderWidth: 3, borderColor: '#fff', elevation: 4 },
  priorityText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  statusRow: { flexDirection: 'row', marginVertical: 10 },
  statusButton: { flex: 1, padding: 12, marginHorizontal: 4, borderRadius: 8, backgroundColor: '#ddd', alignItems: 'center' },
  statusActive: { backgroundColor: '#007AFF' },
  statusText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  submitButton: { backgroundColor: '#34C759', padding: 16, borderRadius: 8, marginTop: 20, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  syncInfo: { marginTop: 20, alignItems: 'center' },
  syncInfoText: { fontSize: 14, color: '#666' },
});

export default TriageFormScreen;