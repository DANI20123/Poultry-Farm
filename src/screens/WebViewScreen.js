import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Colors from '../constants/Colors';

const WebViewScreen = ({ url }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const webViewRef = useRef(null);

  // Custom user agent
  const customUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';

  // Maximum number of retry attempts
  const MAX_RETRY_ATTEMPTS = 2;

  const handleError = () => {
    if (loadAttempts < MAX_RETRY_ATTEMPTS) {
      // Retry loading
      setLoadAttempts(prev => prev + 1);
      setHasError(false);
      setIsLoading(true);
    } else {
      // Max retries reached, show error
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setLoadAttempts(0);
    setHasError(false);
    setIsLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleLoadNativeApp = () => {
    // This would trigger a restart to load the native app
    // For now, we'll just show an alert since we can't restart from here
    Alert.alert(
      'Switch to Native App',
      'Please restart the application to use the native version.',
      [
        { text: 'OK' }
      ]
    );
  };

  // Auto-retry after error
  useEffect(() => {
    if (hasError && loadAttempts < MAX_RETRY_ATTEMPTS) {
      const timer = setTimeout(() => {
        handleRetry();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasError, loadAttempts]);

  // Show loading/error states
  if (hasError && loadAttempts >= MAX_RETRY_ATTEMPTS) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={80} color={Colors.error} />
          <Text style={styles.errorTitle}>Connection Failed</Text>
          <Text style={styles.errorText}>
            Unable to load web content after {MAX_RETRY_ATTEMPTS + 1} attempts
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.retryButton]}
              onPress={handleRetry}
            >
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.nativeButton]}
              onPress={handleLoadNativeApp}
            >
              <Ionicons name="phone-portrait" size={20} color={Colors.textPrimary} />
              <Text style={[styles.buttonText, styles.nativeButtonText]}>Use Native App</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {loadAttempts > 0 ? `Loading... (Attempt ${loadAttempts + 1})` : 'Loading...'}
          </Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={[styles.webview, isLoading && styles.hiddenWebview]}
        userAgent={customUserAgent}
        startInLoadingState={false}
        allowsBackForwardNavigationGestures={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        onError={(syntheticEvent) => {
          console.error('WebView error:', syntheticEvent.nativeEvent);
          handleError();
        }}
        onHttpError={(syntheticEvent) => {
          console.error('WebView HTTP error:', syntheticEvent.nativeEvent);
          handleError();
        }}
        onLoadStart={() => {
          console.log('WebView loading started');
          setIsLoading(true);
          setHasError(false);
        }}
        onLoadEnd={() => {
          console.log('WebView loading finished');
          setIsLoading(false);
        }}
        onLoadProgress={({ nativeEvent }) => {
          if (nativeEvent.progress === 1) {
            setIsLoading(false);
          }
        }}
        onContentProcessDidTerminate={() => {
          console.log('WebView content process terminated');
          handleError();
        }}
        renderError={(errorDomain, errorCode, errorDesc) => {
          console.log('WebView render error:', errorDomain, errorCode, errorDesc);
          return null; // We handle errors in onError
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webview: {
    flex: 1,
  },
  hiddenWebview: {
    opacity: 0,
    height: 0,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.background,
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
    marginBottom: 40,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  retryButton: {
    backgroundColor: Colors.primary,
  },
  nativeButton: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nativeButtonText: {
    color: Colors.primary,
  },
});

export default WebViewScreen;