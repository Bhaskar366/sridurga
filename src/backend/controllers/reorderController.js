const bcrypt = require("bcryptjs");
const db = require("../config/database");

const reorderController = {

    getSupplierNames: (req, res) => {
          const sql = `SELECT DISTINCT suppliername FROM reorder`;
          db.query(sql, (err, results) => {
            if (err) {
                console.error("Supplier fetch error:", err);
                return res.status(500).json({ success: false, message: "Database error" });
            }

            const supplierNames = results.map(row => row.suppliername);
            res.json({ success: true, suppliers: supplierNames });
        });
    },

    getReorderBySupplier: (req, res) => {
        const { supplier } = req.query;
        if (!supplier) {
            return res.status(400).json({ success: false, message: "Supplier name required" });
        }

        const sql = `
          SELECT productid, productname, suppliername, productcompany, qty, mrp, mechanicname, description
          FROM reorder
          WHERE suppliername = ?
        `;
        db.query(sql, [supplier], (err, results) => {
            if (err) {
                console.error("Error fetching reorder data:", err);
                return res.status(500).json({ success: false, message: "Database error" });
            }
            res.json({ success: true, data: results });
        });
    }

};

module.exports = reorderController;