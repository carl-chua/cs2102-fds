var express = require("express");
var router = express.Router();

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/* SQL Query */
//SQl only uses single quotes
var sql_query1 =
  "SELECT o.orderid, o.foodsubtotal, o.timeplaced, f.name, f.price, p.qtyordered FROM ORDERS o JOIN PICKS p ON o.orderid = p.orderid JOIN FOODMENUITEMS f ON p.itemid = f.itemid WHERE o.status = 'PENDING' ORDER BY o.timeplaced";
var sql_query3 =
  "SELECT o.orderid, o.foodsubtotal, o.timeplaced, f.name, f.price, p.qtyordered FROM ORDERS o JOIN PICKS p ON o.orderid = p.orderid JOIN FOODMENUITEMS f ON p.itemid = f.itemid WHERE o.status = 'PREPARING' ORDER BY o.timeplaced";
var sql_query2 =
  "SELECT o.orderid, o.foodsubtotal, o.timeplaced, f.name, f.price, p.qtyordered FROM ORDERS o JOIN PICKS p ON o.orderid = p.orderid JOIN FOODMENUITEMS f ON p.itemid = f.itemid WHERE o.status = 'READY-FOR-DELIVERY' OR o.status = 'DELIVERING' OR o.status = 'DELIVERED' ORDER BY o.timeplaced";

//This will render orderPage.ejs and return other arguments (data)
router.get("/", function (req, res, next) {
  pool.query(sql_query2, (err, data) => {
    res.render("ordersPage", { title: "Orders Page", data: data.rows });
  });
});

module.exports = router;
