import geolib from "geolib";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Ride from "../models/Ride.js";

/** riderId(string) → { socketId, coords: { latitude, longitude } } */
const onDutyRiders = new Map();

const normalizeCoords = (coords = {}) => {
  const latitude = Number(coords.latitude ?? coords.lat);
  const longitude = Number(coords.longitude ?? coords.lng ?? coords.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return {
    latitude,
    longitude,
    heading: Number(coords.heading) || 0,
  };
};

const extractToken = (socket) => {
  return (
    socket.handshake?.auth?.access_token ||
    socket.handshake?.query?.access_token ||
    socket.handshake?.headers?.access_token ||
    null
  );
};

const handleSocketConnection = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = extractToken(socket);
      if (!token) {
        return next(new Error("Authentication invalid: No token"));
      }

      const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(payload.id);
      if (!user) {
        return next(new Error("Authentication invalid: User not found"));
      }

      socket.user = {
        id: user._id.toString(),
        role: user.role,
      };
      next();
    } catch (error) {
      console.error("Socket Auth Error:", error.message);
      next(new Error("Authentication invalid: Token verification failed"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    // Stable personal room — ride status updates target this even after reconnect
    socket.join(`user_${user.id}`);
    console.log(`[WS] User joined: ${user.id} (${user.role}) socket=${socket.id}`);

    const registerOnDuty = (rawCoords, source) => {
      const coords = normalizeCoords(rawCoords);
      if (!coords) {
        console.log(
          `[WS] ${source} ignored — bad coords from ${user.id}`,
          rawCoords
        );
        socket.emit("error", { message: `Invalid coordinates for ${source}` });
        return null;
      }

      const already = onDutyRiders.has(user.id);
      onDutyRiders.set(user.id, {
        socketId: socket.id,
        coords,
        riderId: user.id,
      });
      socket.join("onDuty");

      if (!already || source === "goOnDuty") {
        console.log(
          `[WS] Rider ON duty via ${source}: ${user.id} @ ${coords.latitude},${coords.longitude} (onDuty=${onDutyRiders.size})`
        );
        socket.emit("dutyStatus", {
          onDuty: true,
          onDutyCount: onDutyRiders.size,
        });
        scheduleNearbyUpdate();
      } else if (source === "updateLocation") {
        // Keep customer home-map icons in sync as riders move
        scheduleNearbyUpdate();
      }

      return coords;
    };

    // Always bind duty handlers; reject non-riders loudly (silent ignore caused confusion)
    socket.on("goOnDuty", (rawCoords) => {
      if (user.role !== "rider") {
        console.log(
          `[WS] goOnDuty REJECTED — user ${user.id} role=${user.role} (need rider)`
        );
        socket.emit("error", {
          message: `goOnDuty requires rider role (you are ${user.role})`,
        });
        return;
      }
      registerOnDuty(rawCoords, "goOnDuty");
    });

    socket.on("goOffDuty", () => {
      if (user.role !== "rider") return;
      onDutyRiders.delete(user.id);
      socket.leave("onDuty");
      console.log(`[WS] Rider OFF duty: ${user.id} (onDuty=${onDutyRiders.size})`);
      socket.emit("dutyStatus", {
        onDuty: false,
        onDutyCount: onDutyRiders.size,
      });
      scheduleNearbyUpdate();
    });

    socket.on("updateLocation", (rawCoords) => {
      if (user.role !== "rider") return;

      // Upsert: location pings re-register after reconnect (client only sends these while ON)
      const coords = registerOnDuty(rawCoords, "updateLocation");
      if (!coords) return;

      // io.to (not socket.to) so all customers in the room get updates
      io.to(`rider_${user.id}`).emit("riderLocationUpdate", {
        riderId: user.id,
        coords,
      });
    });

    if (user.role === "customer") {
      /** rideId → search interval id */
      const activeSearches = new Map();

      const stopSearch = (rideId) => {
        const id = String(rideId);
        const handle = activeSearches.get(id);
        if (handle) {
          clearInterval(handle);
          activeSearches.delete(id);
        }
      };

      socket.on("subscribeToZone", (customerCoords) => {
        const coords = normalizeCoords(customerCoords);
        if (!coords) {
          console.log("[WS] subscribeToZone ignored — bad coords", customerCoords);
          return;
        }
        socket.user.coords = coords;
        const list = sendNearbyRiders(socket, coords);
        console.log(
          `[WS] subscribeToZone customer=${user.id} → ${list.length} on-duty rider(s) (total onDuty=${onDutyRiders.size})`
        );
      });

      // Single cancel handler — must pass rideId (avoids stacked listeners canceling wrong trip)
      socket.on("cancelRide", async (payload) => {
        const rideId = String(
          typeof payload === "string" ? payload : payload?.rideId || ""
        );
        if (!rideId || rideId === "undefined") {
          console.log(`[WS] cancelRide ignored — missing rideId from ${user.id}`);
          return;
        }

        stopSearch(rideId);

        try {
          const current = await Ride.findById(rideId);
          if (!current) {
            socket.emit("rideCanceled", {
              rideId,
              message: "Ride not found",
            });
            return;
          }

          if (current.customer?.toString() !== user.id) {
            socket.emit("error", { message: "Not your ride to cancel" });
            return;
          }

          // Socket cancel is ONLY for search phase
          if (current.status !== "SEARCHING_FOR_RIDER") {
            console.log(
              `[WS] cancelRide ignored — ride ${rideId} status=${current.status} (not searching)`
            );
            socket.emit("error", {
              message:
                "This ride is no longer searching. Use Cancel ride on the trip screen.",
            });
            return;
          }

          await Ride.findByIdAndDelete(rideId);
          console.log(`[WS] Customer ${user.id} canceled searching ride ${rideId}`);

          socket.emit("rideCanceled", {
            rideId,
            message: "Search canceled",
          });
          io.to(`ride_${rideId}`).emit("rideCanceled", {
            rideId,
            message: "Search canceled",
          });
        } catch (err) {
          console.error("[WS] cancelRide error", err);
          socket.emit("error", { message: "Failed to cancel ride" });
        }
      });

      socket.on("searchrider", async (rideId) => {
        const id = String(rideId);
        console.log(`[WS] searchrider from customer ${user.id} ride=${id}`);
        try {
          const ride = await Ride.findById(id).populate("customer rider");
          if (!ride) {
            return socket.emit("error", { message: "Ride not found" });
          }

          if (ride.customer?._id?.toString() !== user.id) {
            return socket.emit("error", { message: "Not your ride" });
          }

          if (ride.status !== "SEARCHING_FOR_RIDER") {
            return socket.emit("error", {
              message: "Ride is not searching for riders",
            });
          }

          // Restart search cleanly for this ride only
          stopSearch(id);

          const pickupLat = ride.pickup.latitude;
          const pickupLon = ride.pickup.longitude;

          let retries = 0;
          const MAX_RETRIES = 30;

          const retrySearch = async () => {
            if (!activeSearches.has(id)) return;
            retries++;

            const fresh = await Ride.findById(id);
            if (!fresh || fresh.status !== "SEARCHING_FOR_RIDER") {
              stopSearch(id);
              return;
            }

            console.log(
              `[WS] search attempt #${retries} ride=${id} onDutyRiders=${onDutyRiders.size}`
            );

            const riders = sendNearbyRiders(
              socket,
              { latitude: pickupLat, longitude: pickupLon },
              fresh
            );

            console.log(`[WS] nearby riders matched: ${riders.length}`);

            if (retries >= MAX_RETRIES) {
              stopSearch(id);
              const stillSearching = await Ride.findById(id);
              if (stillSearching?.status === "SEARCHING_FOR_RIDER") {
                await Ride.findByIdAndDelete(id);
                socket.emit("error", {
                  message: "No riders found nearby. Try again.",
                  rideId: id,
                });
              }
            }
          };

          const retryInterval = setInterval(retrySearch, 8000);
          activeSearches.set(id, retryInterval);
          retrySearch();
        } catch (error) {
          console.error("Error searching for rider:", error);
          socket.emit("error", { message: "Error searching for rider" });
        }
      });

      socket.on("disconnect", () => {
        for (const rideId of activeSearches.keys()) {
          stopSearch(rideId);
        }
      });
    }

    socket.on("subscribeToriderLocation", (riderId) => {
      const id = String(riderId);
      const rider = onDutyRiders.get(id);
      socket.join(`rider_${id}`);
      if (rider) {
        socket.emit("riderLocationUpdate", {
          riderId: id,
          coords: rider.coords,
        });
      }
      console.log(`[WS] ${user.id} subscribed to rider ${id} location`);
    });

    socket.on("subscribeRide", async (rideId) => {
      const id = String(rideId);
      socket.join(`ride_${id}`);
      // Also ensure user room (in case of reconnect before this handler)
      socket.join(`user_${user.id}`);
      console.log(`[WS] ${user.id} subscribed to ride_${id}`);
      try {
        const rideData = await Ride.findById(id).populate("customer rider");
        const payload =
          typeof rideData?.toObject === "function"
            ? rideData.toObject()
            : rideData;
        socket.emit("rideData", payload);
      } catch (error) {
        socket.emit("error", { message: "Failed to receive ride data" });
      }
    });

    const CHAT_STATUSES = ["ACCEPTED", "ARRIVED", "START"];

    socket.on("getChatHistory", async (rideId) => {
      try {
        const id = String(rideId);
        const ride = await Ride.findById(id).select(
          "customer rider status messages"
        );
        if (!ride) {
          return socket.emit("error", { message: "Ride not found" });
        }
        const customerId = ride.customer?.toString();
        const riderId = ride.rider?.toString();
        if (user.id !== customerId && user.id !== riderId) {
          return socket.emit("error", { message: "Not part of this ride" });
        }
        socket.join(`ride_${id}`);
        socket.emit("chatHistory", {
          rideId: id,
          messages: ride.messages || [],
        });
      } catch (err) {
        console.error("[WS] getChatHistory", err);
        socket.emit("error", { message: "Failed to load chat" });
      }
    });

    socket.on("sendChatMessage", async (payload = {}) => {
      try {
        const rideId = String(payload.rideId || "");
        const text = String(payload.text || "").trim().slice(0, 500);
        if (!rideId || !text) return;

        const ride = await Ride.findById(rideId);
        if (!ride) {
          return socket.emit("error", { message: "Ride not found" });
        }

        const customerId = ride.customer?.toString();
        const riderId = ride.rider?.toString();
        if (user.id !== customerId && user.id !== riderId) {
          return socket.emit("error", { message: "Not part of this ride" });
        }

        if (!CHAT_STATUSES.includes(ride.status)) {
          return socket.emit("error", {
            message: "Chat is only available during an active trip",
          });
        }

        const message = {
          sender: user.id,
          role: user.role,
          text,
          createdAt: new Date(),
        };

        ride.messages.push(message);
        await ride.save();

        const saved = ride.messages[ride.messages.length - 1];
        const out = {
          rideId,
          message: {
            _id: saved._id?.toString(),
            sender: user.id,
            role: user.role,
            text: saved.text,
            createdAt: saved.createdAt,
          },
        };

        io.to(`ride_${rideId}`).emit("chatMessage", out);
        if (customerId) io.to(`user_${customerId}`).emit("chatMessage", out);
        if (riderId) io.to(`user_${riderId}`).emit("chatMessage", out);

        // Notify the other party (not the sender) for in-app banner
        const peerId = user.id === customerId ? riderId : customerId;
        if (peerId) {
          io.to(`user_${peerId}`).emit("chatNotification", {
            ...out,
            preview: text.slice(0, 80),
            fromRole: user.role,
          });
        }
      } catch (err) {
        console.error("[WS] sendChatMessage", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      if (user.role === "rider") {
        onDutyRiders.delete(user.id);
        console.log(`[WS] Rider removed from onDuty on disconnect: ${user.id}`);
      }
      console.log(`[WS] ${user.role} ${user.id} disconnected`);
    });

    function updateNearbyriders() {
      io.sockets.sockets.forEach((s) => {
        if (s.user?.role === "customer" && s.user.coords) {
          sendNearbyRiders(s, s.user.coords);
        }
      });
    }

    /** Throttle map broadcasts while many riders GPS-ping */
    let nearbyUpdateTimer = null;
    function scheduleNearbyUpdate() {
      if (nearbyUpdateTimer) return;
      nearbyUpdateTimer = setTimeout(() => {
        nearbyUpdateTimer = null;
        updateNearbyriders();
      }, 1500);
    }

    /**
     * @param ride — when set, only riders within offer radius get the ride offer.
     *               when null (home map), ALL on-duty riders are shown (no range filter).
     */
    function sendNearbyRiders(customerSocket, location, ride = null) {
      const pickup = normalizeCoords(location);
      if (!pickup) {
        console.log("[WS] sendNearbyRiders — invalid pickup", location);
        return [];
      }

      const OFFER_RADIUS_M = 60000;
      const nearbyriders = [];

      for (const rider of onDutyRiders.values()) {
        const coords = normalizeCoords(rider.coords);
        if (!coords) continue;

        try {
          const distance = geolib.getDistance(coords, pickup); // meters

          // Ride offers still use a radius; map display shows every on-duty rider
          if (ride && distance > OFFER_RADIUS_M) {
            continue;
          }

          nearbyriders.push({
            riderId: rider.riderId,
            socketId: rider.socketId,
            coords,
            distance,
          });
        } catch (err) {
          console.log("[WS] geolib error", err.message, coords, pickup);
        }
      }

      nearbyriders.sort((a, b) => a.distance - b.distance);
      customerSocket.emit("nearbyriders", nearbyriders);

      if (ride) {
        const payload =
          typeof ride.toObject === "function" ? ride.toObject() : { ...ride };
        // Never leak OTP to nearby riders before accept
        delete payload.otp;

        nearbyriders.forEach((rider) => {
          console.log(
            `[WS] emitting rideOffer → rider ${rider.riderId} socket=${rider.socketId} dist=${rider.distance}m`
          );
          io.to(rider.socketId).emit("rideOffer", payload);
        });

        // If nobody nearby, tell customer (non-fatal)
        if (nearbyriders.length === 0) {
          customerSocket.emit("searchStatus", {
            message: "Searching… no on-duty riders nearby yet",
            onDutyCount: onDutyRiders.size,
          });
        }
      }

      return nearbyriders;
    }

    function getRiderSocket(riderId) {
      const rider = onDutyRiders.get(String(riderId));
      return rider ? io.sockets.sockets.get(rider.socketId) : null;
    }
  });
};

export default handleSocketConnection;
