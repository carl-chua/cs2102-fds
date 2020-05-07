const express = require("express");
const router = express.Router();

//const ordersRouter = require("./orders");
//const menuRouter = require("./menu");
// const addItemRouter = require("./addItem");
// const editItemRouter = require("./editItem");
// const deleteItemRouter = require("./deleteItem");
//router.use("/orders", ordersRouter);
//router.use("/menu", menuRouter);
// router.use("/addItem", addItemRouter);
// router.use("/editItem", editItemRouter);
// router.use("/deleteItem", deleteItemRouter);

const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

var staffId;
var staffName;
var restaurantId;

function getPendingOrdersQuery(restaurantId) {
  return "SELECT o.orderid, o.foodsubtotal, o.timeplaced, f.name, f.price, p.qtyordered \
    FROM ORDERS o JOIN PICKS p ON o.orderid = p.orderid JOIN FOODMENUITEMS f ON p.itemid = f.itemid \
    WHERE o.restaurantid = " +
    restaurantId +
    " AND o.status = 'PENDING' \
    ORDER BY o.timeplaced";
}
function getPreparingOrdersQuery(restaurantId) {
  return "SELECT o.orderid, o.foodsubtotal, o.timeplaced, f.name, f.price, p.qtyordered \
    FROM ORDERS o JOIN PICKS p ON o.orderid = p.orderid JOIN FOODMENUITEMS f ON p.itemid = f.itemid \
    WHERE o.restaurantid = " +
    restaurantId +
    " AND o.status = 'PREPARING' \
    ORDER BY o.timeplaced";
}
function getCompletedOrdersQuery(restaurantId) {
  return "SELECT o.orderid, o.foodsubtotal, o.timeplaced, f.name, f.price, p.qtyordered \
    FROM ORDERS o JOIN PICKS p ON o.orderid = p.orderid JOIN FOODMENUITEMS f ON p.itemid = f.itemid \
    WHERE o.restaurantid = " +
    restaurantId +
    " AND (o.status = 'READY-FOR-DELIVERY' OR o.status = 'DELIVERING' OR o.status = 'DELIVERED') \
    ORDER BY o.timeplaced";
}
function getEarningsTodayQuery(restaurantId) {
  return "SELECT SUM(o.foodsubtotal) as earnings \
  FROM ORDERS o JOIN PICKS p ON o.orderid = p.orderid \
  WHERE o.restaurantid = " +
  restaurantId +
  //" AND DATE(o.timeplaced) = CURRENT_DATE"
  " GROUP BY o.restaurantid";
}
function getMenuQuery(restaurantId) {
  return "SELECT f.itemid, f.category, f.name, f.price, f.qtyorderedtoday, f.dailylimit, f.isselling, f.isavailabletoday, f.rating \
  FROM FOODMENUITEMS f \
  WHERE f.restaurantid = " +
  restaurantId +
  " ORDER BY f.category";
}
function getAddItemQuery(restaurantId, itemId, name, dailyLimit, price, category, isAvailableToday) {
  return "INSERT INTO FOODMENUITEMS VALUES(" +
  itemId +
  ",'" +
  name +
  "'," +
  dailyLimit +
  "," +
  price +
  ",'" +
  category +
  "', 0, true, " +
  isAvailableToday +
  "," +
  restaurantId +
  ", null)";
}
function getEditItemQuery(itemId, name, dailyLimit, price, category, isAvailableToday) {
  return "UPDATE FOODMENUITEMS \
  SET name = '" +
  name +
  "', dailyLimit = " +
  dailyLimit +
  ", price = " +
  price +
  ", category = '" +
  category +
  "', isAvailableToday = " +
  isAvailableToday +
  " WHERE itemId = " +
  itemId;
}
function getDeleteItemQuery(itemId) {
  return "UPDATE FOODMENUITEMS \
  SET isSelling = false \
  WHERE itemId = " + itemId;
}
function getTopItemQuery(restaurantId) {
  return "SELECT SUM(p.qtyordered) as total, f.itemid, f.name, f.price, f.qtyorderedtoday, f.rating \
  FROM FOODMENUITEMS f JOIN PICKS p ON f.itemId = p.itemId \
  WHERE f.restaurantid = " +
  restaurantId +
  " GROUP BY f.itemId \
  ORDER BY total ASC \
  LIMIT 5";
}
function getBottomItemQuery(restaurantId) {
  return "SELECT SUM(p.qtyordered) as total, f.itemid, f.name, f.price, f.qtyorderedtoday, f.rating \
  FROM FOODMENUITEMS f JOIN PICKS p ON f.itemId = p.itemId \
  WHERE f.restaurantid = " +
  restaurantId +
  " GROUP BY f.itemId \
  ORDER BY total DESC \
  LIMIT 5";
}
function getTotalNumberOfOrdersQuery(restaurantId) {
  return "SELECT SUM(o.orderid) as total \
  FROM ORDERS o \
  WHERE o.restaurantid = " +
  restaurantId +
  " GROUP BY o.orderid";
}
function getTotalSalesQuery(restaurantId) {
  return "SELECT SUM(o.foodsubtotal) as sales \
    FROM ORDERS o \
    WHERE o.restaurantid = " +
    restaurantId +
    "AND (o.status = 'READY-FOR-DELIVERY' OR o.status = 'DELIVERING' OR o.status = 'DELIVERED')";
}


/* SQL Queries */
//SQl only uses single quotes
// var pendingOrdersQuery =
//   "SELECT o.orderid, o.foodsubtotal, o.timeplaced, f.name, f.price, p.qtyordered FROM ORDERS o JOIN PICKS p ON o.orderid = p.orderid JOIN FOODMENUITEMS f ON p.itemid = f.itemid WHERE o.restaurantid = " +
//   restaurantId +
//   " AND o.status = 'PENDING' ORDER BY o.timeplaced";
// var preparingOrdersQuery =
//   "SELECT o.orderid, o.foodsubtotal, o.timeplaced, f.name, f.price, p.qtyordered FROM ORDERS o JOIN PICKS p ON o.orderid = p.orderid JOIN FOODMENUITEMS f ON p.itemid = f.itemid WHERE o.restaurantid = " +
//   restaurantId +
//   " AND o.status = 'PREPARING' ORDER BY o.timeplaced";
// var completedOrdersQuery =
//   "SELECT o.orderid, o.foodsubtotal, o.timeplaced, f.name, f.price, p.qtyordered FROM ORDERS o JOIN PICKS p ON o.orderid = p.orderid JOIN FOODMENUITEMS f ON p.itemid = f.itemid WHERE o.restaurantid = " +
//   restaurantId +
//   " AND o.status = 'READY-FOR-DELIVERY' OR o.status = 'DELIVERING' OR o.status = 'DELIVERED' ORDER BY o.timeplaced";
// var earningsTodayQuery =
//   "SELECT SUM(o.foodsubtotal) as earnings FROM ORDERS o JOIN PICKS p ON o.orderid = p.orderid GROUP BY o.orderid";
// var menuQuery =
//   "SELECT f.itemid, f.category, f.name, f.price, f.qtyorderedtoday, f.dailylimit, f.isselling, f.isavailabletoday, f.rating FROM FOODMENUITEMS f WHERE f.restaurantid = " +
//   restaurantId +
//   " ORDER BY f.category";

router.get("/", function (req, res, next) {
  //values are passed in from index.js
  staffId = req.session.staffId;
  staffName = req.session.name;
  restaurantId = req.session.restaurantId;
  res.render("restaurantStaffHomePage", {
    title: "Restaurant Staff Homepage",
    id: staffId,
    name: staffName,
  });
});

router.use("/orders", function (req, res, next) {
  pool.query(getPendingOrdersQuery(restaurantId), (err, pendingData) => {
    pool.query(getPreparingOrdersQuery(restaurantId), (err, preparingData) => {
      pool.query(getCompletedOrdersQuery(restaurantId), (err, completedData) => {
        pool.query(getEarningsTodayQuery(restaurantId), (err, earningsTodayData) => {
          console.log(err);
          res.render("ordersPage", {
            title: "Orders Page",
            pending: pendingData.rows,
            preparing: preparingData.rows,
            completed: completedData.rows,
            earningsToday: earningsTodayData.rows,
          });
        });
      });
    });
  });
});

//This will render menuPage.ejs and return other arguments (data)
router.use("/menu", function (req, res, next) {
  pool.query(getMenuQuery(restaurantId), (err, menuData) => {
    console.log(err);
    res.render("menuPage", {
      title: "Menu Page",
      menu: menuData.rows,
    });
  });
});

router.get("/addItem", function (req, res, next) {
  res.render("addItemPage", { title: "Add Item Page" });
});

router.post("/addItem", function (req, res, next) {
  var itemId = req.body.itemId;
  var name = req.body.name;
  var dailyLimit = req.body.dailyLimit;
  var price = req.body.price;
  var category = req.body.category;
  var isAvailableToday = req.body.isAvailableToday;

  pool.query(getAddItemQuery(restaurantId, itemId, name, dailyLimit, price, category, isAvailableToday), (err, data) => {
    console.log(err);
    res.redirect("/menu");
  });
});

router.get("/editItem", function (req, res, next) {
  res.render("editItemPage", { title: "Edit Item Page" });
});

router.post("/editItem", function (req, res, next) {
  var itemId = req.body.itemId;
  var name = req.body.name;
  var dailyLimit = req.body.dailyLimit;
  var price = req.body.price;
  var category = req.body.category;
  var isAvailableToday = req.body.isAvailableToday;

  pool.query(getEditItemQuery(itemId, name, dailyLimit, price, category, isAvailableToday), (err, data) => {
    console.log(err);
    res.redirect("/menu");
  });
});

router.get("/deleteItem", function (req, res, next) {
  res.render("deleteItemPage", { title: "Delete Item Page" });
});

router.post("/deleteItem", function (req, res, next) {
  var itemId = req.body.itemId;
  pool.query(getDeleteItemQuery(itemId), (err, data) => {
    console.log(err);
    res.redirect("/menu");
  });
});

router.use("/statistics", function (req, res, next) {
  pool.query(getTopItemQuery(restaurantId), (err, topData) => {
    pool.query(getBottomItemQuery(restaurantId), (err, bottomData) => {
      pool.query(getTotalNumberOfOrdersQuery(restaurantId), (err, totalData) => {
        pool.query(getTotalSalesQuery(restaurantId), (err, salesData) => {
          console.log(err);
          res.render("statisticsPage", {
            title: "Statistics Page",
            top: topData.rows,
            bottom: bottomData.rows,
            total: totalData.rows,
            sales: salesData.rows,
          });
        });
      });
    });
  });
});



module.exports = router;
