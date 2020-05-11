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

/* GET home page. */
router.get('/invalidLogin', function(req, res, next) {
	res.render('indexInvalidLogin', { title: 'Express' });
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
		user_query = "SELECT customerId, name \
			FROM Customers \
			WHERE email = '" + email + "' \
			AND password = '" + password + "' \
			AND isDeleted = false;";
	}
	else if (riderVal == 2) {
		user_query = "SELECT riderId \
			FROM DeliveryRiders \
			WHERE email = '" + email + "' \
			AND password = '" + password + "' \
			AND isDeleted = false;";
	}
	else if (staffVal == 3) {
		user_query = "SELECT restaurantStaffId, name, restaurantId\
			FROM RestaurantStaffs \
			WHERE email = '" + email + "'\
			AND password = '" + password + "' \
			AND isDeleted = false;";
	}
	else if (managerVal == 4) {
		user_query = "SELECT FDSManagerId \
			FROM FoodDeliveryServiceManagers \
			WHERE email = '" + email + "' \
			AND password = '" + password + "' \
			AND isDeleted = false;";
	}

	// Construct Specific SQL Query
	pool.query(user_query, (err, data) => {
		// do error handling if possible
		
		// console.log ("data: ", data);
		if (data.rowCount == 0) {
			res.redirect('/invalidlogin');
			return
		}

		if (customerVal == 1) {
			req.session.message = data.rows[0];
			res.redirect('/customer');
		}
		else if (riderVal == 2) {
			req.session.riderId = data.rows[0].riderid;
			res.redirect('/riderHomePage');
		}
		else if (staffVal == 3) {
			req.session.staffId = data.rows[0].restaurantstaffid;
			req.session.name = data.rows[0].name;
			req.session.restaurantId = data.rows[0].restaurantid;
			res.redirect('restaurantStaffHomePage');
		}
		else if (managerVal == 4) {
			req.session.fdsmanagerid = data.rows[0].fdsmanagerid
			res.redirect('/managerHomePage');
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
