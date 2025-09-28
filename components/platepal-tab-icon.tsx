import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface PlatePalTabIconProps {
  color: string;
  size?: number;
}

export function PlatePalTabIcon({ color, size = 24 }: PlatePalTabIconProps) {
  return (
    <View style={styles.container}>
      <IconSymbol 
        name="fork.knife" 
        size={size} 
        color={color} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
