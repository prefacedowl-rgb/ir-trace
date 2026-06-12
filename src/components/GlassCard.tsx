import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Pill, PillType } from './Pill';

export const ACCENT_COLORS = {
  green: '#2D7A3A',
  sage: '#7DAA72',
  sky: '#4A90A4',
  amber: '#C17F24',
  red: '#C0392B',
  gray: '#6B7D65',
};

interface GlassCardProps {
  title: string;
  accent: keyof typeof ACCENT_COLORS;
  pillLabel?: string;
  pillType?: PillType;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GlassCard({ title, accent, pillLabel, pillType, children, style }: GlassCardProps) {
  return (
    <View style={[styles.outerWrapper, style]}>
      <View style={styles.borderContainer}>
        {/* Header strip */}
        <View style={styles.headerStrip}>
          <Text style={styles.headerTitle}>{title.toUpperCase()}</Text>
          {pillLabel && pillType && (
            <Pill label={pillLabel} type={pillType} />
          )}
        </View>
        {/* Body */}
        <View style={styles.body}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    // Gentle eco shadow
    shadowColor: '#2D7A3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  borderContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E0D2',
    overflow: 'hidden',
  },
  headerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F2F5F0',
    borderBottomWidth: 1,
    borderBottomColor: '#D8E0D2',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#6B7D65', // --muted
    letterSpacing: 1.0, // 0.1em
  },
  body: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
});
