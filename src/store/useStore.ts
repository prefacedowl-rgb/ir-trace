import { create } from 'zustand';
import { bleManager, requestBluetoothPermissions, isBleMock } from '../utils/bleManager';
import { base64Encode, base64Decode } from '../utils/base64';
import {
  SERVICE_UUID,
  TX_UUID,
  RX_UUID,
  PROTOCOL_LOOKUP,
  ALL_VARIANTS,
  LEARN_SLOT_NAMES,
  LEARN_NUM_SLOTS,
  Variant,
} from '../utils/constants';

interface LogEntry {
  timestamp: string;
  type: 'rx' | 'tx' | 'err' | 'sys';
  msg: string;
}

interface SaveTxn {
  mode: 'PROTOCOL' | 'LEARNED';
  pending: Set<string>;
  resolve: () => void;
  reject: (err: Error) => void;
  timer: any;
}

interface AppState {
  // BLE Connection State
  connected: boolean;
  isScanning: boolean;
  bleDevice: any | null;
  rxChar: any | null;
  firmwareVersion: string;
  statusStripState: 'default' | 'ok' | 'err' | 'warn';
  statusStripMsg: string;

  // IR Received Signal State
  irProtocol: string;
  irPower: string;
  irMode: string;
  irTempRx: string;
  irFan: string;
  irTimestamp: string;
  irCellPulsing: Record<string, boolean>;

  // Wi-Fi Config State
  wifiList: Array<{ ssid: string; rssi: string; sec: string }>;
  wifiPillState: 'Scan Ready' | 'Scanning...' | 'Scan Done' | 'No Networks';
  selectedWifiIndex: string; // "index", "manual", or "-1"
  manualSsid: string;
  wifiPassword: string;
  wifiReady: boolean;
  isWifiPasswordVisible: boolean;

  // Admin / Advanced State
  adminUnlocked: boolean;
  adminPassword: string;
  adminDeviceId: string;
  adminWakeInterval: string;
  isAdminPasswordVisible: boolean;

  // Protocol Discovery State
  detectedProtocol: string;
  testTemp: number;
  activeVariantId: number | null;
  activeVariantName: string;
  pendingTestVariant: { id: number; name: string } | null;
  suggestedCandidates: Array<[number, string]>;
  activeTestSection: 'lookup' | 'universal';
  selectedLookupValue: string;
  selectedUniversalValue: string;
  findRxActive: boolean;
  isDiscoveryCardVisible: boolean;

  // Unsupported AC Learn State
  learnSlotStates: Array<'EMPTY' | 'CAPTURED' | 'SAVED'>;
  learnCtrlMode: 'PROTOCOL' | 'LEARNED';
  learnActiveSlot: number;
  learnPendingCapture: boolean;
  learnStatusMsg: string;
  learnStatusType: '' | 'capturing' | 'ok' | 'err';

  // Debug State
  rawOutMode: 'ON' | 'OFF' | null;

  // Log State
  logList: Array<LogEntry>;
  manualCommandInput: string;

  // Save Config State
  savePillState: 'Pending' | 'Ready' | 'Saved ✅';
  saveButtonState: 'disabled' | 'enabled' | 'saving' | 'success';
  saveButtonText: string;
  wifiCheckState: 'empty' | 'ready' | 'missing';
  wifiCheckIcon: '○' | '✅' | '❌';
  wifiCheckLabel: string;
  protoCheckState: 'empty' | 'ready' | 'missing';
  protoCheckIcon: '○' | '✅' | '❌';
  protoCheckLabel: string;

  // Shake Triggers
  wifiShakeTrigger: number;
  protoShakeTrigger: number;

  // Actions
  addLog: (type: 'rx' | 'tx' | 'err' | 'sys', msg: string) => void;
  clearLog: () => void;
  setManualCommandInput: (val: string) => void;
  sendManual: () => void;

  setWifiPassword: (val: string) => void;
  setManualSsid: (val: string) => void;
  setSelectedWifiIndex: (val: string) => void;
  toggleWifiPasswordVisibility: () => void;
  requestWifiScan: () => Promise<void>;

  setAdminPassword: (val: string) => void;
  setAdminDeviceId: (val: string) => void;
  setAdminWakeInterval: (val: string) => void;
  toggleAdminPasswordVisibility: () => void;
  unlockAdmin: () => Promise<void>;
  saveAdmin: () => Promise<void>;

  adjustTemp: (delta: number) => void;
  setSelectedLookupValue: (val: string) => void;
  setSelectedUniversalValue: (val: string) => void;
  testSection: (action: 'off' | 'on' | 'temp') => Promise<void>;
  toggleFindRx: () => Promise<void>;
  toggleFindRxLrn: () => Promise<void>;

  setLearnCtrlMode: (mode: 'PROTOCOL' | 'LEARNED') => Promise<void>;
  learnSelectSlot: (i: number) => void;
  learnBegin: () => Promise<void>;
  learnReplay: () => Promise<void>;
  learnSave: () => Promise<void>;
  learnDiscard: () => Promise<void>;
  learnDelete: () => Promise<void>;
  learnDeleteAll: () => Promise<void>;

  toggleRawOut: (mode: 'ON' | 'OFF') => Promise<void>;
  submitAll: () => Promise<void>;

  showScanModal: boolean;
  scanResults: Array<{ id: string; name: string | null; rssi: number | null }>;

  connect: () => Promise<void>;
  disconnect: () => void;
  toggleConnect: () => Promise<void>;
  openScanModal: () => Promise<void>;
  closeScanModal: () => void;
  connectToScannedDevice: (deviceId: string) => Promise<void>;

  // Internal Logic
  onNotify: (raw: string) => void;
  sendCmd: (cmd: string) => Promise<boolean>;
  updateSaveChecklist: () => void;
  pulseCell: (cellKey: string) => void;
}

let saveTxn: SaveTxn | null = null;
let mockPulseInterval: any = null;
let mockCaptureTimeout: any = null;

export const useStore = create<AppState>((set, get) => {
  // Helper to trigger save txn success
  const completeSaveTransaction = () => {
    if (!saveTxn || saveTxn.pending.size > 0) return;
    clearTimeout(saveTxn.timer);
    const resolve = saveTxn.resolve;
    saveTxn = null;
    resolve();
  };

  // Helper to trigger save txn failure
  const failSaveTransaction = (reason: string) => {
    if (!saveTxn) return;
    clearTimeout(saveTxn.timer);
    const reject = saveTxn.reject;
    saveTxn = null;
    reject(new Error(reason));
  };

  // Helper to note ACKs
  const noteSaveAck = (key: string, val: string) => {
    if (!saveTxn) return;
    if (key === 'ERR') {
      failSaveTransaction(val || 'Firmware error');
      return;
    }
    if (key === 'WIFI' && val === 'OK') {
      saveTxn.pending.delete('WIFI');
    }
    if (key === 'SAVE' && val === 'OK') {
      saveTxn.pending.delete('SAVE');
    }
    if (key === 'LRN' && val === 'MODE:' + saveTxn.mode) {
      saveTxn.pending.delete('MODE');
    }
    completeSaveTransaction();
  };

  const beginSaveTransaction = (mode: 'PROTOCOL' | 'LEARNED'): Promise<void> => {
    if (saveTxn) {
      failSaveTransaction('Previous save interrupted');
    }
    const pending = new Set<string>();
    pending.add('WIFI');
    pending.add('MODE');
    if (mode === 'PROTOCOL') {
      pending.add('SAVE');
    }

    return new Promise<void>((resolve, reject) => {
      saveTxn = {
        mode,
        pending,
        resolve,
        reject,
        timer: setTimeout(() => {
          failSaveTransaction('Timed out waiting for firmware ACK');
        }, 10000),
      };
    });
  };

  const padUid = (raw: string): string => {
    const digits = String(raw).replace(/\D/g, '');
    let num = parseInt(digits || '1', 10);
    if (num < 1) num = 1;
    if (num > 999) num = 999;
    return String(num).padStart(3, '0');
  };

  const resetWifiUi = (pillText?: string) => {
    set({
      wifiList: [],
      wifiReady: false,
      selectedWifiIndex: '-1',
      manualSsid: '',
      wifiPillState: (pillText as any) || 'Scan Ready',
    });
    get().updateSaveChecklist();
  };

  const resetAdminUi = () => {
    set({
      adminPassword: '',
      adminDeviceId: '',
      adminWakeInterval: '',
      adminUnlocked: false,
    });
  };

  const setAdminUnlocked = (on: boolean) => {
    set({
      adminUnlocked: on,
    });
  };

  const resetConfirmedProtocol = () => {
    set({
      activeVariantId: null,
      activeVariantName: '',
      pendingTestVariant: null,
    });
  };

  const resetLearnUi = () => {
    set({
      learnPendingCapture: false,
      learnActiveSlot: -1,
      learnSlotStates: Array(LEARN_NUM_SLOTS).fill('EMPTY'),
      learnCtrlMode: 'PROTOCOL',
      learnStatusMsg: 'Connect to device to manage learned slots.',
      learnStatusType: '',
    });
    get().updateSaveChecklist();
  };

  const updateVersionLine = () => {
    // We let components dynamically check firmwareVersion
  };

  const applyLearnModeUi = (mode: 'PROTOCOL' | 'LEARNED') => {
    set({
      learnCtrlMode: mode,
    });
    get().updateSaveChecklist();
  };

  const updateTestButtons = () => {
    // Enable/disable computed dynamically in rendering
  };

  const setFindRxState = (on: boolean) => {
    set({
      findRxActive: on,
    });
  };

  return {
    // BLE Connection State
    connected: false,
    isScanning: false,
    bleDevice: null,
    rxChar: null,
    firmwareVersion: '',
    statusStripState: 'default',
    statusStripMsg: 'Disconnected — tap Connect to scan',

    // IR Received Signal State
    irProtocol: '—',
    irPower: '—',
    irMode: '—',
    irTempRx: '—',
    irFan: '—',
    irTimestamp: '',
    irCellPulsing: {},

    // Wi-Fi Config State
    wifiList: [],
    wifiPillState: 'Scan Ready',
    selectedWifiIndex: '-1',
    manualSsid: '',
    wifiPassword: '',
    wifiReady: false,
    isWifiPasswordVisible: false,

    // Admin / Advanced State
    adminUnlocked: false,
    adminPassword: '',
    adminDeviceId: '',
    adminWakeInterval: '',
    isAdminPasswordVisible: false,

    // Protocol Discovery State
    detectedProtocol: '—',
    testTemp: 24,
    activeVariantId: null,
    activeVariantName: '',
    pendingTestVariant: null,
    suggestedCandidates: [],
    activeTestSection: 'universal',
    selectedLookupValue: '-1',
    selectedUniversalValue: '-1',
    findRxActive: false,
    isDiscoveryCardVisible: false,

    // Unsupported AC Learn State
    learnSlotStates: Array(LEARN_NUM_SLOTS).fill('EMPTY'),
    learnCtrlMode: 'PROTOCOL',
    learnActiveSlot: -1,
    learnPendingCapture: false,
    learnStatusMsg: 'Connect to device to manage learned slots.',
    learnStatusType: '',

    // Debug State
    rawOutMode: null,

    // Log State
    logList: [{ timestamp: '', type: 'sys', msg: 'Log empty — connect to start.' }],
    manualCommandInput: '',

    // Save Config State
    savePillState: 'Pending',
    saveButtonState: 'disabled',
    saveButtonText: '💾 SAVE ALL — Configure Device',
    wifiCheckState: 'empty',
    wifiCheckIcon: '○',
    wifiCheckLabel: 'Wi-Fi network — not selected',
    protoCheckState: 'empty',
    protoCheckIcon: '○',
    protoCheckLabel: 'IR protocol — not tested yet',

    // Scan Modal State
    showScanModal: false,
    scanResults: [],

    // Shake triggers
    wifiShakeTrigger: 0,
    protoShakeTrigger: 0,

    // Actions
    addLog: (type, msg) => {
      const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
      set((state) => {
        let list = [...state.logList];
        if (list.length === 1 && list[0].msg === 'Log empty — connect to start.') {
          list = [];
        }
        list.push({ timestamp, type, msg });
        if (list.length > 300) {
          list.shift();
        }
        return { logList: list };
      });
    },

    clearLog: () => {
      set({
        logList: [{ timestamp: '', type: 'sys', msg: 'Log cleared.' }],
      });
    },

    setManualCommandInput: (val) => set({ manualCommandInput: val }),

    sendManual: async () => {
      const cmd = get().manualCommandInput.trim();
      if (!cmd) return;
      set({ manualCommandInput: '' });
      await get().sendCmd(cmd);
    },

    setWifiPassword: (val) => set({ wifiPassword: val }),
    setManualSsid: (val) => {
      set({ manualSsid: val });
      get().updateSaveChecklist();
    },
    setSelectedWifiIndex: (val) => {
      set({ selectedWifiIndex: val });
      get().updateSaveChecklist();
    },
    toggleWifiPasswordVisibility: () =>
      set((state) => ({ isWifiPasswordVisible: !state.isWifiPasswordVisible })),

    requestWifiScan: async () => {
      if (!get().connected) return;
      set({ wifiPillState: 'Scanning...' });
      await get().sendCmd('wscan');
    },

    setAdminPassword: (val) => set({ adminPassword: val }),
    setAdminDeviceId: (val) => set({ adminDeviceId: val }),
    setAdminWakeInterval: (val) => set({ adminWakeInterval: val }),
    toggleAdminPasswordVisibility: () =>
      set((state) => ({ isAdminPasswordVisible: !state.isAdminPasswordVisible })),

    unlockAdmin: async () => {
      const pass = get().adminPassword.trim();
      if (!pass) {
        get().addLog('err', 'Enter the admin password first');
        return;
      }
      await get().sendCmd(`ADMIN_AUTH:${pass}`);
    },

    saveAdmin: async () => {
      if (!get().adminUnlocked) {
        get().addLog('err', 'Admin section is locked');
        return;
      }
      const uid = padUid(get().adminDeviceId.trim());
      let wakeMin = parseInt(get().adminWakeInterval, 10);
      if (!Number.isFinite(wakeMin) || wakeMin < 1) wakeMin = 1;
      if (wakeMin > 600) wakeMin = 600;

      set({
        adminDeviceId: uid,
        adminWakeInterval: String(wakeMin),
      });

      get().addLog('sys', 'Saving admin settings...');
      await get().sendCmd(`ADMIN_SAVE:${uid}\n${wakeMin * 60}`);
    },

    adjustTemp: (delta) => {
      if (!get().connected) return;
      set((state) => {
        const next = Math.max(16, Math.min(30, state.testTemp + delta));
        return { testTemp: next };
      });
    },

    setSelectedLookupValue: (val) => {
      set({ selectedLookupValue: val, activeTestSection: 'lookup' });
      updateTestButtons();
    },

    setSelectedUniversalValue: (val) => {
      set({ selectedUniversalValue: val, activeTestSection: 'universal' });
      updateTestButtons();
    },

    testSection: async (action) => {
      const state = get();
      if (!state.connected || state.learnCtrlMode === 'LEARNED') return;

      const activeSection = state.activeTestSection;
      const selectedValue =
        activeSection === 'lookup' ? state.selectedLookupValue : state.selectedUniversalValue;
      const varId = parseInt(selectedValue, 10);

      if (varId === -1) {
        get().addLog('sys', 'RAW capture — coming in next firmware update');
        return;
      }

      let displayName = '';
      if (activeSection === 'lookup') {
        const option = state.suggestedCandidates.find(([id]) => id === varId);
        displayName = option ? option[1] : '';
      } else {
        const option = ALL_VARIANTS.find((v) => v.id === varId);
        displayName = option ? option.name : '';
      }

      let cmd = '';
      if (action === 'off') cmd = 'off';
      else if (action === 'on') cmd = `on ${state.testTemp}`;
      else if (action === 'temp') cmd = `t ${state.testTemp}`;

      const ok = await get().sendCmd(`v ${varId}`);
      if (!ok) return;

      set({ pendingTestVariant: { id: varId, name: displayName } });

      const okCmd = await get().sendCmd(cmd);
      if (!okCmd) {
        set({ pendingTestVariant: null });
        return;
      }

      get().addLog('sys', `Testing: ${displayName} — ${cmd}`);
    },

    toggleFindRx: async () => {
      const state = get();
      if (!state.connected) return;
      if (state.findRxActive) {
        await get().sendCmd('FIND_RX:OFF');
      } else {
        const activeSection = state.activeTestSection;
        const selectedValue =
          activeSection === 'lookup' ? state.selectedLookupValue : state.selectedUniversalValue;
        const varId = parseInt(selectedValue, 10);
        if (varId >= 0) {
          await get().sendCmd(`v ${varId}`);
        }
        await get().sendCmd('FIND_RX:ON');
      }
    },

    toggleFindRxLrn: async () => {
      const state = get();
      if (!state.connected || state.learnCtrlMode !== 'LEARNED') return;
      if (state.findRxActive) {
        await get().sendCmd('FIND_RX:OFF');
      } else {
        await get().sendCmd('FIND_RX:ON');
      }
    },

    setLearnCtrlMode: async (mode) => {
      if (!get().connected) return;
      if (mode === 'LEARNED') {
        const allSaved = get().learnSlotStates.every((s) => s === 'SAVED');
        if (!allSaved) {
          get().addLog('err', 'Save all 16 learned slots before enabling Learned Fallback');
          return;
        }
      }
      await get().sendCmd('LRN:MODE:' + mode);
    },

    learnSelectSlot: (i) => {
      if (!get().connected) return;
      set({ learnActiveSlot: i });
      const slotState = get().learnSlotStates[i];
      const slotName = LEARN_SLOT_NAMES[i];
      if (slotState === 'SAVED') {
        set({
          learnStatusMsg: `Slot ${slotName} already saved — press DELETE to re-learn.`,
          learnStatusType: 'ok',
        });
      } else if (slotState === 'CAPTURED') {
        set({
          learnStatusMsg: `Slot ${slotName} captured — press SAVE to store or DISCARD to retry.`,
          learnStatusType: 'ok',
        });
      } else {
        set({
          learnStatusMsg: `Slot ${slotName} selected — press LEARN to capture.`,
          learnStatusType: '',
        });
      }
    },

    learnBegin: async () => {
      const slot = get().learnActiveSlot;
      if (slot < 0) {
        get().addLog('err', 'Select a slot first');
        return;
      }
      await get().sendCmd(`LRN:BEGIN:${slot}`);
    },

    learnReplay: async () => {
      await get().sendCmd('LRN:REPLAY');
    },

    learnSave: async () => {
      await get().sendCmd('LRN:SAVE');
    },

    learnDiscard: async () => {
      await get().sendCmd('LRN:DISCARD');
    },

    learnDelete: async () => {
      const slot = get().learnActiveSlot;
      if (slot < 0) return;
      // Note: React Native custom confirm or simple alert. Alert.alert is native,
      // but let's send it in UI directly or just run since we don't have Alert yet.
      // We can use standard confirm dialog or write a custom logic. For RN, we'll
      // use simple trigger. We will handle the confirm dialog in the component.
      await get().sendCmd(`LRN:DELETE:${slot}`);
    },

    learnDeleteAll: async () => {
      await get().sendCmd('LRN:DELETE_ALL');
    },

    toggleRawOut: async (mode) => {
      await get().sendCmd(`RAW=${mode}`);
    },

    submitAll: async () => {
      if (!get().connected) return;

      const state = get();
      let hasError = false;

      if (!state.wifiReady) {
        set({
          wifiCheckState: 'missing',
          wifiCheckIcon: '❌',
          wifiShakeTrigger: state.wifiShakeTrigger + 1,
        });
        hasError = true;
      }

      const learnedReady =
        state.learnCtrlMode === 'LEARNED' && state.learnSlotStates.every((s) => s === 'SAVED');
      const protoReady =
        state.learnCtrlMode === 'LEARNED' ? learnedReady : state.activeVariantId !== null;

      if (!protoReady) {
        set({
          protoCheckState: 'missing',
          protoCheckIcon: '❌',
          protoShakeTrigger: state.protoShakeTrigger + 1,
        });
        hasError = true;
      }

      if (hasError) {
        get().addLog('err', 'Fill in all required fields before saving');
        return;
      }

      // Collect Wi-Fi info
      let ssid = '';
      if (state.selectedWifiIndex === 'manual') {
        ssid = state.manualSsid.trim();
      } else {
        const net = state.wifiList[parseInt(state.selectedWifiIndex, 10)];
        ssid = net ? net.ssid : '';
      }
      const pass = state.wifiPassword;
      const saveMode = state.learnCtrlMode;

      set({
        saveButtonState: 'saving',
        savePillState: 'Pending',
        saveButtonText: '⏳ Saving...',
      });

      const savePromise = beginSaveTransaction(saveMode);

      try {
        get().addLog('sys', 'Saving Wi-Fi credentials...');
        const okWifi = await get().sendCmd(`WIFI_SET:${ssid}\n${pass}`);
        if (!okWifi) throw new Error('Wi-Fi command send failed');

        if (saveMode === 'LEARNED') {
          get().addLog('sys', 'Using learned fallback slots for IR control...');
          const okLrn = await get().sendCmd('LRN:MODE:LEARNED');
          if (!okLrn) throw new Error('Learned mode command send failed');
        } else {
          get().addLog('sys', 'Saving protocol control mode and IR variant...');
          const okLrn = await get().sendCmd('LRN:MODE:PROTOCOL');
          if (!okLrn) throw new Error('Protocol mode command send failed');
          const okSave = await get().sendCmd('save');
          if (!okSave) throw new Error('Variant save command send failed');
        }

        await savePromise;

        get().addLog(
          'sys',
          saveMode === 'LEARNED'
            ? '✅ Device configured — WiFi + Learned Fallback ready'
            : '✅ Device configured — WiFi + Protocol saved'
        );

        set({
          savePillState: 'Saved ✅',
          saveButtonState: 'success',
          saveButtonText: '✅ Saved! Restarting device...',
        });

        get().addLog(
          'sys',
          'Sending restart command — device will reboot and begin normal operation.'
        );
        setTimeout(async () => {
          await get().sendCmd('restart');
        }, 1500);
      } catch (err: any) {
        failSaveTransaction(err.message || String(err));
        try {
          await savePromise;
        } catch (_) {}
        get().addLog('err', `Save failed: ${err.message || err}`);
        set({
          savePillState: 'Pending',
          saveButtonState: 'enabled',
          saveButtonText: '💾 SAVE ALL — Configure Device',
        });
        get().updateSaveChecklist();
      }
    },

    connect: async () => {
      set({
        statusStripState: 'warn',
        statusStripMsg: 'Scanning for IrTrace-BLE...',
        isScanning: true,
      });

      if (isBleMock) {
        setTimeout(() => {
          set({
            statusStripState: 'warn',
            statusStripMsg: 'Connecting (MOCK)...',
            isScanning: false,
          });
          setTimeout(() => {
            set({
              connected: true,
              bleDevice: { id: 'mock-device-id', name: 'IrTrace-BLE-MOCK' },
              rxChar: { writeWithResponse: async () => {} },
              statusStripState: 'ok',
              statusStripMsg: 'Connected to IrTrace-BLE-MOCK',
              isDiscoveryCardVisible: true,
            });
            get().addLog('sys', 'Connected to IrTrace-BLE-MOCK');

            // Reset checklist and sub-sections on connect
            resetConfirmedProtocol();
            resetWifiUi('Waiting for device scan...');
            resetAdminUi();
            setFindRxState(false);
            get().updateSaveChecklist();

            // Send initial commands with slight delays in mock mode
            setTimeout(() => {
              get().onNotify('FW:v@0.0.3');
              get().onNotify('VAR:5');
              get().onNotify('PWR:ON');
              get().onNotify('TEMP:24');
              get().onNotify('RPT:1');
              get().onNotify('RAW:OFF');
              get().onNotify('NET:0:MyHomeWifi:-45:Secured');
              get().onNotify('NET:1:OfficeGuest:-62:Secured');
              get().onNotify('NET:2:StarbucksOpen:-75:Open');
              get().onNotify('NET:3:SSID_With:Colon:-50:Secured');
              get().onNotify('NET:DONE');
              get().onNotify('LRN:STATUS');
            }, 300);
          }, 1000);
        }, 1500);
        return;
      }

      try {
        const hasPermissions = await requestBluetoothPermissions();
        if (!hasPermissions) {
          set({
            statusStripState: 'err',
            statusStripMsg: 'Bluetooth/Location permission denied',
            isScanning: false,
          });
          get().addLog('err', 'Bluetooth/Location permission denied');
          return;
        }

        let deviceFound = false;

        // Set a timeout to cancel scanning if no device is found
        const scanTimeout = setTimeout(() => {
          if (!deviceFound) {
            bleManager.stopDeviceScan();
            set({
              statusStripState: 'err',
              statusStripMsg: 'Scan timed out. No device found.',
              isScanning: false,
            });
            get().addLog('err', 'Scan timed out. No device found.');
          }
        }, 10000);

        bleManager.startDeviceScan([SERVICE_UUID], null, async (error, device) => {
          if (error) {
            clearTimeout(scanTimeout);
            set({
              statusStripState: 'err',
              statusStripMsg: `Scan error: ${error.message}`,
              isScanning: false,
            });
            get().addLog('err', `Scan error: ${error.message}`);
            return;
          }

          if (device) {
            deviceFound = true;
            clearTimeout(scanTimeout);
            bleManager.stopDeviceScan();
            set({ isScanning: false, statusStripMsg: 'Connecting...' });

            try {
              const connectedDevice = await bleManager.connectToDevice(device.id);
              await connectedDevice.discoverAllServicesAndCharacteristics();

              // Listen to disconnect events
              bleManager.onDeviceDisconnected(device.id, () => {
                get().disconnect();
              });

              // Discover RX / TX Characteristics
              const services = await connectedDevice.services();
              let txChar: any = null;
              let rxChar: any = null;

              for (const service of services) {
                if (service.uuid === SERVICE_UUID) {
                  const characteristics = await service.characteristics();
                  for (const char of characteristics) {
                    if (char.uuid === TX_UUID) txChar = char;
                    if (char.uuid === RX_UUID) rxChar = char;
                  }
                }
              }

              if (!txChar || !rxChar) {
                throw new Error('Required BLE characteristics not found');
              }

              // Start monitoring TX notifications
              connectedDevice.monitorCharacteristicForService(
                SERVICE_UUID,
                TX_UUID,
                (monitorError, char) => {
                  if (monitorError) {
                    get().addLog('err', `Notification error: ${monitorError.message}`);
                    return;
                  }
                  if (char?.value) {
                    const raw = base64Decode(char.value);
                    get().onNotify(raw);
                  }
                }
              );

              set({
                connected: true,
                bleDevice: device,
                rxChar: rxChar,
                statusStripState: 'ok',
                statusStripMsg: `Connected to ${device.name || 'IrTrace-BLE'}`,
                isDiscoveryCardVisible: true,
              });

              get().addLog('sys', `Connected to ${device.name || 'IrTrace-BLE'}`);

              // Reset checklist and sub-sections on connect
              resetConfirmedProtocol();
              resetWifiUi('Waiting for device scan...');
              resetAdminUi();
              setFindRxState(false);
              get().updateSaveChecklist();

              // Send initial commands
              await get().sendCmd('wget');
              await get().sendCmd('status');
              await get().sendCmd('LRN:STATUS');
            } catch (connErr: any) {
              set({
                statusStripState: 'err',
                statusStripMsg: `Failed: ${connErr.message}`,
              });
              get().addLog('err', connErr.message);
            }
          }
        });
      } catch (err: any) {
        set({
          statusStripState: 'err',
          statusStripMsg: `Failed: ${err.message}`,
        });
        get().addLog('err', err.message);
      }
    },

    disconnect: () => {
      const state = get();
      if (state.bleDevice && !isBleMock) {
        bleManager.cancelDeviceConnection(state.bleDevice.id).catch(() => {});
      }
      if (mockPulseInterval) {
        clearInterval(mockPulseInterval);
        mockPulseInterval = null;
      }
      if (mockCaptureTimeout) {
        clearTimeout(mockCaptureTimeout);
        mockCaptureTimeout = null;
      }
      failSaveTransaction('Disconnected');

      set({
        connected: false,
        bleDevice: null,
        rxChar: null,
        firmwareVersion: '',
        isDiscoveryCardVisible: false,
        statusStripState: 'default',
        statusStripMsg: 'Disconnected — tap Connect to reconnect',
      });

      resetConfirmedProtocol();
      resetWifiUi('Scan Ready');
      resetLearnUi();
      resetAdminUi();
      setFindRxState(false);
      get().updateSaveChecklist();

      // Reset save button state explicitly
      set({
        savePillState: 'Pending',
        saveButtonState: 'disabled',
        saveButtonText: '💾 SAVE ALL — Configure Device',
      });

      get().addLog('sys', 'Disconnected');
    },

    toggleConnect: async () => {
      if (get().connected) {
        get().disconnect();
      } else {
        await get().openScanModal();
      }
    },

    openScanModal: async () => {
      if (isBleMock) {
        set({ showScanModal: true, scanResults: [], isScanning: true });
        setTimeout(() => set(s => ({ scanResults: [...s.scanResults, { id: 'mock-1', name: 'IrTrace-BLE', rssi: -42 }] })), 600);
        setTimeout(() => set(s => ({ scanResults: [...s.scanResults, { id: 'mock-2', name: 'IrTrace-Kitchen', rssi: -67 }] })), 1100);
        setTimeout(() => set(s => ({ scanResults: [...s.scanResults, { id: 'mock-3', name: 'IrTrace-Office', rssi: -81 }] })), 1800);
        return;
      }

      try {
        const hasPermissions = await requestBluetoothPermissions();
        if (!hasPermissions) {
          set({ statusStripState: 'err', statusStripMsg: 'Bluetooth/Location permission denied' });
          get().addLog('err', 'Bluetooth/Location permission denied');
          return;
        }
        set({ showScanModal: true, scanResults: [], isScanning: true });
        bleManager.startDeviceScan([SERVICE_UUID], null, (error, device) => {
          if (error) {
            set({ isScanning: false });
            return;
          }
          if (device) {
            set(s => {
              if (s.scanResults.find(d => d.id === device.id)) return s;
              return { scanResults: [...s.scanResults, { id: device.id, name: device.name, rssi: device.rssi }] };
            });
          }
        });
      } catch (err: any) {
        set({ statusStripState: 'err', statusStripMsg: `Failed: ${err.message}` });
        get().addLog('err', err.message);
      }
    },

    closeScanModal: () => {
      if (!isBleMock) bleManager.stopDeviceScan();
      set({ showScanModal: false, scanResults: [], isScanning: false });
    },

    connectToScannedDevice: async (deviceId: string) => {
      if (!isBleMock) bleManager.stopDeviceScan();
      set({ isScanning: false, showScanModal: false, statusStripState: 'warn', statusStripMsg: 'Connecting...' });

      if (isBleMock) {
        const mockName = get().scanResults.find(d => d.id === deviceId)?.name ?? 'IrTrace-BLE-MOCK';
        setTimeout(() => {
          set({
            connected: true,
            bleDevice: { id: deviceId, name: mockName },
            rxChar: { writeWithResponse: async () => {} },
            statusStripState: 'ok',
            statusStripMsg: `Connected to ${mockName}`,
            isDiscoveryCardVisible: true,
            scanResults: [],
          });
          get().addLog('sys', `Connected to ${mockName}`);
          resetConfirmedProtocol();
          resetWifiUi('Waiting for device scan...');
          resetAdminUi();
          setFindRxState(false);
          get().updateSaveChecklist();
          setTimeout(() => {
            get().onNotify('FW:v@0.0.3');
            get().onNotify('VAR:5');
            get().onNotify('PWR:ON');
            get().onNotify('TEMP:24');
            get().onNotify('RPT:1');
            get().onNotify('RAW:OFF');
            get().onNotify('NET:0:MyHomeWifi:-45:Secured');
            get().onNotify('NET:1:OfficeGuest:-62:Secured');
            get().onNotify('NET:DONE');
            get().onNotify('LRN:STATUS');
          }, 300);
        }, 800);
        return;
      }

      try {
        const connectedDevice = await bleManager.connectToDevice(deviceId);
        await connectedDevice.discoverAllServicesAndCharacteristics();

        bleManager.onDeviceDisconnected(deviceId, () => { get().disconnect(); });

        const services = await connectedDevice.services();
        let txChar: any = null;
        let rxChar: any = null;

        for (const service of services) {
          if (service.uuid === SERVICE_UUID) {
            const characteristics = await service.characteristics();
            for (const char of characteristics) {
              if (char.uuid === TX_UUID) txChar = char;
              if (char.uuid === RX_UUID) rxChar = char;
            }
          }
        }

        if (!txChar || !rxChar) throw new Error('Required BLE characteristics not found');

        connectedDevice.monitorCharacteristicForService(SERVICE_UUID, TX_UUID, (monitorError, char) => {
          if (monitorError) { get().addLog('err', `Notification error: ${monitorError.message}`); return; }
          if (char?.value) get().onNotify(base64Decode(char.value));
        });

        set({
          connected: true,
          bleDevice: connectedDevice,
          rxChar,
          statusStripState: 'ok',
          statusStripMsg: `Connected to ${connectedDevice.name || 'IrTrace-BLE'}`,
          isDiscoveryCardVisible: true,
          scanResults: [],
        });

        get().addLog('sys', `Connected to ${connectedDevice.name || 'IrTrace-BLE'}`);
        resetConfirmedProtocol();
        resetWifiUi('Waiting for device scan...');
        resetAdminUi();
        setFindRxState(false);
        get().updateSaveChecklist();

        await get().sendCmd('wget');
        await get().sendCmd('status');
        await get().sendCmd('LRN:STATUS');
      } catch (connErr: any) {
        set({ statusStripState: 'err', statusStripMsg: `Failed: ${connErr.message}` });
        get().addLog('err', connErr.message);
      }
    },

    // Internal Logic
    onNotify: (raw) => {
      const msg = raw.trim();
      if (!msg) return;
      get().addLog('rx', msg);

      const ci = msg.indexOf(':');
      if (ci === -1) return;
      const key = msg.substring(0, ci).toUpperCase();
      const val = msg.substring(ci + 1).trim();

      noteSaveAck(key, val); // Process save transaction ACK

      switch (key) {
        case 'FW':
          set({ firmwareVersion: val });
          break;
        case 'VAR': {
          const id = parseInt(val, 10);
          if (Number.isFinite(id)) {
            set({ selectedUniversalValue: String(id) });
            // Sync with active protocol
            const activeVar = ALL_VARIANTS.find((v) => v.id === id);
            if (activeVar) {
              set({
                activeVariantId: id,
                activeVariantName: activeVar.name,
              });
            }
          }
          break;
        }
        case 'PWR':
          get().addLog('sys', `TX power state: ${val}`);
          break;
        case 'TEMP': {
          const temp = parseInt(val, 10);
          if (Number.isFinite(temp)) {
            set({ testTemp: Math.max(16, Math.min(30, temp)) });
          }
          break;
        }
        case 'RPT':
          get().addLog('sys', `TX repeat: ${val}`);
          break;
        case 'TX':
          if (val === 'OK') {
            // Confirm pending protocol test
            const pending = get().pendingTestVariant;
            if (pending) {
              set({
                activeVariantId: pending.id,
                activeVariantName: pending.name,
                pendingTestVariant: null,
              });
              get().addLog('sys', `Protocol confirmed: ${pending.name}`);
              get().updateSaveChecklist();
            }
          }
          break;
        case 'PROTOCOL': {
          // Strip repeat suffix e.g. "MITSUBISHI112 (Repeat)" -> "MITSUBISHI112"
          const proto = val.replace(/\s*\(.*\)/, '').trim().toUpperCase();
          get().pulseCell('protocol');
          set({ detectedProtocol: val, isDiscoveryCardVisible: true });

          // Populate lookup candidates
          const candidates = PROTOCOL_LOOKUP[proto] || [];
          set({ suggestedCandidates: candidates });

          if (candidates.length > 0) {
            set({
              selectedLookupValue: String(candidates[0][0]),
              activeTestSection: 'lookup',
            });
          } else {
            set({
              selectedLookupValue: '-1',
              activeTestSection: 'universal',
            });
          }
          updateTestButtons();
          break;
        }
        case 'POWER':
          get().pulseCell('power');
          set({ irPower: val });
          break;
        case 'MODE':
          get().pulseCell('mode');
          set({ irMode: val });
          break;
        case 'TEMP_RX':
          get().pulseCell('tempRx');
          set({ irTempRx: val });
          break;
        case 'FAN':
          get().pulseCell('fan');
          set({ irFan: val });
          break;
        case 'RAW':
          set({ rawOutMode: val === 'ON' ? 'ON' : 'OFF' });
          break;
        case 'NET': {
          if (val === 'NONE') {
            set({ wifiList: [], wifiPillState: 'No Networks' });
            get().setSelectedWifiIndex('-1');
            return;
          }
          if (val === 'DONE') {
            set({ wifiPillState: 'Scan Done' });
            get().updateSaveChecklist();
            return;
          }
          // Parsing SSID with colons from right side
          const parts = val.split(':');
          if (parts.length < 4) return;

          const idx = parseInt(parts[0], 10);
          const sec = parts[parts.length - 1];
          const rssi = parts[parts.length - 2];
          const ssid = parts.slice(1, parts.length - 2).join(':');

          set((state) => {
            let list = [...state.wifiList];
            if (idx === 0) {
              list = [];
            }
            if (!list.find((n) => n.ssid === ssid)) {
              list.push({ ssid, rssi, sec });
            }
            return { wifiList: list };
          });
          break;
        }
        case 'WIFI':
          if (val === 'OK') {
            get().addLog('sys', '✅ Wi-Fi credentials saved on device');
          }
          break;
        case 'SAVE':
          if (val === 'OK') {
            get().addLog('sys', '✅ Protocol variant saved on device');
          }
          break;
        case 'ADMIN':
          if (val === 'AUTH_OK') {
            setAdminUnlocked(true);
            get().addLog('sys', 'Admin section unlocked');
            get().sendCmd('ADMIN_GET');
          } else if (val === 'AUTH_FAIL') {
            setAdminUnlocked(false);
            get().addLog('err', 'Admin password rejected');
          } else if (val === 'LOCKED') {
            setAdminUnlocked(false);
            get().addLog('err', 'Admin section is locked');
          } else if (val === 'SAVED') {
            get().addLog('sys', '✅ Admin settings saved on device');
          }
          break;
        case 'ADM_UID':
          setAdminUnlocked(true);
          set({ adminDeviceId: padUid(val) });
          break;
        case 'ADM_WAKE': {
          setAdminUnlocked(true);
          const seconds = parseInt(val, 10);
          if (Number.isFinite(seconds) && seconds > 0) {
            set({ adminWakeInterval: String(Math.max(1, Math.round(seconds / 60))) });
          }
          break;
        }
        case 'FIND_RX':
          if (val === 'ON') setFindRxState(true);
          else if (val === 'OFF') setFindRxState(false);
          else if (val === 'PULSE') {
            // Pulse logic for Find RX button - flashing pulse
          }
          break;
        case 'ERR':
          set({ pendingTestVariant: null });
          get().addLog('err', val);
          break;
        case 'LRN': {
          const lrnParts = val.split(':');
          const sub = lrnParts[0].toUpperCase();
          switch (sub) {
            case 'MODE':
              applyLearnModeUi((lrnParts[1] || 'PROTOCOL') as any);
              break;
            case 'SLOT': {
              const slotIdx = parseInt(lrnParts[1], 10);
              const slotState = (lrnParts[2] || 'EMPTY').toUpperCase() as any;
              if (slotIdx >= 0 && slotIdx < LEARN_NUM_SLOTS) {
                set((state) => {
                  const slots = [...state.learnSlotStates];
                  slots[slotIdx] = slotState;
                  return { learnSlotStates: slots };
                });
                get().updateSaveChecklist();
              }
              break;
            }
            case 'ACTIVE': {
              const activeSlotIdx = parseInt(lrnParts[1], 10);
              set({ learnActiveSlot: activeSlotIdx >= 0 ? activeSlotIdx : -1 });
              break;
            }
            case 'WAIT': {
              set({ learnPendingCapture: true });
              const label = lrnParts[1] || '?';
              set({
                learnStatusMsg: `Point remote at sensor and press the button for ${label}…`,
                learnStatusType: 'capturing',
              });
              break;
            }
            case 'CAPTURED': {
              set({ learnPendingCapture: false });
              const idx = parseInt(lrnParts[1], 10);
              set({
                learnStatusMsg: `Captured slot ${LEARN_SLOT_NAMES[idx]} — press TEST to verify, then SAVE.`,
                learnStatusType: 'ok',
              });
              break;
            }
            case 'LEN':
              get().addLog('sys', `Learn: ${lrnParts[1]} mark/space pairs captured`);
              break;
            case 'REPLAYED':
              set({
                learnStatusMsg: 'Test replay sent — did the AC respond? If yes, press SAVE.',
                learnStatusType: 'ok',
              });
              break;
            case 'SAVED': {
              const idx = parseInt(lrnParts[1], 10);
              set({
                learnStatusMsg: `Slot ${LEARN_SLOT_NAMES[idx]} saved to device storage.`,
                learnStatusType: 'ok',
              });
              break;
            }
            case 'DISCARDED':
              set({
                learnPendingCapture: false,
                learnStatusMsg:
                  'Capture discarded. Previously saved data (if any) is unchanged.',
                learnStatusType: '',
              });
              break;
            case 'DELETED_ALL':
              set({
                learnPendingCapture: false,
                learnActiveSlot: -1,
                learnSlotStates: Array(LEARN_NUM_SLOTS).fill('EMPTY'),
                learnStatusMsg: 'All learned slots deleted. Ready for fresh learning.',
                learnStatusType: 'ok',
              });
              get().updateSaveChecklist();
              break;
            default:
              get().addLog('rx', `LRN:${val}`);
          }
          break;
        }
      }
    },

    sendCmd: async (cmd) => {
      const state = get();
      if (!state.connected) {
        get().addLog('err', 'Not connected');
        return false;
      }

      if (isBleMock) {
        get().addLog('tx', cmd);

        // Simulate responses
        setTimeout(() => {
          if (cmd === 'wscan') {
            get().onNotify('NET:0:MyHomeWifi:-45:Secured');
            get().onNotify('NET:1:OfficeGuest:-62:Secured');
            get().onNotify('NET:2:StarbucksOpen:-75:Open');
            get().onNotify('NET:3:SSID_With:Colon:-50:Secured');
            get().onNotify('NET:DONE');
          } else if (cmd.startsWith('ADMIN_AUTH:')) {
            const pass = cmd.split(':')[1];
            if (pass) {
              get().onNotify('ADMIN:AUTH_OK');
              get().onNotify('ADM_UID:042');
              get().onNotify('ADM_WAKE:600');
            } else {
              get().onNotify('ADMIN:AUTH_FAIL');
            }
          } else if (cmd.startsWith('ADMIN_SAVE:')) {
            const parts = cmd.split('\n');
            const uid = parts[0].split(':')[1];
            const seconds = parseInt(parts[1], 10);
            get().onNotify('ADMIN:SAVED');
            get().onNotify(`ADM_UID:${uid}`);
            get().onNotify(`ADM_WAKE:${seconds}`);
          } else if (cmd === 'save') {
            get().onNotify('SAVE:OK');
          } else if (cmd.startsWith('WIFI_SET:')) {
            get().onNotify('WIFI:OK');
          } else if (cmd.startsWith('LRN:MODE:')) {
            const mode = cmd.split(':')[2];
            get().onNotify(`LRN:MODE:${mode}`);
          } else if (cmd.startsWith('LRN:BEGIN:')) {
            const slot = parseInt(cmd.split(':')[2], 10);
            get().onNotify(`LRN:ACTIVE:${slot}`);
            get().onNotify(`LRN:WAIT:${LEARN_SLOT_NAMES[slot]}`);

            if (mockCaptureTimeout) clearTimeout(mockCaptureTimeout);
            mockCaptureTimeout = setTimeout(() => {
              get().onNotify(`LRN:CAPTURED:${slot}`);
            }, 3000);
          } else if (cmd === 'LRN:REPLAY') {
            get().onNotify('LRN:REPLAYED');
          } else if (cmd === 'LRN:SAVE') {
            const activeSlot = get().learnActiveSlot;
            get().onNotify(`LRN:SAVED:${activeSlot}`);
            get().onNotify(`LRN:SLOT:${activeSlot}:SAVED`);
            get().onNotify(`LRN:ACTIVE:-1`);
          } else if (cmd === 'LRN:DISCARD') {
            get().onNotify('LRN:DISCARDED');
            get().onNotify(`LRN:ACTIVE:-1`);
          } else if (cmd.startsWith('LRN:DELETE:')) {
            const slot = parseInt(cmd.split(':')[2], 10);
            get().onNotify(`LRN:SLOT:${slot}:EMPTY`);
            get().onNotify(`LRN:ACTIVE:-1`);
          } else if (cmd === 'LRN:DELETE_ALL') {
            get().onNotify('LRN:DELETED_ALL');
          } else if (cmd === 'FIND_RX:ON') {
            get().onNotify('FIND_RX:ON');
            if (mockPulseInterval) clearInterval(mockPulseInterval);
            mockPulseInterval = setInterval(() => {
              get().onNotify('FIND_RX:PULSE');
            }, 2000);
          } else if (cmd === 'FIND_RX:OFF') {
            get().onNotify('FIND_RX:OFF');
            if (mockPulseInterval) {
              clearInterval(mockPulseInterval);
              mockPulseInterval = null;
            }
          } else if (cmd.startsWith('RAW=')) {
            const val = cmd.split('=')[1];
            get().onNotify(`RAW:${val}`);
          } else if (cmd.startsWith('v ')) {
            const id = cmd.split(' ')[1];
            get().onNotify(`VAR:${id}`);
          } else if (cmd === 'off' || cmd.startsWith('on ') || cmd.startsWith('t ')) {
            get().onNotify('TX:OK');
          } else if (cmd === 'status') {
            get().onNotify('FW:v@0.0.3');
            get().onNotify('VAR:5');
            get().onNotify('PWR:ON');
            get().onNotify('TEMP:24');
            get().onNotify('RPT:1');
            get().onNotify('RAW:OFF');
          } else if (cmd === 'LRN:STATUS') {
            get().onNotify('LRN:MODE:PROTOCOL');
            for (let i = 0; i < 16; i++) {
              get().onNotify(`LRN:SLOT:${i}:${get().learnSlotStates[i]}`);
            }
          }
        }, 300);

        return true;
      }

      if (!state.rxChar) {
        get().addLog('err', 'Not connected');
        return false;
      }
      try {
        const b64 = base64Encode(cmd);
        // writeCharacteristicWithResponseForDevice:
        await state.rxChar.writeWithResponse(b64);
        get().addLog('tx', cmd);
        return true;
      } catch (err: any) {
        get().addLog('err', `Send failed: ${err.message}`);
        return false;
      }
    },

    updateSaveChecklist: () => {
      const state = get();

      // Check Wi-Fi readiness
      let ssid = '';
      if (state.selectedWifiIndex === 'manual') {
        ssid = state.manualSsid.trim();
      } else if (parseInt(state.selectedWifiIndex, 10) >= 0 && state.wifiList.length > 0) {
        const net = state.wifiList[parseInt(state.selectedWifiIndex, 10)];
        ssid = net ? net.ssid : '';
      }
      const wifiReady = ssid.length > 0;

      // Check Protocol readiness
      const learnedReady =
        state.learnCtrlMode === 'LEARNED' && state.learnSlotStates.every((s) => s === 'SAVED');
      const protoReady =
        state.learnCtrlMode === 'LEARNED' ? learnedReady : state.activeVariantId !== null;

      // Update Wi-Fi check item fields
      const wifiCheckState = wifiReady ? 'ready' : ('empty' as any);
      const wifiCheckIcon = wifiReady ? '✅' : '○';
      const wifiCheckLabel = wifiReady ? `Wi-Fi: ${ssid}` : 'Wi-Fi network — not selected';

      // Update Protocol check item fields
      const protoCheckState = protoReady ? 'ready' : ('empty' as any);
      const protoCheckIcon = protoReady ? '✅' : '○';

      let protoCheckLabel = 'IR protocol — not tested yet';
      if (state.learnCtrlMode === 'LEARNED') {
        const savedCount = state.learnSlotStates.filter((s) => s === 'SAVED').length;
        protoCheckLabel = learnedReady
          ? `IR: Learned Fallback (${savedCount}/${LEARN_NUM_SLOTS} slots saved)`
          : `IR learned slots — ${savedCount}/${LEARN_NUM_SLOTS} saved`;
      } else {
        protoCheckLabel = protoReady
          ? `Protocol: ${state.activeVariantName}`
          : 'IR protocol — not tested yet';
      }

      const allReady = wifiReady && protoReady;

      set({
        wifiReady,
        wifiCheckState,
        wifiCheckIcon,
        wifiCheckLabel,
        protoCheckState,
        protoCheckIcon,
        protoCheckLabel,
        savePillState: allReady ? 'Ready' : 'Pending',
        saveButtonState: allReady ? 'enabled' : 'disabled',
      });
    },

    pulseCell: (cellKey) => {
      set((state) => {
        const pulsing = { ...state.irCellPulsing, [cellKey]: true };
        return { irCellPulsing: pulsing };
      });
      setTimeout(() => {
        set((state) => {
          const pulsing = { ...state.irCellPulsing, [cellKey]: false };
          return { irCellPulsing: pulsing };
        });
      }, 500);
    },
  };
});
