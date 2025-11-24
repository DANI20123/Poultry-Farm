import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import GlassCard from '../components/ui/GlassCard';
import PremiumButton from '../components/ui/PremiumButton';
import Colors from '../constants/Colors';
import { useApp } from '../context/AppContext';
import { DateUtils } from '../utils/DateUtils';

const FinanceScreen = () => {
  const { financialRecords, addFinancialRecord } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  });
  const [transactionForm, setTransactionForm] = useState({
    type: 'expense',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Calculate financial stats
  const calculateStats = () => {
    const filteredRecords = financialRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= dateRange.start && recordDate <= dateRange.end;
    });

    const income = filteredRecords
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const expenses = filteredRecords
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const profit = income - expenses;
    const profitMargin = income > 0 ? (profit / income) * 100 : 0;

    // Category breakdown
    const expenseCategories = {};
    const incomeCategories = {};
    
    filteredRecords.forEach(record => {
      if (record.type === 'expense') {
        expenseCategories[record.category] = (expenseCategories[record.category] || 0) + record.amount;
      } else {
        incomeCategories[record.category] = (incomeCategories[record.category] || 0) + record.amount;
      }
    });

    return {
      income,
      expenses,
      profit,
      profitMargin,
      expenseCategories,
      incomeCategories,
      filteredRecords: filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date))
    };
  };

  const { income, expenses, profit, profitMargin, expenseCategories, incomeCategories, filteredRecords } = calculateStats();

  const handleAddTransaction = async () => {
    if (!transactionForm.category || !transactionForm.amount || parseFloat(transactionForm.amount) <= 0) {
      Alert.alert('Error', 'Please fill all fields with valid data');
      return;
    }

    try {
      const transactionData = {
        type: transactionForm.type,
        category: transactionForm.category,
        amount: parseFloat(transactionForm.amount),
        description: transactionForm.description,
        date: transactionForm.date,
      };

      await addFinancialRecord(transactionData);
      
      Alert.alert('Success', 'Transaction added successfully!');
      setTransactionForm({
        type: 'expense',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction');
    }
  };

  const getPieChartData = () => {
    const data = Object.entries(expenseCategories).map(([category, amount], index) => ({
      name: category,
      population: amount,
      color: getCategoryColor(category, index),
      legendFontColor: Colors.textPrimary, // FIXED: White text for legends
      legendFontSize: 12,
    }));

    return data.length > 0 ? data : [{ 
      name: 'No Data', 
      population: 1, 
      color: Colors.textDisabled,
      legendFontColor: Colors.textPrimary, // FIXED: White text
      legendFontSize: 12 
    }];
  };

  const getCategoryColor = (category, index) => {
    const colors = [
      '#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
    ];
    return colors[index % colors.length];
  };

  const expenseCategoriesList = [
    'Feed', 'Veterinary', 'Labor', 'Utilities', 'Equipment', 'Transport', 'Other'
  ];

  const incomeCategoriesList = [
    'Egg Sales', 'Meat Sales', 'Breed Sales', 'Other Income'
  ];

  const chartConfig = {
    backgroundColor: Colors.surface,
    backgroundGradientFrom: Colors.surface,
    backgroundGradientTo: Colors.surfaceLight,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // FIXED: White labels
    style: {
      borderRadius: 16,
    },
  };

  const renderOverview = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Financial Summary */}
      <View style={styles.statsGrid}>
        <GlassCard style={styles.statCard}>
          <Ionicons name="trending-up" size={24} color={Colors.success} />
          <Text style={styles.statValue}>${income.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Income</Text>
        </GlassCard>
        
        <GlassCard style={styles.statCard}>
          <Ionicons name="trending-down" size={24} color={Colors.error} />
          <Text style={styles.statValue}>${expenses.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Expenses</Text>
        </GlassCard>
        
        <GlassCard style={styles.statCard}>
          <Ionicons name="cash" size={24} color={profit >= 0 ? Colors.success : Colors.error} />
          <Text style={[styles.statValue, { color: profit >= 0 ? Colors.success : Colors.error }]}>
            ${profit.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Profit</Text>
        </GlassCard>
      </View>

      {/* Profit Margin */}
      <GlassCard style={styles.marginCard}>
        <Text style={styles.sectionTitle}>Profit Margin</Text>
        <View style={styles.marginBar}>
          <View 
            style={[
              styles.marginFill, 
              { 
                width: `${Math.min(Math.abs(profitMargin), 100)}%`,
                backgroundColor: profitMargin >= 0 ? Colors.success : Colors.error
              }
            ]} 
          />
          <Text style={styles.marginText}>{profitMargin.toFixed(1)}%</Text>
        </View>
      </GlassCard>

      {/* Expense Breakdown */}
      {Object.keys(expenseCategories).length > 0 && (
        <GlassCard style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Expense Breakdown</Text>
          <PieChart
            data={getPieChartData()}
            width={styles.chartCard.width - 32}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </GlassCard>
      )}

      {/* Recent Transactions */}
      <GlassCard style={styles.transactionsCard}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {filteredRecords.slice(0, 5).map(record => (
          <View key={record.id} style={styles.transactionItem}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionCategory}>{record.category}</Text>
              <Text style={styles.transactionDescription}>{record.description}</Text>
              <Text style={styles.transactionDate}>
                {DateUtils.formatForDisplay(new Date(record.date))}
              </Text>
            </View>
            <Text style={[
              styles.transactionAmount,
              { color: record.type === 'income' ? Colors.success : Colors.error }
            ]}>
              {record.type === 'income' ? '+' : '-'}${record.amount}
            </Text>
          </View>
        ))}
        
        {filteredRecords.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyStateText}>No transactions yet</Text>
          </View>
        )}
      </GlassCard>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );

  const renderTransactions = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Add Transaction Form */}
      <GlassCard style={styles.formCard}>
        <Text style={styles.sectionTitle}>Add Transaction</Text>
        
        {/* Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              transactionForm.type === 'expense' && styles.typeButtonActive
            ]}
            onPress={() => setTransactionForm({...transactionForm, type: 'expense'})}
          >
            <Text style={[
              styles.typeButtonText,
              transactionForm.type === 'expense' && styles.typeButtonTextActive
            ]}>
              Expense
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typeButton,
              transactionForm.type === 'income' && styles.typeButtonActive
            ]}
            onPress={() => setTransactionForm({...transactionForm, type: 'income'})}
          >
            <Text style={[
              styles.typeButtonText,
              transactionForm.type === 'income' && styles.typeButtonTextActive
            ]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryList}>
              {(transactionForm.type === 'expense' ? expenseCategoriesList : incomeCategoriesList).map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    transactionForm.category === category && styles.categoryChipActive
                  ]}
                  onPress={() => setTransactionForm({...transactionForm, category})}
                >
                  <Text style={[
                    styles.categoryChipText,
                    transactionForm.category === category && styles.categoryChipTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount ($)</Text>
          <TextInput
            style={styles.textInput}
            value={transactionForm.amount}
            onChangeText={(value) => setTransactionForm({...transactionForm, amount: value})}
            placeholder="0.00"
            placeholderTextColor={Colors.textDisabled}
            keyboardType="numeric"
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.textInput}
            value={transactionForm.description}
            onChangeText={(value) => setTransactionForm({...transactionForm, description: value})}
            placeholder="Transaction description..."
            placeholderTextColor={Colors.textDisabled}
          />
        </View>

        <PremiumButton
          title="Add Transaction"
          onPress={handleAddTransaction}
          style={styles.addButton}
        />
      </GlassCard>

      {/* All Transactions */}
      <GlassCard style={styles.allTransactionsCard}>
        <Text style={styles.sectionTitle}>All Transactions</Text>
        {filteredRecords.map(record => (
          <View key={record.id} style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              <Ionicons 
                name={record.type === 'income' ? 'arrow-down' : 'arrow-up'} 
                size={20} 
                color={record.type === 'income' ? Colors.success : Colors.error} 
              />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionCategory}>{record.category}</Text>
              <Text style={styles.transactionDescription}>{record.description}</Text>
            </View>
            <Text style={[
              styles.transactionAmount,
              { color: record.type === 'income' ? Colors.success : Colors.error }
            ]}>
              {record.type === 'income' ? '+' : '-'}${record.amount}
            </Text>
          </View>
        ))}

        {filteredRecords.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyStateText}>No transactions yet</Text>
          </View>
        )}
      </GlassCard>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Finance</Text>
        <Text style={styles.subtitle}>Track income and expenses</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transactions' && styles.tabActive]}
          onPress={() => setActiveTab('transactions')}
        >
          <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>
            Transactions
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'overview' ? renderOverview() : renderTransactions()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ... существующие стили ...

  // Добавьте эти стили:
  formCard: {
    marginBottom: 16,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    color: Colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryList: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
  },
  typeButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  addButton: {
    marginTop: 8,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
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
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  marginCard: {
    marginBottom: 16,
  },
  marginBar: {
    height: 32,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    position: 'relative',
  },
  marginFill: {
    position: 'absolute',
    left: 0,
    height: '100%',
    borderRadius: 16,
  },
  marginText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    zIndex: 1,
  },
  chartCard: {
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
  },
  transactionsCard: {
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDescription: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 2,
  },
  transactionDate: {
    color: Colors.textDisabled,
    fontSize: 10,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  formCard: {
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
  },
  typeButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  categoryList: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    color: Colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  addButton: {
    marginTop: 8,
  },
  allTransactionsCard: {
    marginBottom: 16,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bottomPadding: {
    height: 100,
  },
});

export default FinanceScreen;