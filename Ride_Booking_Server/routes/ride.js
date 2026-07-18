import express from "express";
import {
  createRide,
  updateRideStatus,
  acceptRide,
  getMyRides,
  verifyOtpAndStart,
  cancelRide,
  payForRide,
  rateRide,
} from "../controllers/ride.js";
import authorizeRoles from "../middleware/authorize.js";

const router = express.Router();

router.post("/create", authorizeRoles("customer"), createRide);
router.patch("/accept/:rideId", authorizeRoles("rider"), acceptRide);
router.patch("/update/:rideId", authorizeRoles("rider"), updateRideStatus);
router.post(
  "/verify-otp/:rideId",
  authorizeRoles("rider"),
  verifyOtpAndStart
);
router.patch("/cancel/:rideId", cancelRide);
router.post("/pay/:rideId", authorizeRoles("customer"), payForRide);
router.post("/rate/:rideId", authorizeRoles("customer"), rateRide);
router.get("/rides", getMyRides);

export default router;
