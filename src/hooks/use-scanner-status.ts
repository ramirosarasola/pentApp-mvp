import { isScannerConnected, subscribeToScannerConnection } from "@/src/services/scanner-connection";
import { useEffect, useState } from "react";

/**
 * Devuelve `true` cuando hay un escáner BT conectado.
 * Se actualiza reactivamente sin necesidad de pasar props.
 */
export function useScannerStatus(): boolean {
  const [isConnected, setIsConnected] = useState(isScannerConnected);
  useEffect(() => {
    return subscribeToScannerConnection(setIsConnected);
  }, []);
  return isConnected;
}
