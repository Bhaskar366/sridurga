const db = require("../config/database");


const shippping = {

  addProduct: (req, res) => {
    const {
      productid,
      productname,
      mechanicname,
      suppliername,
      description,
      productcompany,
      netrate,
      qty,
      mrp,
    } = req.body;

    if (!productid || !qty) {
      return res.status(400).json({ error: "Product ID and quantity are required" });
    }

    const insertSql = `
      INSERT INTO shipping
        (entrydate, productid, productname, mechanicname, suppliername, description, productcompany, netrate, qty, mrp)
      VALUES (CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        productname = VALUES(productname),
        mechanicname = VALUES(mechanicname),
        suppliername = VALUES(suppliername),
        description = VALUES(description),
        productcompany = VALUES(productcompany),
        netrate = VALUES(netrate),
        qty = qty + VALUES(qty),
        mrp = VALUES(mrp),
        entrydate = CURDATE()
    `;

    const values = [
      productid,
      productname,
      mechanicname,
      suppliername,
      description,
      productcompany,
      netrate,
      qty,
      mrp,
    ];

    db.query(insertSql, values, (err, result) => {
      if (err) {
        console.error("Insert/Update Error:", err);
        return res.status(500).json({ error: "Database operation failed" });
      }

      // Fetch updated quantity
      const checkQtySql = `SELECT qty FROM shipping WHERE productid = ?`;
      db.query(checkQtySql, [productid], (err2, stockRes) => {
        if (err2) {
          console.error("Stock fetch error:", err2);
          return res.status(500).json({ error: "Stock check failed" });
        }

        const updatedQty = stockRes[0]?.qty || 0;
        console.log(`✅ Updated qty for ${productid}: ${updatedQty}`);

        if (updatedQty <= 5) {
          // Handle reorder logic
          const checkReorderSql = `SELECT * FROM reorder WHERE productid = ?`;
          db.query(checkReorderSql, [productid], (err3, reorderRes) => {
            if (err3) return res.status(500).json({ error: "Reorder lookup failed" });

            if (reorderRes.length > 0) {
              const updateReorderSql = `UPDATE reorder SET qty = ? WHERE productid = ?`;
              db.query(updateReorderSql, [updatedQty, productid], (err4) => {
                if (err4) return res.status(500).json({ error: "Reorder update failed" });
                return res.json({ success: true, message: `Product updated & reorder updated.` });
              });
            } else {
              const insertReorderSql = `
                INSERT INTO reorder (productid, productname, suppliername, productcompany, qty)
                VALUES (?, ?, ?, ?, ?)
              `;
              db.query(insertReorderSql, [productid, productname, suppliername, productcompany, updatedQty], (err5) => {
                if (err5) return res.status(500).json({ error: "Reorder insert failed" });
                return res.json({ success: true, message: `Product updated & reorder inserted.` });
              });
            }
          });
        } else {
          // Remove from reorder table if needed
          const deleteReorderSql = `DELETE FROM reorder WHERE productid = ?`;
          db.query(deleteReorderSql, [productid], (err6) => {
            if (err6) return res.status(500).json({ error: "Reorder delete failed" });
            return res.json({ success: true, message: `Product updated & removed from reorder (if existed).` });
          });
        }
      });
    });
  },

  getProductById: (req, res) => {
    const { productid } = req.params;

    if (!productid) {
      return res.status(400).json({ error: "Missing product ID" });
    }

    const sql = `SELECT productname, mechanicname, suppliername, description, productcompany, netrate, mrp FROM shipping WHERE productid = ?`;

    db.query(sql, [productid], (err, result) => {
      if (err) {
        console.error("Product lookup error:", err);
        return res.status(500).json({ error: "DB error" });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(result[0]);
    });
  },

  getProductsPaginated: (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const sql = `
          SELECT DATE_FORMAT(entrydate, '%Y-%m-%d') AS entrydate, productid, productname, mechanicname, suppliername, description,
                 productcompany, netrate, qty, mrp
          FROM shipping
          ORDER BY id DESC
          LIMIT ? OFFSET ?
        `;

    db.query(sql, [limit, offset], (err, results) => {
      if (err) {
        console.error("Error fetching paginated products:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ products: results });
    });
  },

  //**index.htmml products list add to cart */
  getProductsdata: (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    const searchTerm = `%${search}%`;

    let sql = `
        SELECT productid, productname, mechanicname, description,
               productcompany, qty, mrp
        FROM shipping
      `;

    let sqlParams = [];

    if (search) {
      sql += ` WHERE productid LIKE ? OR productname LIKE ? OR mechanicname LIKE ?`;
      sqlParams.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    sqlParams.push(limit, offset);

    db.query(sql, sqlParams, (err, results) => {
      if (err) {
        console.error("Error fetching filtered products:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ products: results });
    });
  },
};

module.exports = shippping;
