import jwt from "jsonwebtoken";
import User from "../models/User.js";
import NotFoundError from "../errors/not-found.js";
import UnauthenticatedError from "../errors/unauthenticated.js";

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnauthenticatedError("Authentication invalid");
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(payload.id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    req.user = {
      id: user._id.toString(),
      phone: user.phone,
      role: user.role,
    };
    req.socket = req.io;

    next();
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new UnauthenticatedError("Authentication invalid");
  }
};

export default auth;
