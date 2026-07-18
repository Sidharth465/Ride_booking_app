import Ride from "../models/Ride.js";
import User from "../models/User.js";
import { BadRequestError, NotFoundError } from "../errors/index.js";
import { StatusCodes } from "http-status-codes";
import {
  calculateDistance,
  calculateFare,
  generateOTP,
  distanceInMeters,
  GEOFENCE_RADIUS_METERS,
} from "../utils/mapUtils.js";

const CANCELABLE_STATUSES = ["ACCEPTED", "ARRIVED"];
const PAYMENT_METHODS = ["cash", "upi", "card"];

/** Allowed rider-driven transitions (OTP start is separate). */
const STATUS_TRANSITIONS = {
  ACCEPTED: ["ARRIVED", "CANCELLED"],
  ARRIVED: [], // START only via verifyOtp
  START: ["COMPLETED"],
};

const partyId = (ref) => {
  if (!ref) return null;
  if (typeof ref === "string") return ref;
  if (ref._id) return ref._id.toString();
  return ref.toString?.() || null;
};

const ridePayload = (ride) => {
  const obj = typeof ride.toObject === "function" ? ride.toObject() : { ...ride };
  // Ensure plain JSON (Socket.IO + mongoose docs can otherwise drop fields)
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Broadcast ride events to ride room AND stable user rooms.
 * User rooms survive better than relying only on ride_* after reconnect.
 */
const emitRideEvent = (io, ride, event, extra = null) => {
  if (!io || !ride) return;
  const payload = extra ?? ridePayload(ride);
  const rideId = partyId(ride._id) || payload._id;
  const customerId = partyId(ride.customer);
  const riderId = partyId(ride.rider);

  console.log(
    `[WS] emit ${event} ride=${rideId} status=${payload.status} → ride room + user rooms`
  );

  if (rideId) io.to(`ride_${rideId}`).emit(event, payload);
  if (customerId) io.to(`user_${customerId}`).emit(event, payload);
  if (riderId) io.to(`user_${riderId}`).emit(event, payload);
};

const assertWithinGeofence = (riderLat, riderLon, target, label) => {
  if (riderLat == null || riderLon == null) {
    throw new BadRequestError(
      `Current GPS location is required to mark ${label}`
    );
  }
  if (
    target?.latitude == null ||
    target?.longitude == null ||
    !Number.isFinite(Number(riderLat)) ||
    !Number.isFinite(Number(riderLon))
  ) {
    throw new BadRequestError("Invalid coordinates for geofence check");
  }

  const meters = distanceInMeters(
    Number(riderLat),
    Number(riderLon),
    Number(target.latitude),
    Number(target.longitude)
  );

  if (meters > GEOFENCE_RADIUS_METERS) {
    throw new BadRequestError(
      `You must be within ${GEOFENCE_RADIUS_METERS}m of the ${label} (currently ${Math.round(meters)}m away)`
    );
  }

  return meters;
};

export const createRide = async (req, res) => {
  const { vehicle, pickup, drop } = req.body;

  if (!vehicle || !pickup || !drop) {
    throw new BadRequestError("Vehicle, pickup, and drop details are required");
  }

  const {
    address: pickupAddress,
    latitude: pickupLat,
    longitude: pickupLon,
  } = pickup;

  const { address: dropAddress, latitude: dropLat, longitude: dropLon } = drop;

  if (
    !pickupAddress ||
    pickupLat == null ||
    pickupLon == null ||
    !dropAddress ||
    dropLat == null ||
    dropLon == null
  ) {
    throw new BadRequestError("Complete pickup and drop details are required");
  }

  const customer = req.user;

  try {
    // One active trip at a time
    const existing = await Ride.findOne({
      customer: customer.id,
      $or: [
        {
          status: {
            $in: ["SEARCHING_FOR_RIDER", "ACCEPTED", "ARRIVED", "START"],
          },
        },
        { status: "COMPLETED", paymentStatus: { $ne: "PAID" } },
      ],
    }).select("_id status paymentStatus");

    if (existing) {
      throw new BadRequestError(
        "You already have an active ride. Finish or cancel it before booking another."
      );
    }

    const distance = calculateDistance(pickupLat, pickupLon, dropLat, dropLon);
    const fare = calculateFare(distance);

    const ride = new Ride({
      vehicle,
      distance,
      fare: fare[vehicle],
      pickup: {
        address: pickupAddress,
        latitude: pickupLat,
        longitude: pickupLon,
      },
      drop: { address: dropAddress, latitude: dropLat, longitude: dropLon },
      customer: customer.id,
      otp: generateOTP(),
      status: "SEARCHING_FOR_RIDER",
    });

    await ride.save();

    res.status(StatusCodes.CREATED).json({
      message: "Ride created successfully",
      ride,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof BadRequestError) throw error;
    throw new BadRequestError("Failed to create ride");
  }
};

export const acceptRide = async (req, res) => {
  const riderId = req.user.id;
  const { rideId } = req.params;

  if (!rideId) {
    throw new BadRequestError("Ride ID is required");
  }

  try {
    // Atomic accept — first rider wins
    let ride = await Ride.findOneAndUpdate(
      { _id: rideId, status: "SEARCHING_FOR_RIDER", rider: null },
      { $set: { rider: riderId, status: "ACCEPTED" } },
      { new: true }
    )
      .populate("customer", "phone role")
      .populate("rider", "phone role");

    if (!ride) {
      throw new BadRequestError("Ride is no longer available for assignment");
    }

    emitRideEvent(req.io, ride, "rideUpdate");
    emitRideEvent(req.io, ride, "rideAccepted");

    // Rider should not rely on OTP from payload — strip for this response copy
    const rideJson = ride.toObject();
    const { otp, ...rideForRider } = rideJson;

    res.status(StatusCodes.OK).json({
      message: "Ride accepted successfully",
      ride: { ...rideForRider, otp: undefined },
    });
  } catch (error) {
    console.error("Error accepting ride:", error);
    if (error instanceof BadRequestError) throw error;
    throw new BadRequestError("Failed to accept ride");
  }
};

export const updateRideStatus = async (req, res) => {
  const riderId = req.user.id;
  const { rideId } = req.params;
  const { status, latitude, longitude } = req.body;

  if (!rideId || !status) {
    throw new BadRequestError("Ride ID and status are required");
  }

  try {
    let ride = await Ride.findById(rideId).populate("customer rider");

    if (!ride) {
      throw new NotFoundError("Ride not found");
    }

    if (!ride.rider || ride.rider._id.toString() !== riderId) {
      throw new BadRequestError("Only the assigned rider can update this ride");
    }

    const allowed = STATUS_TRANSITIONS[ride.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestError(
        `Cannot change status from ${ride.status} to ${status}`
      );
    }

    // Geofence for complete disabled for now (dev / testing)
    // if (status === "COMPLETED") {
    //   assertWithinGeofence(latitude, longitude, ride.drop, "drop");
    // }

    ride.status = status;
    await ride.save();
    ride = await Ride.findById(rideId).populate("customer rider");

    emitRideEvent(req.io, ride, "rideUpdate");

    // Strip OTP from rider response
    const rideJson = ride.toObject();
    delete rideJson.otp;

    res.status(StatusCodes.OK).json({
      message: `Ride status updated to ${status}`,
      ride: rideJson,
    });
  } catch (error) {
    console.error("Error updating ride status:", error);
    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      throw error;
    }
    throw new BadRequestError("Failed to update ride status");
  }
};

/** Rider enters customer OTP to start the trip */
export const verifyOtpAndStart = async (req, res) => {
  const riderId = req.user.id;
  const { rideId } = req.params;
  const { otp } = req.body;

  if (!rideId || !otp) {
    throw new BadRequestError("Ride ID and OTP are required");
  }

  try {
    let ride = await Ride.findById(rideId).populate("customer rider");

    if (!ride) {
      throw new NotFoundError("Ride not found");
    }

    if (!ride.rider || ride.rider._id.toString() !== riderId) {
      throw new BadRequestError("Only the assigned rider can start this ride");
    }

    if (ride.status !== "ARRIVED") {
      throw new BadRequestError("Mark arrived at pickup before starting");
    }

    if (String(ride.otp) !== String(otp).trim()) {
      throw new BadRequestError("Invalid OTP");
    }

    ride.status = "START";
    await ride.save();
    ride = await Ride.findById(rideId).populate("customer rider");

    emitRideEvent(req.io, ride, "rideUpdate");
    emitRideEvent(req.io, ride, "rideStarted");

    const rideJson = ride.toObject();
    delete rideJson.otp;

    res.status(StatusCodes.OK).json({
      message: "OTP verified — trip started",
      ride: rideJson,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      throw error;
    }
    throw new BadRequestError("Failed to verify OTP");
  }
};

export const cancelRide = async (req, res) => {
  const userId = req.user.id;
  const { rideId } = req.params;

  if (!rideId) {
    throw new BadRequestError("Ride ID is required");
  }

  try {
    const ride = await Ride.findById(rideId).populate("customer rider");
    if (!ride) {
      throw new NotFoundError("Ride not found");
    }

    const isCustomer = ride.customer?._id?.toString() === userId;
    const isRider = ride.rider?._id?.toString() === userId;
    if (!isCustomer && !isRider) {
      throw new BadRequestError("Not authorized to cancel this ride");
    }

    if (!CANCELABLE_STATUSES.includes(ride.status)) {
      throw new BadRequestError(
        `Cannot cancel a ride in status ${ride.status}`
      );
    }

    ride.status = "CANCELLED";
    await ride.save();

    const message = isCustomer
      ? "Customer canceled the ride."
      : "Rider canceled the ride.";

    emitRideEvent(req.io, ride, "rideCanceled", { message, rideId });
    emitRideEvent(req.io, ride, "rideUpdate");

    res.status(StatusCodes.OK).json({
      message: "Ride canceled",
      ride,
    });
  } catch (error) {
    console.error("Error canceling ride:", error);
    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      throw error;
    }
    throw new BadRequestError("Failed to cancel ride");
  }
};

/** Mock payment — no real gateway; modular for later Stripe/Razorpay swap */
export const payForRide = async (req, res) => {
  const userId = req.user.id;
  const { rideId } = req.params;
  const { method } = req.body;

  if (!rideId) {
    throw new BadRequestError("Ride ID is required");
  }

  if (!PAYMENT_METHODS.includes(method)) {
    throw new BadRequestError("Valid payment method required (cash, upi, card)");
  }

  try {
    let ride = await Ride.findById(rideId).populate("customer rider");
    if (!ride) {
      throw new NotFoundError("Ride not found");
    }

    if (ride.customer?._id?.toString() !== userId) {
      throw new BadRequestError("Only the customer can pay for this ride");
    }

    if (ride.status !== "COMPLETED") {
      throw new BadRequestError("Ride must be completed before payment");
    }

    if (ride.paymentStatus === "PAID") {
      throw new BadRequestError("Ride already paid");
    }

    ride.paymentStatus = "PAID";
    ride.paymentMethod = method;
    await ride.save();
    ride = await Ride.findById(rideId).populate("customer rider");

    emitRideEvent(req.io, ride, "rideUpdate");

    res.status(StatusCodes.OK).json({
      message: "Payment successful",
      ride,
    });
  } catch (error) {
    console.error("Error paying for ride:", error);
    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      throw error;
    }
    throw new BadRequestError("Failed to process payment");
  }
};

export const rateRide = async (req, res) => {
  const userId = req.user.id;
  const { rideId } = req.params;
  const { rating } = req.body;
  const stars = Number(rating);

  if (!rideId) {
    throw new BadRequestError("Ride ID is required");
  }

  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    throw new BadRequestError("Rating must be an integer between 1 and 5");
  }

  try {
    let ride = await Ride.findById(rideId);
    if (!ride) {
      throw new NotFoundError("Ride not found");
    }

    if (ride.customer?.toString() !== userId) {
      throw new BadRequestError("Only the customer can rate this ride");
    }

    if (ride.status !== "COMPLETED") {
      throw new BadRequestError("Can only rate a completed ride");
    }

    if (ride.rating != null) {
      throw new BadRequestError("Ride already rated");
    }

    if (!ride.rider) {
      throw new BadRequestError("No rider assigned to rate");
    }

    ride.rating = stars;
    await ride.save();

    await User.findByIdAndUpdate(ride.rider, {
      $inc: { ratingSum: stars, ratingCount: 1 },
    });

    ride = await Ride.findById(rideId).populate("customer rider");
    emitRideEvent(req.io, ride, "rideUpdate");

    res.status(StatusCodes.OK).json({
      message: "Rating submitted",
      ride,
    });
  } catch (error) {
    console.error("Error rating ride:", error);
    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      throw error;
    }
    throw new BadRequestError("Failed to submit rating");
  }
};

export const getMyRides = async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  try {
    const query = {
      $or: [{ customer: userId }, { rider: userId }],
    };

    if (status) {
      query.status = status;
    }

    const rides = await Ride.find(query)
      .populate("customer", "phone")
      .populate("rider", "phone")
      .sort({ createdAt: -1 });

    // Hide OTP from riders in list
    const sanitized = rides.map((r) => {
      const obj = r.toObject();
      if (req.user.role === "rider") {
        delete obj.otp;
      }
      return obj;
    });

    res.status(StatusCodes.OK).json({
      message: "Rides retrieved successfully",
      count: sanitized.length,
      rides: sanitized,
    });
  } catch (error) {
    console.error("Error retrieving rides:", error);
    throw new BadRequestError("Failed to retrieve rides");
  }
};
