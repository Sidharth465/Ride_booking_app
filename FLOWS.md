# Ride Booking App — Customer & Rider Flows

Source of truth for how the product must behave. Implement and fix bugs against this doc — not ad‑hoc guesses.

---

## Roles

| Role | App entry | Can do |
|------|-----------|--------|
| **Customer** | `/auth/customer` → `/customer` | Book, track, pay, rate, history, cancel (rules below) |
| **Rider** | `/auth/rider` → `/rider` | Go on duty, accept, trip lifecycle, history, cancel (rules below) |

One phone number = one role (customer **or** rider).

---

## Shared ride status machine

```
SEARCHING_FOR_RIDER
        │
        ▼
     ACCEPTED  ──────► CANCELLED  (customer or rider)
        │
        ▼
      ARRIVED  ──────► CANCELLED  (customer or rider)
        │
        ▼  (OTP verify)
      START
        │
        ▼  (rider within 50m of drop)
    COMPLETED
        │
        ▼
   payment + rating (customer)
```

| From | To | Who | Gate |
|------|----|-----|------|
| — | `SEARCHING_FOR_RIDER` | Customer creates ride | Valid pickup/drop/vehicle |
| `SEARCHING_FOR_RIDER` | `ACCEPTED` | Rider accept API | First rider wins; ride still searching |
| `SEARCHING_FOR_RIDER` | deleted / error | Customer cancel search **or** timeout | Socket cancel / no riders |
| `ACCEPTED` | `ARRIVED` | Rider | No geofence (rider taps Arrived) |
| `ACCEPTED` | `CANCELLED` | Customer or assigned rider | Confirm dialog |
| `ARRIVED` | `START` | Rider | Correct 4‑digit OTP |
| `ARRIVED` | `CANCELLED` | Customer or assigned rider | Confirm dialog |
| `START` | `COMPLETED` | Rider | No distance gate for now (geofence disabled for testing) |
| `COMPLETED` | paid | Customer | Mock pay (cash/upi/card) |
| `COMPLETED` | rated | Customer | 1–5 stars after pay |

**Hard rules**
- Complete geofence (50m drop) is **disabled for now** — re-enable later for production.
- OTP is **customer‑only** (never in `rideOffer`).
- After `START`, cancel is **not** allowed.
- **One active ride per customer** — cannot book another while searching/accepted/arrived/start, or completed-but-unpaid.
- **Call & chat** available during `ACCEPTED` / `ARRIVED` / `START` (native dialer + in-app Socket.IO chat).
- **Live tracking** (customer sees rider pin move) is required from `ACCEPTED` through `START` until `COMPLETED`.
- Both apps update via sockets: `rideUpdate` / `rideAccepted` / `rideStarted` / `rideCanceled` + user rooms `user_<id>`.

---

## Customer flows

### C0 — Auth & session
1. Open app → splash hydrates tokens + `user_role`.
2. If valid customer session → `/customer`.
3. Else → role pick / `/auth/customer` → phone login → home.
4. Logout clears tokens, store, socket.

### C1 — Book a ride
1. Home map shows current GPS.
2. Tap “Where to?” → select pickup (default GPS) + drop (Places search).
3. See route + fare by vehicle → pick vehicle → **Book**.
4. `POST /ride/create` → save `activeRide` (status `SEARCHING_FOR_RIDER`, OTP generated) → `/customer/liveride`.
5. Emit `subscribeRide` + `searchrider`.

### C2 — Searching
1. UI: “Looking for nearby riders…” (+ optional search hint).
2. Server matches on‑duty riders within range → `rideOffer` to riders (no OTP).
3. Retry until accepted, canceled, or timeout → error + clear trip.
4. Customer can **Cancel search** (deletes searching ride).

### C3 — Rider accepted
1. Receive `rideAccepted` / `rideUpdate` → status `ACCEPTED`.
2. Show OTP, rider phone (if present), “Rider on the way”.
3. **Live tracking ON:** rider pin on map.
4. **Blue route** pickup → drop + **expected drop ETA** (Rapido-style).
5. Can **Cancel ride** (`ACCEPTED`).

### C4 — Rider arrived
1. Status → `ARRIVED` via socket.
2. Still show OTP (“share with rider”).
3. Live tracking + blue path + ETA continue.
4. Can **Cancel ride** (`ARRIVED`).

### C5 — Trip started
1. Rider verifies OTP → status `START`.
2. Customer updates immediately: hide OTP, “Trip in progress”.
3. Live tracking continues; ETA refreshes as **remaining time to drop** from rider GPS.
4. **No cancel**.

### C6 — Trip completed → pay → rate
1. Status `COMPLETED` → payment sheet (mock).
2. Pay → then rate 1–5 → Done → clear trip → home.
3. Ride appears in **History**.

### C7 — History
1. Clock icon → list of past rides (fare, status, addresses, paid/rating).

---

## Rider flows

### R0 — Auth & session
1. Splash → if rider session → `/rider`.
2. Else `/auth/rider` → login → home.
3. Logout clears duty + session.

### R1 — Go on duty
1. GPS required.
2. Socket must be connected.
3. Toggle **ON** → `goOnDuty` (+ heartbeat / location upsert).
4. Server `onDutyRiders` must show count ≥ 1.
5. Toggle **OFF** → `goOffDuty` (blocked if active trip).
6. **App restart:** `onDuty` is persisted; if an active trip exists, duty is forced **ON** and `goOnDuty` is re-sent after socket/GPS are ready.

### R2 — Receive & accept offer
1. While ON, receive `rideOffer` (no OTP).
2. Accept → `PATCH /ride/accept` → `activeRide` `ACCEPTED` → `subscribeRide`.
3. Ignore dismisses modal only (offer may return on next search tick).
4. Push `updateLocation` so customer can track.

### R3 — To pickup (`ACCEPTED`)
1. UI: “Head to pickup”, **Arrived at pickup**, Cancel.
2. Map: **blue route** pickup → drop + **expected drop ETA**.
3. Live location every ~2s while on trip.
4. Tap **Arrived** → `ARRIVED` (no 50m gate).
5. Customer gets `rideUpdate`.

### R4 — Start with OTP (`ARRIVED`)
1. UI: enter 4‑digit OTP from customer.
2. `POST /ride/verify-otp` → `START`.
3. Customer gets `rideUpdate` + `rideStarted`.
4. Rider UI: blue path + ETA “Drop in ~X min”; **Complete** disabled until near drop.

### R5 — Complete (`START`)
1. Show distance to drop + live ETA.
2. **Complete** enabled only if GPS ≤ **50m of drop**.
3. Server rejects if farther.
4. On success → clear `activeRide`, back to listening if still ON.
5. Customer opens payment flow.

### R6 — Cancel
1. Allowed only in `ACCEPTED` (and optionally `ARRIVED` per product rule).
2. Both sides clear trip via `rideCanceled`.

### R7 — History
1. Header clock → same history list as customer (role‑filtered by API).

---

## Live tracking contract

**Required whenever status is `ACCEPTED`, `ARRIVED`, or `START`.**  
Customer liveride map must show: pickup marker + drop marker + **moving rider pin**.

| Who | Sends | Receives |
|-----|--------|----------|
| Rider (ON **or** active trip) | `updateLocation` every ~2s during trip | — |
| Server | `riderLocationUpdate` to room `rider_<riderId>` via **`io.to`** (all subscribers) | — |
| Customer (from accept onward) | `subscribeToriderLocation` (re-join on reconnect) | rider pin moves |

If customer sees “Waiting for rider live location…”, rider is not emitting or customer not subscribed.

---

## Socket events (canonical)

| Event | Direction | Meaning |
|-------|-----------|---------|
| `goOnDuty` / `goOffDuty` / `updateLocation` | Rider → server | Duty + GPS |
| `dutyStatus` | Server → rider | Ack on duty |
| `searchrider` | Customer → server | Start matching |
| `searchStatus` | Server → customer | No riders yet / hint |
| `rideOffer` | Server → rider | Offer (strip OTP) |
| `subscribeRide` | Both → server | Join `ride_<id>` + get `rideData` |
| `rideData` / `rideUpdate` / `rideAccepted` / `rideStarted` | Server → both | State sync |
| `rideCanceled` | Server → both | Trip canceled |
| `subscribeToriderLocation` | Customer → server | Join rider GPS room |
| `riderLocationUpdate` | Server → customer | Live pin |
| `error` | Server → client | Fatal search / ride errors |

Every authenticated socket also joins `user_<userId>` for reliable status delivery.

---

## Screen map

**Customer:** `index` (home) → `selectlocations` (book) → `liveride` (search→trip→pay) → `history`  
**Rider:** `index` (duty + offer + active panel) → `history`

---

## Definition of done (per happy path)

1. Rider ON → customer books → rider gets offer → accept.  
2. Customer sees OTP + **live rider pin** (tracking stays on through Arrived → Start → until Complete).  
3. Rider Arrived → customer status “arrived / share OTP” (**still tracking**).  
4. Rider OTP → customer “Trip in progress”, OTP hidden (**still tracking**).  
5. Rider near drop (≤50m) → Complete → customer pays → rates → history.  
6. Cancel works in searching / accepted / arrived; not after start.

---

## Explicit non‑goals (for now)

Real payments, push notifications, chat, turn‑by‑turn nav, surge, multi‑stop, rider→customer rating.
