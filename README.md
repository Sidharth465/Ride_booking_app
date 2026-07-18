# RideApp — Real-Time Ride Booking

<p align="center">
  <img src="docs/images/readme-banner.png" alt="RideApp banner" width="900" />
</p>

<p align="center">
  <img src="docs/images/icon.png" alt="App icon" width="96" />
</p>

<p align="center">
  <strong>Book. Track. Ride.</strong> — A full-stack ride-hailing app for customers and riders with live maps, Socket.IO, OTP start, in-trip chat, and payment.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Google%20Maps-Directions-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white" alt="Maps" />
</p>

---

## Description

**RideApp** is a mobile ride-booking platform (similar in flow to Uber / Rapido) with two roles in one app:

| Role | What you can do |
|------|------------------|
| **Customer** | Set pickup & drop, choose vehicle & fare, search riders, live-track the trip, chat/call, pay & rate |
| **Rider** | Go on duty, receive nearby offers, navigate to pickup/drop, verify OTP, slide-to-complete, earn |

Backend is a **Node.js + Express + MongoDB** API with **Socket.IO** for live locations, ride offers, status updates, and chat.

---

## App preview

<p align="center">
  <img src="docs/images/splash.png" alt="Splash" width="180" />
  &nbsp;
  <img src="docs/images/customer.jpg" alt="Customer" width="180" />
  &nbsp;
  <img src="docs/images/rider.jpg" alt="Rider" width="180" />
</p>

<p align="center">
  <em>Splash · Customer · Rider</em>
</p>

<p align="center">
  <img src="docs/images/marker.png" alt="Pickup pin" height="40" />
  <img src="docs/images/drop_marker.png" alt="Drop pin" height="40" />
  <img src="docs/images/bike_marker.png" alt="Bike marker" height="48" />
  &nbsp;&nbsp;
  <img src="docs/images/logo_t.png" alt="Logo" height="40" />
</p>

---

## Features

### Customer
- GPS home map with **nearby on-duty rider icons**
- Pickup / drop search (Google Places) + route preview
- Vehicle types: **Bike · Auto · Cab Economy · Cab Premium**
- Live ride sheet (draggable) with OTP, ETA, call & chat
- Resume active trip after app restart
- Mock payment (cash / UPI / card) + star rating
- Multiple **app themes** (Midnight Sky, Ink Coral, Forest Lime, and more)
- Ride history

### Rider
- On / off duty toggle
- Live ride offers with route map + **Open in Google Maps**
- Navigate to pickup → mark arrived → **OTP verify** → trip
- Live map: you → next stop, custom pins
- **Slide left → right to complete ride**
- Call & chat with customer
- Themes + history

### Platform
- JWT auth (access + refresh)
- Real-time sockets (`rideOffer`, `rideUpdate`, `riderLocationUpdate`, chat)
- Android release signing + cleartext HTTP for LAN testing

---

## Tech stack

| Layer | Stack |
|-------|--------|
| Mobile | Expo 54, React Native, Expo Router, Reanimated, Gesture Handler, Gorhom Bottom Sheet |
| Maps | `react-native-maps`, MapViewDirections, Google Places / Geocoding |
| State | Zustand + MMKV |
| Server | Node.js, Express, Socket.IO, Mongoose, JWT, Geolib |
| DB | MongoDB |

---

## Project structure

```
Ride_Booking_App/
├── ride_app/                 # Expo / React Native client
│   ├── src/app/              # Routes (customer, rider, auth)
│   ├── src/components/       # UI (maps, sheets, chat, themes)
│   ├── src/service/          # API + Socket.IO client
│   ├── android/              # Native Android (release builds)
│   └── .env                  # EXPO_PUBLIC_API_HOST, Maps key
├── Ride_Booking_Server/      # Express + Socket.IO API
├── docs/images/              # README images
├── FLOWS.md                  # Product / ride status source of truth
└── README.md                 # You are here
```

---

## Ride status flow

```
SEARCHING_FOR_RIDER → ACCEPTED → ARRIVED → START → COMPLETED → pay + rate
```

- OTP is shown only to the **customer** (never in rider offers)
- Cancel allowed until trip starts; not after `START`
- One active ride per customer at a time

Full rules: see [`FLOWS.md`](./FLOWS.md).

---

## Getting started

### 1. Server

```bash
cd Ride_Booking_Server
cp .env-template .env   # set MONGO_URI, JWT secrets, PORT=3000
npm install
npm start
```

Server listens on `0.0.0.0:3000` (reachable on your LAN).

### 2. Mobile app

```bash
cd ride_app
npm install
```

Create / edit `.env`:

```env
EXPO_PUBLIC_MAP_API_KEY=your_google_maps_key
EXPO_PUBLIC_API_HOST=192.168.x.x    # laptop LAN IP for real devices
EXPO_PUBLIC_API_PORT=3000
```

```bash
npx expo start
# or
npx expo run:android
npx expo run:ios
```

### 3. Test on another phone (same Wi‑Fi)

1. Laptop IP in `EXPO_PUBLIC_API_HOST` (not `localhost`)
2. Rebuild the app after changing `.env`
3. Keep the server running on the laptop
4. Allow firewall port **3000**

### 4. Android release APK

```bash
cd ride_app/android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

---

## Roles & login

1. Open app → pick **Customer** or **Rider**
2. Sign in with a 10-digit phone number
3. Same phone number is bound to one role

---

## Screens map (high level)

| Path | Screen |
|------|--------|
| `/` | Splash / session restore |
| `/role` | Choose customer or rider |
| `/auth/customer` · `/auth/rider` | Phone login |
| `/customer` | Home map + “Where to?” |
| `/customer/selectlocations` | Pickup / drop + fare |
| `/customer/liveride` | Live trip tracking |
| `/rider` | Duty + offers + active trip |
| `*/chat` | In-trip messaging |
| `*/history` | Past rides |

---

## Environment

| Variable | Where | Purpose |
|----------|--------|---------|
| `EXPO_PUBLIC_API_HOST` | `ride_app/.env` | Backend host (LAN IP on device) |
| `EXPO_PUBLIC_API_PORT` | `ride_app/.env` | Backend port (default `3000`) |
| `EXPO_PUBLIC_MAP_API_KEY` | `ride_app/.env` | Google Maps / Places |
| `MONGO_URI` | server `.env` | MongoDB connection |
| `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` | server `.env` | JWT |

---

## License

ISC — see server package. App assets under `ride_app/src/assets`.

---

<p align="center">
  <img src="docs/images/icon.png" width="48" alt="RideApp" />
  <br />
  Built with Expo · Socket.IO · Google Maps
</p>
