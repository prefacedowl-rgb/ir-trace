import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export type CheckItemState = 'empty' | 'ready' | 'missing';

interface CheckItemProps {
  icon: '○' | '✅' | '❌';
  label: string;
  state: CheckItemState;
  shakeTrigger: number;
}

export function CheckItem({ icon, label, state, shakeTrigger }: CheckItemProps) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (shakeTrigger > 0) {
      // 350ms ease shake animation
      translateX.value = withSequence(
        withTiming(-5, { duration: 70 }),
        withTiming(5, { duration: 70 }),
        withTiming(-3, { duration: 70 }),
        withTiming(3, { duration: 70 }),
        withTiming(0, { duration: 70 })
      );
    }
  }, [shakeTrigger]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const getContainerStyle = () => {
    switch (state) {
      case 'ready':
        return {
          borderColor: '#A5D6A7',
          backgroundColor: '#E8F5EA',
        };
      case 'missing':
        return {
          borderColor: '#F5B7B1',
          backgroundColor: '#FDECEA',
        };
      default:
        return {
          borderColor: '#D8E0D2',
          backgroundColor: '#F7F9F5',
        };
    }
  };

  const getTextColor = () => {
    switch (state) {
      case 'ready':
        return '#2D7A3A';
      case 'missing':
        return '#C0392B';
      default:
        return '#6B7D65'; // --muted
    }
  };

  const isBold = state === 'ready' || state === 'missing';

  return (
    <Animated.View style={[styles.container, getContainerStyle(), animatedStyle]}>
      <Text style={[styles.icon, { color: getTextColor(), fontWeight: isBold ? 'bold' : 'normal' }]}>{icon}</Text>
      <Text style={[styles.label, { color: getTextColor(), fontWeight: isBold ? 'bold' : 'normal' }]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginVertical: 4,
  },
  icon: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 13,
    marginRight: 10,
  },
  label: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 12,
    flex: 1,
  },
});
