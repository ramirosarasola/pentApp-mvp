import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import BluetoothModuleClass from "react-native-bluetooth-classic/lib/BluetoothModule";

type BluetoothApi = InstanceType<typeof BluetoothModuleClass>;

/**
 * Devuelve el módulo nativo solo en builds con código nativo (no Expo Go ni web).
 */
export function getBluetoothModule(): BluetoothApi | null {
  if (Platform.OS === "web") {
    return null;
  }
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("react-native-bluetooth-classic").default as BluetoothApi;
  } catch {
    return null;
  }
}
