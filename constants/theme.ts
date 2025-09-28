/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#ffa552';
const tintColorDark = '#ffa552';

export const Colors = {
  light: {
    text: '#381d2a',
    background: '#fcde9c',
    tint: tintColorLight,
    icon: '#381d2a',
    tabIconDefault: '#e0863d',
    tabIconSelected: tintColorLight,
    primary: '#ffa552',
    secondary: '#e0863d',
    accent: '#381d2a',
    surface: '#fff',
    surfaceVariant: '#fcde9c',
  },
  dark: {
    text: '#fcde9c',
    background: '#381d2a',
    tint: tintColorDark,
    icon: '#fcde9c',
    tabIconDefault: '#e0863d',
    tabIconSelected: tintColorDark,
    primary: '#ffa552',
    secondary: '#e0863d',
    accent: '#fcde9c',
    surface: '#381d2a',
    surfaceVariant: '#2a1420',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
