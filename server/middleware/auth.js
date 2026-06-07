import jwt from "jsonwebtoken";

const readCookie = (cookieHeader, name) => {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((part) => part.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice(name.length + 1));
};

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;
  const cookieToken = readCookie(req.headers.cookie, "token");
  const token = bearerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({ error: "JWT secret is not configured" });
    }

    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }

    return res.status(401).json({ error: "Invalid token" });
  }
};

export const protect = authMiddleware;
