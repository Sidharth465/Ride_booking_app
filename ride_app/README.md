# RideApp (Mobile)

Expo / React Native client for the **Ride Booking** platform.

<p align="center">
  <img src="../docs/images/icon.png" width="80" alt="RideApp icon" />
</p>

> Full project docs, screenshots, and setup: **[../README.md](../README.md)**

## Quick start

```bash
npm install
npx expo start
```

Configure `.env`:

```env
EXPO_PUBLIC_MAP_API_KEY=...
EXPO_PUBLIC_API_HOST=192.168.x.x
EXPO_PUBLIC_API_PORT=3000
```

## Android release

```bash
cd android && ./gradlew assembleRelease
```

APK: `android/app/build/outputs/apk/release/app-release.apk`

## App roles

| | Customer | Rider |
|---|----------|-------|
| Preview | ![Customer](../docs/images/customer.jpg) | ![Rider](../docs/images/rider.jpg) |
| Flow | Book → track → pay → rate | Duty → accept → OTP → slide to complete |

## Stack

Expo 54 · React Native · Expo Router · Socket.IO client · Google Maps · Zustand · MMKV
