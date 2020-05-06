var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

/* SQL Queries */
//SQl only uses single quotes
/*Need to select only current restaurant*/
var menuQuery =
  "SELECT f.itemid, f.category, f.name, f.price, f.qtyorderedtoday, f.dailylimit, f.isselling, f.isavailabletoday, f.rating FROM FOODMENUITEMS f ORDER BY f.category;";

router.get('/', function(req, res, next) {
  //values are passed in from index.js
  var staffId = req.session.staffId;
  var staffName = req.session.name;
  res.render('restaurantStaffHomePage', { title: 'Restaurant Staff Homepage', id: staffId, name: staffName});
});

//This will render orderPage.ejs and return other arguments (data)
router.post("/menuPage", function (req, res, next) {
  pool.query(menuQuery, (err, menuData) => {
    console.log(err);
    res.render("menuPage", {
      title: "Menu Page",
      menu: menuData.rows,
    });
  });
});

module.exports = router;
