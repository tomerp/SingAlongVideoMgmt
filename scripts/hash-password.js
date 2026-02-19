#!/usr/bin/env node
/**
 * Outputs bcrypt hash for a password. Used for AUTH_PASSWORD_HASH in .env.
 * Usage (with Node): node scripts/hash-password.js your-password
 * Or set PWD_TO_HASH and run: node scripts/hash-password.js
 */
const password = process.env.PWD_TO_HASH || process.argv[2] || "";
if (!password) {
  console.error("Usage: node scripts/hash-password.js <password>");
  console.error("   or: PWD_TO_HASH=yourpass node scripts/hash-password.js");
  process.exit(1);
}
const bcrypt = require("bcryptjs");
console.log(bcrypt.hashSync(password, 10));
