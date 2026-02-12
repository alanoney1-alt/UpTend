import React, { useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';
import SignUpModal from '../components/SignUpModal';

// Auth screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';

// Shared screens
import BudChatScreen from '../screens/BudChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import VoiceMode from '../screens/VoiceMode';
import VerifyProScreen from '../screens/VerifyProScreen';
import BookingScreen from '../screens/BookingScreen';
import EmergencyScreen from '../screens/EmergencyScreen';

// Customer screens
import CustomerDashboardScreen from '../screens/CustomerDashboardScreen';
import LiveMapScreen from '../screens/LiveMapScreen';
import ARCameraScreen from '../screens/ARCameraScreen';
import SmartHomeScreen from '../screens/SmartHomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import PhotoTimelineScreen from '../screens/PhotoTimelineScreen';
import NeighborhoodScreen from '../screens/NeighborhoodScreen';
import RecruitScreen from '../screens/RecruitScreen';

// Pro screens
import ProDashboardScreen from '../screens/ProDashboardScreen';
import ProRouteScreen from '../screens/ProRouteScreen';
import DemandHeatmapScreen from '../screens/DemandHeatmapScreen';
import ProDemandView from '../screens/ProDemandView';
import ScopeMeasureScreen from '../screens/ScopeMeasureScreen';
import MaterialListScreen from '../screens/MaterialListScreen';
import IncidentLogScreen from '../screens/IncidentLogScreen';
import DamageProtectionScreen from '../screens/DamageProtectionScreen';
import EarningsCoachScreen from '../screens/EarningsCoachScreen';
import TaxHelperScreen from '../screens/TaxHelperScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProReferralScreen from '../screens/ProReferralScreen';
import ReviewManagerScreen from '../screens/ReviewManagerScreen';
import SkillUpScreen from '../screens/SkillUpScreen';
import CustomerCRMScreen from '../screens/CustomerCRMScreen';
import ProSchedulerScreen from '../screens/ProSchedulerScreen';
import InsuranceClaimScreen from '../screens/InsuranceClaimScreen';
import IdentityVerifyScreen from '../screens/IdentityVerifyScreen';

// Engagement screens
import TransformationFeedScreen from '../screens/TransformationFeedScreen';
import HomeHealthScreen from '../screens/HomeHealthScreen';
import FlashDealsScreen from '../screens/FlashDealsScreen';
import NeighborhoodActivityScreen from '../screens/NeighborhoodActivityScreen';
import SubscribeScreen from '../screens/SubscribeScreen';
import HomeStreaksScreen from '../screens/HomeStreaksScreen';
import ProTipsScreen from '../screens/ProTipsScreen';

// B2B screens
import B2BDashboardScreen from '../screens/B2BDashboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const CustomerStack = createNativeStackNavigator();

// --- Customer nested stacks ---

function CustomerBudStack() {
  return (
    <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
      <CustomerStack.Screen name="BudChat" component={BudChatScreen} />
      <CustomerStack.Screen name="ARCamera" component={ARCameraScreen} options={{ presentation: 'fullScreenModal' }} />
      <CustomerStack.Screen name="VoiceMode" component={VoiceMode} options={{ presentation: 'fullScreenModal' }} />
      <CustomerStack.Screen name="Calendar" component={CalendarScreen} />
    </CustomerStack.Navigator>
  );
}

function CustomerBookingStack() {
  return (
    <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
      <CustomerStack.Screen name="BookingHome" component={BookingScreen} />
    </CustomerStack.Navigator>
  );
}

function CustomerEmergencyStack() {
  return (
    <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
      <CustomerStack.Screen name="EmergencyHome" component={EmergencyScreen} />
    </CustomerStack.Navigator>
  );
}

function CustomerDashboardStack() {
  return (
    <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
      <CustomerStack.Screen name="DashboardHome" component={CustomerDashboardScreen} />
      <CustomerStack.Screen name="HomeHealth" component={HomeHealthScreen} />
      <CustomerStack.Screen name="SmartHome" component={SmartHomeScreen} />
      <CustomerStack.Screen name="VerifyPro" component={VerifyProScreen} />
      <CustomerStack.Screen name="FlashDeals" component={FlashDealsScreen} options={{ headerShown: true, headerTitle: 'Flash Deals' }} />
      <CustomerStack.Screen name="Subscribe" component={SubscribeScreen} options={{ headerShown: true, headerTitle: 'Subscribe & Save' }} />
      <CustomerStack.Screen name="HomeStreaks" component={HomeStreaksScreen} options={{ headerShown: true, headerTitle: 'Home Streaks' }} />
      <CustomerStack.Screen name="ProTips" component={ProTipsScreen} options={{ headerShown: true, headerTitle: 'Pro Tips' }} />
      <CustomerStack.Screen name="NeighborhoodActivity" component={NeighborhoodActivityScreen} options={{ headerShown: true, headerTitle: 'Your Neighborhood' }} />
    </CustomerStack.Navigator>
  );
}

function CustomerProfileStack() {
  return (
    <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
      <CustomerStack.Screen name="ProfileHome" component={ProfileScreen} />
      <CustomerStack.Screen name="Recruit" component={RecruitScreen} />
    </CustomerStack.Navigator>
  );
}

// --- Pro nested stacks ---

const ProStack = createNativeStackNavigator();
const ProJobsStack = createNativeStackNavigator();
const ProRoutesStack = createNativeStackNavigator();
const ProEarningsStack = createNativeStackNavigator();
const ProProfileStack = createNativeStackNavigator();
const ProBudStack = createNativeStackNavigator();

function ProBudStackScreen() {
  return (
    <ProBudStack.Navigator screenOptions={{ headerShown: false }}>
      <ProBudStack.Screen name="BudChat" component={BudChatScreen} />
      <ProBudStack.Screen name="VoiceMode" component={VoiceMode} options={{ presentation: 'fullScreenModal' }} />
      <ProBudStack.Screen name="ScopeMeasure" component={ScopeMeasureScreen} />
      <ProBudStack.Screen name="MaterialList" component={MaterialListScreen} />
    </ProBudStack.Navigator>
  );
}

function ProJobsStackScreen() {
  return (
    <ProJobsStack.Navigator screenOptions={{ headerShown: false }}>
      <ProJobsStack.Screen name="JobsHome" component={ProDashboardScreen} />
      <ProJobsStack.Screen name="VerifyPro" component={VerifyProScreen} />
      <ProJobsStack.Screen name="MaterialList" component={MaterialListScreen} />
      <ProJobsStack.Screen name="IncidentLog" component={IncidentLogScreen} />
      <ProJobsStack.Screen name="DamageProtection" component={DamageProtectionScreen} />
      <ProJobsStack.Screen name="ScopeMeasure" component={ScopeMeasureScreen} />
    </ProJobsStack.Navigator>
  );
}

function ProRoutesStackScreen() {
  return (
    <ProRoutesStack.Navigator screenOptions={{ headerShown: false }}>
      <ProRoutesStack.Screen name="RoutesHome" component={ProRouteScreen} />
      <ProRoutesStack.Screen name="DemandHeatmap" component={DemandHeatmapScreen} />
      <ProRoutesStack.Screen name="ProDemandView" component={ProDemandView} />
    </ProRoutesStack.Navigator>
  );
}

function ProEarningsStackScreen() {
  return (
    <ProEarningsStack.Navigator screenOptions={{ headerShown: false }}>
      <ProEarningsStack.Screen name="EarningsHome" component={EarningsCoachScreen} />
      <ProEarningsStack.Screen name="TaxHelper" component={TaxHelperScreen} />
      <ProEarningsStack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <ProEarningsStack.Screen name="ProReferral" component={ProReferralScreen} />
    </ProEarningsStack.Navigator>
  );
}

function ProProfileStackScreen() {
  return (
    <ProProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProProfileStack.Screen name="CustomerCRM" component={CustomerCRMScreen} />
      <ProProfileStack.Screen name="ReviewManager" component={ReviewManagerScreen} />
      <ProProfileStack.Screen name="SkillUp" component={SkillUpScreen} />
      <ProProfileStack.Screen name="ProScheduler" component={ProSchedulerScreen} />
      <ProProfileStack.Screen name="InsuranceClaim" component={InsuranceClaimScreen} />
      <ProProfileStack.Screen name="Emergency" component={EmergencyScreen} />
      <ProProfileStack.Screen name="IdentityVerify" component={IdentityVerifyScreen} />
      <ProProfileStack.Screen name="ProTips" component={ProTipsScreen} />
    </ProProfileStack.Navigator>
  );
}

// --- B2B nested stacks ---
const B2BPropertiesStack = createNativeStackNavigator();
const B2BAnalyticsStack = createNativeStackNavigator();
const B2BBudStack = createNativeStackNavigator();
const B2BProfileStack = createNativeStackNavigator();

function B2BBudStackScreen() {
  return (
    <B2BBudStack.Navigator screenOptions={{ headerShown: false }}>
      <B2BBudStack.Screen name="BudChat" component={BudChatScreen} />
      <B2BBudStack.Screen name="VoiceMode" component={VoiceMode} options={{ presentation: 'fullScreenModal' }} />
    </B2BBudStack.Navigator>
  );
}

function B2BPropertiesStackScreen() {
  return (
    <B2BPropertiesStack.Navigator screenOptions={{ headerShown: false }}>
      <B2BPropertiesStack.Screen name="B2BDashboard" component={B2BDashboardScreen} />
    </B2BPropertiesStack.Navigator>
  );
}

function B2BAnalyticsStackScreen() {
  return (
    <B2BAnalyticsStack.Navigator screenOptions={{ headerShown: false }}>
      <B2BAnalyticsStack.Screen name="B2BAnalytics" component={B2BDashboardScreen} />
    </B2BAnalyticsStack.Navigator>
  );
}

function B2BProfileStackScreen() {
  return (
    <B2BProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <B2BProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
    </B2BProfileStack.Navigator>
  );
}

// --- Tab Navigators ---

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

const tabScreenOptions = {
  tabBarActiveTintColor: Colors.primary,
  tabBarInactiveTintColor: Colors.textLight,
  tabBarStyle: { borderTopColor: Colors.borderLight, paddingBottom: 4, height: 56 },
  tabBarLabelStyle: { fontSize: 12, fontWeight: '600' as const },
  headerStyle: { backgroundColor: Colors.white },
  headerTitleStyle: { fontWeight: '700' as const, color: Colors.text },
};

function CustomerTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="Home"
        component={CustomerDashboardStack}
        options={{ tabBarLabel: 'Home', tabBarIcon: () => <TabIcon emoji="🏠" />, headerShown: false }}
      />
      <Tab.Screen
        name="Bud"
        component={CustomerBudStack}
        options={{ tabBarLabel: 'Bud', tabBarIcon: () => <TabIcon emoji="💬" />, headerShown: false }}
      />
      <Tab.Screen
        name="Book"
        component={CustomerBookingStack}
        options={{ tabBarLabel: 'Book', tabBarIcon: () => <TabIcon emoji="📅" />, headerShown: false }}
      />
      <Tab.Screen
        name="Emergency"
        component={CustomerEmergencyStack}
        options={{ tabBarLabel: 'Emergency', tabBarIcon: () => <TabIcon emoji="🚨" />, headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={CustomerProfileStack}
        options={{ tabBarLabel: 'Profile', tabBarIcon: () => <TabIcon emoji="👤" />, headerShown: false }}
      />
    </Tab.Navigator>
  );
}

function ProTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="Bud"
        component={ProBudStackScreen}
        options={{ tabBarLabel: 'Bud', tabBarIcon: () => <TabIcon emoji="💬" />, headerShown: false }}
      />
      <Tab.Screen
        name="Jobs"
        component={ProJobsStackScreen}
        options={{ tabBarLabel: 'Jobs', tabBarIcon: () => <TabIcon emoji="📋" />, headerShown: false }}
      />
      <Tab.Screen
        name="Routes"
        component={ProRoutesStackScreen}
        options={{ tabBarLabel: 'Routes', tabBarIcon: () => <TabIcon emoji="🗺️" />, headerShown: false }}
      />
      <Tab.Screen
        name="Earnings"
        component={ProEarningsStackScreen}
        options={{ tabBarLabel: 'Earnings', tabBarIcon: () => <TabIcon emoji="📊" />, headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={ProProfileStackScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: () => <TabIcon emoji="👤" />, headerShown: false }}
      />
    </Tab.Navigator>
  );
}

function B2BTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="Bud"
        component={B2BBudStackScreen}
        options={{ tabBarLabel: 'Bud', tabBarIcon: () => <TabIcon emoji="💬" />, headerShown: false }}
      />
      <Tab.Screen
        name="Properties"
        component={B2BPropertiesStackScreen}
        options={{ tabBarLabel: 'Properties', tabBarIcon: () => <TabIcon emoji="🏢" />, headerShown: false }}
      />
      <Tab.Screen
        name="Analytics"
        component={B2BAnalyticsStackScreen}
        options={{ tabBarLabel: 'Analytics', tabBarIcon: () => <TabIcon emoji="📊" />, headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={B2BProfileStackScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: () => <TabIcon emoji="👤" />, headerShown: false }}
      />
    </Tab.Navigator>
  );
}

// --- Onboarding Stack ---
const OnboardingStack = createNativeStackNavigator();

function OnboardingNavigator({ onComplete }: { onComplete: () => void }) {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="Onboarding">
        {() => <OnboardingScreen onComplete={onComplete} />}
      </OnboardingStack.Screen>
      <OnboardingStack.Screen name="Welcome">
        {(props) => <WelcomeScreen {...props} onComplete={onComplete} />}
      </OnboardingStack.Screen>
      <OnboardingStack.Screen name="Login" component={LoginScreen} />
    </OnboardingStack.Navigator>
  );
}

// --- Root Navigator ---

export default function AppNavigator() {
  const { user, role, loading, guestMode, pendingAction, setPendingAction } = useAuth();
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  React.useEffect(() => {
    if (pendingAction && guestMode) {
      setShowSignUpModal(true);
    }
  }, [pendingAction, guestMode]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const getMainTabs = () => {
    if (role === 'pro') return <ProTabs />;
    if (role === 'business') return <B2BTabs />;
    return <CustomerTabs />;
  };

  if (guestMode && !hasOnboarded) {
    return (
      <NavigationContainer>
        <OnboardingNavigator onComplete={() => setHasOnboarded(true)} />
        <SignUpModal
          visible={showSignUpModal}
          onClose={() => { setShowSignUpModal(false); setPendingAction(null); }}
        />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      {getMainTabs()}
      <SignUpModal
        visible={showSignUpModal}
        onClose={() => { setShowSignUpModal(false); setPendingAction(null); }}
      />
    </NavigationContainer>
  );
}
