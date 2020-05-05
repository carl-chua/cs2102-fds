var express = require('express');
var router = express.Router();

var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

var orderId = null;
var customerId = null;

/* GET users listing. */
router.get('/', function(req, res, next) {
	// req.query.user is passed in from index.js
	customerId = req.query.user;
	var user_query = "SELECT * FROM Customers WHERE customerId = '" + customerId + "';";
	pool.query(user_query, (err, userData) => {
		var get_restaurants = "SELECT R.restaurantId, R.name AS rname, FMI.itemId, FMI.name as iname, FMI.price, FMI.category, FMI.rating FROM Restaurants R JOIN FoodMenuItems FMI ON (R.restaurantId = FMI.restaurantId) WHERE FMI.isSelling = TRUE AND FMI.isAvailableToday = TRUE ORDER BY R.restaurantId;";
		pool.query(get_restaurants, (err, foodData) => {
			// get latest unconfirmed order of this customer
			var get_picks = "WITH Temptable AS (SELECT O.orderId, R.restaurantId, R.name AS rname, P.itemId, FMI.name AS iname, FMI.price, P.qtyOrdered, (P.qtyOrdered * FMI.price) AS sumPrice FROM Picks P NATURAL JOIN Orders O JOIN FoodMenuItems FMI ON (P.itemId = FMI.itemId) JOIN Restaurants R ON (FMI.restaurantId = R.restaurantId) WHERE O.customerId = " + customerId + " AND O.status = 'CART' ORDER BY O.orderId desc) SELECT * FROM Temptable T WHERE T.orderId = (SELECT MAX(orderId) FROM Temptable);";
			pool.query(get_picks, (err, picksData) => {
				if (picksData.rows.length > 0) {
					orderId = picksData.rows[0].orderid;
				}
				res.render('customerHomePage', {userData: userData.rows, foodData: foodData.rows, picksData: picksData.rows});
			})
		})
	});
});

router.post('/', function(req, res, next) {
	var itemIdToRemove = req.body.remove;
	var removeQty = req.body.removeQty;
	var itemIdToAdd = req.body.add;
	var addQty = req.body.submitQty;

	if (typeof itemIdToAdd != 'undefined' && typeof addQty != 'undefined') {
		if (orderId == null) {
			var new_order_query = "SELECT MAX(orderId) FROM Orders;";
			pool.query(new_order_query, (err, orderData) => {
				orderId = orderData.rows[0].max + 1;
				var create_new_order = "INSERT INTO Orders VALUES (" + orderId + ", 'CART', 0, 0, 0, null, null, null, null, null, null, null, null, false, null, null, " + customerId + ");";
				pool.query(create_new_order, (err, orderData) => {
					console.log(err);
				});
			});
		}
		var check_items_exist_query = "SELECT * FROM Picks P WHERE orderId = " + orderId + " AND itemId = " + itemIdToAdd + ";";
		pool.query(check_items_exist_query, (err, existData) => {
			console.log(err);
			if (existData.rows.length > 0) {
				update_query = "UPDATE Picks SET qtyOrdered = qtyOrdered + " + addQty + " WHERE orderId = " + orderId + " AND itemId = " + itemIdToAdd + ";";
			}
			else {
				update_query = "INSERT INTO Picks VALUES (" + orderId + ", " + itemIdToAdd + ", " + addQty + ");";
			}
			pool.query(update_query, (err, updateData) => {
				console.log(err);
			});
		})
		res.redirect('back');
	}
});

module.exports = router;
