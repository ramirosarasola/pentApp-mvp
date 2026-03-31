import { ApiError } from "@/src/services/api/api-error";
import { HttpClient } from "@/src/services/api/http-client";
import { GarageApiService } from "@/src/services/garage/garage-api-service";
import type { GarageVehiclesResponse } from "@/src/services/garage/garage-vehicles-response";
import { useAuth } from "@clerk/expo";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface GarageJsonState {
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly responseJson: GarageVehiclesResponse | null;
  readonly executeRefresh: () => Promise<void>;
}

const FALLBACK_API_BASE_URL = "https://pentapp-mvp.vercel.app/api";

export function useGarageApiJson(): GarageJsonState {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [responseJson, setResponseJson] = useState<GarageVehiclesResponse | null>(null);
  const apiBaseUrl: string = process.env.EXPO_PUBLIC_API_BASE_URL ?? FALLBACK_API_BASE_URL;
  const getTokenRef = useRef(getToken);
  const hasExecutedInitialLoadRef = useRef<boolean>(false);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const httpClient: HttpClient = useMemo(() => {
    return new HttpClient({
      baseUrl: apiBaseUrl,
      tokenProvider: async () => getTokenRef.current(),
    });
  }, [apiBaseUrl]);
  const garageApiService: GarageApiService = useMemo(() => {
    return new GarageApiService({ httpClient });
  }, [httpClient]);
  const executeRefresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await garageApiService.executeGetVehicles();
      setResponseJson(response);
    } catch (error: unknown) {
      const message = error instanceof ApiError ? error.message : "Failed to fetch garage vehicles.";
      setErrorMessage(message);
      setResponseJson(null);
    } finally {
      setIsLoading(false);
    }
  }, [garageApiService]);

  useEffect(() => {
    if (hasExecutedInitialLoadRef.current) {
      return;
    }
    hasExecutedInitialLoadRef.current = true;
    void executeRefresh();
  }, [executeRefresh]);

  return {
    isLoading,
    errorMessage,
    responseJson,
    executeRefresh,
  };
}
