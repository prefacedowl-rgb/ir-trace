import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ScanlineOverlay() {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(6, {
        duration: 2000, // scrolling speed: 6px over 2s to feel smooth and subtle
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* We make the animated SVG slightly larger than the screen so translating it doesn't reveal edges */}
      <Animated.View style={[{ width: '100%', height: SCREEN_HEIGHT + 12, top: -12 }, animatedStyle]}>
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="scanline" width="100%" height="6" patternUnits="userSpaceOnUse">
              <Rect width="100%" height="2" fill="#FFFFFF" fillOpacity={0.03} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#scanline)" />
        </Svg>
      </Animated.View>
    </View>
  );
}
