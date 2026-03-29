const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String, required: true, unique: true,
    lowercase: true, trim: true
  },
  name: { type: String, trim: true },
  password: {
    type: String,
    select: false        // Never returned in queries by default
  },
  provider: {
    type: String,
    enum: ['local', 'google', 'github'],
    default: 'local'
  },
  providerId: { type: String },   // SSO user's external ID
  avatar: { type: String },       // Profile picture URL from SSO
  auditCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

// Auto-hash password before saving (only if modified)
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to verify password
UserSchema.methods.checkPassword = async function(candidate, hash) {
  return bcrypt.compare(candidate, hash);
};

module.exports = mongoose.model('User', UserSchema);
