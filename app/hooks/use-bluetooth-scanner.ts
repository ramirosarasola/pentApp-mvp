import { setConnectedScannerDevice } from "@/app/services/scanner-connection";
import { ensureBluetoothPermissions } from "@/app/services/ensure-bluetooth-permissions";
import { getBluetoothModule } from "@/app/services/bluetooth-module";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import type { BluetoothDevice, BluetoothDeviceEvent, BluetoothNativeDevice } from "react-native-bluetooth-classic";

export type ScannerDeviceRow = {
  id: string;
  name: string;
  subtitle: string;
  bonded: boolean;
};

function mapToRow(native: Pick<BluetoothNativeDevice, "name" | "address" | "bonded">): ScannerDeviceRow {
  const bonded = Boolean(native.bonded);
  return {
    id: native.address,
    name: native.name?.trim() ? String(native.name) : native.address,
    subtitle: bonded ? "Vinculado" : "Bluetooth Classic",
    bonded,
  };
}

function mergeRows(prev: ScannerDeviceRow[], incoming: ScannerDeviceRow[]): ScannerDeviceRow[] {
  const map = new Map(prev.map((d) => [d.id, d]));
  incoming.forEach((r) => map.set(r.id, r));
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export function useBluetoothScanner() {
  const bt = useMemo(() => getBluetoothModule(), []);
  const [devices, setDevices] = useState<ScannerDeviceRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedId, setConnectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const discoverySubRef = useRef<{ remove: () => void } | null>(null);

  const mergeDiscovered = useCallback((native: BluetoothNativeDevice) => {
    const row = mapToRow(native);
    setDevices((prev) => mergeRows(prev, [row]));
  }, []);

  const loadBonded = useCallback(async () => {
    if (!bt) {
      return;
    }
    setError(null);
    try {
      const bonded = await bt.getBondedDevices();
      const rows = bonded.map((d: BluetoothDevice) => mapToRow(d));
      rows.forEach((r: ScannerDeviceRow) => {
        if (r.bonded) {
          r.subtitle = "Vinculado";
        }
      });
      setDevices((prev) => mergeRows(prev, rows));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los dispositivos emparejados.");
    }
  }, [bt]);

  useEffect(() => {
    void loadBonded();
  }, [loadBonded]);

  const startScan = useCallback(async () => {
    if (!bt) {
      setError("Bluetooth Classic requiere un development build (npx expo run:android). Expo Go no incluye este módulo nativo.");
      return;
    }
    setError(null);
    if (Platform.OS === "android") {
      const ok = await ensureBluetoothPermissions();
      if (!ok) {
        setError("Activa permisos de Bluetooth y ubicación para escanear dispositivos.");
        return;
      }
      const enabled = await bt.isBluetoothEnabled();
      if (!enabled) {
        await bt.requestBluetoothEnabled();
      }
      discoverySubRef.current?.remove();
      discoverySubRef.current = bt.onDeviceDiscovered((event: BluetoothDeviceEvent) => {
        mergeDiscovered(event.device);
      });
      setIsScanning(true);
      try {
        await bt.startDiscovery();
        await loadBonded();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error durante el escaneo.");
      } finally {
        setIsScanning(false);
        discoverySubRef.current?.remove();
        discoverySubRef.current = null;
      }
      return;
    }
    if (Platform.OS === "ios") {
      try {
        await loadBonded();
      } catch (err) {
        setError(err instanceof Error ? err.message : "En iOS solo aparecen accesorios compatibles emparejados (External Accessory).");
      }
    }
  }, [bt, loadBonded, mergeDiscovered]);

  const connectSelected = useCallback(async () => {
    if (!bt || !selectedId) {
      setError("Selecciona un dispositivo de la lista.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const device: BluetoothDevice = await bt.connectToDevice(selectedId, {
        connectorType: "rfcomm",
        connectionType: "delimited",
        delimiter: "\r",
        secureSocket: true,
      });
      setConnectedScannerDevice(device);
      setConnectedId(selectedId);
    } catch (err) {
      setConnectedScannerDevice(null);
      setConnectedId(null);
      setError(err instanceof Error ? err.message : "No se pudo abrir el socket SPP.");
    } finally {
      setIsConnecting(false);
    }
  }, [bt, selectedId]);

  const disconnectScanner = useCallback(async () => {
    if (!bt || !connectedId) {
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      await bt.disconnectFromDevice(connectedId);
      setConnectedScannerDevice(null);
      setConnectedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al desconectar.");
    } finally {
      setIsConnecting(false);
    }
  }, [bt, connectedId]);

  useEffect(() => {
    if (!bt) {
      return;
    }
    const sub = bt.onDeviceDisconnected((event: BluetoothDeviceEvent) => {
      const addr = event.device.address;
      setConnectedId((current) => {
        if (current === addr) {
          setConnectedScannerDevice(null);
          return null;
        }
        return current;
      });
    });
    return () => sub.remove();
  }, [bt]);

  useEffect(() => {
    return () => {
      discoverySubRef.current?.remove();
      void bt?.cancelDiscovery?.();
    };
  }, [bt]);

  return {
    isNativeAvailable: Boolean(bt),
    devices,
    selectedId,
    setSelectedId,
    isScanning,
    isConnecting,
    connectedId,
    error,
    refreshBonded: loadBonded,
    startScan,
    connectSelected,
    disconnectScanner,
  };
}
