var express = require('express');
var router = express.Router();

var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

/* GET users listing. */
router.get('/', function(req, res, next) {
	var user_query = "SELECT * FROM Customers WHERE customerId = '" + req.query.user + "';";
	console.log(req.query.user);
	pool.query(user_query, (err, userData) => {
		var get_restaurants = "SELECT R.restaurantId, R.name AS rname, FMI.itemId, FMI.name as iname, FMI.price, FMI.category, FMI.rating FROM Restaurants R JOIN FoodMenuItems FMI ON (R.restaurantId = FMI.restaurantId) WHERE FMI.isSelling = TRUE AND FMI.isAvailableToday = TRUE ORDER BY R.restaurantId;";
		pool.query(get_restaurants, (err, foodData) => {
			res.render('customerHomePage', {userData: userData.rows, foodData: foodData.rows});
		})
	});
});

module.exports = router;
