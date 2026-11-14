
import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token required"
      });
    }

    const token = authHeader.split(" ")[1];

    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(
      token,
      secret
    );

    req.user = {
      userId: decoded.userId
    };

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        error.name === "TokenExpiredError"
          ? "Access token expired"
          : "Invalid access token"
    });
  }
};
