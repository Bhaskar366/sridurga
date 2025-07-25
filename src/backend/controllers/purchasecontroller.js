const db = require("../config/database");


const purchasecontroller = {
addPurchase: (req, res) => {
        const { supplierName, purchasedAmount } = req.body;

        const currentDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
        const sql = "INSERT INTO supplierpurchases (suppliername, purchasedamount, date) VALUES (?, ?, ?)";
        db.query(sql, [supplierName, purchasedAmount, currentDate], (err, result) => {
            if (err) {
                console.error("Insert Error:", err);
                return res.status(500).json({ success: false });
            }
            res.json({ success: true });
        });
    },

    getPurchases: (req, res) => {
        const sql = "SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date, suppliername, purchasedamount FROM supplierpurchases ORDER BY date DESC";
        db.query(sql, (err, results) => {
            if (err) {
                console.error("Select Error:", err);
                return res.status(500).json([]);
            }
            res.json(results);
        });
    },
}
module.exports = purchasecontroller;