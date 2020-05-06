var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

var managerId = null;

/* GET manager name listing. */
router.get('/', function(req, res, next) {
  // req.query.user is passed in from index.js
  managerId = req.query.user;
  var user_query = "SELECT * FROM FoodDeliveryServiceManagers WHERE FDSManagerId = '" + managerId + "';";
  pool.query(user_query, (err, userData) => {
    console.log(err);
    res.render('managerHomePage', { userData: userData.rows });
  });
});

// Handling navigation to other pages
router.post('/', function(req, res, next) {
  var navigation = req.body.navigation;
  if (navigation == '1') {
    res.redirect('/viewAllFDPCPage');
  } else if (navigation == '2') {
    res.redirect('/createFDPCPage/?user=' + managerId);
  } else {
    res.redirect('/viewStatisticsHomePage');
  }
});


module.exports = router;
