# PlatePal 🍽️

**Find restaurants that match your dietary preferences with AI-powered recommendations**

PlatePal is a React Native app built with Expo that helps you discover restaurants tailored to your specific dietary needs. Simply enter your preferences, share your location, and let AI find the perfect dining spots for you.

## ✨ Features

- **Smart Dietary Matching**: Input custom dietary preferences or select from quick options (Vegan, Vegetarian, Gluten-free, Halal, Kosher, Keto)
- **Location-Based Search**: Use GPS location or zip code to find nearby restaurants
- **AI-Powered Recommendations**: Leverages Google's Gemini AI to provide personalized restaurant suggestions
- **Restaurant Details**: Get names, addresses, descriptions, and ratings for each recommendation
- **Maps Integration**: Open restaurants directly in your device's maps app
- **Beautiful UI**: Modern, accessible design with smooth animations and intuitive interactions

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- iOS Simulator or Android Emulator (or physical device with Expo Go)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd platepal
   npm install
   ```

2. **Set up Gemini API**
   - Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Replace the API key in `app/(tabs)/index.tsx` (line 21)

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device**
   - Scan the QR code with Expo Go (iOS/Android)
   - Or press `i` for iOS Simulator / `a` for Android Emulator

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router with file-based routing
- **AI**: Google Gemini 2.5 Flash API
- **Location**: Expo Location
- **HTTP Client**: Axios
- **Styling**: React Native StyleSheet with custom design system

## 📱 How to Use

1. **Set Location**: Enter a zip code or tap the location icon to use GPS
2. **Choose Preferences**: Select quick dietary options or add custom preferences
3. **Search**: Tap "Search" to find AI-recommended restaurants
4. **Explore Results**: View restaurant details, ratings, and descriptions
5. **Navigate**: Tap "Open in Maps" to get directions

## 🎨 Design System

PlatePal uses a warm, food-inspired color palette:
- **Sand** (#fcde9c): Background
- **Tangerine** (#ffa552): Primary actions
- **Apricot** (#e0863d): Secondary elements
- **Plum** (#381d2a): Text and accents
- **White** (#ffffff): Cards and surfaces

## 📂 Project Structure

```
platepal/
├── app/
│   ├── (tabs)/
│   │   └── index.tsx          # Main restaurant finder screen
│   └── _layout.tsx            # Root layout
├── components/
│   ├── themed-text.tsx        # Themed text components
│   ├── themed-view.tsx        # Themed view components
│   └── top-bar.tsx           # App header
├── assets/                    # Images and icons
└── package.json
```

## 🔧 Configuration

### Location Permissions
The app requests location permissions for GPS-based restaurant discovery. Permissions are configured in `app.json`:

```json
"android": {
  "permissions": [
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.ACCESS_COARSE_LOCATION"
  ]
}
```

### API Configuration
Replace the Gemini API key in `app/(tabs)/index.tsx`:
```typescript
const GEMINI_API_KEY = "your-api-key-here";
```

## 🚧 Development Notes

This is a hackathon project focused on simplicity and rapid development:
- Direct API calls from the client (no backend required)
- Minimal external dependencies
- Single-screen experience for maximum impact

## 📄 License

This project is private and intended for hackathon use.

---

**Built with ❤️ for food lovers everywhere**
