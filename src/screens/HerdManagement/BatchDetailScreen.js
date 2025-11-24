import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlassCard from '../../components/ui/GlassCard';
import PremiumButton from '../../components/ui/PremiumButton';
import Colors from '../../constants/Colors';
import { useApp } from '../../context/AppContext';
import { DateUtils } from '../../utils/DateUtils';

const BatchDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { batch: initialBatch } = route.params;
  const { herdBatches, productivity, addProductivityRecord, deleteHerdBatch } = useApp();
  
  // Find the current batch data (in case it was updated)
  const batch = herdBatches.find(b => b.id === initialBatch.id) || initialBatch;
  
  const [todayEggs, setTodayEggs] = useState('');
  const [todayFeed, setTodayFeed] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchProductivity, setBatchProductivity] = useState([]);

  // Check if batch still exists
  useEffect(() => {
    if (!herdBatches.find(b => b.id === initialBatch.id)) {
      Alert.alert('Batch Not Found', 'This batch has been deleted', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  }, [herdBatches, initialBatch.id]);

  useEffect(() => {
    // Filter productivity data for this batch
    const batchData = productivity.filter(p => p.batchId === batch.id);
    setBatchProductivity(batchData);
  }, [productivity, batch.id]);

  const handleAddProductivity = async () => {
    if (!todayEggs || parseInt(todayEggs) < 0) {
      Alert.alert('Error', 'Please enter valid eggs count');
      return;
    }

    setIsSubmitting(true);

    try {
      const recordData = {
        batchId: batch.id,
        date: new Date().toISOString().split('T')[0],
        eggsCount: parseInt(todayEggs),
        feedConsumed: todayFeed ? parseFloat(todayFeed) : 0,
        notes: `Daily record for ${DateUtils.formatDate(new Date())}`,
      };

      await addProductivityRecord(recordData);
      
      Alert.alert('Success', 'Productivity record added!');
      setTodayEggs('');
      setTodayFeed('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateProductivityRate = () => {
    if (batchProductivity.length === 0) return 0;
    const totalEggs = batchProductivity.reduce((sum, p) => sum + (p.eggsCount || 0), 0);
    const totalDays = batchProductivity.length;
    const avgDailyEggs = totalEggs / totalDays;
    return ((avgDailyEggs / batch.quantity) * 100).toFixed(1);
  };

  const getChartData = () => {
    const last7Days = batchProductivity.slice(-7);
    return {
      labels: last7Days.map(p => DateUtils.formatDate(new Date(p.date), 'dd.MM')),
      datasets: [{
        data: last7Days.map(p => p.eggsCount || 0),
      }]
    };
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
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: Colors.primary,
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>{batch.breed}</Text>
            <Text style={styles.subtitle}>{batch.quantity} birds</Text>
          </View>
          <View style={styles.headerIcons}>
            <Ionicons name="qr-code" size={24} color={Colors.textPrimary} />
          </View>
        </View>

        {/* Batch Info */}
        <GlassCard style={styles.infoCard}>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Arrival Date</Text>
              <Text style={styles.infoValue}>
                {DateUtils.formatForDisplay(new Date(batch.arrivalDate))}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Productivity Rate</Text>
              <Text style={styles.infoValue}>{calculateProductivityRate()}%</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Days Tracked</Text>
              <Text style={styles.infoValue}>{batchProductivity.length}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Quick Add Today's Data */}
        <GlassCard style={styles.quickAddCard}>
          <Text style={styles.sectionTitle}>Today's Data</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Eggs Collected</Text>
              <TextInput
                style={styles.input}
                value={todayEggs}
                onChangeText={setTodayEggs}
                placeholder="0"
                placeholderTextColor={Colors.textDisabled}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Feed Used (kg)</Text>
              <TextInput
                style={styles.input}
                value={todayFeed}
                onChangeText={setTodayFeed}
                placeholder="0.0"
                placeholderTextColor={Colors.textDisabled}
                keyboardType="numeric"
              />
            </View>
          </View>

          <PremiumButton
            title="Save Today's Data"
            onPress={handleAddProductivity}
            loading={isSubmitting}
            style={styles.saveButton}
          />
        </GlassCard>

        {/* Productivity Chart */}
        {batchProductivity.length > 0 && (
          <GlassCard style={styles.chartCard}>
            <Text style={styles.sectionTitle}>7-Day Productivity</Text>
            <LineChart
              data={getChartData()}
              width={styles.chartCard.width - 32}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </GlassCard>
        )}

        {/* Recent Records */}
        <GlassCard style={styles.recordsCard}>
          <Text style={styles.sectionTitle}>Recent Records</Text>
          
          {batchProductivity.slice(-5).reverse().map((record, index) => (
            <View key={record.id} style={styles.recordItem}>
              <View style={styles.recordDate}>
                <Text style={styles.recordDateText}>
                  {DateUtils.formatDate(new Date(record.date), 'MMM dd')}
                </Text>
              </View>
              <View style={styles.recordData}>
                <View style={styles.recordStat}>
                  <Ionicons name="egg" size={16} color={Colors.accent} />
                  <Text style={styles.recordStatText}>{record.eggsCount} eggs</Text>
                </View>
                {record.feedConsumed > 0 && (
                  <View style={styles.recordStat}>
                    <Ionicons name="water" size={16} color={Colors.primary} />
                    <Text style={styles.recordStatText}>{record.feedConsumed}kg</Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          {batchProductivity.length === 0 && (
            <View style={styles.emptyRecords}>
              <Ionicons name="stats-chart-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyRecordsText}>No productivity data yet</Text>
              <Text style={styles.emptyRecordsSubtext}>Add today's data to start tracking</Text>
            </View>
          )}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  headerIcons: {
    padding: 8,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  quickAddCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    color: Colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    textAlign: 'center',
  },
  saveButton: {
    marginTop: 8,
  },
  chartCard: {
    marginBottom: 16,
    width: '100%',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  recordsCard: {
    marginBottom: 16,
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  recordDate: {
    flex: 1,
  },
  recordDateText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  recordData: {
    flexDirection: 'row',
    gap: 16,
  },
  recordStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordStatText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  emptyRecords: {
    alignItems: 'center',
    padding: 32,
  },
  emptyRecordsText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyRecordsSubtext: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default BatchDetailScreen;