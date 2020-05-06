var express = require("express");
var router = express.Router();

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/* SQL Query */
//SQl only uses single quotes
/*Need to select only current restaurant*/
var menuQuery =
  "SELECT f.itemid, f.category, f.name, f.price, f.qtyorderedtoday, f.dailylimit, f.isselling, f.isavailabletoday, f.rating FROM FOODMENUITEMS f ORDER BY f.category;";

//This will render orderPage.ejs and return other arguments (data)
router.get("/", function (req, res, next) {
  pool.query(menuQuery, (err, menuData) => {
    console.log(err);
    res.render("menuPage", {
      title: "Menu Page",
      menu: menuData.rows,
    });
  });
});

module.exports = router;
