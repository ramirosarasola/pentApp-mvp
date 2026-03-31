import type { GarageVehicle } from "@/src/services/garage/garage-vehicle";

export interface GarageVehiclesResponse {
  readonly items: GarageVehicle[];
}
