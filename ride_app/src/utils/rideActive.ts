/** Statuses that block booking another ride */
export const BLOCKING_RIDE_STATUSES = [
  "SEARCHING_FOR_RIDER",
  "ACCEPTED",
  "ARRIVED",
  "START",
] as const;

export type RideLike = {
  status?: string;
  paymentStatus?: string | null;
} | null;

/**
 * True if customer must finish/cancel this ride before booking another.
 * COMPLETED still blocks until paid.
 */
export const hasBlockingActiveRide = (ride: RideLike) => {
  if (!ride?.status) return false;
  if (
    (BLOCKING_RIDE_STATUSES as readonly string[]).includes(ride.status)
  ) {
    return true;
  }
  if (ride.status === "COMPLETED" && ride.paymentStatus !== "PAID") {
    return true;
  }
  return false;
};
