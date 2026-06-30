import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, Platform } from 'react-native';

export default function ScreenWrapper({ children }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1e1e24" />
      <View style={styles.container}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1e1e24',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#1e1e24',
  },
});