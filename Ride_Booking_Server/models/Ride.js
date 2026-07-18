import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Ride status machine:
 * SEARCHING_FOR_RIDER → ACCEPTED → ARRIVED → START → COMPLETED
 *                                    ↘ CANCELLED (from searching/accepted)
 */
const rideSchema = new Schema(
  {
    vehicle: {
      type: String,
      enum: ["bike", "auto", "cabEconomy", "cabPremium"],
      required: true,
    },
    distance: {
      type: Number,
      required: true,
    },
    pickup: {
      address: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    drop: {
      address: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    fare: {
      type: Number,
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rider: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: [
        "SEARCHING_FOR_RIDER",
        "ACCEPTED",
        "ARRIVED",
        "START",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "SEARCHING_FOR_RIDER",
    },
    otp: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID"],
      default: "PENDING",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "card"],
      default: null,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    messages: [
      {
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, enum: ["customer", "rider"], required: true },
        text: { type: String, required: true, trim: true, maxlength: 500 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Ride = mongoose.model("Ride", rideSchema);
export default Ride;
