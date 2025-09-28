import React from 'react';
import { View, StyleSheet, StatusBar, Platform, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlatePalLogo from '../assets/images/platepallogo.svg';

interface TopBarProps {
  platepallogo?: string; // Just pass the SVG filename without extension
}

const palette = {
  sand: "#FCDE9C", // warm background
  tangerine: "#FFA552", // primary
  apricot: "#DE8254", // secondary
  plum: "#381D2A", // dark text / accents
  sage: "#C4D6B0", // soft surface
  white: "#ffffff",
} as const;

export const TopBar: React.FC<TopBarProps> = ({ platepallogo }) => {
  const renderLogo = () => {
    if (!platepallogo) {
      return (
        <View style={styles.logoPlaceholder}>
          <Text style={styles.placeholderText}>LOGO</Text>
        </View>
      );
    }

    // Use the PlatePal SVG logo
    if (platepallogo === 'platepallogo') {
      return <PlatePalLogo style={styles.logoSvg} />;
    }
    
    return (
      <View style={styles.logoPlaceholder}>
        <Text style={styles.placeholderText}>{platepallogo.toUpperCase()}</Text>
        <Text style={styles.placeholderSubtext}>SVG Ready</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.sand} />
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          {renderLogo()}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.sand,
  },
  topBar: {
    height: 80,
    backgroundColor: palette.sand,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 29, 42, 0.15)', // more prominent border
    shadowColor: palette.plum,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 50,
  },
  logoPlaceholder: {
    width: 140,
    height: 50,
    backgroundColor: 'rgba(56, 29, 42, 0.1)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(56, 29, 42, 0.2)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSvg: {
    width: 140,
    height: 50,
  },
  placeholderText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.plum,
    opacity: 0.7,
  },
  placeholderSubtext: {
    fontSize: 8,
    fontWeight: '500',
    color: palette.plum,
    opacity: 0.5,
    marginTop: 2,
  },
});
