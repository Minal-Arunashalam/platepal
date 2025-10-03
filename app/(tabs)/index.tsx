import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TopBar } from "@/components/top-bar";
import axios from "axios";
import * as Location from "expo-location";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Replace with your Gemini API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const palette = {
  sand: "#fcde9c", // warm background (matches logo)
  tangerine: "#ffa552", // primary (matches logo)
  apricot: "#e0863d", // secondary (matches logo)
  plum: "#381d2a", // dark text / accents (matches logo)
  sage: "#fcde9c", // soft surface (matches logo background)
  white: "#ffffff",
} as const;

type Restaurant = {
  name: string;
  address: string;
  description: string;
  rating?: string;
};

const PressableScale: React.FC<{
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
  children: React.ReactNode;
}> = ({ onPress, disabled, style, children }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[{ transform: [{ scale }] }, disabled && { opacity: 0.6 }]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function PlatePalScreen() {
  const [dietPrefs, setDietPrefs] = useState("");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [zipCode, setZipCode] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);


  const quickPrefs = [
    "Vegan",
    "Vegetarian",
    "Gluten-free",
    "Halal",
    "Kosher",
    "Keto",
  ];

  const onTogglePref = (label: string) => {
    const lower = label.toLowerCase();
    const tokens = dietPrefs
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.map((t) => t.toLowerCase()).includes(lower)) {
      const next = tokens.filter((t) => t.toLowerCase() !== lower).join(", ");
      setDietPrefs(next);
    } else {
      const next = [...tokens, lower].join(", ").replace(/^,\s*/, "");
      setDietPrefs(next);
    }
  };

  const isPrefActive = (label: string) => {
    const lower = label.toLowerCase();
    return dietPrefs
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .includes(lower);
  };

  const openInMaps = (r: Restaurant) => {
    const query = encodeURIComponent(`${r.name} ${r.address ?? ""}`.trim());
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    if (url) Linking.openURL(url);
  };

  const getLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required to find nearby restaurants"
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      Alert.alert(
        "Location found!",
        `Lat: ${loc.coords.latitude.toFixed(
          4
        )}, Lng: ${loc.coords.longitude.toFixed(4)}`
      );
    } catch (error) {
      Alert.alert("Error", "Failed to get location");
    } finally {
      setLocationLoading(false);
    }
  };

  const findRestaurants = async () => {
    if (!dietPrefs.trim()) {
      Alert.alert("Missing info", "Please enter your dietary preferences");
      return;
    }
    if (!location && !zipCode.trim()) {
      Alert.alert("Missing location", "Please enter a zip code or get your location first");
      return;
    }

    // Use zip code if no location, or use location if available
    let searchLocation = location;
    if (!location && zipCode.trim()) {
      // Simple zip code to coordinates (this is a placeholder - in real app you'd use a geocoding service)
      Alert.alert("Zip Code Search", "Zip code search is coming soon! Please use the location button for now.");
      return;
    }

    if (!searchLocation) {
      Alert.alert("Error", "No valid location found");
      return;
    }

    console.log("Starting restaurant search...");
    console.log("Diet prefs:", dietPrefs);
    console.log("Location:", searchLocation);

    setLoading(true);
    try {
      const prompt = `Find me restaurants near latitude ${searchLocation.latitude}, longitude ${searchLocation.longitude} that match these dietary preferences: ${dietPrefs}. 

IMPORTANT: For each restaurant, you MUST include a realistic rating based on actual review data. Research and provide accurate ratings that reflect real customer reviews.

Please return ONLY a JSON array of restaurants in this exact format:
[
  {
    "name": "Restaurant Name",
    "address": "Street address",
    "description": "Brief description of why it matches the dietary preferences",
    "rating": "4.2/5"
  }
]

Requirements:
- Always include a rating field for every restaurant (required field)
- Use realistic ratings between 2.0/5 and 5.0/5 based on actual review data
- Format ratings as "X.X/5" (e.g., "4.2/5", "3.8/5")
- Limit to 8 restaurants maximum
- Make sure the JSON is valid and contains no other text`;

      console.log("Making API call to Gemini...");

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API Response:", response.data);

      const text =
        response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      console.log("Response text:", text);

      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        console.log("Found JSON:", jsonMatch[0]);
        const restaurantData = JSON.parse(jsonMatch[0]);
        console.log("Parsed restaurants:", restaurantData);
        setRestaurants(restaurantData);
        Alert.alert("Success!", `Found ${restaurantData.length} restaurants`);
      } else {
        console.log("No JSON found in response");
        Alert.alert("Error", "Could not parse restaurant data from response");
      }
    } catch (error: any) {
      console.error("Full error:", error);
      console.error("Error response:", error.response?.data);
      Alert.alert(
        "Error",
        `Failed to find restaurants: ${error.message || "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (!location || !dietPrefs.trim()) {
      setRefreshing(false);
      return;
    }
    setRefreshing(true);
    try {
      await findRestaurants();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <TopBar platepallogo="platepallogo" />
      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
      <ThemedView style={styles.mainSection}>
        <ThemedText type="subtitle">Find Your Perfect Restaurant</ThemedText>

        {/* Location Input */}
        <View style={styles.locationContainer}>
          <ThemedText style={styles.inputLabel}>Location:</ThemedText>
          <View style={styles.locationInputRow}>
            <TextInput
              style={[styles.zipInput, inputFocused && styles.zipInputFocused]}
              placeholder="Enter zip code (optional)"
              placeholderTextColor="#999999"
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="numeric"
              maxLength={5}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
            <PressableScale
              style={[
                styles.locationIconButton,
                locationLoading && styles.buttonDisabled,
              ]}
              onPress={getLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator color={palette.plum} size="small" />
              ) : (
                <ThemedText style={styles.faviconIcon}>⌖</ThemedText>
              )}
            </PressableScale>
          </View>
          <ThemedText style={styles.statusText}>
            {location ? `Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 
             zipCode ? `Zip code: ${zipCode}` : "Enter zip code or tap icon to get location"}
          </ThemedText>
        </View>

        {/* Preference Chips */}
        <View style={styles.chipsContainer}>
          <View style={styles.chipsRow}>
            {quickPrefs.map((label) => (
              <PressableScale
                key={label}
                onPress={() => onTogglePref(label)}
                style={[styles.chip, isPrefActive(label) && styles.chipActive]}
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    isPrefActive(label) && styles.chipTextActive,
                  ]}
                >
                  {label}
                </ThemedText>
              </PressableScale>
            ))}
          </View>
          <PressableScale
            onPress={() => setDietPrefs("")}
            style={styles.clearChip}
          >
            <ThemedText style={styles.clearChipText}>
              Clear
            </ThemedText>
          </PressableScale>
        </View>

        {/* Custom Preferences Input */}
        <View style={styles.customInputContainer}>
          <ThemedText style={styles.inputLabel}>Add custom preferences:</ThemedText>
          <TextInput
            style={[styles.customInput, inputFocused && styles.customInputFocused]}
            placeholder="e.g., nut-free, dairy-free, spicy..."
            placeholderTextColor="#999999"
            value={dietPrefs}
            onChangeText={setDietPrefs}
            multiline
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
        </View>

        {/* Action Buttons Row - Bottom */}
        <View style={styles.actionButtonsRow}>
          <PressableScale
            style={[
              styles.searchButtonWithText,
              loading && styles.buttonDisabled,
            ]}
            onPress={findRestaurants}
            disabled={loading || (!location && !zipCode.trim()) || !dietPrefs.trim()}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <ThemedText style={styles.searchButtonText}>Search</ThemedText>
            )}
          </PressableScale>
        </View>
      </ThemedView>

      {restaurants.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Recommended restaurants</ThemedText>
          {restaurants.map((restaurant, index) => (
            <ThemedView key={index} style={styles.restaurantCard}>
              {restaurant.rating && (
                <View style={styles.ratingBadge}>
                  <ThemedText style={styles.ratingBadgeText}>
                    ★ {restaurant.rating}
                  </ThemedText>
                </View>
              )}
              <ThemedText type="defaultSemiBold" style={styles.restaurantName}>
                {restaurant.name}
              </ThemedText>
              <ThemedText style={styles.restaurantAddress}>
                {restaurant.address}
              </ThemedText>
              <ThemedText style={styles.restaurantDescription}>
                {restaurant.description}
              </ThemedText>
              <View style={styles.cardActions}>
                <PressableScale
                  style={[styles.smallBtn, styles.mapsBtn]}
                  onPress={() => openInMaps(restaurant)}
                >
                  <ThemedText style={styles.smallBtnText}>
                    Open in Maps
                  </ThemedText>
                </PressableScale>
              </View>
            </ThemedView>
          ))}
        </ThemedView>
      )}

      {!loading && restaurants.length === 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">No results yet</ThemedText>
          <ThemedText>
            Enter your dietary preferences and tap "Get My Location" then "Find
            restaurants".
          </ThemedText>
        </ThemedView>
      )}

      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={palette.tangerine} />
            <ThemedText style={{ marginTop: 12 }}>
              Finding great places for you…
            </ThemedText>
          </View>
        </View>
      )}
      </Animated.ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.sand,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    backgroundColor: palette.white,
    borderRadius: 20,
    shadowColor: palette.plum,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  mainSection: {
    marginTop: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 28,
    backgroundColor: palette.white,
    borderRadius: 24,
    shadowColor: palette.plum,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  locationContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  locationInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  zipInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: palette.sage,
    borderRadius: 24,
    padding: 14,
    fontSize: 16,
    backgroundColor: palette.white,
    minHeight: 48,
  },
  zipInputFocused: {
    borderColor: palette.tangerine,
    shadowColor: palette.tangerine,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  locationIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.sage,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: palette.plum,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  faviconIcon: {
    fontSize: 22,
    color: palette.plum,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  searchButtonWithText: {
    backgroundColor: palette.tangerine,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    shadowColor: palette.plum,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 56,
  },
  searchButtonText: {
    color: palette.white,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 14,
    color: palette.plum,
    marginTop: 8,
    opacity: 0.8,
  },
  customInputContainer: {
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: palette.plum,
    fontWeight: "600",
    marginBottom: 8,
  },
  customInput: {
    borderWidth: 2,
    borderColor: palette.sage,
    borderRadius: 24,
    padding: 16,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: "top",
    backgroundColor: palette.white,
    lineHeight: 22,
  },
  customInputFocused: {
    borderColor: palette.tangerine,
    backgroundColor: palette.white,
    shadowColor: palette.tangerine,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    borderWidth: 2,
    borderColor: palette.sage,
    borderRadius: 24,
    padding: 20,
    fontSize: 17,
    marginTop: 16,
    minHeight: 120,
    textAlignVertical: "top",
    backgroundColor: palette.white,
    lineHeight: 24,
  },
  inputFocused: {
    borderColor: palette.tangerine,
    backgroundColor: palette.white,
    shadowColor: palette.tangerine,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    paddingVertical: 20,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 16,
    shadowColor: palette.plum,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 56,
  },
  secondaryButton: {
    backgroundColor: palette.apricot,
  },
  searchButton: {
    backgroundColor: palette.tangerine,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: palette.white,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  restaurantCard: {
    backgroundColor: palette.white,
    padding: 20,
    borderRadius: 20,
    marginTop: 16,
    shadowColor: palette.plum,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  restaurantName: {
    fontSize: 20,
    color: palette.plum,
    fontWeight: "700",
    paddingRight: 80,
    marginBottom: 8,
  },
  restaurantAddress: {
    fontSize: 15,
    color: palette.plum,
    opacity: 0.8,
    marginTop: 8,
  },
  restaurantDescription: {
    fontSize: 16,
    color: palette.plum,
    marginTop: 12,
    lineHeight: 24,
  },
  ratingBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: palette.plum,
    borderColor: palette.apricot,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  ratingBadgeText: {
    fontSize: 12,
    color: palette.sand,
    fontWeight: "700",
  },
  chipsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    flex: 1,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: palette.sage,
    borderWidth: 2,
    borderColor: palette.apricot,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: palette.sand,
    borderColor: palette.tangerine,
    shadowColor: palette.plum,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  chipText: {
    color: palette.plum,
    fontSize: 15,
    fontWeight: "600",
  },
  chipTextActive: {
    color: palette.plum,
    fontWeight: "800",
  },
  clearChip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: "#FF4444",
    borderWidth: 2,
    borderColor: "#CC0000",
    shadowColor: "#FF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  clearChipText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: "700",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
  },
  smallBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 22,
    minHeight: 44,
  },
  mapsBtn: {
    backgroundColor: palette.plum,
  },
  smallBtnText: {
    color: palette.white,
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  loadingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(56,29,42,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    backgroundColor: palette.white,
    padding: 22,
    borderRadius: 14,
    shadowColor: palette.plum,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
});
