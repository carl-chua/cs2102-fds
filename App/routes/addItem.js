var express = require("express");
var router = express.Router();

// connecting to Postgres DB
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/* SQL Query */
var sql_query = "INSERT INTO FOODMENUITEMS VALUES";

// rendering insert.ejs page
// GET
//These routing methods specify a callback function (sometimes called “handler functions”) called when the application receives a request to the specified route (endpoint) and HTTP method. In other words, the application “listens” for requests that match the specified route(s) and method(s), and when it detects a match, it calls the specified callback function.
router.get("/", function (req, res, next) {
  res.render("addItemPage", { title: "Add Item Page" });
});

// retrieving information from insert.ejs page
// POST
router.post("/", function (req, res, next) {
  // Retrieve Information
  var itemId = req.body.itemId;
  var name = req.body.name;
  var dailyLimit = req.body.dailyLimit;
  var price = req.body.price;
  var category = req.body.category;
  var isSelling = req.body.isSelling;

  // Construct Specific SQL Query
  var insert_query =
    sql_query +
    "(" +
    itemId +
    ",'" +
    name +
    "'," +
    dailyLimit +
    "," +
    price +
    ",'" +
    category +
    "', 0," +
    isSelling +
    ", true" +
    ", 5, null)";

  pool.query(insert_query, (err, data) => {
    console.log(err);
    res.redirect("/menu");
  });
});

module.exports = router;
