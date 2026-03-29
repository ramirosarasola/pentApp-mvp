import type { GarageVehicle } from "@/app/services/garage/garage-vehicle";

export interface GarageVehiclesResponse {
  readonly items: GarageVehicle[];
}
