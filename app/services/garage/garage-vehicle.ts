export interface GarageVehicle {
  readonly id: string;
  readonly plate: string;
  readonly vin: string | null;
  readonly label: string | null;
  readonly isPrimary: boolean;
  readonly createdAt: string;
}
