const db = require("../config/database");

const myorder = {


  getOrdersByDate: (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Missing date parameter" });

    const ordersSql = `
        SELECT DATE_FORMAT(orderdate, '%Y-%m-%d') AS orderdate,
               productid, productname, mechanicname, description,
               productcompany, qty, mrp, percentage,
               percentageamount, soldprice AS grossamount
        FROM myorder
        WHERE DATE(orderdate) = ?
    `;

    const totalSql = `
        SELECT SUM(soldprice) AS total
        FROM myorder
        WHERE DATE(orderdate) = ?
    `;

    db.query(ordersSql, [date], (err, orders) => {
      if (err) {
        console.error("Order fetch error:", err);
        return res.status(500).json({ error: "Failed to fetch orders" });
      }

      db.query(totalSql, [date], (err2, totalResult) => {
        if (err2) {
          console.error("Total fetch error:", err2);
          return res.status(500).json({ error: "Failed to fetch total" });
        }

        const total = totalResult[0]?.total || 0;
        res.json({ date, orders, total });
      });
    });
  },

  //**delete from today orders */
  deleteOrderByProductAndDate: (req, res) => {
    const { productid, orderdate, deleteQty } = req.body;
    if (!productid || !orderdate || !deleteQty)
      return res.status(400).json({ success: false, message: "Missing data" });

    const selectSql = `SELECT qty, mrp, percentage FROM myorder WHERE productid = ? AND DATE(orderdate) = ?`;
    db.query(selectSql, [productid, orderdate], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: "Fetch error" });
      if (results.length === 0)
        return res.status(404).json({ success: false, message: "Order not found" });

      const currentQty = results[0].qty;
      const mrp = results[0].mrp;
      const percentage = results[0].percentage || 0;

      if (deleteQty > currentQty)
        return res.status(400).json({ success: false, message: "Delete quantity exceeds current quantity" });

      const newQty = currentQty - deleteQty;
      const grossAmount = mrp * newQty;
      const newSoldPrice = grossAmount - (grossAmount * (percentage / 100));

      const updateShippingSql = `UPDATE shipping SET qty = qty + ? WHERE productid = ?`;
      db.query(updateShippingSql, [deleteQty, productid], (errShipping) => {
        if (errShipping)
          return res.status(500).json({ success: false, message: "Failed to update shipping qty" });

        const checkShippingSql = `SELECT productid, productname, suppliername, productcompany, qty, mechanicname, description FROM shipping WHERE productid = ?`;
        db.query(checkShippingSql, [productid], (errCheck, shippingData) => {
          if (errCheck)
            return res.status(500).json({ success: false, message: "Failed to fetch updated shipping data" });

          const updatedQty = shippingData[0].qty;

          if (updatedQty < 5) {
            db.query(`SELECT qty FROM reorder WHERE productid = ?`, [productid], (errExist, reorderResult) => {
              if (errExist)
                return res.status(500).json({ success: false, message: "Failed to check reorder table" });

              const { productname, suppliername, productcompany, mechanicname, description } = shippingData[0];

              if (reorderResult.length > 0) {
                db.query(
                  `UPDATE reorder SET qty = ? WHERE productid = ?`,
                  [updatedQty, productid],
                  (errUpdate) => {
                    if (errUpdate)
                      return res.status(500).json({ success: false, message: "Failed to update reorder table" });
                  }
                );
              } else {
                db.query(
                  `INSERT INTO reorder (productid, productname, suppliername, productcompany, qty, mechanicname, description)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [productid, productname, suppliername, productcompany, updatedQty, mechanicname, description],
                  (errInsert) => {
                    if (errInsert)
                      return res.status(500).json({ success: false, message: "Failed to insert into reorder table" });
                  }
                );
              }
            });
          }
          else {
            // Remove from reorder table if qty >= 5
            db.query(`DELETE FROM reorder WHERE productid = ?`, [productid], (errDel) => {
              if (errDel)
                return res.status(500).json({ success: false, message: "Failed to remove from reorder table" });
            });
          }

          // Proceed with order deletion or update
          if (deleteQty === currentQty) {
            db.query(`DELETE FROM myorder WHERE productid = ? AND DATE(orderdate) = ?`, [productid, orderdate], (err1) => {
              if (err1) return res.status(500).json({ success: false, message: "Failed to delete from myorder" });

              db.query(`DELETE FROM dailyprofit WHERE productid = ? AND DATE(orderdate) = ?`, [productid, orderdate], (err2) => {
                if (err2) return res.status(500).json({ success: false, message: "Failed to delete from dailyprofit" });

                return res.json({ success: true, message: "Deleted entire order" });
              });
            });
          } else {
            const newPercentageAmount = grossAmount * (percentage / 100);
            db.query(
              `UPDATE myorder SET qty = ?, soldprice = ?, percentageamount = ? WHERE productid = ? AND DATE(orderdate) = ?`,
              [newQty, newSoldPrice, newPercentageAmount, productid, orderdate],
              (err3) => {
                if (err3) return res.status(500).json({ success: false, message: "Failed to update myorder" });

                db.query(
                  `UPDATE dailyprofit SET qty = ?, soldprice = ? WHERE productid = ? AND DATE(orderdate) = ?`,
                  [newQty, newSoldPrice, productid, orderdate],
                  (err4) => {
                    if (err4) return res.status(500).json({ success: false, message: "Failed to update dailyprofit" });

                    db.query(
                      `SELECT netrate, soldprice, qty FROM dailyprofit WHERE productid = ? AND DATE(orderdate) = ?`,
                      [productid, orderdate],
                      (err5, profitResults) => {
                        if (err5) return res.status(500).json({ success: false, message: "Failed to fetch dailyprofit" });

                        const { netrate, soldprice, qty } = profitResults[0];
                        const profit = ((soldprice / qty) - netrate) * qty;

                        db.query(
                          `UPDATE dailyprofit SET profit = ? WHERE productid = ? AND DATE(orderdate) = ?`,
                          [profit, productid, orderdate],
                          (err6) => {
                            if (err6) return res.status(500).json({ success: false, message: "Failed to update profit" });

                            return res.json({ success: true, message: "Partial quantity deleted and profit updated" });
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        });
      });
    });
  },



  getMonthsSummary: (req, res) => {
    let offset = parseInt(req.query.offset);
    let limit = parseInt(req.query.limit);

    if (isNaN(offset) || offset < 0) offset = 0;
    if (isNaN(limit) || limit <= 0) limit = 5;

    const countSql = `SELECT COUNT(DISTINCT DATE_FORMAT(orderdate, '%Y-%m')) AS count FROM myorder`;
    const summarySql = `
    SELECT 
      DATE_FORMAT(orderdate,'%Y-%m') AS monthStr,
      YEAR(orderdate) AS year,
      MONTHNAME(orderdate) AS monthName,
      SUM(soldprice) AS total
    FROM myorder
    GROUP BY DATE_FORMAT(orderdate,'%Y-%m'), YEAR(orderdate), MONTHNAME(orderdate)
    ORDER BY monthStr DESC
    LIMIT ? OFFSET ?
  `;


    db.query(countSql, (err, countResult) => {
      if (err) {
        console.error("Count query error:", err);
        return res.status(500).json({ error: err });
      }

      const totalCount = countResult[0]?.count || 0;

      db.query(summarySql, [limit, offset], (err2, months) => {
        if (err2) {
          console.error("Summary query error:", err2);
          return res.status(500).json({ error: err2 });
        }

        res.json({ months, totalCount });
      });
    });
  },

  getFullMonthOrders: (req, res) => {
    const { month } = req.query;

    const fullSql = `
      SELECT 
        DATE_FORMAT(orderdate,'%Y-%m-%d') AS orderdate,
        productid, productname, mechanicname, description,
        productcompany, qty, mrp, percentage,
        percentageamount, soldprice
      FROM myorder
      WHERE DATE_FORMAT(orderdate,'%Y-%m') = ?
      ORDER BY orderdate DESC`;

    db.query(fullSql, [month], (err, orders) => {
      if (err) {
        console.error("Full month orders query error:", err);
        return res.status(500).json({ error: err });
      }
      res.json({ orders });
    });
  },


};

module.exports = myorder;