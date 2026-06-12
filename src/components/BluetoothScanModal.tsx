import React, { useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useStore } from '../store/useStore';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

// ─── Radar Ring ──────────────────────────────────────────────────────────────
function RadarRing({ delay }: { delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3, 1], [0, 0.6, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.15, 1]) }],
  }));

  return <Animated.View style={[styles.radarRing, animStyle]} />;
}

// ─── Signal Bars ─────────────────────────────────────────────────────────────
function SignalBars({ rssi }: { rssi: number | null }) {
  const strength = rssi === null ? 0 : rssi > -55 ? 4 : rssi > -65 ? 3 : rssi > -75 ? 2 : 1;
  return (
    <View style={styles.barsRow}>
      {[1, 2, 3, 4].map(bar => (
        <View
          key={bar}
          style={[
            styles.bar,
            { height: 4 + bar * 3 },
            bar <= strength ? styles.barActive : styles.barInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Device Row ──────────────────────────────────────────────────────────────
function DeviceRow({
  item,
  onConnect,
  connectingId,
}: {
  item: { id: string; name: string | null; rssi: number | null };
  onConnect: (id: string) => void;
  connectingId: string | null;
}) {
  const isConnecting = connectingId === item.id;
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withTiming(1, { duration: 120 }),
    );
    onConnect(item.id);
  };

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.deviceCard, rowStyle]}>
      <View style={styles.deviceIconWrap}>
        <LinearGradient colors={['#1E3D23', '#2D7A3A']} style={styles.deviceIcon}>
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              fill="#4CAF50"
            />
            <Circle cx="12" cy="9" r="2.5" fill="#fff" />
          </Svg>
        </LinearGradient>
      </View>

      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName} numberOfLines={1}>
          {item.name ?? 'Unknown Device'}
        </Text>
        <View style={styles.deviceMeta}>
          <SignalBars rssi={item.rssi} />
          <Text style={styles.rssiText}>
            {item.rssi !== null ? `${item.rssi} dBm` : 'N/A'}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={handlePress}
        disabled={connectingId !== null}
        style={({ pressed }) => [
          styles.connectRowBtn,
          pressed && { opacity: 0.7 },
          connectingId !== null && connectingId !== item.id && styles.connectRowBtnDim,
        ]}
      >
        {isConnecting ? (
          <ConnectingDots />
        ) : (
          <Text style={styles.connectRowBtnText}>CONNECT</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Connecting Dots ─────────────────────────────────────────────────────────
function ConnectingDots() {
  const d1 = useSharedValue(0.3);
  const d2 = useSharedValue(0.3);
  const d3 = useSharedValue(0.3);

  useEffect(() => {
    const cfg = { duration: 400 };
    d1.value = withRepeat(withSequence(withTiming(1, cfg), withTiming(0.3, cfg)), -1);
    d2.value = withDelay(150, withRepeat(withSequence(withTiming(1, cfg), withTiming(0.3, cfg)), -1));
    d3.value = withDelay(300, withRepeat(withSequence(withTiming(1, cfg), withTiming(0.3, cfg)), -1));
  }, []);

  const s1 = useAnimatedStyle(() => ({ opacity: d1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: d2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: d3.value }));

  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
      {[s1, s2, s3].map((s, i) => (
        <Animated.View key={i} style={[styles.connectingDot, s]} />
      ))}
    </View>
  );
}

// ─── Scanning Dots in Title ───────────────────────────────────────────────────
function ScanningTitle({ isScanning }: { isScanning: boolean }) {
  const dot = useSharedValue(0);

  useEffect(() => {
    if (isScanning) {
      dot.value = withRepeat(withTiming(3, { duration: 1200 }), -1, false);
    }
  }, [isScanning]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: dot.value % 1 > 0.5 ? 1 : 0.3 }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={styles.scanTitle}>
        {isScanning ? 'Scanning nearby' : 'Found devices'}
      </Text>
      {isScanning && (
        <Animated.Text style={[styles.scanTitle, dotStyle]}>{'...'}</Animated.Text>
      )}
    </View>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState() {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 900 }), withTiming(0.4, { duration: 900 })),
      -1,
    );
  }, []);
  const s = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.emptyState, s]}>
      <Text style={styles.emptyText}>Searching for IrTrace devices…</Text>
    </Animated.View>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function BluetoothScanModal() {
  const showScanModal = useStore(s => s.showScanModal);
  const scanResults = useStore(s => s.scanResults);
  const isScanning = useStore(s => s.isScanning);
  const closeScanModal = useStore(s => s.closeScanModal);
  const connectToScannedDevice = useStore(s => s.connectToScannedDevice);

  const [connectingId, setConnectingId] = React.useState<string | null>(null);

  const sheetY = useSharedValue(SCREEN_H);
  const backdropOp = useSharedValue(0);

  useEffect(() => {
    if (showScanModal) {
      setConnectingId(null);
      backdropOp.value = withTiming(1, { duration: 280 });
      sheetY.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.back(1.1)) });
    } else {
      backdropOp.value = withTiming(0, { duration: 220 });
      sheetY.value = withTiming(SCREEN_H, { duration: 260 });
    }
  }, [showScanModal]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOp.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));

  const handleConnect = useCallback((id: string) => {
    setConnectingId(id);
    connectToScannedDevice(id);
  }, [connectToScannedDevice]);

  if (!showScanModal) return null;

  return (
    <Modal transparent visible={showScanModal} animationType="none" statusBarTranslucent>
      <View style={styles.root}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={closeScanModal}>
          <Animated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, backdropStyle]} />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Radar Header */}
          <LinearGradient colors={['#0A1F0D', '#0D2B11']} style={styles.radarHeader}>
            <View style={styles.radarContainer}>
              <RadarRing delay={0} />
              <RadarRing delay={730} />
              <RadarRing delay={1460} />
              <LinearGradient colors={['#2D7A3A', '#4CAF50']} style={styles.radarCore}>
                <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </LinearGradient>
            </View>

            <ScanningTitle isScanning={isScanning} />
            <Text style={styles.scanSubtitle}>
              {scanResults.length === 0
                ? 'Looking for IrTrace BLE devices'
                : `${scanResults.length} device${scanResults.length === 1 ? '' : 's'} found`}
            </Text>
          </LinearGradient>

          {/* Handle pill */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* Device List */}
          <FlatList
            data={scanResults}
            keyExtractor={item => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState />}
            renderItem={({ item }) => (
              <DeviceRow
                item={item}
                onConnect={handleConnect}
                connectingId={connectingId}
              />
            )}
          />

          {/* Cancel */}
          <Pressable
            onPress={closeScanModal}
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.cancelText}>CANCEL</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.78)',
  },
  sheet: {
    backgroundColor: '#0D1A0F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.75,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
  },

  // Handle
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#0D1A0F',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  // Radar header
  radarHeader: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76,175,80,0.15)',
  },
  radarContainer: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  radarRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  radarCore: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTitle: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 16,
    color: '#E8F5EA',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  scanSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 4,
  },

  // List
  list: { flexGrow: 0 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },

  // Device card
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,175,80,0.07)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.18)',
    padding: 12,
    marginBottom: 10,
  },
  deviceIconWrap: { marginRight: 12 },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceInfo: { flex: 1, gap: 4 },
  deviceName: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 13,
    color: '#E8F5EA',
    letterSpacing: 0.4,
  },
  deviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 4, borderRadius: 2 },
  barActive: { backgroundColor: '#4CAF50' },
  barInactive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  rssiText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },

  // Connect row button
  connectRowBtn: {
    backgroundColor: '#2D7A3A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  connectRowBtnDim: { opacity: 0.35 },
  connectRowBtnText: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 11,
    color: '#fff',
    letterSpacing: 0.8,
  },
  connectingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
  },

  // Cancel
  cancelBtn: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.4,
  },
});
