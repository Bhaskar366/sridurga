const db = require("../config/database");

const checkout = {

    getAddCart: (req, res) => {
        const sql = `
            SELECT 
                productid, 
                productname, 
                mechanicname, 
                description, 
                productcompany, 
                qty, 
                mrp 
            FROM addcart
            ORDER BY id DESC
        `;

        db.query(sql, (err, results) => {
            if (err) {
                console.error("Error fetching addcart data:", err);
                return res.status(500).json({ success: false, message: "Database error" });
            }
            res.json({ success: true, cart: results });
        });
    },

    placeOrder: async (req, res) => {
        const cart = req.body.cart;
        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ success: false, message: "Empty cart" });
        }

        const today = new Date();

        try {
            // Fetch netrates for all productids in one query
            const productIds = cart.map(item => item.productid);
            const placeholders = productIds.map(() => '?').join(',');

            const netrateQuery = `SELECT productid, netrate FROM shipping WHERE productid IN (${placeholders})`;
            const [netrateResults] = await db.promise().query(netrateQuery, productIds);

            const netrateMap = {};
            netrateResults.forEach(row => {
                netrateMap[row.productid] = parseFloat(row.netrate) || 0;
            });

            // Prepare insert values for myorder and dailyprofit
            const myOrderValues = [];
            const dailyProfitValues = [];

            cart.forEach(item => {
                const qty = parseFloat(item.qty) || 0;
                const mrp = parseFloat(item.mrp) || 0;
                const gross = qty * mrp;
                const percentage = parseFloat(item.percentage) || 0;
                const percentAmt = (percentage / 100) * gross;
                const sold = gross - percentAmt;

                const netrate = netrateMap[item.productid] || 0;
                const unitSold = qty > 0 ? sold / qty : 0;
                const profitPerUnit = unitSold - netrate;
                const totalProfit = profitPerUnit * qty;

                // For myorder table
                myOrderValues.push([
                    today, item.productid, item.productname, item.mechanicname,
                    item.description, item.productcompany, qty, mrp,
                    gross, percentage, percentAmt, sold
                ]);

                // For dailyprofit table
                dailyProfitValues.push([
                    today, item.productid, item.productname, item.mechanicname,
                    item.description, item.productcompany, qty, sold,
                    netrate, totalProfit
                ]);
            });

            // Insert into myorder
            const insertOrderQuery = `
                INSERT INTO myorder (
                    orderdate, productid, productname, mechanicname, description,
                    productcompany, qty, mrp, grossamount, percentage, percentageamount, soldprice
                ) VALUES ?
            `;

            await db.promise().query(insertOrderQuery, [myOrderValues]);

            // Insert into dailyprofit
            const insertProfitQuery = `
                INSERT INTO dailyprofit (
                    orderdate, productid, productname, mechanicname, description,
                    productcompany, qty, soldprice, netrate, profit
                ) VALUES ?
            `;

            await db.promise().query(insertProfitQuery, [dailyProfitValues]);

            // Update stock and check for reorder condition
            for (const item of cart) {
                // Update stock
                await db.promise().query(
                    `UPDATE shipping SET qty = qty - ? WHERE productid = ?`,
                    [item.qty, item.productid]
                );

                // Check new qty and fetch product details from shipping
                const [updatedStock] = await db.promise().query(
                    `SELECT productid, productname, suppliername, productcompany, qty FROM shipping WHERE productid = ?`,
                    [item.productid]
                );

                const details = updatedStock[0];
                const updatedQty = details?.qty || 0;

                if (updatedQty <= 5) {
                    // Check if product exists in reorder table
                    const [existing] = await db.promise().query(
                        `SELECT qty FROM reorder WHERE productid = ?`,
                        [details.productid]
                    );

                    if (existing.length > 0) {
                        // Update to reflect current stock exactly, no addition
                        await db.promise().query(
                            `UPDATE reorder SET qty = ? WHERE productid = ?`,
                            [updatedQty, details.productid]
                        );
                    } else {
                        // Insert new entry
                        await db.promise().query(
                            `INSERT INTO reorder (productid, productname, suppliername, productcompany, qty)
                             VALUES (?, ?, ?, ?, ?)`,
                            [details.productid, details.productname, details.suppliername, details.productcompany, updatedQty]
                        );
                    }
                } else {
                    // Delete if above 5
                    await db.promise().query(
                        `DELETE FROM reorder WHERE productid = ?`,
                        [item.productid]
                    );
                }
            }

            // Step 5: Clear the cart
            await db.promise().query(`TRUNCATE TABLE addcart`);

            return res.json({ success: true, message: "Order placed, stock updated, profit calculated, reorder managed." });


        } catch (err) {
            console.error("Order processing error:", err);
            return res.status(500).json({ success: false, message: "Order processing failed" });
        }
    },

};

module.exports = checkout;