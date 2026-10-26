// Catch-all for any route that isn’t handled above
module.exports = (req, res, next) => {
  res.status(404).json({ message: "🔍 Route not found" });
};