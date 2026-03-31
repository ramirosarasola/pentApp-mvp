import { HttpClient } from "@/src/services/api/http-client";
import type { GarageVehicle } from "@/src/services/garage/garage-vehicle";
import type { GarageVehiclesResponse } from "@/src/services/garage/garage-vehicles-response";

interface CreateGarageVehicleInput {
  readonly plate: string;
  readonly vin?: string;
  readonly label?: string;
}

interface UpdateGarageVehicleVinInput {
  readonly vehicleId: string;
  readonly vin: string | null;
}

interface SelectGarageVehicleResponse {
  readonly vehicleId: string;
  readonly selected: boolean;
}

export class GarageApiService {
  private readonly httpClient: HttpClient;

  public constructor(params: { httpClient: HttpClient }) {
    this.httpClient = params.httpClient;
  }

  public async executeGetVehicles(): Promise<GarageVehiclesResponse> {
    return this.httpClient.executeRequest<GarageVehiclesResponse>({
      method: "GET",
      path: "/garage/vehicles",
    });
  }

  public async executeCreateVehicle(input: CreateGarageVehicleInput): Promise<GarageVehicle> {
    return this.httpClient.executeRequest<GarageVehicle>({
      method: "POST",
      path: "/garage/vehicles",
      body: input,
    });
  }

  public async executeUpdateVehicleVin(input: UpdateGarageVehicleVinInput): Promise<GarageVehicle> {
    return this.httpClient.executeRequest<GarageVehicle>({
      method: "PATCH",
      path: `/garage/vehicles/${input.vehicleId}`,
      body: { vin: input.vin },
    });
  }

  public async executeSelectVehicle(vehicleId: string): Promise<SelectGarageVehicleResponse> {
    return this.httpClient.executeRequest<SelectGarageVehicleResponse>({
      method: "PATCH",
      path: `/garage/vehicles/${vehicleId}/select`,
    });
  }
}
