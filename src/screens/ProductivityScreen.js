import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlassCard from '../components/ui/GlassCard';
import PremiumButton from '../components/ui/PremiumButton';
import Colors from '../constants/Colors';
import { useApp } from '../context/AppContext';
import { DateUtils } from '../utils/DateUtils';

const ProductivityScreen = () => {
  const navigation = useNavigation();
  const { herdBatches, productivity, addProductivityRecord } = useApp();
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  const screenWidth = Dimensions.get('window').width - 32;

  const handleAddRecord = () => {
    if (herdBatches.length === 0) {
      Alert.alert('No Batches', 'Please add a batch first');
      return;
    }
    // Navigate to batch selection or quick add
    navigation.navigate('Herd', { screen: 'HerdList' });
  };

  const getFilteredData = () => {
    if (!selectedBatch) return productivity;
    return productivity.filter(p => p.batchId === selectedBatch.id);
  };

  const getChartData = () => {
    const filteredData = getFilteredData();
    const sortedData = filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let dataToShow = sortedData;
    if (timeRange === '7d') {
      dataToShow = sortedData.slice(-7);
    } else if (timeRange === '30d') {
      dataToShow = sortedData.slice(-30);
    }

    // Ensure we have at least one data point
    if (dataToShow.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [0]
        }]
      };
    }

    return {
      labels: dataToShow.map(p => DateUtils.formatDate(new Date(p.date), 'dd.MM')),
      datasets: [{
        data: dataToShow.map(p => p.eggsCount || 0),
      }]
    };
  };

  const calculateStats = () => {
    const filteredData = getFilteredData();
    const totalEggs = filteredData.reduce((sum, p) => sum + (p.eggsCount || 0), 0);
    const totalFeed = filteredData.reduce((sum, p) => sum + (p.feedConsumed || 0), 0);
    const avgDailyEggs = filteredData.length > 0 ? totalEggs / filteredData.length : 0;
    
    return { totalEggs, totalFeed, avgDailyEggs };
  };

  const chartConfig = {
    backgroundColor: Colors.surface,
    backgroundGradientFrom: Colors.surface,
    backgroundGradientTo: Colors.surfaceLight,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 107, 53, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.5,
    propsForBackgroundLines: {
      strokeWidth: 0,
    },
    propsForLabels: {
      fontSize: 10,
    },
  };

  const { totalEggs, totalFeed, avgDailyEggs } = calculateStats();

  const hasData = productivity.length > 0 && getFilteredData().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Productivity</Text>
        <Text style={styles.subtitle}>Track eggs production and feed consumption</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Batch Selector */}
        <GlassCard style={styles.selectorCard}>
          <Text style={styles.sectionTitle}>Select Batch</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.batchSelectorContent}
          >
            <View style={styles.batchSelector}>
              <TouchableOpacity
                style={[styles.batchChip, !selectedBatch && styles.batchChipActive]}
                onPress={() => setSelectedBatch(null)}
              >
                <Text style={[styles.batchChipText, !selectedBatch && styles.batchChipTextActive]}>
                  All Batches
                </Text>
              </TouchableOpacity>
              
              {herdBatches.map(batch => (
                <TouchableOpacity
                  key={batch.id}
                  style={[styles.batchChip, selectedBatch?.id === batch.id && styles.batchChipActive]}
                  onPress={() => setSelectedBatch(batch)}
                >
                  <Text style={[
                    styles.batchChipText,
                    selectedBatch?.id === batch.id && styles.batchChipTextActive
                  ]}>
                    {batch.breed}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </GlassCard>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <Ionicons name="egg" size={24} color={Colors.accent} />
            <Text style={styles.statValue}>{totalEggs}</Text>
            <Text style={styles.statLabel}>Total Eggs</Text>
          </GlassCard>
          
          <GlassCard style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color={Colors.success} />
            <Text style={styles.statValue}>{avgDailyEggs.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Avg Daily</Text>
          </GlassCard>
          
          <GlassCard style={styles.statCard}>
            <Ionicons name="water" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{totalFeed.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Feed (kg)</Text>
          </GlassCard>
        </View>

        {/* Time Range Selector */}
        <GlassCard style={styles.timeRangeCard}>
          <Text style={styles.sectionTitle}>Time Range</Text>
          <View style={styles.timeRangeSelector}>
            {['7d', '30d', '90d'].map(range => (
              <TouchableOpacity
                key={range}
                style={[styles.timeRangeChip, timeRange === range && styles.timeRangeChipActive]}
                onPress={() => setTimeRange(range)}
              >
                <Text style={[
                  styles.timeRangeText,
                  timeRange === range && styles.timeRangeTextActive
                ]}>
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Chart */}
        {hasData ? (
          <GlassCard style={styles.chartCard}>
            <Text style={styles.sectionTitle}>
              {selectedBatch ? selectedBatch.breed : 'All Batches'} Productivity
            </Text>
            <BarChart
              data={getChartData()}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
            />
          </GlassCard>
        ) : (
          <GlassCard style={styles.emptyState}>
            <Ionicons name="stats-chart-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>No Data Yet</Text>
            <Text style={styles.emptyStateText}>
              {herdBatches.length === 0 
                ? 'Add batches first to track productivity' 
                : 'Start tracking productivity by adding daily records'
              }
            </Text>
            <PremiumButton
              title={herdBatches.length === 0 ? "Add First Batch" : "Add First Record"}
              onPress={handleAddRecord}
              style={styles.emptyStateButton}
            />
          </GlassCard>
        )}

        {/* Recent Activity */}
        {productivity.length > 0 && (
          <GlassCard style={styles.activityCard}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <FlatList
              data={productivity.slice(-10).reverse()}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const batch = herdBatches.find(b => b.id === item.batchId);
                return (
                  <View key={item.id} style={styles.activityItem}>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityBatch}>
                        {batch?.breed || 'Unknown Batch'}
                      </Text>
                      <Text style={styles.activityDate}>
                        {DateUtils.formatForDisplay(new Date(item.date))}
                      </Text>
                    </View>
                    <View style={styles.activityStats}>
                      <Text style={styles.activityEggs}>{item.eggsCount} eggs</Text>
                      {item.feedConsumed > 0 && (
                        <Text style={styles.activityFeed}>{item.feedConsumed}kg</Text>
                      )}
                    </View>
                  </View>
                );
              }}
              keyExtractor={item => item.id}
            />
          </GlassCard>
        )}

        <PremiumButton
          title="Add Productivity Record"
          onPress={handleAddRecord}
          style={styles.addButton}
        />

        {/* Extra padding for better scrolling */}
        <View style={styles.bottomPadding} />
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  selectorCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  batchSelectorContent: {
    paddingRight: 16,
  },
  batchSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  batchChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  batchChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  batchChipText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  batchChipTextActive: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
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
  },
  timeRangeCard: {
    marginBottom: 16,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  timeRangeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
  },
  timeRangeChipActive: {
    backgroundColor: Colors.primary,
  },
  timeRangeText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  chartCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  activityCard: {
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  activityInfo: {
    flex: 1,
  },
  activityBatch: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityDate: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  activityStats: {
    alignItems: 'flex-end',
  },
  activityEggs: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityFeed: {
    color: Colors.primary,
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginBottom: 16,
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
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyStateButton: {
    width: '100%',
  },
  addButton: {
    marginBottom: 24,
  },
  bottomPadding: {
    height: 20,
  },
});

export default ProductivityScreen;