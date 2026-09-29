export interface PlatformDownloadConfig {
  id: string;
  name: string;
  platform: 'ios' | 'android' | 'pwa' | 'apk';
  badge: string;
  version: string;
  releaseDate?: string;
  downloadUrl?: string; // Set when live; if undefined, UI cleanly shows "Coming Soon / In Beta"
  status: 'available' | 'coming_soon' | 'beta';
  requirements: string;
}

export const APP_DOWNLOAD_CONFIG: {
  appName: string;
  currentVersion: string;
  platforms: PlatformDownloadConfig[];
} = {
  appName: 'Lighthouse Reels',
  currentVersion: 'v1.4.2',
  platforms: [
    {
      id: 'android-play',
      name: 'Google Play Store',
      platform: 'android',
      badge: 'Recommended for Android',
      version: '1.4.2',
      downloadUrl: process.env.NEXT_PUBLIC_APP_ANDROID_URL || undefined,
      status: process.env.NEXT_PUBLIC_APP_ANDROID_URL ? 'available' : 'coming_soon',
      requirements: 'Android 9.0 (Pie) or higher',
    },
    {
      id: 'apple-appstore',
      name: 'Apple App Store',
      platform: 'ios',
      badge: 'For iPhone & iPad',
      version: '1.4.0',
      downloadUrl: process.env.NEXT_PUBLIC_APP_IOS_URL || undefined,
      status: process.env.NEXT_PUBLIC_APP_IOS_URL ? 'available' : 'coming_soon',
      requirements: 'iOS 15.0 or later',
    },
    {
      id: 'android-apk',
      name: 'Direct Android APK',
      platform: 'apk',
      badge: 'Sideload / Direct Install',
      version: '1.4.2-universal',
      downloadUrl: process.env.NEXT_PUBLIC_APP_APK_URL || undefined,
      status: process.env.NEXT_PUBLIC_APP_APK_URL ? 'available' : 'coming_soon',
      requirements: 'Universal ARM64 / x86_64',
    },
    {
      id: 'web-pwa',
      name: 'Instant Web App (PWA)',
      platform: 'pwa',
      badge: 'Zero Storage Required',
      version: 'Web PWA',
      downloadUrl: '/home',
      status: 'available',
      requirements: 'Works on Chrome, Safari, Edge, Firefox',
    },
  ],
};
