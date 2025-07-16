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
            // Step 1: Fetch netrate for all productids
            const productIds = cart.map(item => item.productid);
            const placeholders = productIds.map(() => '?').join(',');
            const netrateQuery = `SELECT productid, netrate FROM shipping WHERE productid IN (${placeholders})`;
            const [netrateResults] = await db.promise().query(netrateQuery, productIds);

            const netrateMap = {};
            netrateResults.forEach(row => {
                netrateMap[row.productid] = parseFloat(row.netrate) || 0;
            });

            // Step 2: Prepare data for inserts
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

                // myorder insert
                myOrderValues.push([
                    today, item.productid, item.productname, item.mechanicname,
                    item.description, item.productcompany, qty, mrp,
                    gross, percentage, percentAmt, sold
                ]);

                // dailyprofit insert
                dailyProfitValues.push([
                    today, item.productid, item.productname, item.mechanicname,
                    item.description, item.productcompany, qty, sold,
                    netrate, mrp, totalProfit  // ✅ mrp before profit
                ]);
            });

            // Step 3: Insert to myorder
            await db.promise().query(`
                INSERT INTO myorder (
                    orderdate, productid, productname, mechanicname, description,
                    productcompany, qty, mrp, grossamount, percentage, percentageamount, soldprice
                ) VALUES ?`, [myOrderValues]);

            // Step 4: Insert to dailyprofit
            await db.promise().query(`
                INSERT INTO dailyprofit (
                    orderdate, productid, productname, mechanicname, description,
                    productcompany, qty, soldprice, netrate, mrp, profit
                ) VALUES ?`, [dailyProfitValues]);

            // Step 5: Update stock and reorder
            for (const item of cart) {
                await db.promise().query(
                    `UPDATE shipping SET qty = qty - ? WHERE productid = ?`,
                    [item.qty, item.productid]
                );

                const [updatedStock] = await db.promise().query(
                    `SELECT productid, productname, suppliername, productcompany, qty, mrp FROM shipping WHERE productid = ?`,
                    [item.productid]
                );

                const details = updatedStock[0];
                const updatedQty = parseFloat(details?.qty) || 0;
                const updatedMrp = parseFloat(details?.mrp) || 0;

                if (updatedQty <= 5) {
                    const [existing] = await db.promise().query(
                        `SELECT qty FROM reorder WHERE productid = ?`,
                        [details.productid]
                    );

                    if (existing.length > 0) {
                        await db.promise().query(
                            `UPDATE reorder SET qty = ?, mrp = ? WHERE productid = ?`,
                            [updatedQty, updatedMrp, details.productid]
                        );
                    } else {
                        await db.promise().query(
                            `INSERT INTO reorder (productid, productname, suppliername, productcompany, qty, mrp)
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [
                                details.productid,
                                details.productname,
                                details.suppliername,
                                details.productcompany,
                                updatedQty,
                                updatedMrp
                            ]
                        );
                    }
                } else {
                    await db.promise().query(
                        `DELETE FROM reorder WHERE productid = ?`,
                        [details.productid]
                    );
                }
            }

            // Step 6: Clear the cart
            await db.promise().query(`TRUNCATE TABLE addcart`);

            return res.json({ success: true, message: "Order placed, stock updated, profit calculated, reorder managed." });

        } catch (err) {
            console.error("Order processing error:", err);
            return res.status(500).json({ success: false, message: "Order processing failed" });
        }
    },
}

module.exports = checkout;