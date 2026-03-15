import * as ExpoLocation from "expo-location";
import { appConfig } from "../config/appConfig";

export async function getCurrentUserLocation() {
  try {
    const permission = await ExpoLocation.requestForegroundPermissionsAsync();

    if (permission.status !== "granted") {
      return {
        label: appConfig.locationFallbackLabel,
        latitude: 44.4759,
        longitude: -73.2121,
        source: "fallback" as const
      };
    }

    const position = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.Balanced
    });

    return {
      label: "Current device location",
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      source: "device" as const
    };
  } catch {
    return {
      label: appConfig.locationFallbackLabel,
      latitude: 44.4759,
      longitude: -73.2121,
      source: "fallback" as const
    };
  }
}

export async function geocodeAddress(address: string) {
  const results = await ExpoLocation.geocodeAsync(address);

  if (results.length === 0) {
    throw new Error("Address could not be located.");
  }

  return results[0];
}
