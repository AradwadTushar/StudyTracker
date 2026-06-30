import React, { useEffect, useState } from 'react';

import UpdateModal from './src/components/UpdateModal';
import { checkForAppUpdate } from './src/services/updateService';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen       from './src/screens/HomeScreen';
import TrackerScreen    from './src/screens/TrackerScreen';
import SyllabusScreen   from './src/screens/SyllabusScreen';
import DeferredScreen   from './src/screens/DeferredScreen';
import NotesScreen      from './src/screens/NotesScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import Mascot           from './src/components/Mascot';
import FloatingTools    from './src/components/FloatingTools';
import { useStore }     from './src/store/useStore';
import { COLORS }       from './src/utils/theme';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home:          ['home',          'home-outline'],
  Tracker:       ['timer',         'timer-outline'],
  Syllabus:      ['book',          'book-outline'],
  'Study Later': ['layers',        'layers-outline'],
  Notes:         ['document-text', 'document-text-outline'],
};

export default function App() {
  const loadAll            = useStore(s => s.loadAll);
  const modalOpen          = useStore(s => s.fullScreenModalOpen);
  const onboarded          = useStore(s => s.onboarded);
  const completeOnboarding = useStore(s => s.completeOnboarding);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
  loadAll();

  async function checkUpdates() {
    const update = await checkForAppUpdate();

    if (update) {
      setUpdateInfo(update);
      setShowUpdateModal(true);
    }
  }

  checkUpdates();
}, []);

  // Show onboarding until completed
  if (!onboarded) {
    return (
      <SafeAreaProvider>
        <View style={styles.root}>
          <StatusBar style="light" />
          <OnboardingScreen onComplete={({ name, apiKey, loadGate, loadCdac }) => {
            completeOnboarding(name, apiKey, loadGate, loadCdac);
          }} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <NavigationContainer>
          <StatusBar style="light" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarStyle: styles.tabBar,
              tabBarActiveTintColor: COLORS.accent,
              tabBarInactiveTintColor: COLORS.textMuted,
              tabBarLabelStyle: styles.tabLabel,
              tabBarIcon: ({ focused, color }) => {
                const [active, inactive] = TAB_ICONS[route.name];
                return <Ionicons name={focused ? active : inactive} size={22} color={color} />;
              },
            })}
          >
            <Tab.Screen name="Home"         component={HomeScreen} />
            <Tab.Screen name="Tracker"      component={TrackerScreen} />
            <Tab.Screen name="Syllabus"     component={SyllabusScreen} />
            <Tab.Screen name="Study Later"  component={DeferredScreen} />
            <Tab.Screen name="Notes"        component={NotesScreen} />
          </Tab.Navigator>
        </NavigationContainer>

        {/* Hide overlays while a full-screen modal (Quiz, etc.) is open */}
        {!modalOpen && <FloatingTools />}
        {!modalOpen && <Mascot />}
        <UpdateModal
    visible={showUpdateModal}
    onClose={() => setShowUpdateModal(false)}
    update={updateInfo}
/>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 8,
  },
  tabLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },
});
