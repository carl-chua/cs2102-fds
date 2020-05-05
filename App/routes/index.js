var express = require('express');
var router = express.Router();

// connecting to Postgres DB
const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

/* SQL Query */
var sql_query = 'SELECT ';

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


// retrieving information from index.ejs page
// POST
router.post('/', function(req, res, next) {
	// Retrieve Information
	var email  = req.body.email;
	var password = req.body.password;
	var customerVal = req.body.customer;
	var riderVal = req.body.rider;
	var managerVal = req.body.manager;
	var staffVal = req.body.rstaff;

	var select_query;

	if (customerVal == 1) {
		select_query = "SELECT name FROM Customers WHERE email = '" + email + "' AND password = '" + password + "';";
	}
	else if (riderVal == 2) {
		select_query = "SELECT name FROM DeliveryRiders WHERE email = '" + email + "' AND password = '" + password + "';";
	}
	else if (staffVal == 3) {
		select_query = "SELECT name FROM RestaurantStaffs WHERE email = '" + email + "' AND password = '" + password + "';";
	}
	else if (managerVal == 4) {
		select_query = "SELECT name FROM FoodDeliveryServiceManagers WHERE email = '" + email + "' AND password = '" + password + "';";
	}

	console.log(riderVal);


	// Construct Specific SQL Query
	pool.query(select_query, (err, data) => {
		res.render('customerHomePage', {data: data.rows})
	});
	
});

module.exports = router;
