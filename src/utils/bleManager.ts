import { BleManager } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';

let manager: BleManager | null = null;
let mock = false;

try {
  manager = new BleManager();
} catch (e) {
  console.warn('BleManager native module is not available. Mock BLE mode activated.');
  mock = true;
}

export const bleManager = manager as BleManager;
export const isBleMock = mock;

export async function requestBluetoothPermissions(): Promise<boolean> {
  if (mock) {
    return true; // Mock mode: permissions are auto-granted
  }
  if (Platform.OS === 'ios') {
    return true;
  }
  if (Platform.OS === 'android') {
    const apiLevel = Platform.Version;
    if (typeof apiLevel === 'number' && apiLevel < 31) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return (
        result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
        result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
        result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
      );
    }
  }
  return false;
}
