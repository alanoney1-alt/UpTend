import React, { useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';
import SignUpModal from '../components/SignUpModal';

// Auth screens
import OnboardingScreen from '../screens/OnboardingScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';

// Shared screens
import GeorgeChatScreen from '../screens/GeorgeChatScreen';
import GeorgeHomeScreen from '../screens/GeorgeHomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import VoiceMode from '../screens/VoiceMode';
import VerifyProScreen from '../screens/VerifyProScreen';
import BookingScreen from '../screens/BookingScreen';
import EmergencyScreen from '../screens/EmergencyScreen';

// New screens
import HomeScanScreen from '../screens/HomeScanScreen';
import DIYScreen from '../screens/DIYScreen';
import AutoScreen from '../screens/AutoScreen';
import ShoppingScreen from '../screens/ShoppingScreen';
import MoreScreen from '../screens/MoreScreen';

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
import ComplianceScreen from '../screens/ComplianceScreen';
import GovernmentContractsScreen from '../screens/GovernmentContractsScreen';
import HOACommunityScreen from '../screens/HOACommunityScreen';
import PropertyManagementScreen from '../screens/PropertyManagementScreen';
import ConstructionScreen from '../screens/ConstructionScreen';
import VeteranOnboardingScreen from '../screens/VeteranOnboardingScreen';
import VeteranMentorScreen from '../screens/VeteranMentorScreen';
import ReportBuilderScreen from '../screens/ReportBuilderScreen';
import InvoicingScreen from '../screens/InvoicingScreen';
import WhiteLabelScreen from '../screens/WhiteLabelScreen';
import AcademyScreen from '../screens/AcademyScreen';
import BusinessBookingScreen from '../screens/BusinessBookingScreen';
import PartsRequestScreen from '../screens/PartsRequestScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const CustomerStack = createNativeStackNavigator();

// --- Customer nested stacks ---

function CustomerGeorgeStack() {
  return (
    <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
      <CustomerStack.Screen name="GeorgeChat" component={GeorgeHomeScreen} />
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

function CustomerHomeScanStack() {
  return (
    <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
      <CustomerStack.Screen name="HomeScanHome" component={HomeScanScreen} />
      <CustomerStack.Screen name="ProfileHome" component={ProfileScreen} />
    </CustomerStack.Navigator>
  );
}

function CustomerAutoStack() {
  return (
    <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
      <CustomerStack.Screen name="AutoHome" component={AutoScreen} />
    </CustomerStack.Navigator>
  );
}

function CustomerMoreStack() {
  return (
    <CustomerStack.Navigator screenOptions={{ headerShown: false }}>
      <CustomerStack.Screen name="MoreHome" component={MoreScreen} />
      <CustomerStack.Screen name="DIY" component={DIYScreen} />
      <CustomerStack.Screen name="Shopping" component={ShoppingScreen} />
      <CustomerStack.Screen name="Emergency" component={EmergencyScreen} />
      <CustomerStack.Screen name="Profile" component={ProfileScreen} />
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
const ProGeorgeStack = createNativeStackNavigator();

function ProGeorgeStackScreen() {
  return (
    <ProGeorgeStack.Navigator screenOptions={{ headerShown: false }}>
      <ProGeorgeStack.Screen name="GeorgeChat" component={GeorgeChatScreen} />
      <ProGeorgeStack.Screen name="VoiceMode" component={VoiceMode} options={{ presentation: 'fullScreenModal' }} />
      <ProGeorgeStack.Screen name="ScopeMeasure" component={ScopeMeasureScreen} />
      <ProGeorgeStack.Screen name="MaterialList" component={MaterialListScreen} />
    </ProGeorgeStack.Navigator>
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
      <ProJobsStack.Screen name="PartsRequest" component={PartsRequestScreen} />
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
      <ProProfileStack.Screen name="Academy" component={AcademyScreen} />
    </ProProfileStack.Navigator>
  );
}

// --- B2B nested stacks ---
const B2BPropertiesStack = createNativeStackNavigator();
const B2BAnalyticsStack = createNativeStackNavigator();
const B2BGeorgeStack = createNativeStackNavigator();
const B2BProfileStack = createNativeStackNavigator();

function B2BGeorgeStackScreen() {
  return (
    <B2BGeorgeStack.Navigator screenOptions={{ headerShown: false }}>
      <B2BGeorgeStack.Screen name="GeorgeChat" component={GeorgeChatScreen} />
      <B2BGeorgeStack.Screen name="VoiceMode" component={VoiceMode} options={{ presentation: 'fullScreenModal' }} />
    </B2BGeorgeStack.Navigator>
  );
}

function B2BPropertiesStackScreen() {
  return (
    <B2BPropertiesStack.Navigator screenOptions={{ headerShown: false }}>
      <B2BPropertiesStack.Screen name="B2BDashboard" component={B2BDashboardScreen} />
      <B2BPropertiesStack.Screen name="Compliance" component={ComplianceScreen} />
      <B2BPropertiesStack.Screen name="GovernmentContracts" component={GovernmentContractsScreen} />
      <B2BPropertiesStack.Screen name="HOACommunity" component={HOACommunityScreen} />
      <B2BPropertiesStack.Screen name="PropertyManagement" component={PropertyManagementScreen} />
      <B2BPropertiesStack.Screen name="Construction" component={ConstructionScreen} />
      <B2BPropertiesStack.Screen name="VeteranOnboarding" component={VeteranOnboardingScreen} />
      <B2BPropertiesStack.Screen name="VeteranMentor" component={VeteranMentorScreen} />
      <B2BPropertiesStack.Screen name="Invoicing" component={InvoicingScreen} />
      <B2BPropertiesStack.Screen name="WhiteLabel" component={WhiteLabelScreen} />
      <B2BPropertiesStack.Screen name="BusinessBooking" component={BusinessBookingScreen} />
      <B2BPropertiesStack.Screen name="Academy" component={AcademyScreen} />
    </B2BPropertiesStack.Navigator>
  );
}

function B2BAnalyticsStackScreen() {
  return (
    <B2BAnalyticsStack.Navigator screenOptions={{ headerShown: false }}>
      <B2BAnalyticsStack.Screen name="B2BAnalytics" component={B2BDashboardScreen} />
      <B2BAnalyticsStack.Screen name="ReportBuilder" component={ReportBuilderScreen} />
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

function TabBarIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  return <Ionicons name={name} size={22} color={focused ? '#111111' : '#8E8E93'} />;
}

const tabScreenOptions = {
  tabBarActiveTintColor: '#111111',
  tabBarInactiveTintColor: '#8E8E93',
  tabBarStyle: {
    borderTopColor: '#F2F2F7',
    borderTopWidth: 0.5,
    paddingBottom: 2,
    paddingTop: 6,
    height: 52,
    backgroundColor: '#FFFFFF',
  },
  tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.2 },
  headerShown: false,
};

function CustomerTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="Home"
        component={CustomerGeorgeStack}
        options={{
          tabBarLabel: 'George',
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'chatbubble' : 'chatbubble-outline'} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Book"
        component={CustomerBookingStack}
        options={{
          tabBarLabel: 'Book',
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="HomeScan"
        component={CustomerHomeScanStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'home' : 'home-outline'} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="More"
        component={CustomerMoreStack}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function ProTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="George"
        component={ProGeorgeStackScreen}
        options={{
          tabBarLabel: 'George',
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'chatbubble' : 'chatbubble-outline'} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Jobs"
        component={ProJobsStackScreen}
        options={{
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'briefcase' : 'briefcase-outline'} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Routes"
        component={ProRoutesStackScreen}
        options={{
          tabBarLabel: 'Routes',
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'navigate' : 'navigate-outline'} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={ProEarningsStackScreen}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'wallet' : 'wallet-outline'} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProProfileStackScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'person-circle' : 'person-circle-outline'} focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function B2BTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="George"
        component={B2BGeorgeStackScreen}
        options={{
          tabBarLabel: 'George',
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'chatbubble' : 'chatbubble-outline'} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Properties"
        component={B2BPropertiesStackScreen}
        options={{
          tabBarLabel: 'Properties',
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'business' : 'business-outline'} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={B2BAnalyticsStackScreen}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'bar-chart' : 'bar-chart-outline'} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={B2BProfileStackScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? 'person-circle' : 'person-circle-outline'} focused={focused} />,
        }}
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

  // Guest mode goes straight to Mr. George — onboarding is optional
  // Uncomment to re-enable onboarding gate:
  // if (guestMode && !hasOnboarded) {
  //   return (
  //     <NavigationContainer>
  //       <OnboardingNavigator onComplete={() => setHasOnboarded(true)} />
  //       <SignUpModal visible={showSignUpModal} onClose={() => { setShowSignUpModal(false); setPendingAction(null); }} />
  //     </NavigationContainer>
  //   );
  // }

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
