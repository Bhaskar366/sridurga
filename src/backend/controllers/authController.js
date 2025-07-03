const bcrypt = require("bcryptjs");
const db = require("../config/database");

const authController = {
  registerUser: (req, res) => {
    const { fullName, username, password } = req.body;

    if (!fullName || !username || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const checkQuery = "SELECT * FROM users WHERE username = ?";
    db.query(checkQuery, [username], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Database error" });
      if (result.length > 0) {
        return res.status(409).json({ success: false, message: "Username already exists" });
      }

      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ success: false, message: "Error hashing password" });

        const insertQuery = "INSERT INTO users (fullname, username, password) VALUES (?, ?, ?)";
        db.query(insertQuery, [fullName, username, hashedPassword], (err) => {
          if (err) return res.status(500).json({ success: false, message: "Error saving user" });

          res.json({ success: true });
        });
      });
    });
  },


  loginUser: (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Missing username or password" });
    }

    // First check in users table (staff)
    const userSql = "SELECT password FROM users WHERE username = ?";
    db.query(userSql, [username], (err, userResult) => {
      if (err) {
        console.error("User DB error:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (userResult.length > 0) {
        const hashedPassword = userResult[0].password;
        bcrypt.compare(password, hashedPassword, (err, match) => {
          if (err) {
            console.error("Password compare error:", err);
            return res.status(500).json({ success: false, message: "Error checking password" });
          }
          if (match) {
            return res.json({ success: true, role: "user" });
          } else {
            return res.json({ success: false, message: "Incorrect password" });
          }
        });
      } else {
        // Not found in users, try admin_users (using fullname here)
        const adminSql = "SELECT password FROM adminusers WHERE fullname = ?";
        db.query(adminSql, [username], (err2, adminResult) => {
          if (err2) {
            console.error("Admin DB error:", err2);
            return res.status(500).json({ success: false, message: "Database error" });
          }

          if (adminResult.length === 0) {
            return res.json({ success: false, message: "User not found" });
          }

          const hashedPassword = adminResult[0].password;
          bcrypt.compare(password, hashedPassword, (err3, matchAdmin) => {
            if (err3) {
              console.error("Password compare error:", err3);
              return res.status(500).json({ success: false, message: "Error checking password" });
            }

            if (matchAdmin) {
              return res.json({ success: true, role: "admin" });
            } else {
              return res.json({ success: false, message: "Incorrect password" });
            }
          });
        });
      }
    });
  },

};

module.exports = authController;
