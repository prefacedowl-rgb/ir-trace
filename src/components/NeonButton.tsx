import React, { useState } from 'react';
import { StyleSheet, Text, Pressable, ViewStyle, TextStyle, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant =
  | 'primary'
  | 'danger'
  | 'success'
  | 'saving'
  | 'secondary-neutral'
  | 'secondary-danger'
  | 'secondary-success'
  | 'secondary-info'
  | 'secondary-warn'
  | 'admin-unlock'
  | 'adjuster';

interface NeonButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accentColor?: string; // Kept for interface compatibility
}

export function NeonButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
}: NeonButtonProps) {
  const scale = useSharedValue(1);
  const [isPressed, setIsPressed] = useState(false);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (disabled) return;
    setIsPressed(true);
    scale.value = withTiming(0.97, { duration: 120 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    setIsPressed(false);
    scale.value = withTiming(1.0, { duration: 120 });
  };

  const renderContent = () => {
    const uppercaseLabel = label;

    // 1. Primary Button (Connect, Save All)
    if (variant === 'primary') {
      return (
        <LinearGradient
          colors={['#2D7A3A', '#4CAF50']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.btnInner, styles.primaryShadow]}
        >
          <Text style={[styles.text, styles.whiteText, textStyle]}>{uppercaseLabel}</Text>
        </LinearGradient>
      );
    }

    // 2. Danger Button (Disconnect, Delete, Admin Save)
    if (variant === 'danger') {
      return (
        <View style={[styles.btnInner, styles.dangerShadow, { backgroundColor: '#C0392B' }]}>
          <Text style={[styles.text, styles.whiteText, textStyle]}>{uppercaseLabel}</Text>
        </View>
      );
    }

    // 3. Success Solid Button
    if (variant === 'success') {
      return (
        <View style={[styles.btnInner, { backgroundColor: '#2D7A3A' }]}>
          <Text style={[styles.text, styles.whiteText, textStyle]}>{uppercaseLabel}</Text>
        </View>
      );
    }

    // 4. Saving Solid Button
    if (variant === 'saving') {
      return (
        <View style={[styles.btnInner, { backgroundColor: '#C17F24' }]}>
          <Text style={[styles.text, styles.whiteText, textStyle]}>{uppercaseLabel}</Text>
        </View>
      );
    }

    // 5. Admin Unlock
    if (variant === 'admin-unlock') {
      return (
        <View style={[styles.btnInner, { backgroundColor: '#1A2318' }]}>
          <Text style={[styles.text, styles.whiteText, textStyle]}>{uppercaseLabel}</Text>
        </View>
      );
    }

    // 6. Adjuster Button (- and +)
    if (variant === 'adjuster') {
      const borderC = isPressed ? '#2D7A3A' : '#D8E0D2';
      const bgC = isPressed ? '#E8F5EA' : '#FFFFFF';
      const textC = isPressed ? '#2D7A3A' : '#1A2318';
      return (
        <View
          style={[
            styles.btnInner,
            {
              borderColor: borderC,
              borderWidth: 1.5,
              backgroundColor: bgC,
              paddingVertical: 4,
              paddingHorizontal: 12,
            },
          ]}
        >
          <Text style={[styles.text, { color: textC, fontSize: 16 }, textStyle]}>{uppercaseLabel}</Text>
        </View>
      );
    }

    // 7. Secondary variants
    let bg = '#F2F5F0';
    let textC = '#6B7D65';
    let border = '#D8E0D2';

    if (variant === 'secondary-danger') {
      bg = '#FDECEA';
      textC = '#C0392B';
      border = '#F5B7B1';
    } else if (variant === 'secondary-success') {
      bg = '#E8F5EA';
      textC = '#2D7A3A';
      border = '#A5D6A7';
    } else if (variant === 'secondary-info') {
      bg = '#E8F4F8';
      textC = '#4A90A4';
      border = '#AED6E8';
    } else if (variant === 'secondary-warn') {
      bg = '#FDF3E3';
      textC = '#C17F24';
      border = '#F5CBA7';
    }

    return (
      <View
        style={[
          styles.btnInner,
          {
            backgroundColor: bg,
            borderColor: border,
            borderWidth: variant === 'secondary-neutral' ? 1 : 1.5,
          },
        ]}
      >
        <Text style={[styles.text, { color: textC }, textStyle]}>{uppercaseLabel}</Text>
      </View>
    );
  };

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.buttonContainer,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      disabled={disabled}
    >
      {renderContent()}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 4,
  },
  btnInner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: {
    opacity: 0.38,
  },
  text: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  whiteText: {
    color: '#FFFFFF',
  },
  primaryShadow: {
    shadowColor: '#2D7A3A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  dangerShadow: {
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
});
