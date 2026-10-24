/**
 * One-time script: promote a user to admin by email.
 *
 * Usage:
 *   node makeAdmin.js your@email.com
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.js";

dotenv.config();

const email = process.argv[2];

if (!email) {
  console.error("Usage: node makeAdmin.js <email>");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dailynews");

const user = await User.findOneAndUpdate(
  { email: email.toLowerCase().trim() },
  { role: "admin" },
  { new: true }
);

if (!user) {
  console.error(`No user found with email: ${email}`);
} else {
  console.log(`✓ ${user.name} (${user.email}) is now an admin.`);
}

await mongoose.disconnect();
