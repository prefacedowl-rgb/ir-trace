import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  label?: string;
  options: DropdownOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  accentColor?: string; // Kept for backwards compatibility
  placeholder?: string;
}

export function CustomDropdown({
  label,
  options,
  selectedValue,
  onValueChange,
  disabled = false,
  placeholder = 'Select option...',
}: CustomDropdownProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);

  const selectedOption = options.find((opt) => opt.value === selectedValue);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const animatedSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const openSheet = () => {
    if (disabled) return;
    setModalVisible(true);
    translateY.value = withSpring(0, { damping: 20, stiffness: 150 });
  };

  const closeSheet = (callback?: () => void) => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
      runOnJS(setModalVisible)(false);
      if (callback) runOnJS(callback)();
    });
  };

  const handleSelect = (value: string) => {
    closeSheet(() => {
      onValueChange(value);
    });
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>}

      {/* Select Trigger Box */}
      <Pressable
        onPress={openSheet}
        disabled={disabled}
        style={({ pressed }) => [
          styles.trigger,
          {
            borderColor: disabled
              ? '#D8E0D2'
              : modalVisible
              ? '#2D7A3A'
              : '#D8E0D2',
            opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
            shadowColor: '#2D7A3A',
            shadowOpacity: disabled ? 0 : modalVisible ? 0.08 : 0,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.triggerText,
            { color: disabled ? 'rgba(26, 35, 24, 0.4)' : '#1A2318' },
          ]}
        >
          {displayLabel}
        </Text>
        <View style={styles.chevronContainer}>
          <Svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <Path
              d="M1 1.5L6 6.5L11 1.5"
              stroke={disabled ? 'rgba(26, 35, 24, 0.4)' : '#2D7A3A'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </Pressable>

      {/* Modal Bottom Sheet */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => closeSheet()}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeSheet()} />

          <Animated.View style={[styles.bottomSheet, animatedSheetStyle]}>
            <View style={styles.sheetBg}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{label ? label.toUpperCase() : 'SELECT'}</Text>
                <Pressable onPress={() => closeSheet()} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>CLOSE</Text>
                </Pressable>
              </View>

              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const isSelected = item.value === selectedValue;
                  return (
                    <Pressable
                      onPress={() => handleSelect(item.value)}
                      style={({ pressed }) => [
                        styles.optionRow,
                        {
                          borderColor: isSelected ? '#2D7A3A' : '#D8E0D2',
                          backgroundColor: isSelected
                            ? '#E8F5EA'
                            : pressed
                            ? '#F2F5F0'
                            : '#FFFFFF',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color: isSelected ? '#2D7A3A' : '#1A2318',
                            fontFamily: isSelected
                              ? 'Inter_700Bold'
                              : 'Inter_400Regular',
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkIcon}>
                          <Svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                            <Path
                              d="M1 5L4.5 8.5L13 1"
                              stroke="#2D7A3A"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </Svg>
                        </View>
                      )}
                    </Pressable>
                  );
                }}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  fieldLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#6B7D65', // --muted
    marginBottom: 6,
    letterSpacing: 1.0,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
  },
  triggerText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13,
    flex: 1,
  },
  chevronContainer: {
    marginLeft: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 35, 24, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.65,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#D8E0D2',
    overflow: 'hidden',
  },
  sheetBg: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F2F5F0',
    borderBottomWidth: 1,
    borderBottomColor: '#D8E0D2',
  },
  sheetTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#6B7D65',
    letterSpacing: 1.0,
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(45, 122, 58, 0.1)',
  },
  closeBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#2D7A3A',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginVertical: 4,
  },
  optionText: {
    fontSize: 13,
    flex: 1,
  },
  checkIcon: {
    marginLeft: 8,
  },
});
