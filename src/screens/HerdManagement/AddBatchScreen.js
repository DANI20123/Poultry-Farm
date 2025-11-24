import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import GlassCard from '../../components/ui/GlassCard';
import PremiumButton from '../../components/ui/PremiumButton';
import Colors from '../../constants/Colors';
import { useApp } from '../../context/AppContext';
import { DateUtils, INITIAL_DATE } from '../../utils/DateUtils';

const AddBatchScreen = () => {
  const navigation = useNavigation();
  const { addHerdBatch } = useApp();

  const [formData, setFormData] = useState({
    breed: '',
    quantity: '',
    arrivalDate: INITIAL_DATE,
    notes: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange('arrivalDate', selectedDate);
    }
  };

  const validateForm = () => {
    if (!formData.breed.trim()) {
      Alert.alert('Error', 'Please enter breed name');
      return false;
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      Alert.alert('Error', 'Please enter valid quantity');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const batchData = {
        breed: formData.breed.trim(),
        quantity: parseInt(formData.quantity),
        arrivalDate: formData.arrivalDate.toISOString(),
        notes: formData.notes.trim(),
        currentQuantity: parseInt(formData.quantity), // Start with full quantity
      };

      await addHerdBatch(batchData);
      
      Alert.alert(
        'Success',
        'Batch added successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add batch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const popularBreeds = [
    'Lohmann Brown',
    'Hy-Line Brown',
    'ISA Brown',
    'Hubbard Golden Comet',
    'Bovans Brown'
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Add New Batch</Text>
            <Text style={styles.subtitle}>Enter details for new poultry batch</Text>
          </View>

          <GlassCard style={styles.formCard}>
            {/* Breed Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Breed *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.breed}
                onChangeText={(value) => handleInputChange('breed', value)}
                placeholder="Enter breed name"
                placeholderTextColor={Colors.textDisabled}
              />
            </View>

            {/* Popular Breeds */}
            <Text style={styles.suggestionTitle}>Popular Breeds:</Text>
            <View style={styles.breedSuggestions}>
              {popularBreeds.map(breed => (
                <TouchableOpacity
                  key={breed}
                  style={styles.breedChip}
                  onPress={() => handleInputChange('breed', breed)}
                >
                  <Text style={styles.breedChipText}>{breed}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quantity Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.quantity}
                onChangeText={(value) => handleInputChange('quantity', value)}
                placeholder="Number of birds"
                placeholderTextColor={Colors.textDisabled}
                keyboardType="numeric"
              />
            </View>

            {/* Arrival Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Arrival Date *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {DateUtils.formatDate(formData.arrivalDate, 'dd.MM.yyyy')}
                </Text>
                <Ionicons name="calendar" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={formData.arrivalDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date(2020, 0, 1)}
                maximumDate={new Date(2030, 11, 31)}
              />
            )}

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.notes}
                onChangeText={(value) => handleInputChange('notes', value)}
                placeholder="Additional notes about this batch..."
                placeholderTextColor={Colors.textDisabled}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </GlassCard>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <PremiumButton
              title="Cancel"
              variant="dark"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
            />
            <PremiumButton
              title="Add Batch"
              onPress={handleSubmit}
              loading={isSubmitting}
              style={styles.submitButton}
            />
          </View>

          {/* Extra padding for scroll */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40, // Extra padding for better scroll
  },
  header: {
    marginBottom: 24,
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
  formCard: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 16,
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
  textArea: {
    minHeight: 100,
  },
  suggestionTitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  breedSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  breedChip: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  breedChipText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  dateButton: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
  bottomPadding: {
    height: 100,
  },
});

export default AddBatchScreen;