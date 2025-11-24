import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import * as Font from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Colors from './src/constants/Colors';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingScreen from './src/screens/LoadingScreen';
import WebViewScreen from './src/screens/WebViewScreen';

// Firebase URLs
const FLAG_URL = 'https://chikengame-df0a7-default-rtdb.firebaseio.com/flag.json';
const URL_CONFIG = 'https://chikengame-df0a7-default-rtdb.firebaseio.com/url.json';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [shouldLoadWebView, setShouldLoadWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [webViewFailed, setWebViewFailed] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Load fonts first
      await loadFonts();
      
      // Check remote flag
      await checkRemoteFlag();
      
    } catch (error) {
      console.error('Error initializing app:', error);
      setError('Failed to initialize app');
      setAppReady(true);
      setLoading(false);
    }
  };

  const loadFonts = async () => {
    await Font.loadAsync({
      'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
      'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
      'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    });
    setFontsLoaded(true);
  };

  const checkRemoteFlag = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching flag from:', FLAG_URL);
      
      // Fetch the flag from Firebase
      const flagResponse = await fetch(FLAG_URL);
      if (!flagResponse.ok) {
        throw new Error(`HTTP error! status: ${flagResponse.status}`);
      }
      
      const flagText = await flagResponse.text();
      console.log('Flag response text:', flagText);
      
      let flagData;
      try {
        flagData = JSON.parse(flagText);
      } catch (parseError) {
        console.error('Error parsing flag JSON:', parseError);
        throw new Error('Invalid JSON in flag response');
      }
      
      console.log('Parsed flag data:', flagData);
      
      if (flagData === true) {
        console.log('Flag is TRUE, fetching URL...');
        
        // If flag is true, fetch the URL and load WebView
        const urlResponse = await fetch(URL_CONFIG);
        if (!urlResponse.ok) {
          throw new Error(`HTTP error! status: ${urlResponse.status}`);
        }
        
        const urlText = await urlResponse.text();
        console.log('URL response text:', urlText);
        
        let urlData;
        try {
          urlData = JSON.parse(urlText);
        } catch (parseError) {
          console.error('Error parsing URL JSON:', parseError);
          throw new Error('Invalid JSON in URL response');
        }
        
        console.log('Parsed URL data:', urlData);
        
        // Extract URL from the JSON object
        let finalUrl;
        if (typeof urlData === 'string') {
          finalUrl = urlData;
        } else if (urlData && urlData.url) {
          finalUrl = urlData.url;
        } else if (urlData && typeof urlData === 'object') {
          // Try to find any string value in the object
          const values = Object.values(urlData);
          const stringValue = values.find(val => typeof val === 'string');
          if (stringValue && stringValue.startsWith('http')) {
            finalUrl = stringValue;
          }
        }
        
        if (finalUrl && finalUrl.startsWith('http')) {
          console.log('Setting WebView URL:', finalUrl);
          setWebViewUrl(finalUrl);
          setShouldLoadWebView(true);
          setWebViewFailed(false);
        } else {
          console.error('Invalid URL found:', finalUrl);
          throw new Error('No valid URL found in configuration');
        }
      } else {
        // If flag is false, load the regular app
        console.log('Flag is FALSE, loading native app');
        setShouldLoadWebView(false);
        setWebViewFailed(false);
      }
      
    } catch (error) {
      console.error('Error checking remote flag:', error);
      // On error, fall back to regular app
      setShouldLoadWebView(false);
      setWebViewFailed(false);
      setError(`Failed to check updates: ${error.message}`);
    } finally {
      setLoading(false);
      setAppReady(true);
    }
  };

  const handleWebViewFallback = () => {
    console.log('WebView failed, switching to native app');
    setWebViewFailed(true);
    setShouldLoadWebView(false);
  };

  const handleRetryInitialCheck = () => {
    setError(null);
    setLoading(true);
    setWebViewFailed(false);
    initializeApp();
  };

  // Show loading screen while initializing
  if (!appReady || !fontsLoaded || loading) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  // Show error state
  if (error && !shouldLoadWebView && !webViewFailed) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContent}>
            <Ionicons name="warning" size={64} color={Colors.error} />
            <Text style={styles.errorTitle}>Loading Error</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorSubtext}>
              Loading native application instead...
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={handleRetryInitialCheck}
            >
              <Text style={styles.retryButtonText}>Retry Check</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Render WebView or regular app based on flag and WebView status
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      
      {shouldLoadWebView && !webViewFailed ? (
        <WebViewScreen 
          url={webViewUrl} 
          onFallbackToNative={handleWebViewFallback}
        />
      ) : (
        <AppProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AppProvider>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  errorSubtext: {
    color: Colors.textDisabled,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});