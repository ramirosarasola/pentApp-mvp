import { colors } from "@/app/constants/theme";
import { useGarageApiJson } from "@/app/hooks/use-garage-api-json";
import type { GarageVehicle } from "@/app/services/garage/garage-vehicle";
import { styled } from "nativewind";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const VIN_MANUFACTURERS: Record<string, string> = {
  WVW: "VOLKSWAGEN",
  "9BW": "VOLKSWAGEN",
  "3VW": "VOLKSWAGEN",
  "9BR": "TOYOTA",
  "1HG": "HONDA",
  JHM: "HONDA",
  WBA: "BMW",
  WDC: "MERCEDES-BENZ",
};

function executeInferManufacturer(vin: string | null): string {
  if (!vin) {
    return "UNIDENTIFIED";
  }
  const prefix: string = vin.slice(0, 3).toUpperCase();
  return VIN_MANUFACTURERS[prefix] ?? "UNIDENTIFIED";
}

function executeFormatModelGroup(vehicle: GarageVehicle): string {
  if (vehicle.label?.trim()) {
    return vehicle.label.trim().toUpperCase();
  }
  return `PLATE ${vehicle.plate}`;
}

function executeFormatSubtitle(vehicle: GarageVehicle): string {
  const year = new Date(vehicle.createdAt).getUTCFullYear();
  return `${vehicle.plate} / ${Number.isNaN(year) ? "YEAR N/A" : year}`;
}

const Garage = () => {
  const { isLoading, errorMessage, responseJson, executeRefresh } = useGarageApiJson();
  const [activeVehicleIndex, setActiveVehicleIndex] = useState<number>(0);
  const vehicles: GarageVehicle[] = responseJson?.items ?? [];
  const activeVehicle: GarageVehicle | null = vehicles.length
    ? (vehicles[activeVehicleIndex] ?? vehicles[0])
    : null;

  useEffect(() => {
    if (activeVehicleIndex < vehicles.length) {
      return;
    }
    setActiveVehicleIndex(0);
  }, [activeVehicleIndex, vehicles.length]);

  const executeSelectPreviousVehicle = (): void => {
    if (vehicles.length < 2) {
      return;
    }
    setActiveVehicleIndex((previousIndex) =>
      previousIndex === 0 ? vehicles.length - 1 : previousIndex - 1
    );
  };

  const executeSelectNextVehicle = (): void => {
    if (vehicles.length < 2) {
      return;
    }
    setActiveVehicleIndex((previousIndex) =>
      previousIndex === vehicles.length - 1 ? 0 : previousIndex + 1
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5 rounded-2xl">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-xl font-sans-bold text-tertiary">Garage</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void executeRefresh();
          }}
          style={{
            backgroundColor: colors.tertiary,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: colors.background, fontFamily: "sans-semibold" }}>
            Reload
          </Text>
        </Pressable>
      </View>
      {isLoading ? <Text className="mb-3 text-quaternary">Loading...</Text> : null}
      {errorMessage ? <Text className="mb-3 text-warning">{errorMessage}</Text> : null}
      {!activeVehicle ? (
        <View className="rounded-xl border border-border bg-card p-4">
          <Text className="text-quaternary">No vehicles found.</Text>
        </View>
      ) : (
        <>
          <View className="rounded-2xl border border-border bg-card p-4">
            <View className="self-start rounded-xl bg-tertiary/20 px-3 py-1">
              <Text className="font-sans-semibold text-[10px] tracking-[1.2px] text-tertiary">
                {activeVehicle.isPrimary ? "ACTIVE VEHICLE" : "GARAGE VEHICLE"}
              </Text>
            </View>
            <Text className="mt-3 font-sans-bold text-4xl leading-tight text-white">
              {executeFormatModelGroup(activeVehicle)}
            </Text>
            <Text className="mt-2 font-sans-regular text-sm tracking-wide text-quaternary">
              {executeFormatSubtitle(activeVehicle)}
            </Text>
            <View className="mt-5 h-40 items-center justify-center rounded-xl border border-border bg-background">
              <Text className="font-sans-semibold text-quaternary">Vehicle preview</Text>
              <Text className="mt-1 font-sans-regular text-xs text-quaternary/70">
                Plate: {activeVehicle.plate}
              </Text>
            </View>
            <View className="mt-4 flex-row justify-end gap-2">
              <Pressable
                accessibilityRole="button"
                onPress={executeSelectPreviousVehicle}
                className="h-11 w-11 items-center justify-center rounded-lg bg-background"
              >
                <Text className="font-sans-bold text-xl text-white">{"<"}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={executeSelectNextVehicle}
                className="h-11 w-11 items-center justify-center rounded-lg bg-background"
              >
                <Text className="font-sans-bold text-xl text-white">{">"}</Text>
              </Pressable>
            </View>
          </View>
          <View className="mt-4 rounded-2xl border border-tertiary bg-card p-4">
            <Text className="font-sans-regular text-xs tracking-[1.8px] text-quaternary">
              IDENTIFICATION NODE
            </Text>
            <Text className="mt-4 font-sans-semibold text-[11px] tracking-[1.2px] text-tertiary">
              MANUFACTURER
            </Text>
            <Text className="mt-1 font-sans-bold text-2xl text-white">
              {executeInferManufacturer(activeVehicle.vin)}
            </Text>
            <Text className="mt-4 font-sans-semibold text-[11px] tracking-[1.2px] text-tertiary">
              MODEL GROUP
            </Text>
            <Text className="mt-1 font-sans-bold text-2xl text-white">
              {executeFormatModelGroup(activeVehicle)}
            </Text>
            <Text className="mt-4 font-sans-semibold text-[11px] tracking-[1.2px] text-tertiary">
              GLOBAL VIN
            </Text>
            <Text className="mt-1 font-sans-regular text-base text-tertiary">
              {activeVehicle.vin ?? "NOT AVAILABLE"}
            </Text>
          </View>
          <Text className="mt-3 text-center font-sans-regular text-xs text-quaternary">
            {activeVehicleIndex + 1} / {vehicles.length}
          </Text>
        </>
      )}
    </SafeAreaView>
  );
};

export default Garage;
