var express = require("express");
var router = express.Router();

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/* SQL Query */
//SQl only uses single quotes
/*Need to select only current restaurant*/
var pendingOrdersQuery =
  "SELECT o.orderid, o.foodsubtotal, o.timeplaced, f.name, f.price, p.qtyordered FROM ORDERS o JOIN PICKS p ON o.orderid = p.orderid JOIN FOODMENUITEMS f ON p.itemid = f.itemid WHERE o.status = 'PENDING' ORDER BY o.timeplaced";
var preparingOrdersQuery =
  "SELECT o.orderid, o.foodsubtotal, o.timeplaced, f.name, f.price, p.qtyordered FROM ORDERS o JOIN PICKS p ON o.orderid = p.orderid JOIN FOODMENUITEMS f ON p.itemid = f.itemid WHERE o.status = 'PREPARING' ORDER BY o.timeplaced";
var completedOrdersQuery =
  "SELECT o.orderid, o.foodsubtotal, o.timeplaced, f.name, f.price, p.qtyordered FROM ORDERS o JOIN PICKS p ON o.orderid = p.orderid JOIN FOODMENUITEMS f ON p.itemid = f.itemid WHERE o.status = 'READY-FOR-DELIVERY' OR o.status = 'DELIVERING' OR o.status = 'DELIVERED' ORDER BY o.timeplaced";
var earningsTodayQuery = 
  "SELECT SUM(o.foodsubtotal) as earnings FROM ORDERS o JOIN PICKS p ON o.orderid = p.orderid GROUP BY o.orderid";

//This will render orderPage.ejs and return other arguments (data)
router.get("/", function (req, res, next) {
  pool.query(pendingOrdersQuery, (err, pendingData) => {
    pool.query(preparingOrdersQuery, (err, preparingData) => {
      pool.query(completedOrdersQuery, (err, completedData) => {
        pool.query(earningsTodayQuery, (err, earningsTodayData) => {
        console.log(err);
        res.render("ordersPage", { title: "Orders Page", pending: pendingData.rows, preparing: preparingData.rows, completed: completedData.rows, earningsToday: earningsTodayData.rows});
        })
      })
    })
  });
});

module.exports = router;
