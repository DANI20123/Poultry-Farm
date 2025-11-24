import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Alert,
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import GlassCard from '../components/ui/GlassCard';
import PremiumButton from '../components/ui/PremiumButton';
import Colors from '../constants/Colors';
import { useApp } from '../context/AppContext';

const InventoryScreen = () => {
  const { inventory, updateInventory } = useApp();
  const [editingItem, setEditingItem] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');

  const defaultItems = [
    { id: '1', name: 'Layer Feed', type: 'feed', currentStock: 0, unit: 'kg', minStock: 100 },
    { id: '2', name: 'Starter Feed', type: 'feed', currentStock: 0, unit: 'kg', minStock: 50 },
    { id: '3', name: 'Grower Feed', type: 'feed', currentStock: 0, unit: 'kg', minStock: 75 },
    { id: '4', name: 'Egg Cartons', type: 'supplies', currentStock: 0, unit: 'pcs', minStock: 200 },
    { id: '5', name: 'Vaccines', type: 'medical', currentStock: 0, unit: 'doses', minStock: 10 },
  ];

  const handleUpdateStock = async (itemId, adjustment) => {
    const item = inventory.find(i => i.id === itemId) || defaultItems.find(i => i.id === itemId);
    if (!item) return;

    const newStock = (item.currentStock || 0) + adjustment;
    
    if (newStock < 0) {
      Alert.alert('Error', 'Stock cannot be negative');
      return;
    }

    try {
      await updateInventory(itemId, { currentStock: newStock });
      Alert.alert('Success', `Stock updated to ${newStock}${item.unit}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update stock');
    }
  };

  const handleManualEdit = (item) => {
    setEditingItem(item);
    setNewQuantity(item.currentStock?.toString() || '0');
  };

  const handleSaveManualEdit = async () => {
    if (!editingItem) return;

    const quantity = parseFloat(newQuantity);
    if (isNaN(quantity) || quantity < 0) {
      Alert.alert('Error', 'Please enter valid quantity');
      return;
    }

    try {
      await updateInventory(editingItem.id, { currentStock: quantity });
      setEditingItem(null);
      setNewQuantity('');
      Alert.alert('Success', 'Stock updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update stock');
    }
  };

  const getStockStatus = (item) => {
    const current = item.currentStock || 0;
    const min = item.minStock || 0;
    
    if (current === 0) return { status: 'out', color: Colors.error, text: 'Out of Stock' };
    if (current <= min) return { status: 'low', color: Colors.warning, text: 'Low Stock' };
    return { status: 'good', color: Colors.success, text: 'In Stock' };
  };

  const renderInventoryItem = ({ item }) => {
    const stockStatus = getStockStatus(item);
    
    return (
      <GlassCard style={styles.inventoryItem}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemType}>{item.type}</Text>
          </View>
          <View style={[styles.stockStatus, { backgroundColor: stockStatus.color }]}>
            <Text style={styles.stockStatusText}>{stockStatus.text}</Text>
          </View>
        </View>

        <View style={styles.stockInfo}>
          <View style={styles.stockLevel}>
            <Text style={styles.stockLabel}>Current Stock</Text>
            <Text style={styles.stockValue}>
              {item.currentStock || 0} {item.unit}
            </Text>
          </View>
          <View style={styles.minStock}>
            <Text style={styles.stockLabel}>Min Required</Text>
            <Text style={styles.stockValue}>{item.minStock} {item.unit}</Text>
          </View>
        </View>

        {editingItem?.id === item.id ? (
          <View style={styles.manualEdit}>
            <TextInput
              style={styles.quantityInput}
              value={newQuantity}
              onChangeText={setNewQuantity}
              keyboardType="numeric"
              placeholder="Enter quantity"
              placeholderTextColor={Colors.textDisabled}
            />
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={styles.cancelEdit}
                onPress={() => setEditingItem(null)}
              >
                <Text style={styles.cancelEditText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveEdit}
                onPress={handleSaveManualEdit}
              >
                <Text style={styles.saveEditText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.manualEditButton}
              onPress={() => handleManualEdit(item)}
            >
              <Ionicons name="create-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.manualEditText}>Edit</Text>
            </TouchableOpacity>
            
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.quickButton}
                onPress={() => handleUpdateStock(item.id, -10)}
              >
                <Text style={styles.quickButtonText}>-10</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickButton}
                onPress={() => handleUpdateStock(item.id, -1)}
              >
                <Text style={styles.quickButtonText}>-1</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickButton}
                onPress={() => handleUpdateStock(item.id, 1)}
              >
                <Text style={styles.quickButtonText}>+1</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickButton}
                onPress={() => handleUpdateStock(item.id, 10)}
              >
                <Text style={styles.quickButtonText}>+10</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </GlassCard>
    );
  };

  const lowStockItems = [...inventory, ...defaultItems].filter(item => 
    (item.currentStock || 0) <= (item.minStock || 0)
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <Text style={styles.subtitle}>Manage feed and supplies</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <GlassCard style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={24} color={Colors.warning} />
              <Text style={styles.alertTitle}>Low Stock Alert</Text>
            </View>
            <Text style={styles.alertText}>
              {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} need{lowStockItems.length === 1 ? 's' : ''} restocking
            </Text>
            {lowStockItems.map(item => (
              <Text key={item.id} style={styles.alertItem}>
                • {item.name} - {item.currentStock || 0}/{item.minStock} {item.unit}
              </Text>
            ))}
          </GlassCard>
        )}

        {/* Inventory List */}
        <FlatList
          data={[...inventory, ...defaultItems.filter(d => !inventory.find(i => i.id === d.id))]}
          renderItem={renderInventoryItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />

        {/* Quick Add Form */}
        <GlassCard style={styles.quickAddCard}>
          <Text style={styles.sectionTitle}>Quick Stock Update</Text>
          <Text style={styles.quickAddText}>
            Tap the +/- buttons to quickly adjust stock levels, or use Edit for precise amounts.
          </Text>
        </GlassCard>

        <PremiumButton
          title="Order Supplies"
          onPress={() => Alert.alert('Order', 'This will open supplier contact')}
          style={styles.orderButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  alertCard: {
    marginBottom: 16,
    borderColor: Colors.warning,
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    color: Colors.warning,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  alertText: {
    color: Colors.textPrimary,
    fontSize: 14,
    marginBottom: 8,
  },
  alertItem: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  inventoryItem: {
    marginBottom: 12,
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemType: {
    color: Colors.textSecondary,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  stockStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  stockInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stockLevel: {
    flex: 1,
  },
  minStock: {
    flex: 1,
  },
  stockLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  stockValue: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manualEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  manualEditText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  quickButtonText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  manualEdit: {
    marginTop: 8,
  },
  quantityInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    padding: 12,
    color: Colors.textPrimary,
    fontSize: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelEdit: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelEditText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  saveEdit: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveEditText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  quickAddCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  quickAddText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  orderButton: {
    marginBottom: 24,
  },
});

export default InventoryScreen;