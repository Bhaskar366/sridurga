const db = require("../config/database");


const investors = {
  getLastInvestment: (req, res) => {
    const sql = `SELECT * FROM investors ORDER BY idinvestors DESC LIMIT 1`;
    db.query(sql, (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (result.length === 0) return res.json({});
      res.json(result[0]);
    });
  },

  addInvestment: (req, res) => {
    const {
      bhaskar,
      narayanarao,
      chandrashekhar,
      naidu,
      totalinvestment,
      runningtotal,
      amountused,
      balanceamount,
    } = req.body;

    const sql = `
      INSERT INTO investors 
      (investmentdate, bhaskar, narayanarao, chandrashekhar, naidu, totalinvestment, runningtotal, amountused, balanceamount) 
      VALUES (CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      bhaskar,
      narayanarao,
      chandrashekhar,
      naidu,
      totalinvestment,
      runningtotal,
      amountused,
      balanceamount,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("DB insert failed:", err);
        return res.status(500).json({ error: "DB insert failed" });
      }
      res.json({ success: true });
    });
  },


  getPaginatedInvestments: (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const countQuery = "SELECT COUNT(*) AS total FROM investors";
    const dataQuery = `
          SELECT 
            DATE_FORMAT(investmentdate, '%Y-%m-%d') AS investmentdate,
            bhaskar, narayanarao, chandrashekhar, naidu,
            totalinvestment, runningtotal, amountused, balanceamount
          FROM investors
          ORDER BY idinvestors DESC
          LIMIT ? OFFSET ?
        `;

    db.query(countQuery, (err, countResult) => {
      if (err) return res.status(500).json({ error: "Count query failed" });

      const totalRows = countResult[0].total;
      const totalPages = Math.ceil(totalRows / limit);

      db.query(dataQuery, [limit, offset], (err, dataResult) => {
        if (err) return res.status(500).json({ error: "Data fetch failed" });

        res.json({
          data: dataResult,
          totalPages,
        });
      });
    });
  },

  getBhaskarTotal: (req, res) => {
    const sql = `SELECT SUM(bhaskar) AS totalBhaskar FROM investors`;

    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      const total = results[0].totalBhaskar || 0;
      res.json({ totalBhaskar: total });
    });
  },

  getnarayanaraoTotal: (req, res) => {
    const sql = `SELECT SUM(narayanarao) AS totalnarayanarao FROM investors`;

    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      const total = results[0].totalnarayanarao || 0;
      res.json({ totalnarayanarao: total });
    });
  },

  getchandrashekharTotal: (req, res) => {
    const sql = `SELECT SUM(chandrashekhar) AS totalchandrashekhar FROM investors`;

    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      const total = results[0].totalchandrashekhar || 0;
      res.json({ totalchandrashekhar: total });
    });
  },

  getnaiduTotal: (req, res) => {
    const sql = `SELECT SUM(naidu) AS totalnaidu FROM investors`;

    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      const total = results[0].totalnaidu || 0;
      res.json({ totalnaidu: total });
    });
  },

  getrunningtotal: (req, res) => {
    const sql = `SELECT runningtotal FROM investors ORDER BY idinvestors DESC LIMIT 1`;

    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      const total = results.length > 0 ? results[0].runningtotal : 0;
      res.json({ totalrunningtotal: total });
    });
  },

  getbalanceamount: (req, res) => {
    const sql = `SELECT balanceamount FROM investors ORDER BY idinvestors DESC LIMIT 1`;

    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      const total = results.length > 0 ? results[0].balanceamount : 0;
      res.json({ totalbalanceamount: total });
    });
  },

  //**bhaskar details */
  getbhaskarDetails: (req, res) => {
    const { page = 1 } = req.query;
    const pageSize = 10;
    const offset = (parseInt(page, 10) - 1) * pageSize;

    const countSql = `
      SELECT COUNT(*) AS total FROM investors WHERE bhaskar > 0
    `;

    const dataSql = `
      SELECT 
        DATE_FORMAT(investmentdate, '%Y-%m-%d') AS investmentdate,
        bhaskar AS amount
      FROM investors
      WHERE bhaskar > 0
      ORDER BY investmentdate DESC
      LIMIT ? OFFSET ?
    `;

    db.query(countSql, (err, countResult) => {
      if (err) {
        console.error("DB Count Error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      const totalRows = countResult[0].total;
      const totalPages = Math.ceil(totalRows / pageSize);

      db.query(dataSql, [pageSize, offset], (err, results) => {
        if (err) {
          console.error("DB Data Error:", err);
          return res.status(500).json({ error: "Database error" });
        }

        res.json({
          data: results,
          totalPages,
        });
      });
    });
  },

  getnarayanaDetails: (req, res) => {
    const { page = 1 } = req.query;
    const pageSize = 10;
    const offset = (parseInt(page, 10) - 1) * pageSize;

    const countSql = `
      SELECT COUNT(*) AS total FROM investors WHERE narayanarao > 0
    `;

    const dataSql = `
      SELECT 
        DATE_FORMAT(investmentdate, '%Y-%m-%d') AS investmentdate,
        narayanarao AS amount
      FROM investors
      WHERE narayanarao > 0
      ORDER BY investmentdate DESC
      LIMIT ? OFFSET ?
    `;

    db.query(countSql, (err, countResult) => {
      if (err) {
        console.error("DB Count Error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      const totalRows = countResult[0].total;
      const totalPages = Math.ceil(totalRows / pageSize);

      db.query(dataSql, [pageSize, offset], (err, results) => {
        if (err) {
          console.error("DB Data Error:", err);
          return res.status(500).json({ error: "Database error" });
        }

        res.json({
          data: results,
          totalPages,
        });
      });
    });
  },

  getchandrashekharDetails: (req, res) => {
    const { page = 1 } = req.query;
    const pageSize = 10;
    const offset = (parseInt(page, 10) - 1) * pageSize;

    const countSql = `
      SELECT COUNT(*) AS total FROM investors WHERE chandrashekhar > 0
    `;

    const dataSql = `
      SELECT 
        DATE_FORMAT(investmentdate, '%Y-%m-%d') AS investmentdate,
        chandrashekhar AS amount
      FROM investors
      WHERE chandrashekhar > 0
      ORDER BY investmentdate DESC
      LIMIT ? OFFSET ?
    `;

    db.query(countSql, (err, countResult) => {
      if (err) {
        console.error("DB Count Error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      const totalRows = countResult[0].total;
      const totalPages = Math.ceil(totalRows / pageSize);

      db.query(dataSql, [pageSize, offset], (err, results) => {
        if (err) {
          console.error("DB Data Error:", err);
          return res.status(500).json({ error: "Database error" });
        }

        res.json({
          data: results,
          totalPages,
        });
      });
    });
  },


};

module.exports = investors;