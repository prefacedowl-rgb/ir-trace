import React, { useState } from 'react';
import { StyleSheet, TextInput, View, TextInputProps, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);

interface NeonInputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  rightElement?: React.ReactNode | ((isFocused: boolean) => React.ReactNode);
  disabled?: boolean;
}

export function NeonInput({
  containerStyle,
  rightElement,
  disabled = false,
  onFocus,
  onBlur,
  ...props
}: NeonInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const handleFocus = (e: any) => {
    if (disabled) return;
    setIsFocused(true);
    focusAnim.value = withTiming(1, { duration: 150 });
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusAnim.value = withTiming(0, { duration: 150 });
    if (onBlur) onBlur(e);
  };

  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      ['#D8E0D2', '#2D7A3A']
    );

    const shadowOpacity = focusAnim.value * 0.12;
    const shadowRadius = focusAnim.value * 3;

    return {
      borderColor,
      shadowColor: '#2D7A3A',
      shadowOpacity,
      shadowRadius,
      elevation: focusAnim.value * 1,
    };
  });

  return (
    <AnimatedView
      style={[
        styles.container,
        animatedContainerStyle,
        disabled && styles.disabled,
        containerStyle,
      ]}
    >
      <TextInput
        style={styles.input}
        placeholderTextColor="rgba(107, 125, 101, 0.6)"
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!disabled}
        {...props}
      />
      {rightElement && (
        <View style={styles.rightContainer}>
          {typeof rightElement === 'function' ? rightElement(isFocused) : rightElement}
        </View>
      )}
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  disabled: {
    backgroundColor: '#F7F9F5',
    opacity: 0.55,
  },
  input: {
    flex: 1,
    height: 48,
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13,
    color: '#1A2318',
  },
  rightContainer: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
