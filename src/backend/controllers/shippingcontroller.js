const db = require("../config/database");


const shippping = {

  addProduct: async (req, res) => {
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
  
    try {
      await db.promise().query(insertSql, values);
  
      // ✅ Always fetch full updated row after insertion
      const [productRows] = await db.promise().query(
        `SELECT productid, productname, suppliername, productcompany, qty, mrp FROM shipping WHERE productid = ?`,
        [productid]
      );
  
      const product = productRows[0];
      if (!product) {
        return res.status(500).json({ error: "Product not found after insertion" });
      }
  
      const updatedQty = parseFloat(product.qty) || 0;
      const updatedMrp = parseFloat(product.mrp);
  
      console.log(`📦 Product ${productid} has updated qty: ${updatedQty}, mrp: ${updatedMrp}`);
  
      if (updatedQty < 5) {
        if (!updatedMrp || isNaN(updatedMrp)) {
          console.error("❌ MRP is missing or invalid, cannot insert into reorder.");
          return res.status(500).json({ error: "MRP missing, cannot insert into reorder" });
        }
  
        // Check reorder table
        const [reorderRows] = await db.promise().query(
          `SELECT * FROM reorder WHERE productid = ?`,
          [productid]
        );
  
        if (reorderRows.length > 0) {
          // Update existing reorder record
          await db.promise().query(
            `UPDATE reorder SET qty = ?, mrp = ? WHERE productid = ?`,
            [updatedQty, updatedMrp, productid]
          );
          return res.json({ success: true, message: "Product updated & reorder record updated." });
        } else {
          // Insert new reorder record
          await db.promise().query(
            `INSERT INTO reorder (productid, productname, suppliername, productcompany, qty, mrp)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [product.productid, product.productname, product.suppliername, product.productcompany, updatedQty, updatedMrp]
          );
          return res.json({ success: true, message: "Product updated & reorder record inserted." });
        }
      } else if (updatedQty > 5) {
        // ✅ If qty > 5 → remove from reorder
        await db.promise().query(
          `DELETE FROM reorder WHERE productid = ?`,
          [productid]
        );
        return res.json({ success: true, message: "Product updated & removed from reorder if existed." });
      } else {
        // qty == 5, no reorder action
        return res.json({ success: true, message: "Product updated, no reorder action for qty 5." });
      }
    } catch (err) {
      console.error("Insert/Update Error:", err);
      return res.status(500).json({ error: "Database operation failed" });
    }
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