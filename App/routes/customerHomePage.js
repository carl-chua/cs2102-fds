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
			// get latest unconfirmed order of this customer
			var get_picks = "WITH Temptable AS (SELECT O.orderId, R.restaurantId, R.name AS rname, P.itemId, FMI.name AS iname, FMI.price, P.qtyOrdered, (P.qtyOrdered * FMI.price) AS sumPrice FROM Picks P NATURAL JOIN Orders O JOIN FoodMenuItems FMI ON (P.itemId = FMI.itemId) JOIN Restaurants R ON (FMI.restaurantId = R.restaurantId) WHERE O.customerId = " + req.query.user + " AND O.status = 'CART' ORDER BY O.orderId desc) SELECT * FROM Temptable T WHERE T.orderId = (SELECT MAX(orderId) FROM Temptable);";
			pool.query(get_picks, (err, picksData) => {
				console.log(err);
				res.render('customerHomePage', {userData: userData.rows, foodData: foodData.rows, picksData: picksData.rows});
			})
		})
	});
});

module.exports = router;
