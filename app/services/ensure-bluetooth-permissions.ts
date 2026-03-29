import { PermissionsAndroid, Platform } from "react-native";

/**
 * Solicita permisos necesarios para escanear y conectar Bluetooth Classic (SPP) en Android 12+.
 */
export async function ensureBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return true;
  }
  const sdk = typeof Platform.Version === "number" ? Platform.Version : parseInt(String(Platform.Version), 10);
  const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  if (!fine) {
    return false;
  }
  if (sdk >= 31) {
    const scan = PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN;
    const connect = PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT;
    if (!scan || !connect) {
      const single = await PermissionsAndroid.request(fine);
      return single === PermissionsAndroid.RESULTS.GRANTED;
    }
    const result = await PermissionsAndroid.requestMultiple([scan, connect, fine]);
    return Object.values(result).every((status) => status === PermissionsAndroid.RESULTS.GRANTED);
  }
  const location = await PermissionsAndroid.request(fine);
  return location === PermissionsAndroid.RESULTS.GRANTED;
}
