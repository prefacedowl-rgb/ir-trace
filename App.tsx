import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Linking,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  useFonts,
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from './src/store/useStore';
import { ScanlineOverlay } from './src/components/ScanlineOverlay';
import { StatusStrip } from './src/components/StatusStrip';
import { GlassCard, ACCENT_COLORS } from './src/components/GlassCard';
import { NeonButton } from './src/components/NeonButton';
import { NeonInput } from './src/components/NeonInput';
import { CustomDropdown } from './src/components/CustomDropdown';
import { CheckItem } from './src/components/CheckItem';
import { Pill } from './src/components/Pill';
import { ALL_VARIANTS, LEARN_SLOT_NAMES, WEB_VERSION } from './src/utils/constants';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

export default function App() {
  const [fontsLoaded] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
    Inter_400Regular,
    Inter_700Bold,
  });

  // BLE state
  const connected = useStore((s) => s.connected);
  const statusStripState = useStore((s) => s.statusStripState);
  const statusStripMsg = useStore((s) => s.statusStripMsg);
  const firmwareVersion = useStore((s) => s.firmwareVersion);
  const toggleConnect = useStore((s) => s.toggleConnect);

  // IR Received Signal state
  const irProtocol = useStore((s) => s.irProtocol);
  const irPower = useStore((s) => s.irPower);
  const irMode = useStore((s) => s.irMode);
  const irTempRx = useStore((s) => s.irTempRx);
  const irFan = useStore((s) => s.irFan);
  const irTimestamp = useStore((s) => s.irTimestamp);
  const irCellPulsing = useStore((s) => s.irCellPulsing);

  // Wi-Fi Configuration state
  const wifiList = useStore((s) => s.wifiList);
  const wifiPillState = useStore((s) => s.wifiPillState);
  const selectedWifiIndex = useStore((s) => s.selectedWifiIndex);
  const setSelectedWifiIndex = useStore((s) => s.setSelectedWifiIndex);
  const manualSsid = useStore((s) => s.manualSsid);
  const setManualSsid = useStore((s) => s.setManualSsid);
  const wifiPassword = useStore((s) => s.wifiPassword);
  const setWifiPassword = useStore((s) => s.setWifiPassword);
  const isWifiPasswordVisible = useStore((s) => s.isWifiPasswordVisible);
  const toggleWifiPasswordVisibility = useStore((s) => s.toggleWifiPasswordVisibility);
  const requestWifiScan = useStore((s) => s.requestWifiScan);

  // Admin / Advanced state
  const adminUnlocked = useStore((s) => s.adminUnlocked);
  const adminPassword = useStore((s) => s.adminPassword);
  const setAdminPassword = useStore((s) => s.setAdminPassword);
  const isAdminPasswordVisible = useStore((s) => s.isAdminPasswordVisible);
  const toggleAdminPasswordVisibility = useStore((s) => s.toggleAdminPasswordVisibility);
  const unlockAdmin = useStore((s) => s.unlockAdmin);
  const adminDeviceId = useStore((s) => s.adminDeviceId);
  const setAdminDeviceId = useStore((s) => s.setAdminDeviceId);
  const adminWakeInterval = useStore((s) => s.adminWakeInterval);
  const setAdminWakeInterval = useStore((s) => s.setAdminWakeInterval);
  const saveAdmin = useStore((s) => s.saveAdmin);

  // Protocol Discovery state
  const detectedProtocol = useStore((s) => s.detectedProtocol);
  const testTemp = useStore((s) => s.testTemp);
  const adjustTemp = useStore((s) => s.adjustTemp);
  const activeVariantId = useStore((s) => s.activeVariantId);
  const activeVariantName = useStore((s) => s.activeVariantName);
  const suggestedCandidates = useStore((s) => s.suggestedCandidates);
  const selectedLookupValue = useStore((s) => s.selectedLookupValue);
  const setSelectedLookupValue = useStore((s) => s.setSelectedLookupValue);
  const selectedUniversalValue = useStore((s) => s.selectedUniversalValue);
  const setSelectedUniversalValue = useStore((s) => s.setSelectedUniversalValue);
  const testSection = useStore((s) => s.testSection);
  const findRxActive = useStore((s) => s.findRxActive);
  const toggleFindRx = useStore((s) => s.toggleFindRx);
  const isDiscoveryCardVisible = useStore((s) => s.isDiscoveryCardVisible);
  const activeTestSection = useStore((s) => s.activeTestSection);

  // Learn Fallback state
  const learnSlotStates = useStore((s) => s.learnSlotStates);
  const learnCtrlMode = useStore((s) => s.learnCtrlMode);
  const setLearnCtrlMode = useStore((s) => s.setLearnCtrlMode);
  const learnActiveSlot = useStore((s) => s.learnActiveSlot);
  const learnSelectSlot = useStore((s) => s.learnSelectSlot);
  const learnPendingCapture = useStore((s) => s.learnPendingCapture);
  const learnStatusMsg = useStore((s) => s.learnStatusMsg);
  const learnStatusType = useStore((s) => s.learnStatusType);
  const learnBegin = useStore((s) => s.learnBegin);
  const learnReplay = useStore((s) => s.learnReplay);
  const learnSave = useStore((s) => s.learnSave);
  const learnDiscard = useStore((s) => s.learnDiscard);
  const learnDelete = useStore((s) => s.learnDelete);
  const learnDeleteAll = useStore((s) => s.learnDeleteAll);
  const toggleFindRxLrn = useStore((s) => s.toggleFindRxLrn);

  // Debug state
  const rawOutMode = useStore((s) => s.rawOutMode);
  const toggleRawOut = useStore((s) => s.toggleRawOut);

  // Log state
  const logList = useStore((s) => s.logList);
  const manualCommandInput = useStore((s) => s.manualCommandInput);
  const setManualCommandInput = useStore((s) => s.setManualCommandInput);
  const sendManual = useStore((s) => s.sendManual);
  const clearLog = useStore((s) => s.clearLog);

  // Save Config state
  const savePillState = useStore((s) => s.savePillState);
  const saveButtonState = useStore((s) => s.saveButtonState);
  const saveButtonText = useStore((s) => s.saveButtonText);
  const wifiCheckState = useStore((s) => s.wifiCheckState);
  const wifiCheckIcon = useStore((s) => s.wifiCheckIcon);
  const wifiCheckLabel = useStore((s) => s.wifiCheckLabel);
  const protoCheckState = useStore((s) => s.protoCheckState);
  const protoCheckIcon = useStore((s) => s.protoCheckIcon);
  const protoCheckLabel = useStore((s) => s.protoCheckLabel);
  const wifiShakeTrigger = useStore((s) => s.wifiShakeTrigger);
  const protoShakeTrigger = useStore((s) => s.protoShakeTrigger);
  const submitAll = useStore((s) => s.submitAll);

  // Reanimated shared values for conditional panels
  const activeVariantShared = useSharedValue(0);
  const adminPanelShared = useSharedValue(0);
  const wifiManualShared = useSharedValue(0);
  const dotScale = useSharedValue(1);
  const dotOpacity = useSharedValue(1);

  // Radial pulse for connected button
  useEffect(() => {
    if (connected) {
      dotScale.value = withRepeat(
        withTiming(2.2, { duration: 1500, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      dotOpacity.value = withRepeat(
        withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
    } else {
      dotScale.value = 1;
      dotOpacity.value = 1;
    }
  }, [connected]);

  // Handle active variant tag reveal
  const hasActiveVariant = activeVariantId !== null;
  useEffect(() => {
    activeVariantShared.value = withTiming(hasActiveVariant ? 1 : 0, { duration: 250 });
  }, [hasActiveVariant]);

  const activeVariantTagStyle = useAnimatedStyle(() => {
    return {
      height: activeVariantShared.value * 42,
      opacity: activeVariantShared.value,
      marginVertical: activeVariantShared.value * 6,
    };
  });

  // Handle admin fields reveal
  useEffect(() => {
    adminPanelShared.value = withTiming(adminUnlocked ? 1 : 0, { duration: 250 });
  }, [adminUnlocked]);

  const adminFieldsStyle = useAnimatedStyle(() => {
    return {
      height: adminPanelShared.value * 270,
      opacity: adminPanelShared.value,
      marginTop: adminPanelShared.value * 12,
    };
  });

  // Handle manual SSID reveal
  const isManualWifiSelected = selectedWifiIndex === 'manual';
  useEffect(() => {
    wifiManualShared.value = withTiming(isManualWifiSelected ? 1 : 0, { duration: 250 });
  }, [isManualWifiSelected]);

  const wifiManualInputStyle = useAnimatedStyle(() => {
    return {
      height: wifiManualShared.value * 72,
      opacity: wifiManualShared.value,
      marginTop: wifiManualShared.value * 8,
    };
  });

  // Pulse animation for connected dot
  const pulseDotAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: dotScale.value }],
      opacity: dotOpacity.value,
    };
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00F5FF" />
      </View>
    );
  }

  // Set version color: firmware version mismatch turns clay red
  const isVersionMismatch = firmwareVersion !== '' && firmwareVersion !== 'v@0.0.3';
  const versionColor = isVersionMismatch ? '#C0392B' : '#6B7D65';

  // Wi-Fi parsing options
  const wifiOptions = wifiList.map((net, i) => ({
    value: String(i),
    label: `${net.ssid} (${net.rssi}dBm) [${net.sec}]`,
  }));
  wifiOptions.push({ value: 'manual', label: '➕ Manual Entry...' });

  // Protocol dropdowns
  const lookupOptions = suggestedCandidates.map(([id, name], i) => ({
    value: String(id),
    label: (i === 0 ? '⭐ ' : `${i + 1}. `) + name,
  }));
  if (suggestedCandidates.length === 0) {
    lookupOptions.push({ value: '-1', label: '— No candidates —' });
  }

  const universalOptions = [
    { value: '-1', label: '⚡ Local Setup — RAW Capture' },
    ...ALL_VARIANTS.map((v) => ({
      value: String(v.id),
      label: `${v.id} — ${v.name}`,
    })),
  ];

  // Helper for rendering glowing background cell flashes
  const getCellGlowStyle = (cellName: string) => {
    return {
      backgroundColor: irCellPulsing[cellName] ? 'rgba(0, 245, 255, 0.15)' : 'transparent',
    };
  };

  // Check shared test buttons enable logic
  const isTestDisabled = () => {
    if (!connected || learnCtrlMode === 'LEARNED') return true;
    if (activeTestSection === 'lookup') {
      return parseInt(selectedLookupValue, 10) < 0;
    }
    return false; // universal is always enabled
  };

  const testBtnDisabled = isTestDisabled();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF2EB" />
      {/* Nature photo layer */}
      <Image
        source={require('./assets/nature-bg.jpg')}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          width: '100%',
          height: '100%',
          opacity: 0.10,
        }}
        resizeMode="cover"
      />
      {/* White wash layer */}
      <View
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(238,242,235,0.92)',
        }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* STICKY HEADER */}
        <View style={styles.header}>
          {/* Header Left */}
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={['#2D7A3A', '#4CAF50']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.brandIcon}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M5 12.5C7.33333 10.1667 9.66667 9 12 9M1 8.5C4.66667 4.83333 8.33333 3 12 3C15.6667 3 19.3333 4.83333 23 8.5M9 16.5C10 15.5 11 15 12 15C13 15 14 15.5 15 16.5M12 21C12.5523 21 13 20.5523 13 20C13 19.4477 12.5523 19 12 19C11.4477 19 11 19.4477 11 20C11 20.5523 11.4477 21 12 21Z"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
            </LinearGradient>
            <View style={styles.brandTextContainer}>
              <Text style={styles.brandName}>IrTrace</Text>
              <Text style={[styles.versionLine, { color: versionColor }]}>
                {`ESP32-C5 · WEB ${WEB_VERSION} / FW ${firmwareVersion || '--'}`}
              </Text>
            </View>
          </View>

          {/* Header Right */}
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => Linking.openURL('https://irtrace.io/manual.html')}
              style={({ pressed }) => [styles.guideBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.guideBtnText}>GUIDE</Text>
            </Pressable>

            {/* Connect button */}
            <View style={styles.connectBtnWrapper}>
              {connected ? (
                // Connected State Button
                <Pressable
                  onPress={toggleConnect}
                  style={({ pressed }) => [
                    styles.disconnectBtn,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <View style={styles.dotContainer}>
                    <Animated.View style={[styles.pulseDot, pulseDotAnimatedStyle]} />
                    <View style={[styles.staticDot, { backgroundColor: '#C0392B' }]} />
                  </View>
                  <Text style={styles.disconnectBtnText}>DISCONNECT</Text>
                </Pressable>
              ) : (
                // Disconnected State Button
                <Pressable
                  onPress={toggleConnect}
                  style={styles.connectBtnContainer}
                >
                  <LinearGradient
                    colors={['#2D7A3A', '#4CAF50']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.connectBtn}
                  >
                    <View style={styles.dotContainer}>
                      <View style={[styles.staticDot, { backgroundColor: '#FFFFFF', opacity: 0.5 }]} />
                    </View>
                    <Text style={styles.connectBtnText}>CONNECT</Text>
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* STATUS STRIP */}
        <StatusStrip state={statusStripState} message={statusStripMsg} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. IR RECEIVED SIGNAL CARD */}
        <GlassCard
          title="IR Received Signal"
          accent="sky"
          pillLabel={irProtocol !== '—' ? 'Live' : 'Waiting'}
          pillType={irProtocol !== '—' ? 'live' : 'idle'}
        >
          {irTimestamp !== '' && (
            <Text style={styles.timestampText}>{`Last: ${irTimestamp}`}</Text>
          )}

          <View style={styles.irGrid}>
            {/* Protocol Row */}
            <Animated.View style={[styles.irCellFull, getCellGlowStyle('protocol')]}>
              <Text style={styles.fieldLabel}>PROTOCOL</Text>
              <Text
                style={[
                  styles.dataValue,
                  { color: irProtocol !== '—' ? '#4A90A4' : '#C5CDD0' },
                ]}
              >
                {irProtocol}
              </Text>
            </Animated.View>

            {/* Power & Mode Cells */}
            <View style={styles.irRow}>
              <Animated.View style={[styles.irCellHalf, getCellGlowStyle('power')]}>
                <Text style={styles.fieldLabel}>POWER</Text>
                <Text
                  style={[
                    styles.dataValue,
                    {
                      color:
                        irPower === 'ON'
                          ? '#2D7A3A'
                          : irPower === 'OFF'
                          ? '#C0392B'
                          : '#C5CDD0',
                      fontWeight: irPower === 'N/A' ? 'normal' : 'bold',
                    },
                  ]}
                >
                  {irPower}
                </Text>
              </Animated.View>
              <View style={styles.verticalDivider} />
              <Animated.View style={[styles.irCellHalf, getCellGlowStyle('mode')]}>
                <Text style={styles.fieldLabel}>MODE</Text>
                <Text
                  style={[
                    styles.dataValue,
                    {
                      color: irMode === 'N/A' ? '#C5CDD0' : '#1A2318',
                      fontWeight: irMode === 'N/A' ? 'normal' : 'bold',
                    },
                  ]}
                >
                  {irMode}
                </Text>
              </Animated.View>
            </View>

            <View style={styles.horizontalDivider} />

            {/* Temperature & Fan Speed Cells */}
            <View style={styles.irRow}>
              <Animated.View style={[styles.irCellHalf, getCellGlowStyle('tempRx')]}>
                <Text style={styles.fieldLabel}>TEMP (RX)</Text>
                <Text
                  style={[
                    styles.dataValue,
                    {
                      color: irTempRx === 'N/A' ? '#C5CDD0' : '#1A2318',
                      fontWeight: irTempRx === 'N/A' ? 'normal' : 'bold',
                    },
                  ]}
                >
                  {irTempRx}
                </Text>
              </Animated.View>
              <View style={styles.verticalDivider} />
              <Animated.View style={[styles.irCellHalf, getCellGlowStyle('fan')]}>
                <Text style={styles.fieldLabel}>FAN SPEED</Text>
                <Text
                  style={[
                    styles.dataValue,
                    {
                      color: irFan === 'N/A' ? '#C5CDD0' : '#1A2318',
                      fontWeight: irFan === 'N/A' ? 'normal' : 'bold',
                    },
                  ]}
                >
                  {irFan}
                </Text>
              </Animated.View>
            </View>
          </View>
        </GlassCard>

        {/* 2. WI-FI CONFIGURATION CARD */}
        <GlassCard
          title="Wi-Fi Configuration"
          accent="green"
          pillLabel={wifiPillState}
          pillType={
            wifiPillState === 'Scanning...'
              ? 'warn'
              : wifiPillState === 'Scan Done'
              ? 'live'
              : 'idle'
          }
        >
          <CustomDropdown
            label="Select Network"
            options={wifiOptions}
            selectedValue={selectedWifiIndex}
            onValueChange={setSelectedWifiIndex}
            disabled={!connected}
            placeholder={connected ? 'Select network...' : 'Waiting for connection...'}
          />

          {/* Manual SSID slide down */}
          <Animated.View style={[styles.overflowHidden, wifiManualInputStyle]}>
            <Text style={styles.fieldLabel}>SSID (MANUAL)</Text>
            <NeonInput
              placeholder="SSID"
              value={manualSsid}
              onChangeText={setManualSsid}
              disabled={!connected}
            />
          </Animated.View>

          <View style={styles.marginGap} />

          <Text style={styles.fieldLabel}>PASSWORD</Text>
          <NeonInput
            placeholder="Password"
            value={wifiPassword}
            onChangeText={setWifiPassword}
            secureTextEntry={!isWifiPasswordVisible}
            disabled={!connected}
            rightElement={(isFocused) => (
              <Pressable onPress={toggleWifiPasswordVisibility} disabled={!connected}>
                {isWifiPasswordVisible ? (
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isFocused ? '#2D7A3A' : '#6B7D65'} strokeWidth="2">
                    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <Line x1="1" y1="1" x2="23" y2="23" />
                  </Svg>
                ) : (
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isFocused ? '#2D7A3A' : '#6B7D65'} strokeWidth="2">
                    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <Circle cx="12" cy="12" r="3" />
                  </Svg>
                )}
              </Pressable>
            )}
          />

          <View style={styles.marginGap} />

          <NeonButton
            label="🔄 RE-SCAN"
            onPress={requestWifiScan}
            variant="secondary-neutral"
            disabled={!connected || wifiPillState === 'Scanning...'}
          />
        </GlassCard>

        {/* 3. ADMIN / ADVANCED CARD */}
        <GlassCard
          title="Admin / Advanced"
          accent="green"
          pillLabel={adminUnlocked ? 'Unlocked' : 'Locked'}
          pillType={adminUnlocked ? 'live' : 'idle'}
        >
          {!adminUnlocked ? (
            // LOCKED STATE
            <View>
              <Text style={styles.noteText}>
                Unlock to edit the production-only fields used by the main firmware: device ID and wake interval.
              </Text>
              <Text style={styles.fieldLabel}>ADMIN PASSWORD</Text>
              <NeonInput
                placeholder="Admin Password"
                value={adminPassword}
                onChangeText={setAdminPassword}
                secureTextEntry={!isAdminPasswordVisible}
                disabled={!connected}
                rightElement={(isFocused) => (
                  <Pressable onPress={toggleAdminPasswordVisibility} disabled={!connected}>
                    {isAdminPasswordVisible ? (
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isFocused ? '#2D7A3A' : '#6B7D65'} strokeWidth="2">
                        <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <Line x1="1" y1="1" x2="23" y2="23" />
                      </Svg>
                    ) : (
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isFocused ? '#2D7A3A' : '#6B7D65'} strokeWidth="2">
                        <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <Circle cx="12" cy="12" r="3" />
                      </Svg>
                    )}
                  </Pressable>
                )}
              />
              <View style={styles.marginGap} />
              <NeonButton
                label="UNLOCK ADMIN"
                onPress={unlockAdmin}
                variant="admin-unlock"
                disabled={!connected}
              />
            </View>
          ) : (
            // UNLOCKED STATE (slide down)
            <Animated.View style={[styles.overflowHidden, adminFieldsStyle]}>
              <View style={styles.adminFieldsContainer}>
                <Text style={styles.fieldLabel}>DEVICE ID (001-999)</Text>
                <NeonInput
                  placeholder="001"
                  value={adminDeviceId}
                  onChangeText={setAdminDeviceId}
                  inputMode="numeric"
                  maxLength={3}
                />

                <View style={styles.marginGap} />

                <Text style={styles.fieldLabel}>WAKE INTERVAL (MINUTES)</Text>
                <NeonInput
                  placeholder="10"
                  value={adminWakeInterval}
                  onChangeText={setAdminWakeInterval}
                  inputMode="numeric"
                />

                <Text style={styles.tinyNoteText}>
                  The device stores wake interval in seconds. This screen edits it in minutes to match the old admin flow.
                </Text>

                <View style={styles.marginGap} />

                <NeonButton label="SAVE ADMIN" onPress={saveAdmin} variant="danger" />
              </View>
            </Animated.View>
          )}
        </GlassCard>

        {/* 4. PROTOCOL DISCOVERY CARD (hidden until connected) */}
        {isDiscoveryCardVisible && (
          <GlassCard
            title="Protocol Discovery"
            accent="sky"
            pillLabel={detectedProtocol !== '—' ? detectedProtocol : '—'}
            pillType="proto"
          >
            {/* 6a. Temperature Control Row */}
            <View style={styles.tempRowContainer}>
              <Text style={styles.tempRowLabel}>TEMP</Text>
              <View style={styles.tempAdjuster}>
                <NeonButton
                  label="−"
                  onPress={() => adjustTemp(-1)}
                  variant="adjuster"
                  disabled={!connected}
                  style={styles.adjustBtn}
                />
                <View style={styles.tempDisplayContainer}>
                  <Text style={styles.tempTextValue}>{testTemp}</Text>
                  <Text style={styles.tempTextUnit}>°C</Text>
                </View>
                <NeonButton
                  label="+"
                  onPress={() => adjustTemp(1)}
                  variant="adjuster"
                  disabled={!connected}
                  style={styles.adjustBtn}
                />
              </View>
            </View>

            {/* 6b. Active Variant Tag */}
            <Animated.View style={[styles.activeTagContainer, activeVariantTagStyle]}>
              <View style={styles.activeTagInner}>
                <View style={styles.activeTagDot} />
                <Text style={styles.activeTagText}>
                  {`Active variant: ${activeVariantName}`}
                </Text>
              </View>
            </Animated.View>

            {/* 6c. Suggested Protocols Section */}
            <View style={styles.sectionDivider} />
            <View style={styles.subHeaderRow}>
              <Text style={styles.subLabel}>SUGGESTED PROTOCOLS</Text>
              <Pill
                label={`${suggestedCandidates.length} candidate${
                  suggestedCandidates.length !== 1 ? 's' : ''
                }`}
                type="proto"
              />
            </View>

            {/* Candidate Warning Box */}
            {(suggestedCandidates.length === 0 || detectedProtocol === '—') && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  {detectedProtocol === '—'
                    ? '⚠️ No direct TX candidates for this protocol — use All Protocols below.'
                    : `⚠️ "${detectedProtocol}" not in lookup table — use All Protocols below.`}
                </Text>
              </View>
            )}

            <CustomDropdown
              options={lookupOptions}
              selectedValue={selectedLookupValue}
              onValueChange={setSelectedLookupValue}
              disabled={!connected || suggestedCandidates.length === 0}
            />

            {/* 6d. All Protocols Section */}
            <View style={styles.sectionDivider} />
            <View style={styles.subHeaderRow}>
              <Text style={styles.subLabel}>ALL PROTOCOLS</Text>
              <Pill label="69 VARIANTS (0–68)" type="proto" />
            </View>

            <CustomDropdown
              options={universalOptions}
              selectedValue={selectedUniversalValue}
              onValueChange={setSelectedUniversalValue}
              disabled={!connected}
            />

            {/* 6e. Shared Test Buttons */}
            <View style={styles.marginGap} />
            <View style={styles.testBtnRow}>
              <NeonButton
                label="TEST OFF"
                onPress={() => testSection('off')}
                variant="secondary-danger"
                disabled={testBtnDisabled}
                style={styles.flex1}
              />
              <View style={styles.horizontalGap} />
              <NeonButton
                label="TEST ON"
                onPress={() => testSection('on')}
                variant="secondary-success"
                disabled={testBtnDisabled}
                style={styles.flex1}
              />
              <View style={styles.horizontalGap} />
              <NeonButton
                label="SET TEMP"
                onPress={() => testSection('temp')}
                variant="secondary-info"
                disabled={testBtnDisabled}
                style={styles.flex1}
              />
            </View>

            {/* Learned mode notice */}
            {learnCtrlMode === 'LEARNED' && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  🔒 Protocol Discovery disabled — switch to Protocol mode to use these controls
                </Text>
              </View>
            )}

            {/* 6f. Find AC Receiver */}
            <View style={styles.sectionDivider} />
            <NeonButton
              label={findRxActive ? '⏹ STOP FIND RX' : '📡 FIND AC RECEIVER'}
              onPress={toggleFindRx}
              variant={findRxActive ? 'secondary-warn' : 'secondary-neutral'}
              disabled={!connected || learnCtrlMode === 'LEARNED'}
            />
            {findRxActive && (
              <Text style={styles.findRxHint}>
                ● Scanning — sweep blaster slowly across AC face
              </Text>
            )}
          </GlassCard>
        )}

        {/* 5. UNSUPPORTED AC SETUP / LEARN FALLBACK CARD */}
        <GlassCard
          title="Unsupported AC Setup"
          accent="green"
          pillLabel={learnCtrlMode === 'LEARNED' ? 'Learned' : 'Protocol'}
          pillType={learnCtrlMode === 'LEARNED' ? 'live' : 'proto'}
        >
          {/* 7a. Info Note Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxText}>
              Use this section only when the protocol library cannot control your AC. Learn each command from your original remote, then switch to Learned mode. Replays always use 38 kHz — carrier is not measured by the receiver.
            </Text>
          </View>

          {/* 7b. Control Mode Toggle Row */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>CONTROL</Text>
            <View style={styles.toggleButtons}>
              <NeonButton
                label="PROTOCOL (DEFAULT)"
                onPress={() => setLearnCtrlMode('PROTOCOL')}
                variant={learnCtrlMode === 'PROTOCOL' ? 'primary' : 'secondary-neutral'}
                disabled={!connected}
                style={styles.flex1}
              />
              <View style={styles.horizontalGap} />
              <NeonButton
                label="LEARNED FALLBACK"
                onPress={() => setLearnCtrlMode('LEARNED')}
                variant={learnCtrlMode === 'LEARNED' ? 'secondary-success' : 'secondary-neutral'}
                disabled={!connected || !learnSlotStates.every((s) => s === 'SAVED')}
                style={styles.flex1}
              />
            </View>
          </View>

          {/* 7c. Slot Grid */}
          <Text style={styles.legendText}>
            ● Empty (gray)  ● Captured (orange)  ● Saved (green)
          </Text>

          <View style={styles.slotGrid}>
            {Array(16)
              .fill(null)
              .map((_, i) => {
                const state = learnSlotStates[i];
                const isSelected = learnActiveSlot === i;
                const slotName = LEARN_SLOT_NAMES[i];

                let borderC = '#D8E0D2';
                let bgC = '#F7F9F5';
                let dotC = '#D8E0D2';

                if (state === 'CAPTURED') {
                  borderC = '#C17F24';
                  bgC = '#FDF3E3';
                  dotC = '#C17F24';
                } else if (state === 'SAVED') {
                  borderC = '#2D7A3A';
                  bgC = '#E8F5EA';
                  dotC = '#2D7A3A';
                }

                if (isSelected) {
                  borderC = '#4A90A4';
                }

                return (
                  <Pressable
                    key={i}
                    disabled={!connected}
                    onPress={() => learnSelectSlot(i)}
                    style={[
                      styles.gridCell,
                      { borderColor: borderC, backgroundColor: bgC },
                      !connected && { opacity: 0.38 },
                    ]}
                  >
                    <Text style={styles.slotNameText}>{slotName}</Text>
                    <View style={[styles.slotDot, { backgroundColor: dotC }]} />
                  </Pressable>
                );
              })}
          </View>

          {/* 7d. Workflow Status Line */}
          <View
            style={[
              styles.workflowStatusLine,
              learnStatusType === 'capturing' && styles.workflowStatusCapturing,
              learnStatusType === 'ok' && styles.workflowStatusOk,
              learnStatusType === 'err' && styles.workflowStatusErr,
            ]}
          >
            <Text
              style={[
                styles.workflowStatusText,
                learnStatusType === 'capturing' && { color: '#C17F24' },
                learnStatusType === 'ok' && { color: '#2D7A3A' },
                learnStatusType === 'err' && { color: '#C0392B' },
              ]}
            >
              {learnStatusMsg}
            </Text>
          </View>

          {/* 7e. Workflow Buttons */}
          <View style={styles.marginGap} />
          <View style={styles.testBtnRow}>
            <NeonButton
              label="📥 LEARN"
              onPress={learnBegin}
              variant="secondary-info"
              disabled={learnActiveSlot < 0 || !connected || learnSlotStates[learnActiveSlot] === 'SAVED'}
              style={styles.flex1}
            />
            <View style={styles.horizontalGap} />
            <NeonButton
              label="▶ TEST"
              onPress={learnReplay}
              variant="secondary-warn"
              disabled={learnActiveSlot < 0 || !connected || learnSlotStates[learnActiveSlot] !== 'CAPTURED'}
              style={styles.flex1}
            />
            <View style={styles.horizontalGap} />
            <NeonButton
              label="💾 SAVE"
              onPress={learnSave}
              variant="secondary-success"
              disabled={learnActiveSlot < 0 || !connected || learnSlotStates[learnActiveSlot] !== 'CAPTURED'}
              style={styles.flex1}
            />
            <View style={styles.horizontalGap} />
            <NeonButton
              label="✕ DISCARD"
              onPress={learnDiscard}
              variant="secondary-neutral"
              disabled={learnActiveSlot < 0 || !connected || learnSlotStates[learnActiveSlot] !== 'CAPTURED'}
              style={styles.flex1}
            />
          </View>

          <View style={styles.marginGap} />
          <View style={styles.testBtnRow}>
            <NeonButton
              label="🗑 DELETE"
              onPress={learnDelete}
              variant="danger"
              disabled={learnActiveSlot < 0 || !connected || learnSlotStates[learnActiveSlot] !== 'SAVED'}
              style={styles.flex1}
            />
            <View style={styles.horizontalGap} />
            <NeonButton
              label="DELETE ALL"
              onPress={learnDeleteAll}
              variant="danger"
              disabled={!connected || !learnSlotStates.some((s) => s !== 'EMPTY')}
              style={styles.flex1}
            />
          </View>

          {/* 7h. Find AC Receiver (Learned Mode) */}
          <View style={styles.sectionDivider} />
          <NeonButton
            label={findRxActive ? '⏹ STOP FIND RX' : '📡 FIND AC RECEIVER'}
            onPress={toggleFindRxLrn}
            variant={findRxActive ? 'secondary-warn' : 'secondary-neutral'}
            disabled={!connected || learnCtrlMode !== 'LEARNED'}
          />
          <Text style={styles.tinyNoteTextCenter}>Uses COOL 24 slot for scanning</Text>
        </GlassCard>

        {/* 6. DEBUG CARD */}
        <GlassCard title="Debug" accent="gray">
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabelWidth}>RAW OUT</Text>
            <View style={styles.toggleButtons}>
              <NeonButton
                label="ON"
                onPress={() => toggleRawOut('ON')}
                variant={rawOutMode === 'ON' ? 'secondary-success' : 'secondary-neutral'}
                disabled={!connected}
                style={styles.flex1}
              />
              <View style={styles.horizontalGap} />
              <NeonButton
                label="OFF"
                onPress={() => toggleRawOut('OFF')}
                variant={rawOutMode === 'OFF' ? 'secondary-danger' : 'secondary-neutral'}
                disabled={!connected}
                style={styles.flex1}
              />
            </View>
          </View>
        </GlassCard>

        {/* 7. MESSAGE LOG CARD */}
        <GlassCard
          title="Message Log"
          accent="sky"
          pillLabel="CLEAR"
          pillType="idle"
        >
          {/* Note: Instead of a generic clear button, we hijack the pillLabel and trigger action */}
          <View style={styles.logHeader}>
            <Pressable onPress={clearLog} style={styles.clearPressable}>
              <Text style={styles.clearText}>Tap card pill above to clear log</Text>
            </Pressable>
          </View>

          <View style={styles.logViewport}>
            <ScrollView
              style={styles.logScroll}
              ref={(ref) => ref?.scrollToEnd({ animated: true })}
            >
              {logList.map((log, i) => {
                let color = '#6B7D65'; // --muted
                let isItalic = false;

                if (log.type === 'rx') color = '#4A90A4'; // --sky
                else if (log.type === 'tx') color = '#2D7A3A'; // --green
                else if (log.type === 'err') color = '#C0392B'; // --red
                else if (log.type === 'sys') isItalic = true;

                return (
                  <Text key={i} style={styles.logLine}>
                    {log.timestamp && (
                      <Text style={styles.logTimestamp}>{`[${log.timestamp}] `}</Text>
                    )}
                    <Text style={{ color, fontStyle: isItalic ? 'italic' : 'normal' }}>
                      {log.msg}
                    </Text>
                  </Text>
                );
              })}
            </ScrollView>
          </View>

          {/* Manual Send Row */}
          <View style={styles.manualSendRow}>
            <NeonInput
              placeholder="Manual command (e.g. status)..."
              value={manualCommandInput}
              onChangeText={setManualCommandInput}
              onSubmitEditing={sendManual}
              disabled={!connected}
              containerStyle={styles.manualInput}
            />
            <View style={styles.horizontalGap} />
            <NeonButton
              label="SEND"
              onPress={sendManual}
              disabled={!connected || !manualCommandInput.trim()}
              style={styles.sendBtn}
            />
          </View>
        </GlassCard>

        {/* 8. SAVE CONFIGURATION CARD */}
        <GlassCard
          title="Save Configuration"
          accent="green"
          pillLabel={savePillState}
          pillType={savePillState === 'Saved ✅' || savePillState === 'Ready' ? 'live' : 'idle'}
        >
          {/* Checklist */}
          <CheckItem
            icon={wifiCheckIcon}
            label={wifiCheckLabel}
            state={wifiCheckState}
            shakeTrigger={wifiShakeTrigger}
          />
          <CheckItem
            icon={protoCheckIcon}
            label={protoCheckLabel}
            state={protoCheckState}
            shakeTrigger={protoShakeTrigger}
          />

          <View style={styles.marginGap} />

          {/* Save All Button */}
          <NeonButton
            label={saveButtonText}
            onPress={submitAll}
            variant={
              saveButtonState === 'success'
                ? 'success'
                : saveButtonState === 'saving'
                ? 'saving'
                : saveButtonState === 'disabled'
                ? 'secondary-neutral'
                : 'primary'
            }
            disabled={saveButtonState === 'disabled'}
            style={styles.saveBtnFull}
            textStyle={styles.saveBtnText}
          />
        </GlassCard>

        {/* 9. FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            IrTrace · ESP32-C5 · RX · BLE · Chrome only
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2EB',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#EEF2EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 58,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: '#D8E0D2',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  brandName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#1A2318',
  },
  versionLine: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 8.5,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guideBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D8E0D2',
    backgroundColor: '#F2F5F0',
    marginRight: 8,
  },
  guideBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#2D7A3A',
  },
  connectBtnWrapper: {
    height: 34,
  },
  connectBtnContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  connectBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F5B7B1',
    backgroundColor: '#FDECEA',
  },
  disconnectBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#C0392B',
  },
  btnPressed: {
    opacity: 0.7,
  },
  dotContainer: {
    width: 8,
    height: 8,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staticDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#C0392B',
    backgroundColor: 'transparent',
    position: 'absolute',
  },
  irGrid: {
    width: '100%',
  },
  irCellFull: {
    borderWidth: 1,
    borderColor: '#D8E0D2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  irRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  irCellHalf: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  verticalDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#D8E0D2',
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: '#D8E0D2',
    marginVertical: 4,
  },
  fieldLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#6B7D65', // --muted
    letterSpacing: 1.0,
    marginBottom: 4,
  },
  dataValue: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 20,
  },
  timestampText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: '#6B7D65',
    textAlign: 'right',
    marginBottom: 8,
  },
  noteText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#6B7D65',
    lineHeight: 1.6 * 13,
    marginBottom: 16,
  },
  tinyNoteText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#6B7D65',
    lineHeight: 15,
    marginTop: 4,
  },
  tinyNoteTextCenter: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#6B7D65',
    textAlign: 'center',
    marginTop: 6,
  },
  marginGap: {
    height: 12,
  },
  overflowHidden: {
    overflow: 'hidden',
  },
  tempRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F5F0',
    borderWidth: 1,
    borderColor: '#D8E0D2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  tempRowLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#6B7D65',
  },
  tempAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  adjustBtn: {
    width: 36,
    height: 36,
    marginVertical: 0,
  },
  tempDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    minWidth: 80,
  },
  tempTextValue: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 28,
    color: '#2D7A3A',
  },
  tempTextUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7D65',
    marginLeft: 2,
  },
  activeTagContainer: {
    overflow: 'hidden',
  },
  activeTagInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5EA',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeTagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2D7A3A',
    marginRight: 10,
  },
  activeTagText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#2D7A3A',
  },
  sectionDivider: {
    height: 1.5,
    backgroundColor: '#D8E0D2',
    marginVertical: 16,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#6B7D65',
    letterSpacing: 1.0,
  },
  warningBox: {
    backgroundColor: '#FDF3E3',
    borderWidth: 1.5,
    borderColor: '#F5CBA7',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  warningText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#C17F24',
    lineHeight: 16,
  },
  testBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  horizontalGap: {
    width: 8,
  },
  findRxHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#C17F24',
    textAlign: 'center',
    marginTop: 8,
  },
  infoBox: {
    backgroundColor: '#FDF3E3',
    borderWidth: 1.5,
    borderColor: '#F5CBA7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoBoxText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
    color: '#C17F24',
    lineHeight: 17,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  toggleLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#6B7D65',
    marginRight: 16,
  },
  toggleLabelWidth: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#6B7D65',
    width: 72,
  },
  toggleButtons: {
    flexDirection: 'row',
    flex: 1,
  },
  legendText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: '#6B7D65',
    textAlign: 'center',
    marginVertical: 12,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCell: {
    width: '23.5%',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginVertical: 4,
  },
  slotNameText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    color: '#1A2318',
  },
  slotDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginTop: 6,
  },
  workflowStatusLine: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#D8E0D2',
    borderRadius: 12,
    backgroundColor: '#F7F9F5',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 16,
  },
  workflowStatusCapturing: {
    borderColor: '#F5CBA7',
    backgroundColor: '#FDF3E3',
  },
  workflowStatusOk: {
    borderColor: '#A5D6A7',
    backgroundColor: '#E8F5EA',
  },
  workflowStatusErr: {
    borderColor: '#F5B7B1',
    backgroundColor: '#FDECEA',
  },
  workflowStatusText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#6B7D65',
    lineHeight: 16,
    textAlign: 'center',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
  },
  clearPressable: {
    paddingVertical: 2,
  },
  clearText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9.5,
    color: '#6B7D65',
  },
  logViewport: {
    height: 180,
    backgroundColor: '#FAFCF9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8E0D2',
    padding: 12,
  },
  logScroll: {
    flex: 1,
  },
  logLine: {
    marginVertical: 2,
    lineHeight: 16,
  },
  logTimestamp: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    color: '#A0ADB9',
  },
  manualSendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#D8E0D2',
    marginTop: 12,
    paddingTop: 12,
  },
  manualInput: {
    flex: 1,
  },
  sendBtn: {
    height: 48,
    justifyContent: 'center',
  },
  saveBtnFull: {
    marginVertical: 8,
  },
  saveBtnText: {
    fontSize: 13,
    paddingVertical: 4,
  },
  adminFieldsContainer: {
    backgroundColor: '#F2F5F0',
    borderWidth: 1,
    borderColor: '#D8E0D2',
    borderRadius: 10,
    padding: 14,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 48,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: '#6B7D65',
  },
});
