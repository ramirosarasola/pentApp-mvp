import Assistant from "@/assets/icons/ai-assistant.svg";
import Garage from "@/assets/icons/cars.svg";
import FleetHealth from "@/assets/icons/fleet-health.png";
import Home from "@/assets/icons/home.svg";
import Connect from "@/assets/icons/plug-connection.svg";

import ConnectionBle from "@/assets/icons/connection-ble.png";
import ConnectionPhone from "@/assets/icons/connection-phone.png";
import ConnectionScanner from "@/assets/icons/connection-scanner.png";

export const TabIcons = {
  home: Home,
  garage: Garage,
  connect: Connect,
  assistant: Assistant,
} as const;

export const Icons = {
  fleetHealth: FleetHealth,
  connectionPhone: ConnectionPhone,
  connectionBle: ConnectionBle,
  connectionScanner: ConnectionScanner,
} as const;
