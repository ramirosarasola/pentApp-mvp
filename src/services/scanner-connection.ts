import type { BluetoothDevice } from "react-native-bluetooth-classic";

type ConnectionListener = (isConnected: boolean) => void;

let connectedDevice: BluetoothDevice | null = null;
const listeners = new Set<ConnectionListener>();

export function setConnectedScannerDevice(device: BluetoothDevice | null): void {
  connectedDevice = device;
  listeners.forEach((fn) => fn(device !== null));
}

export function getConnectedScannerDevice(): BluetoothDevice | null {
  return connectedDevice;
}

export function isScannerConnected(): boolean {
  return connectedDevice !== null;
}

export function subscribeToScannerConnection(listener: ConnectionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
