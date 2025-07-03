// server.js

const express = require('express');
const cors = require("cors");
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();  // <=== Initialize app BEFORE using it

app.use(cors());
app.use(express.json());
app.use(express.static("src"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from /src folder
app.use(express.static(path.join(__dirname, "src")));

const PORT = process.env.PORT || 5000;

// Import controllers
const authController = require("./src/backend/controllers/authController");
const investorController = require("./src/backend/controllers/investorController");
const shippingcontroller = require("./src/backend/controllers/shippingcontroller");
const addcartcontroller = require("./src/backend/controllers/addcartcontroller");
const checkoutcontroller = require("./src/backend/controllers/checkoutcontroller");
const myordercontroller = require("./src/backend/controllers/myorderscontroller");
const profitPerUnit = require("./src/backend/controllers/profitcontroller");
const reorderController = require("./src/backend/controllers/reorderController");

const { pathToFileURL } = require('url');



// Routes
app.post("/register", authController.registerUser);
app.post("/login", authController.loginUser);  // Changed to POST for login

// investor Routes
app.get("/api/investors/last", investorController.getLastInvestment);
app.post("/api/investors", investorController.addInvestment);
app.get("/getinvestmentdata", investorController.getPaginatedInvestments);
app.get("/investors/bhaskar-total", investorController.getBhaskarTotal);
app.get("/investors/narayanarao-total", investorController.getnarayanaraoTotal);
app.get("/investors/chandrashekhar-total", investorController.getchandrashekharTotal);
app.get("/investors/naidu-total", investorController.getnaiduTotal);
app.get("/investors/running-total", investorController.getrunningtotal);
app.get("/investors/balanceamount-total", investorController.getbalanceamount);
app.get("/api/bhaskar-details", investorController.getbhaskarDetails);
app.get("/api/narayana-details", investorController.getnarayanaDetails);
app.get("/api/chandrashekhar-details", investorController.getchandrashekharDetails);


//**shipping produts raoutes */
app.post("/api/products", shippingcontroller.addProduct);
app.get("/data/products/:productid", shippingcontroller.getProductById);
app.get("/get/products", shippingcontroller.getProductsPaginated);
app.get("/api/get/productsdata", shippingcontroller.getProductsdata);


//**cehckout routes */ 
app.get("/addcart", checkoutcontroller.getAddCart);
app.post("/api/placeorder", checkoutcontroller.placeOrder);

//**myorder routes */
app.get("/api/checkout-by-date", myordercontroller.getOrdersByDate);
app.delete("/api/delete-order", myordercontroller.deleteOrderByProductAndDate);
app.get('/api/months-summary', myordercontroller.getMonthsSummary);
app.get('/api/full-month-orders', myordercontroller.getFullMonthOrders);


//**addto cart products list */
app.post("/api/post/addcart", addcartcontroller.addCart);
app.get('/api/get/addcart', addcartcontroller.getCart);
app.delete("/api/clear/addcart", addcartcontroller.clearCart);

//**profit routes */
app.get("/api/dailyprofit", profitPerUnit.getDailyProfitPaginated);
app.get("/api/orders/summary", profitPerUnit.getDailySummary);
app.get("/api/orders/monthly-summary", profitPerUnit.getMonthlySummary);
app.get("/api/orders/today-profit", profitPerUnit.getTodayProfit);
app.get("/api/orders/monthly-profit", profitPerUnit.getMonthlyProfit);


//**reorder the products routes */
app.get("/api/reorder/supplier-names", reorderController.getSupplierNames);
app.get("/api/reorder", reorderController.getReorderBySupplier);





// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
