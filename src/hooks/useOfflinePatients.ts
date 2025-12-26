import { useState, useEffect, useCallback } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  blood_group: string;
  emergency_contact: string;
  allergies: string[] | null;
  chronic_conditions: string[] | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  synced: boolean;
  last_updated: string;
}

interface VitalsRecord {
  id: string;
  patient_id: string;
  heart_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  temperature: number | null;
  spo2: number | null;
  respiratory_rate: number | null;
  recorded_at: string;
  synced: boolean;
}

interface MedPredictDB extends DBSchema {
  patients: {
    key: string;
    value: PatientRecord;
    indexes: { 'by-name': string; 'by-synced': number };
  };
  vitals: {
    key: string;
    value: VitalsRecord;
    indexes: { 'by-patient': string; 'by-synced': number };
  };
  syncQueue: {
    key: number;
    value: {
      id?: number;
      type: 'patient' | 'vitals';
      action: 'create' | 'update' | 'delete';
      data: any;
      timestamp: string;
    };
  };
}

let db: IDBPDatabase<MedPredictDB> | null = null;

async function getDB(): Promise<IDBPDatabase<MedPredictDB>> {
  if (db) return db;
  
  db = await openDB<MedPredictDB>('medpredict-offline', 1, {
    upgrade(database) {
      // Patients store
      const patientStore = database.createObjectStore('patients', { keyPath: 'id' });
      patientStore.createIndex('by-name', 'name');
      patientStore.createIndex('by-synced', 'synced');
      
      // Vitals store
      const vitalsStore = database.createObjectStore('vitals', { keyPath: 'id' });
      vitalsStore.createIndex('by-patient', 'patient_id');
      vitalsStore.createIndex('by-synced', 'synced');
      
      // Sync queue
      database.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
    },
  });
  
  return db;
}

export function useOfflinePatients() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online', { description: 'Syncing pending changes...' });
      syncWithServer();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline', { description: 'Changes will be saved locally' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initial load
  useEffect(() => {
    loadPatients();
    checkPendingSync();
  }, []);

  const loadPatients = useCallback(async () => {
    try {
      const database = await getDB();
      const offlinePatients = await database.getAll('patients');
      
      if (isOnline) {
        // Fetch from server and update local cache
        const { data: serverPatients, error } = await supabase
          .from('patients')
          .select('*')
          .order('name');
        
        if (!error && serverPatients) {
          const tx = database.transaction('patients', 'readwrite');
          for (const patient of serverPatients) {
            await tx.store.put({
              ...patient,
              synced: true,
              last_updated: new Date().toISOString(),
            });
          }
          await tx.done;
          
          const updatedPatients = await database.getAll('patients');
          setPatients(updatedPatients);
        }
      } else {
        setPatients(offlinePatients);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  }, [isOnline]);

  const checkPendingSync = useCallback(async () => {
    const database = await getDB();
    const queue = await database.getAll('syncQueue');
    setPendingSyncCount(queue.length);
  }, []);

  const syncWithServer = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const database = await getDB();
      const queue = await database.getAll('syncQueue');
      
      for (const item of queue) {
        try {
          if (item.type === 'patient') {
            if (item.action === 'create' || item.action === 'update') {
              const { synced, last_updated, ...patientData } = item.data;
              await supabase.from('patients').upsert(patientData);
            } else if (item.action === 'delete') {
              await supabase.from('patients').delete().eq('id', item.data.id);
            }
          } else if (item.type === 'vitals') {
            if (item.action === 'create') {
              const { synced, ...vitalsData } = item.data;
              await supabase.from('vitals').insert(vitalsData);
            }
          }
          
          // Remove from queue after successful sync
          if (item.id) {
            await database.delete('syncQueue', item.id);
          }
        } catch (error) {
          console.error('Error syncing item:', error);
        }
      }
      
      // Refresh data from server
      await loadPatients();
      await checkPendingSync();
      
      if (queue.length > 0) {
        toast.success('Sync complete', { description: `${queue.length} changes synced` });
      }
    } catch (error) {
      console.error('Error during sync:', error);
      toast.error('Sync failed', { description: 'Will retry when online' });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, loadPatients, checkPendingSync]);

  const getPatient = useCallback(async (id: string): Promise<PatientRecord | undefined> => {
    const database = await getDB();
    return database.get('patients', id);
  }, []);

  const getPatientVitals = useCallback(async (patientId: string): Promise<VitalsRecord[]> => {
    const database = await getDB();
    const index = database.transaction('vitals').store.index('by-patient');
    return index.getAll(patientId);
  }, []);

  const savePatientOffline = useCallback(async (patient: Omit<PatientRecord, 'synced' | 'last_updated'>) => {
    const database = await getDB();
    
    const patientRecord: PatientRecord = {
      ...patient,
      synced: isOnline,
      last_updated: new Date().toISOString(),
    };
    
    await database.put('patients', patientRecord);
    
    if (!isOnline) {
      await database.add('syncQueue', {
        type: 'patient',
        action: 'update',
        data: patientRecord,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Sync immediately
      const { synced, last_updated, ...data } = patientRecord;
      await supabase.from('patients').upsert([data]);
    }
    
    await loadPatients();
    await checkPendingSync();
  }, [isOnline, loadPatients, checkPendingSync]);

  const saveVitalsOffline = useCallback(async (vitals: Omit<VitalsRecord, 'synced'>) => {
    const database = await getDB();
    
    const vitalsRecord: VitalsRecord = {
      ...vitals,
      synced: isOnline,
    };
    
    await database.put('vitals', vitalsRecord);
    
    if (!isOnline) {
      await database.add('syncQueue', {
        type: 'vitals',
        action: 'create',
        data: vitalsRecord,
        timestamp: new Date().toISOString(),
      });
    } else {
      const { synced, ...data } = vitalsRecord;
      await supabase.from('vitals').insert(data);
    }
    
    await checkPendingSync();
  }, [isOnline, checkPendingSync]);

  return {
    isOnline,
    isSyncing,
    patients,
    pendingSyncCount,
    loadPatients,
    getPatient,
    getPatientVitals,
    savePatientOffline,
    saveVitalsOffline,
    syncWithServer,
  };
}
