import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  HERD_BATCHES: 'herd_batches',
  PRODUCTIVITY: 'productivity',
  INVENTORY: 'inventory',
  FINANCIAL_RECORDS: 'financial_records',
  SYNC_QUEUE: 'sync_queue',
  SETTINGS: 'settings'
};

export const Storage = {
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
  }
};

export default STORAGE_KEYS;