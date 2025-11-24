import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Colors from '../constants/Colors';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import FinanceScreen from '../screens/FinanceScreen';
import AddBatchScreen from '../screens/HerdManagement/AddBatchScreen';
import BatchDetailScreen from '../screens/HerdManagement/BatchDetailScreen';
import HerdListScreen from '../screens/HerdManagement/HerdListScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ProductivityScreen from '../screens/ProductivityScreen';
import ScannerScreen from '../screens/ScannerScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HerdStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HerdList" component={HerdListScreen} />
    <Stack.Screen name="AddBatch" component={AddBatchScreen} />
    <Stack.Screen name="BatchDetail" component={BatchDetailScreen} />
  </Stack.Navigator>
);

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Herd') {
            iconName = focused ? 'egg' : 'egg-outline';
          } else if (route.name === 'Productivity') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Inventory') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Finance') {
            iconName = focused ? 'cash' : 'cash-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: 'rgba(255,255,255,0.1)',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerStyle: {
          backgroundColor: Colors.background,
          shadowColor: 'transparent',
        },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Herd" 
        component={HerdStack}
        options={{ title: 'Herd Management' }}
      />
      <Tab.Screen 
        name="Productivity" 
        component={ProductivityScreen}
        options={{ title: 'Productivity' }}
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryScreen}
        options={{ title: 'Inventory' }}
      />
      <Tab.Screen 
        name="Finance" 
        component={FinanceScreen}
        options={{ title: 'Finance' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Scanner" component={ScannerScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;