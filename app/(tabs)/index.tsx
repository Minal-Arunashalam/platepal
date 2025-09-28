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
const GEMINI_API_KEY = "AIzaSyC8Dor1Lgh5Wi5sY1i2oHcuM6FyUtg2oIw";

const palette = {
  sand: "#FCDE9C", // warm background
  tangerine: "#FFA552", // primary
  apricot: "#DE8254", // secondary
  plum: "#381D2A", // dark text / accents
  sage: "#C4D6B0", // soft surface
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
    if (!location) {
      Alert.alert("Missing location", "Please get your location first");
      return;
    }

    console.log("Starting restaurant search...");
    console.log("Diet prefs:", dietPrefs);
    console.log("Location:", location);

    setLoading(true);
    try {
      const prompt = `Find me restaurants near latitude ${location.latitude}, longitude ${location.longitude} that match these dietary preferences: ${dietPrefs}. 

Please return ONLY a JSON array of restaurants in this exact format:
[
  {
    "name": "Restaurant Name",
    "address": "Street address",
    "description": "Brief description of why it matches the dietary preferences",
    "rating": "4.5/5 or similar"
  }
]

Limit to 8 restaurants maximum. Make sure the JSON is valid and contains no other text.`;

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Your Dietary Preferences</ThemedText>
        <TextInput
          style={[styles.input, inputFocused && styles.inputFocused]}
          placeholder="e.g., vegan, gluten-free, halal, keto, vegetarian..."
          placeholderTextColor="#999999"
          value={dietPrefs}
          onChangeText={setDietPrefs}
          multiline
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
        />
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
          <PressableScale
            onPress={() => setDietPrefs("")}
            style={styles.clearChip}
          >
            <ThemedText style={styles.clearChipText}>
              Clear
            </ThemedText>
          </PressableScale>
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <PressableScale
          style={[
            styles.button,
            styles.secondaryButton,
            locationLoading && styles.buttonDisabled,
          ]}
          onPress={getLocation}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <ThemedText style={styles.buttonText}>
              {location ? "📍 Location Found" : "📍 Get My Location"}
            </ThemedText>
          )}
        </PressableScale>
      </ThemedView>

      <ThemedView style={styles.section}>
        <PressableScale
          style={[
            styles.button,
            styles.searchButton,
            loading && styles.buttonDisabled,
          ]}
          onPress={findRestaurants}
          disabled={loading || !location || !dietPrefs.trim()}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <ThemedText style={styles.buttonText}>
              🔍 Find restaurants
            </ThemedText>
          )}
        </PressableScale>
      </ThemedView>

      {restaurants.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Recommended restaurants</ThemedText>
          {restaurants.map((restaurant, index) => (
            <ThemedView key={index} style={styles.restaurantCard}>
              {restaurant.rating && (
                <View style={styles.ratingBadge}>
                  <ThemedText style={styles.ratingBadgeText}>
                    ⭐ {restaurant.rating}
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
  section: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: palette.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.sage,
    shadowColor: palette.plum,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.sage,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginTop: 10,
    minHeight: 84,
    textAlignVertical: "top",
    backgroundColor: palette.white,
  },
  inputFocused: {
    borderColor: palette.tangerine,
    backgroundColor: palette.white,
    shadowColor: palette.tangerine,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: palette.plum,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
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
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  restaurantCard: {
    backgroundColor: palette.white,
    padding: 16,
    borderRadius: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: palette.sage,
    shadowColor: palette.plum,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  restaurantName: {
    fontSize: 17,
    color: palette.plum,
    fontWeight: "700",
    paddingRight: 72,
  },
  restaurantAddress: {
    fontSize: 13,
    color: palette.plum,
    opacity: 0.8,
    marginTop: 6,
  },
  restaurantDescription: {
    fontSize: 14,
    color: palette.plum,
    marginTop: 10,
    lineHeight: 20,
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
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: palette.sage,
    borderWidth: 1,
    borderColor: palette.apricot,
  },
  chipActive: {
    backgroundColor: palette.sand,
    borderColor: palette.tangerine,
    shadowColor: palette.plum,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  chipText: {
    color: palette.plum,
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextActive: {
    color: palette.plum,
    fontWeight: "800",
  },
  clearChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#FF4444",
    borderWidth: 1,
    borderColor: "#CC0000",
    shadowColor: "#FF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  clearChipText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: "700",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
  },
  smallBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  mapsBtn: {
    backgroundColor: palette.plum,
  },
  smallBtnText: {
    color: palette.white,
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.2,
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
