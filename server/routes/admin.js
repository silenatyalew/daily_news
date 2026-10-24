import express from "express";
import User from "../models/user.js";
import { verifyToken, verifyAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

// GET /api/admin/test
// Confirms the admin routes are reachable and the token is valid + admin role.
// Protected — requires a valid JWT with role:"admin"
router.get("/test", verifyToken, verifyAdmin, (req, res) => {
  res.json({
    message: "Admin access confirmed.",
    admin: {
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// GET /api/admin/dashboard
// Admin dashboard statistics
router.get("/dashboard", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: "admin" });

    res.json({
      message: "Welcome to the DailyNews Admin Dashboard!",
      statistics: { totalUsers, totalAdmins },
      admin: {
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error.message);
    res.status(500).json({ message: "Failed to load dashboard statistics." });
  }
});

// GET /api/admin/users
// List all registered users (admin only)
router.get("/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      totalUsers: await User.countDocuments(),
      users,
    });
  } catch (error) {
    console.error("Get users error:", error.message);
    res.status(500).json({ message: "Failed to load users." });
  }
});

// PATCH /api/admin/users/:id/role
// Promote or demote a user's role (admin only)
// Body: { "role": "admin" } or { "role": "user" }
router.patch("/users/:id/role", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: 'Role must be "user" or "admin".' });
    }

    // Prevent an admin from demoting themselves
    if (req.params.id === req.user._id.toString() && role !== "admin") {
      return res.status(400).json({ message: "You cannot remove your own admin role." });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, select: "-password" }
    );

    if (!updated) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: `Role updated to "${role}".`, user: updated });
  } catch (error) {
    console.error("Update role error:", error.message);
    res.status(500).json({ message: "Failed to update role." });
  }
});

export default router;
