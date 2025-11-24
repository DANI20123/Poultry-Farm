import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import Colors from '../../constants/Colors';

const PremiumButton = ({ 
  title, 
  onPress, 
  variant = 'primary',
  loading = false,
  style,
  ...props 
}) => {
  const getGradient = () => {
    switch(variant) {
      case 'primary':
        return Colors.gradientPrimary;
      case 'success':
        return Colors.gradientSuccess;
      case 'dark':
        return Colors.gradientDark;
      default:
        return Colors.gradientPrimary;
    }
  };

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={loading} 
      style={style}
      {...props}
    >
      <LinearGradient
        colors={getGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height: 56,
          borderRadius: 16,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={{
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '600',
          }}>
            {title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default PremiumButton;