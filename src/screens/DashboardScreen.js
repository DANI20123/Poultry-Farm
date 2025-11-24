import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import GlassCard from '../components/ui/GlassCard';
import PremiumButton from '../components/ui/PremiumButton';
import Colors from '../constants/Colors';
import { useApp } from '../context/AppContext';
import { DateUtils } from '../utils/DateUtils';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { herdBatches, productivity, inventory, financialRecords } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalBatches: 0,
    totalEggsToday: 0,
    lowStockItems: 0,
    monthlyProfit: 0
  });

  useEffect(() => {
    calculateStats();
  }, [herdBatches, productivity, inventory, financialRecords]);

  const calculateStats = () => {
    const today = DateUtils.formatDate(new Date(), 'yyyy-MM-dd');
    
    // Total batches
    const totalBatches = herdBatches.length;
    
    // Eggs today
    const todayProductivity = productivity.filter(p => 
      p.date.startsWith(today)
    );
    const totalEggsToday = todayProductivity.reduce((sum, p) => sum + (p.eggsCount || 0), 0);
    
    // Low stock items
    const lowStockItems = inventory.filter(item => 
      item.quantity <= (item.minStock || 0)
    ).length;
    
    // Monthly profit (simple calculation)
    const monthlyIncome = financialRecords
      .filter(f => f.type === 'income' && new Date(f.date).getMonth() === new Date().getMonth())
      .reduce((sum, f) => sum + f.amount, 0);
    
    const monthlyExpenses = financialRecords
      .filter(f => f.type === 'expense' && new Date(f.date).getMonth() === new Date().getMonth())
      .reduce((sum, f) => sum + f.amount, 0);
    
    const monthlyProfit = monthlyIncome - monthlyExpenses;

    setStats({
      totalBatches,
      totalEggsToday,
      lowStockItems,
      monthlyProfit
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    calculateStats();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleQuickAction = (action) => {
    switch(action) {
      case 'scan':
        navigation.navigate('Scanner');
        break;
      case 'addBatch':
        navigation.navigate('Herd', { screen: 'AddBatch' });
        break;
      case 'addProductivity':
        navigation.navigate('Productivity');
        break;
      default:
        break;
    }
  };

  const handleSync = () => {
    Alert.alert(
      "Sync Data",
      "Your data will be synced to cloud when internet connection is available",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.subtitle}>Poultry Farm Management</Text>
        </View>
        
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Quick Stats */}
        <GlassCard style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="egg-outline" size={24} color={Colors.accent} />
              <Text style={styles.statValue}>{stats.totalEggsToday}</Text>
              <Text style={styles.statLabel}>Eggs Today</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="layers-outline" size={24} color={Colors.primary} />
              <Text style={styles.statValue}>{stats.totalBatches}</Text>
              <Text style={styles.statLabel}>Active Batches</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="warning-outline" size={24} color={Colors.warning} />
              <Text style={styles.statValue}>{stats.lowStockItems}</Text>
              <Text style={styles.statLabel}>Low Stock</Text>
            </View>
          </View>
        </GlassCard>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionsGrid}>
          <GlassCard style={styles.actionCard}>
            <Ionicons 
              name="qr-code" 
              size={32} 
              color={Colors.primary} 
              onPress={() => handleQuickAction('scan')}
            />
            <Text style={styles.actionText}>Scan Cell</Text>
          </GlassCard>
          
          <GlassCard style={styles.actionCard}>
            <Ionicons 
              name="add-circle" 
              size={32} 
              color={Colors.primary} 
              onPress={() => handleQuickAction('addBatch')}
            />
            <Text style={styles.actionText}>Add Batch</Text>
          </GlassCard>
          
          <GlassCard style={styles.actionCard}>
            <Ionicons 
              name="stats-chart" 
              size={32} 
              color={Colors.primary} 
              onPress={() => handleQuickAction('addProductivity')}
            />
            <Text style={styles.actionText}>Productivity</Text>
          </GlassCard>
        </View>

        {/* Recent Batches */}
        <Text style={styles.sectionTitle}>Recent Batches</Text>
        {herdBatches.slice(0, 3).map(batch => (
          <GlassCard key={batch.id} style={styles.batchCard}>
            <View style={styles.batchHeader}>
              <Text style={styles.batchName}>{batch.breed}</Text>
              <Text style={styles.batchQuantity}>{batch.quantity} birds</Text>
            </View>
            <Text style={styles.batchDate}>
              Arrived: {DateUtils.formatForDisplay(new Date(batch.arrivalDate))}
            </Text>
          </GlassCard>
        ))}

        {herdBatches.length === 0 && (
          <GlassCard style={styles.emptyState}>
            <Ionicons name="egg-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyStateText}>No batches yet</Text>
            <Text style={styles.emptyStateSubtext}>Add your first batch to get started</Text>
          </GlassCard>
        )}

        {/* Sync Button */}
        <PremiumButton 
          title="Sync Data to Cloud"
          onPress={handleSync}
          style={styles.syncButton}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsCard: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  actionText: {
    color: Colors.textPrimary,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  batchCard: {
    marginBottom: 12,
    padding: 16,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  batchName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  batchQuantity: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  batchDate: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 24,
  },
  emptyStateText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  syncButton: {
    marginBottom: 24,
  },
});

export default DashboardScreen;