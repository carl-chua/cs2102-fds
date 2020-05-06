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

	var user_query;

	if (customerVal == 1) {
		user_query = "SELECT customerId FROM Customers WHERE email = '" + email + "' AND password = '" + password + "';";
	}
	else if (riderVal == 2) {
		user_query = "SELECT riderId FROM DeliveryRiders WHERE email = '" + email + "' AND password = '" + password + "';";
	}
	else if (staffVal == 3) {
		user_query = "SELECT restaurantStaffId FROM RestaurantStaffs WHERE email = '" + email + "' AND password = '" + password + "';";
	}
	else if (managerVal == 4) {
		user_query = "SELECT FDSManagerId FROM FoodDeliveryServiceManagers WHERE email = '" + email + "' AND password = '" + password + "';";
	}

	// Construct Specific SQL Query
	pool.query(user_query, (err, data) => {
		// do error handling if possible
		if (customerVal == 1) {
			req.session.message = data.rows[0].customerid;
			res.redirect('/customerHomePage');
		}
		else if (riderVal == 2) {
			res.redirect('/riderHomePage/?user=' + data.rows[0].riderid);
		}
		else if (staffVal == 3) {
			res.redirect('/staffHomePage/?user=' + data.rows[0].restaurantstaffid);
		}
		else if (managerVal == 4) {
			res.redirect('/managerHomePage/?user=' + data.rows[0].fdsmanagerid);
		}		
	});
	
});

/*
	if (req.query.user == 1) {
		user_query = "SELECT name FROM Customers WHERE email = '" + email + "' AND password = '" + password + "';";
	}
	else if (req.query.user == 2) {
		user_query = "SELECT name FROM DeliveryRiders WHERE email = '" + email + "' AND password = '" + password + "';";
	}
	else if (req.query.user == 3) {
		user_query = "SELECT name FROM RestaurantStaffs WHERE email = '" + email + "' AND password = '" + password + "';";
	}
	else if (req.quer.user == 4) {
		user_query = "SELECT name FROM FoodDeliveryServiceManagers WHERE email = '" + email + "' AND password = '" + password + "';";
	}
 */

module.exports = router;
