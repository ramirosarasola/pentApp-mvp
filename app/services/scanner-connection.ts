import type { BluetoothDevice } from "react-native-bluetooth-classic";

let connectedDevice: BluetoothDevice | null = null;

export function setConnectedScannerDevice(device: BluetoothDevice | null): void {
  connectedDevice = device;
}

export function getConnectedScannerDevice(): BluetoothDevice | null {
  return connectedDevice;
}
