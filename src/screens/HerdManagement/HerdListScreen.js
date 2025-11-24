import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlassCard from '../../components/ui/GlassCard';
import PremiumButton from '../../components/ui/PremiumButton';
import Colors from '../../constants/Colors';
import { useApp } from '../../context/AppContext';
import { DateUtils } from '../../utils/DateUtils';

const HerdListScreen = () => {
  const navigation = useNavigation();
  const { herdBatches, deleteHerdBatch, productivity } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleAddBatch = () => {
    navigation.navigate('AddBatch');
  };

  const handleBatchPress = (batch) => {
    navigation.navigate('BatchDetail', { batch });
  };

  const getProductivityRecordsCount = (batchId) => {
    return productivity.filter(record => record.batchId === batchId).length;
  };

  const handleDeleteBatch = async (batchId, batchName) => {
    setDeletingId(batchId);
    
    const recordsCount = getProductivityRecordsCount(batchId);
    const recordsText = recordsCount > 0 
      ? ` This will also delete ${recordsCount} productivity record${recordsCount > 1 ? 's' : ''} associated with this batch.`
      : '';
    
    Alert.alert(
      "Delete Batch",
      `Are you sure you want to delete "${batchName}"?${recordsText} This action cannot be undone.`,
      [
        { 
          text: "Cancel", 
          style: "cancel", 
          onPress: () => setDeletingId(null) 
        },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const success = await deleteHerdBatch(batchId);
              if (success) {
                Alert.alert("Success", "Batch and associated data deleted successfully");
              } else {
                Alert.alert("Error", "Failed to delete batch");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete batch");
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderBatchItem = ({ item }) => {
    const recordsCount = getProductivityRecordsCount(item.id);
    
    return (
      <TouchableOpacity onPress={() => handleBatchPress(item)}>
        <GlassCard style={styles.batchCard}>
          <View style={styles.batchHeader}>
            <View style={styles.batchInfo}>
              <Text style={styles.batchName}>{item.breed}</Text>
              <Text style={styles.batchDetails}>
                {item.quantity} birds • Arrived {DateUtils.formatForDisplay(new Date(item.arrivalDate))}
              </Text>
              {recordsCount > 0 && (
                <Text style={styles.recordsCount}>
                  {recordsCount} productivity record{recordsCount > 1 ? 's' : ''}
                </Text>
              )}
            </View>
            <TouchableOpacity 
              onPress={() => handleDeleteBatch(item.id, item.breed)}
              style={styles.deleteButton}
              disabled={deletingId === item.id}
            >
              {deletingId === item.id ? (
                <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textDisabled} />
              ) : (
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
              )}
            </TouchableOpacity>
          </View>
          
          {item.notes && (
            <Text style={styles.batchNotes}>{item.notes}</Text>
          )}
          
          <View style={styles.batchFooter}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.statusText}>Active</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Herd Management</Text>
        <Text style={styles.subtitle}>Manage your poultry batches</Text>
      </View>

      <View style={styles.content}>
        <PremiumButton
          title="Add New Batch"
          onPress={handleAddBatch}
          style={styles.addButton}
        />

        {herdBatches.length === 0 ? (
          <GlassCard style={styles.emptyState}>
            <Ionicons name="egg-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>No batches found</Text>
            <Text style={styles.emptyStateText}>
              Add your first batch to get started
            </Text>
          </GlassCard>
        ) : (
          <FlatList
            data={herdBatches}
            renderItem={renderBatchItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor={Colors.primary}
              />
            }
          />
        )}
      </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  addButton: {
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  batchCard: {
    marginBottom: 12,
    padding: 16,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  batchInfo: {
    flex: 1,
    marginRight: 12,
  },
  batchName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  batchDetails: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 2,
  },
  recordsCount: {
    color: Colors.primary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 4,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  batchNotes: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  batchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyStateTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default HerdListScreen;