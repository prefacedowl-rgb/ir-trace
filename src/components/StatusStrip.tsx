import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
  cancelAnimation,
} from 'react-native-reanimated';

export type StatusStripState = 'default' | 'ok' | 'err' | 'warn';

interface StatusStripProps {
  state: StatusStripState;
  message: string;
}

const STRIP_THEMES = {
  default: { bg: '#E8F4F8', text: '#4A90A4', dot: '#4A90A4', blink: true, speed: 1000 },
  ok: { bg: '#E8F5EA', text: '#2D7A3A', dot: '#2D7A3A', blink: false, speed: 0 },
  err: { bg: '#FDECEA', text: '#C0392B', dot: '#C0392B', blink: false, speed: 0 },
  warn: { bg: '#FDF3E3', text: '#C17F24', dot: '#C17F24', blink: true, speed: 1000 },
};

export function StatusStrip({ state, message }: StatusStripProps) {
  const dotOpacity = useSharedValue(1);
  const themeAnim = useSharedValue(0);

  const activeTheme = STRIP_THEMES[state] || STRIP_THEMES.default;

  // Track the previous state to interpolate colors
  useEffect(() => {
    themeAnim.value = 0;
    themeAnim.value = withTiming(1, { duration: 300 });

    // Handle dot animation
    cancelAnimation(dotOpacity);
    if (activeTheme.blink) {
      dotOpacity.value = withRepeat(
        withTiming(0.3, { duration: activeTheme.speed }),
        -1,
        true
      );
    } else {
      dotOpacity.value = 1;
    }
  }, [state, activeTheme.blink, activeTheme.speed]);

  const animatedStyle = useAnimatedStyle(() => {
    // Determine colors based on active theme
    const bgColors = {
      default: '#E8F4F8',
      ok: '#E8F5EA',
      err: '#FDECEA',
      warn: '#FDF3E3',
    };
    const borderColors = {
      default: '#AED6E8',
      ok: '#A5D6A7',
      err: '#F5B7B1',
      warn: '#F5CBA7',
    };

    // Animate transition using interpolation
    const backgroundColor = interpolateColor(
      themeAnim.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.92)', bgColors[state] || bgColors.default]
    );

    const borderBottomColor = interpolateColor(
      themeAnim.value,
      [0, 1],
      ['#D8E0D2', borderColors[state] || borderColors.default]
    );

    return {
      backgroundColor,
      borderBottomColor,
    };
  });

  const animatedTextColorStyle = useAnimatedStyle(() => {
    const textColors = {
      default: '#4A90A4',
      ok: '#2D7A3A',
      err: '#C0392B',
      warn: '#C17F24',
    };
    return {
      color: interpolateColor(themeAnim.value, [0, 1], ['#1A2318', textColors[state] || textColors.default]),
    };
  });

  const animatedDotStyle = useAnimatedStyle(() => {
    return {
      opacity: dotOpacity.value,
      backgroundColor: activeTheme.dot,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Animated.View style={[styles.dot, animatedDotStyle]} />
      <Animated.Text style={[styles.messageText, animatedTextColorStyle]} numberOfLines={2}>
        {message}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1.5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  messageText: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 11,
    flex: 1,
    lineHeight: 14,
  },
});
