const bcrypt = require('bcryptjs');

// Grab the password from the command line arguments
const password = process.argv[2];

if (!password) {
  console.error("Error: Please provide a password to hash.");
  process.exit(1);
}

// Hash the password with a salt round of 10
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error("Error hashing password:", err);
    process.exit(1);
  }
  console.log("Original:", password);
  console.log("Hashed:  ", hash);
});

// Usage: node scripts/hash-password.js "yourAdminPassword"
