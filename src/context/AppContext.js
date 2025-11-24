import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useReducer } from 'react';

const AppContext = createContext();

// Storage keys
const STORAGE_KEYS = {
  HERD_BATCHES: 'herd_batches',
  PRODUCTIVITY: 'productivity',
  INVENTORY: 'inventory',
  FINANCIAL_RECORDS: 'financial_records',
  SYNC_QUEUE: 'sync_queue',
  SETTINGS: 'settings'
};

// Storage functions
const Storage = {
  saveData: async (key, data) => {
    try {
      const jsonValue = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  },

  getData: async (key) => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error reading data:', error);
      return [];
    }
  },

  addItem: async (key, newItem) => {
    try {
      const currentData = await Storage.getData(key);
      const updatedData = [...currentData, { 
        ...newItem, 
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        synced: false
      }];
      await Storage.saveData(key, updatedData);
      return updatedData;
    } catch (error) {
      console.error('Error adding item:', error);
      return null;
    }
  },

  updateItem: async (key, itemId, updates) => {
    try {
      const currentData = await Storage.getData(key);
      const updatedData = currentData.map(item => 
        item.id === itemId ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      );
      await Storage.saveData(key, updatedData);
      return updatedData;
    } catch (error) {
      console.error('Error updating item:', error);
      return null;
    }
  },

  deleteItem: async (key, itemId) => {
    try {
      const currentData = await Storage.getData(key);
      const updatedData = currentData.filter(item => item.id !== itemId);
      await Storage.saveData(key, updatedData);
      return updatedData;
    } catch (error) {
      console.error('Error deleting item:', error);
      return null;
    }
  },

  // New function to delete productivity records for a batch
  deleteProductivityForBatch: async (batchId) => {
    try {
      const currentData = await Storage.getData(STORAGE_KEYS.PRODUCTIVITY);
      const updatedData = currentData.filter(record => record.batchId !== batchId);
      await Storage.saveData(STORAGE_KEYS.PRODUCTIVITY, updatedData);
      return updatedData;
    } catch (error) {
      console.error('Error deleting productivity records:', error);
      return null;
    }
  }
};

const initialState = {
  herdBatches: [],
  productivity: [],
  inventory: [],
  financialRecords: [],
  syncQueue: [],
  settings: {},
  isLoading: true,
  isOnline: false
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_HERD_BATCHES':
      return { ...state, herdBatches: action.payload };
    
    case 'ADD_HERD_BATCH':
      return { ...state, herdBatches: [...state.herdBatches, action.payload] };
    
    case 'UPDATE_HERD_BATCH':
      return {
        ...state,
        herdBatches: state.herdBatches.map(batch =>
          batch.id === action.payload.id ? action.payload : batch
        )
      };

    case 'DELETE_HERD_BATCH':
      return {
        ...state,
        herdBatches: state.herdBatches.filter(batch => batch.id !== action.payload)
      };

    case 'SET_PRODUCTIVITY':
      return { ...state, productivity: action.payload };
    
    case 'ADD_PRODUCTIVITY_RECORD':
      return { ...state, productivity: [...state.productivity, action.payload] };

    case 'DELETE_PRODUCTIVITY_FOR_BATCH':
      return {
        ...state,
        productivity: state.productivity.filter(record => record.batchId !== action.payload)
      };
    
    case 'SET_INVENTORY':
      return { ...state, inventory: action.payload };
    
    case 'UPDATE_INVENTORY_ITEM':
      return {
        ...state,
        inventory: state.inventory.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };
    
    case 'ADD_INVENTORY_ITEM':
      return { ...state, inventory: [...state.inventory, action.payload] };
    
    case 'SET_FINANCIAL_RECORDS':
      return { ...state, financialRecords: action.payload };
    
    case 'ADD_FINANCIAL_RECORD':
      return { ...state, financialRecords: [...state.financialRecords, action.payload] };
    
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };
    
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Загрузка данных при старте приложения
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const [
        herdBatches,
        productivity,
        inventory,
        financialRecords
      ] = await Promise.all([
        Storage.getData(STORAGE_KEYS.HERD_BATCHES),
        Storage.getData(STORAGE_KEYS.PRODUCTIVITY),
        Storage.getData(STORAGE_KEYS.INVENTORY),
        Storage.getData(STORAGE_KEYS.FINANCIAL_RECORDS)
      ]);

      dispatch({ type: 'SET_HERD_BATCHES', payload: herdBatches });
      dispatch({ type: 'SET_PRODUCTIVITY', payload: productivity });
      dispatch({ type: 'SET_INVENTORY', payload: inventory });
      dispatch({ type: 'SET_FINANCIAL_RECORDS', payload: financialRecords });
      
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Herd Batches
  const addHerdBatch = async (batchData) => {
    const newBatch = await Storage.addItem(STORAGE_KEYS.HERD_BATCHES, batchData);
    if (newBatch) {
      dispatch({ type: 'ADD_HERD_BATCH', payload: newBatch[newBatch.length - 1] });
    }
    return newBatch;
  };

  const updateHerdBatch = async (batchId, updates) => {
    const updatedBatches = await Storage.updateItem(STORAGE_KEYS.HERD_BATCHES, batchId, updates);
    if (updatedBatches) {
      const updatedBatch = updatedBatches.find(batch => batch.id === batchId);
      dispatch({ type: 'UPDATE_HERD_BATCH', payload: updatedBatch });
    }
    return updatedBatches;
  };

  const deleteHerdBatch = async (batchId) => {
    try {
      // Delete the batch
      const updatedBatches = await Storage.deleteItem(STORAGE_KEYS.HERD_BATCHES, batchId);
      if (!updatedBatches) return false;

      // Delete associated productivity records
      await Storage.deleteProductivityForBatch(batchId);
      
      // Update state
      dispatch({ type: 'DELETE_HERD_BATCH', payload: batchId });
      dispatch({ type: 'DELETE_PRODUCTIVITY_FOR_BATCH', payload: batchId });
      
      return true;
    } catch (error) {
      console.error('Error deleting batch:', error);
      return false;
    }
  };

  // Productivity
  const addProductivityRecord = async (recordData) => {
    const newRecord = await Storage.addItem(STORAGE_KEYS.PRODUCTIVITY, recordData);
    if (newRecord) {
      dispatch({ type: 'ADD_PRODUCTIVITY_RECORD', payload: newRecord[newRecord.length - 1] });
    }
    return newRecord;
  };

  // Inventory
  const updateInventory = async (itemId, updates) => {
    let updatedInventory;
    
    // Check if item exists
    const existingItem = state.inventory.find(item => item.id === itemId);
    if (existingItem) {
      updatedInventory = await Storage.updateItem(STORAGE_KEYS.INVENTORY, itemId, updates);
    } else {
      // Add new item
      const newItem = { id: itemId, ...updates };
      updatedInventory = await Storage.addItem(STORAGE_KEYS.INVENTORY, newItem);
    }
    
    if (updatedInventory) {
      dispatch({ type: 'SET_INVENTORY', payload: updatedInventory });
    }
    return updatedInventory;
  };

  const addInventoryItem = async (itemData) => {
    const newItem = await Storage.addItem(STORAGE_KEYS.INVENTORY, itemData);
    if (newItem) {
      dispatch({ type: 'ADD_INVENTORY_ITEM', payload: newItem[newItem.length - 1] });
    }
    return newItem;
  };

  // Financial Records
  const addFinancialRecord = async (recordData) => {
    const newRecord = await Storage.addItem(STORAGE_KEYS.FINANCIAL_RECORDS, recordData);
    if (newRecord) {
      dispatch({ type: 'ADD_FINANCIAL_RECORD', payload: newRecord[newRecord.length - 1] });
    }
    return newRecord;
  };

  const value = {
    ...state,
    addHerdBatch,
    updateHerdBatch,
    deleteHerdBatch,
    addProductivityRecord,
    updateInventory,
    addInventoryItem,
    addFinancialRecord
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};