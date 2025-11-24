import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
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
import { DateUtils } from '../utils/DateUtils';

const ScannerScreen = () => {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualData, setManualData] = useState({
    batchId: '',
    eggsCount: '',
    feedConsumed: '',
  });
  const { herdBatches, addProductivityRecord } = useApp();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    
    try {
      // Parse QR code data (assuming format: "batch:{batchId}")
      const [type, batchId] = data.split(':');
      
      if (type === 'batch' && batchId) {
        const batch = herdBatches.find(b => b.id === batchId);
        if (batch) {
          showProductivityModal(batch);
        } else {
          Alert.alert('Batch Not Found', 'No batch found with this QR code');
        }
      } else {
        Alert.alert('Invalid QR Code', 'This QR code is not recognized');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process QR code');
    }
  };

  const showProductivityModal = (batch) => {
    Alert.prompt(
      `Add Productivity Data - ${batch.breed}`,
      'Enter number of eggs collected today:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Next', 
          onPress: (eggsCount) => {
            if (eggsCount && !isNaN(eggsCount)) {
              Alert.prompt(
                'Feed Consumption',
                'Enter feed consumed today (kg):',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Save', 
                    onPress: async (feedConsumed) => {
                      try {
                        const recordData = {
                          batchId: batch.id,
                          date: new Date().toISOString().split('T')[0],
                          eggsCount: parseInt(eggsCount),
                          feedConsumed: feedConsumed ? parseFloat(feedConsumed) : 0,
                          notes: `QR scan - ${DateUtils.formatDate(new Date())}`,
                        };

                        await addProductivityRecord(recordData);
                        
                        Alert.alert(
                          'Success',
                          `Added ${eggsCount} eggs for ${batch.breed}`,
                          [{ text: 'OK', onPress: () => navigation.goBack() }]
                        );
                      } catch (error) {
                        Alert.alert('Error', 'Failed to save data');
                      }
                    }
                  }
                ],
                'plain-text',
                '0'
              );
            }
          }
        }
      ],
      'plain-text',
      '0'
    );
  };

  const handleManualSubmit = async () => {
    if (!manualData.batchId || !manualData.eggsCount) {
      Alert.alert('Error', 'Please select batch and enter eggs count');
      return;
    }

    try {
      const batch = herdBatches.find(b => b.id === manualData.batchId);
      if (!batch) {
        Alert.alert('Error', 'Selected batch not found');
        return;
      }

      const recordData = {
        batchId: manualData.batchId,
        date: new Date().toISOString().split('T')[0],
        eggsCount: parseInt(manualData.eggsCount),
        feedConsumed: manualData.feedConsumed ? parseFloat(manualData.feedConsumed) : 0,
        notes: `Manual entry - ${DateUtils.formatDate(new Date())}`,
      };

      await addProductivityRecord(recordData);
      
      Alert.alert('Success', `Added data for ${batch.breed}`);
      setManualData({ batchId: '', eggsCount: '', feedConsumed: '' });
      setShowManualEntry(false);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to save data');
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="camera-off" size={64} color={Colors.textSecondary} />
          <Text style={styles.permissionText}>Camera permission required</Text>
          <Text style={styles.permissionSubtext}>
            Please allow camera access to scan QR codes
          </Text>
          <PremiumButton
            title="Grant Permission"
            onPress={requestPermission}
            style={styles.permissionButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>QR Scanner</Text>
        <TouchableOpacity 
          style={styles.manualButton}
          onPress={() => setShowManualEntry(true)}
        >
          <Ionicons name="create-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </View>
            
            <Text style={styles.scanText}>
              Align QR code within the frame
            </Text>
          </View>
        </CameraView>
      </View>

      {/* Scanner Controls */}
      <View style={styles.controls}>
        <Text style={styles.instructions}>
          Scan QR codes on poultry cages to quickly record productivity data
        </Text>
        
        {scanned && (
          <PremiumButton
            title="Tap to Scan Again"
            onPress={() => setScanned(false)}
            style={styles.scanAgainButton}
          />
        )}
      </View>

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualEntry}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manual Data Entry</Text>
            <TouchableOpacity 
              onPress={() => setShowManualEntry(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <GlassCard style={styles.formCard}>
              {/* Batch Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Batch *</Text>
                <View style={styles.batchList}>
                  {herdBatches.map(batch => (
                    <TouchableOpacity
                      key={batch.id}
                      style={[
                        styles.batchOption,
                        manualData.batchId === batch.id && styles.batchOptionActive
                      ]}
                      onPress={() => setManualData({...manualData, batchId: batch.id})}
                    >
                      <Text style={[
                        styles.batchOptionText,
                        manualData.batchId === batch.id && styles.batchOptionTextActive
                      ]}>
                        {batch.breed} ({batch.quantity} birds)
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Eggs Count */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Eggs Collected Today *</Text>
                <TextInput
                  style={styles.textInput}
                  value={manualData.eggsCount}
                  onChangeText={(value) => setManualData({...manualData, eggsCount: value})}
                  placeholder="Enter number of eggs"
                  placeholderTextColor={Colors.textDisabled}
                  keyboardType="numeric"
                />
              </View>

              {/* Feed Consumed */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Feed Consumed (kg)</Text>
                <TextInput
                  style={styles.textInput}
                  value={manualData.feedConsumed}
                  onChangeText={(value) => setManualData({...manualData, feedConsumed: value})}
                  placeholder="Enter feed amount"
                  placeholderTextColor={Colors.textDisabled}
                  keyboardType="numeric"
                />
              </View>

              <PremiumButton
                title="Save Data"
                onPress={handleManualSubmit}
                style={styles.saveButton}
              />
            </GlassCard>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  manualButton: {
    padding: 8,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: Colors.primary,
  },
  cornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: Colors.primary,
  },
  cornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: Colors.primary,
  },
  cornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: Colors.primary,
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 32,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  controls: {
    padding: 20,
    alignItems: 'center',
  },
  instructions: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  scanAgainButton: {
    width: '100%',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: Colors.textPrimary,
    fontSize: 16,
  },
  permissionText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionSubtext: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    width: '100%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formCard: {
    marginBottom: 16,
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
  batchList: {
    gap: 8,
  },
  batchOption: {
    padding: 16,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  batchOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  batchOptionText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  batchOptionTextActive: {
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
  saveButton: {
    marginTop: 8,
  },
});

export default ScannerScreen;