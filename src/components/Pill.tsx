import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type PillType = 'idle' | 'live' | 'warn' | 'err' | 'proto';

interface PillProps {
  label: string;
  type: PillType;
}

const PILL_COLORS = {
  idle: { border: '#D8E0D2', text: '#6B7D65', bg: ['#F2F5F0', '#F2F5F0'] },
  live: { border: '#A5D6A7', text: '#2D7A3A', bg: ['#E8F5EA', '#E8F5EA'] },
  warn: { border: '#F5CBA7', text: '#C17F24', bg: ['#FDF3E3', '#FDF3E3'] },
  err: { border: '#F5B7B1', text: '#C0392B', bg: ['#FDECEA', '#FDECEA'] },
  proto: { border: '#AED6E8', text: '#4A90A4', bg: ['#E8F4F8', '#E8F4F8'] },
};

export function Pill({ label, type }: PillProps) {
  const config = PILL_COLORS[type] || PILL_COLORS.idle;

  return (
    <View style={[styles.glowWrapper, { shadowColor: config.border }]}>
      <LinearGradient
        colors={config.bg as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.pill, { borderColor: config.border }]}
      >
        <Text style={[styles.text, { color: config.text }]}>{label.toUpperCase()}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  glowWrapper: {},
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
