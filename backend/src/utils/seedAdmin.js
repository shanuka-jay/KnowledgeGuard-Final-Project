/**
 * Creates one admin account for a clean deployment.
 * Run: npm run seed:admin
 *
 * This script does not delete existing data. For a no-data deployment, use a
 * fresh MongoDB database name in MONGODB_URI before running it.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@knowledgeguard.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234';

async function seedAdmin() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    await mongoose.disconnect();
    return;
  }

  await User.create({
    name: 'System Admin',
    email: ADMIN_EMAIL,
    passwordHash: ADMIN_PASSWORD,
    role: 'admin',
    department: 'Administration',
    startDate: new Date(),
    consentGiven: true,
    consentDate: new Date(),
  });

  console.log('Admin account created');
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log('Change this password after first login.');

  await mongoose.disconnect();
}

seedAdmin().catch(err => {
  console.error('Admin seed failed:', err.message);
  process.exit(1);
});
