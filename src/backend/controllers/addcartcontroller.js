const db = require("../config/database");

const addToCart = {
  addCart: (req, res) => {
    const cartItems = req.body.cart;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty or invalid" });
    }

    const processItem = (item, callback) => {
      const checkSql = `SELECT qty FROM addcart WHERE productid = ?`;
      db.query(checkSql, [item.productid], (err, results) => {
        if (err) return callback(err);

        if (results.length > 0) {
          // Increment quantity if already in cart
          const updateSql = `UPDATE addcart SET qty = qty + 1 WHERE productid = ?`;
          db.query(updateSql, [item.productid], callback);
        } else {
          // Fetch netrate from shipping table
          const netrateSql = `SELECT netrate FROM shipping WHERE productid = ?`;
          db.query(netrateSql, [item.productid], (err, netrateResult) => {
            if (err) return callback(err);
            const netrate = netrateResult[0]?.netrate || 0;

            // Insert into addcart
            const insertSql = `
              INSERT INTO addcart 
              (productid, productname, mechanicname, description, productcompany, qty, mrp, netrate)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(insertSql, [
              item.productid,
              item.productname,
              item.mechanicname,
              item.description,
              item.productcompany,
              1,
              item.mrp,
              netrate
            ], callback);
          });
        }
      });
    };

    let index = 0;
    const processNext = () => {
      if (index >= cartItems.length) {
        return res.json({ success: true, message: "Cart items added/updated successfully" });
      }
      processItem(cartItems[index], (err) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        index++;
        processNext();
      });
    };

    processNext();
  },

  getCart: (req, res) => {
    db.query("SELECT * FROM addcart", (err, results) => {
      if (err) return res.status(500).json({ success: false, message: "Failed to fetch cart" });
      res.json({ success: true, cart: results });
    });
  },

  clearCart: (req, res) => {
    db.query("TRUNCATE TABLE addcart", (err) => {
      if (err) return res.status(500).json({ success: false, message: "Failed to clear cart" });
      res.json({ success: true, message: "Cart cleared" });
    });
  },

};

module.exports = addToCart;
