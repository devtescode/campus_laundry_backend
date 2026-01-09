module.exports.adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN);
  if (decoded.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }

  req.admin = decoded;
  next();
};
