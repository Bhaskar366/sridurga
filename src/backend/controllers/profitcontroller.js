const db = require("../config/database");

const profitPerUnit = {
    getDailyProfitPaginated: (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const query = `
          SELECT 
            DATE_FORMAT(orderdate, '%Y-%m-%d') AS orderdate,
            productid, productname, mechanicname, description,
            productcompany, qty, soldprice, netrate, profit
          FROM dailyprofit
          ORDER BY orderdate DESC, id DESC
          LIMIT ? OFFSET ?
        `;

        db.query(query, [limit, offset], (err, results) => {
            if (err) {
                console.error("Pagination fetch error:", err);
                return res.status(500).json({ success: false, message: "Database error" });
            }

            res.json({ success: true, records: results });
        });
    },

    //**daily total sale value */
    getDailySummary: (req, res) => {
        const sql = `
            SELECT 
                SUM(qty) AS totalQty,
                SUM(soldprice) AS totalSold
            FROM dailyprofit
            WHERE DATE(orderdate) = CURDATE()
        `;

        db.query(sql, (err, results) => {
            if (err) {
                console.error("Summary SQL error:", err);
                return res.status(500).json({ success: false });
            }

            const today = new Date().toISOString().split("T")[0];

            // results[0] will always exist even if SUM returns null
            res.json({
                success: true,
                latestDate: today,
                totalQty: results[0].totalQty || 0,
                totalSold: results[0].totalSold || 0,
            });
        });
    },

    //**total sale value of this month */
    getMonthlySummary: (req, res) => {
        const sql = `
            SELECT 
                SUM(qty) AS totalQty,
                SUM(soldprice) AS totalSold
            FROM dailyprofit
            WHERE MONTH(orderdate) = MONTH(CURDATE()) AND YEAR(orderdate) = YEAR(CURDATE())
        `;

        db.query(sql, (err, results) => {
            if (err) {
                console.error("Monthly summary SQL error:", err);
                return res.status(500).json({ success: false });
            }

            res.json({
                success: true,
                totalQty: results[0].totalQty || 0,
                totalSold: results[0].totalSold || 0,
            });
        });
    },

    //**today total profit */
    getTodayProfit: (req, res) => {
        const sql = `
            SELECT SUM(profit) AS totalProfit
            FROM dailyprofit
            WHERE DATE(orderdate) = CURDATE()
        `;

        db.query(sql, (err, results) => {
            if (err) {
                console.error("Today Profit SQL error:", err);
                return res.status(500).json({ success: false });
            }

            res.json({
                success: true,
                totalProfit: results[0].totalProfit || 0,
            });
        });
    },

    //**this month profit */
    getMonthlyProfit: (req, res) => {
        const sql = `
            SELECT 
                SUM(qty) AS totalQty,
                SUM(profit) AS totalProfit
            FROM dailyprofit
            WHERE MONTH(orderdate) = MONTH(CURDATE()) AND YEAR(orderdate) = YEAR(CURDATE())
        `;

        db.query(sql, (err, results) => {
            if (err) {
                console.error("Monthly Profit SQL error:", err);
                return res.status(500).json({ success: false });
            }

            res.json({
                success: true,
                totalQty: results[0].totalQty || 0,
                totalProfit: results[0].totalProfit || 0,
            });
        });
    },
};

module.exports = profitPerUnit;
