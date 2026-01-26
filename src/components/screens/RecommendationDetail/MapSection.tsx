import { Feather } from "@expo/vector-icons";
// External Dependencies
import React, { useMemo } from "react";
import {
  Dimensions,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";

// Internal Dependencies
import { reportError } from "@/libs/utils";

interface MapSectionProps {
  mapUri: string;
  address: string;
  coordinates: { longitude: number; latitude: number };
}

export const MapSection = ({
  mapUri,
  address,
  coordinates,
}: MapSectionProps) => {
  const { width, height } = Dimensions.get("window");

  const LATITUDE_DELTA = 0.008;
  const LONGITUDE_DELTA = LATITUDE_DELTA * (width / height);

  const initialRegion = useMemo(
    () => ({
      longitude: coordinates.longitude,
      latitude: coordinates.latitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    }),
    [coordinates.longitude, coordinates.latitude],
  );

  const handleAddressButtonPress = () => {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.google.com/?address=${encodedAddress}&dirflg=d`;

    Linking.openURL(mapUri || url).catch((error) => {
      reportError(error, {
        component: "MapSection",
        action: "Open Maps Application",
        extra: { address, mapUri },
      });
    });
  };

  return (
    <View style={styles.mapContainer}>
      <View style={styles.map}>
        <MapView
          key={mapUri}
          pointerEvents="none"
          scrollEnabled={false}
          region={initialRegion}
          style={styles.mapView}
          userInterfaceStyle="light"
          provider={PROVIDER_GOOGLE}
          onPress={handleAddressButtonPress}
        >
          <Marker coordinate={coordinates} />
        </MapView>

        {/* Expand Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.expandButton}
          onPress={handleAddressButtonPress}
        >
          <Feather name="external-link" size={17} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
    height: 300,
    position: "relative",
  },
  mapView: {
    flex: 1,
    borderRadius: 20,
  },
  expandButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
