import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import axios from 'axios';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

// Replace with your Gemini API key
const GEMINI_API_KEY = "AIzaSyC8Dor1Lgh5Wi5sY1i2oHcuM6FyUtg2oIw";

type Restaurant = {
  name: string;
  address: string;
  description: string;
  rating?: string;
};

export default function PlatePalScreen() {
  const [dietPrefs, setDietPrefs] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const quickPrefs = ['Vegan', 'Vegetarian', 'Gluten-free', 'Halal', 'Kosher', 'Keto'];

  const onTogglePref = (label: string) => {
    const lower = label.toLowerCase();
    const tokens = dietPrefs.split(',').map(t => t.trim()).filter(Boolean);
    if (tokens.map(t => t.toLowerCase()).includes(lower)) {
      const next = tokens.filter(t => t.toLowerCase() !== lower).join(', ');
      setDietPrefs(next);
    } else {
      const next = [...tokens, lower].join(', ').replace(/^,\s*/, '');
      setDietPrefs(next);
    }
  };

  const isPrefActive = (label: string) => {
    const lower = label.toLowerCase();
    return dietPrefs.split(',').map(t => t.trim().toLowerCase()).includes(lower);
  };

  const openInMaps = (r: Restaurant) => {
    const query = encodeURIComponent(`${r.name} ${r.address ?? ''}`.trim());
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
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to find nearby restaurants');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      Alert.alert('Location found!', `Lat: ${loc.coords.latitude.toFixed(4)}, Lng: ${loc.coords.longitude.toFixed(4)}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setLocationLoading(false);
    }
  };

  const findRestaurants = async () => {
    if (!dietPrefs.trim()) {
      Alert.alert('Missing info', 'Please enter your dietary preferences');
      return;
    }
    if (!location) {
      Alert.alert('Missing location', 'Please get your location first');
      return;
    }

    console.log('Starting restaurant search...');
    console.log('Diet prefs:', dietPrefs);
    console.log('Location:', location);

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

      console.log('Making API call to Gemini...');
      
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
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('API Response:', response.data);
      
      const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('Response text:', text);
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        console.log('Found JSON:', jsonMatch[0]);
        const restaurantData = JSON.parse(jsonMatch[0]);
        console.log('Parsed restaurants:', restaurantData);
        setRestaurants(restaurantData);
        Alert.alert('Success!', `Found ${restaurantData.length} restaurants`);
      } else {
        console.log('No JSON found in response');
        Alert.alert('Error', 'Could not parse restaurant data from response');
      }
    } catch (error: any) {
      console.error('Full error:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', `Failed to find restaurants: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>🍽️ PlatePal</ThemedText>
        <ThemedText style={styles.subtitle}>Find restaurants that match your dietary preferences</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Your Dietary Preferences</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="e.g., vegan, gluten-free, halal, keto, vegetarian..."
          value={dietPrefs}
          onChangeText={setDietPrefs}
          multiline
        />
        <View style={styles.chipsRow}>
          {quickPrefs.map((label) => (
            <TouchableOpacity
              key={label}
              onPress={() => onTogglePref(label)}
              style={[styles.chip, isPrefActive(label) && styles.chipActive]}
            >
              <ThemedText style={[styles.chipText, isPrefActive(label) && styles.chipTextActive]}>{label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        
      </ThemedView>

      <ThemedView style={styles.section}>
        <TouchableOpacity 
          style={[styles.button, locationLoading && styles.buttonDisabled]} 
          onPress={getLocation}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <ThemedText style={styles.buttonText}>
              {location ? '📍 Location Found' : '📍 Get My Location'}
            </ThemedText>
          )}
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.section}>
        <TouchableOpacity 
          style={[styles.button, styles.searchButton, loading && styles.buttonDisabled]} 
          onPress={findRestaurants}
          disabled={loading || !location || !dietPrefs.trim()}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <ThemedText style={styles.buttonText}>🔍 Find restaurants</ThemedText>
          )}
        </TouchableOpacity>
      </ThemedView>

      {restaurants.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Recommended restaurants</ThemedText>
          {restaurants.map((restaurant, index) => (
            <ThemedView key={index} style={styles.restaurantCard}>
              <ThemedText type="defaultSemiBold" style={styles.restaurantName}>
                {restaurant.name}
              </ThemedText>
              <ThemedText style={styles.restaurantAddress}>{restaurant.address}</ThemedText>
              <ThemedText style={styles.restaurantDescription}>{restaurant.description}</ThemedText>
              { restaurant.rating && (
                <ThemedText style={styles.restaurantRating}>⭐ {restaurant.rating}</ThemedText>
              )}
              <View style={styles.cardActions}>
                <TouchableOpacity style={[styles.smallBtn, styles.mapsBtn]} onPress={() => openInMaps(restaurant)}>
                  <ThemedText style={styles.smallBtnText}>Open in Maps</ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          ))}
        </ThemedView>
      )}

      {!loading && restaurants.length === 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">No results yet</ThemedText>
          <ThemedText>Enter your dietary preferences and tap "Get My Location" then "Find restaurants".</ThemedText>
        </ThemedView>
      )}

      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#00b894" />
            <ThemedText style={{ marginTop: 12 }}>Finding great places for you…</ThemedText>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f0fbf7',
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
    borderRadius: 16,
    margin: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  subtitle: {
    fontSize: 16,
    color: '#636e72',
    textAlign: 'center',
    marginTop: 8,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#0984e3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  searchButton: {
    backgroundColor: '#00b894',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  restaurantCard: {
    backgroundColor: '#f9fcff',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00b894',
    borderWidth: 1,
    borderColor: '#eaf0f4',
  },
  restaurantName: {
    fontSize: 18,
    color: '#2d3436',
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#636e72',
    marginTop: 4,
  },
  restaurantDescription: {
    fontSize: 14,
    color: '#2d3436',
    marginTop: 8,
    lineHeight: 20,
  },
  restaurantRating: {
    fontSize: 14,
    color: '#e17055',
    marginTop: 8,
    fontWeight: 'bold',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#eef2f7',
    borderWidth: 1,
    borderColor: '#e0e6ee',
  },
  chipActive: {
    backgroundColor: '#d7f5ea',
    borderColor: '#00b894',
  },
  chipText: {
    color: '#4b5563',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#0c8a6a',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  mapsBtn: {
    backgroundColor: '#0984e3',
  },
  smallBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});
