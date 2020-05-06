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

function getSQLCustomer(customerId) {
	return "SELECT * \
	FROM Customers \
	WHERE customerId = '" + customerId + "';";
}

function getSQLRestaurants() {
	return "SELECT R.restaurantId, R.name AS rname\
	FROM Restaurants R \
	ORDER BY R.restaurantId;";
}

function getSQLPicks(customerID) {
	return "WITH Temptable AS \
		(SELECT O.orderId, O.foodSubTotal, R.restaurantId, R.name AS rname, P.itemId, FMI.name AS iname, FMI.price, P.qtyOrdered, (P.qtyOrdered * FMI.price) AS sumPrice \
		FROM Picks P NATURAL JOIN Orders O \
			JOIN FoodMenuItems FMI ON (P.itemId = FMI.itemId) \
			JOIN Restaurants R ON (FMI.restaurantId = R.restaurantId) \
		WHERE O.customerId = " + customerID + " \
		AND O.status = 'CART' ORDER BY O.orderId desc) \
	SELECT * \
	FROM Temptable T \
	WHERE T.orderId = (\
		SELECT MAX(orderId) \
		FROM Temptable);";
}

/* GET users listing. */
router.get('/', function(req, res, next) {
	// req.query.user is passed in from index.js
	customerId = req.query.user;
	pool.query(
		getSQLCustomer(customerId), (err, userData) => {
		console.log(err);
	pool.query(getSQLRestaurants(), (err, foodData) => {
		console.log(err);
		// get latest unconfirmed order of this customer
	pool.query(getSQLPicks(customerId), (err, picksData) => {
		console.log(err);
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
	var confirm = req.body.confirm;

	if (typeof itemIdToAdd != 'undefined' && typeof addQty != 'undefined') {
		if (orderId == null) {
			var new_order_query = "SELECT MAX(orderId) FROM Orders;";
			pool.query(new_order_query, (err, orderData) => {
				orderId = orderData.rows[0].max + 1;
				var create_new_order = "INSERT INTO Orders VALUES (" + (orderData.rows[0].max + 1) + ", 'CART', 0, 0, 0, null, null, null, null, null, null, null, null, false, null, null, " + customerId + ");";
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
	else if (typeof itemIdToRemove != 'undefined' && typeof removeQty != 'undefined') {
		var get_number_of_items = "SELECT * FROM Picks P WHERE orderId = " + orderId + " AND itemId = " + itemIdToRemove + ";";
		pool.query(get_number_of_items, (err, numberData) => {
			console.log(err);
			var update_query;
			if (numberData.rows[0].qtyordered <= removeQty) {
				update_query = "DELETE FROM Picks WHERE orderId = " + orderId + " AND itemId = " + itemIdToRemove + ";";
			}
			else {
				update_query = "UPDATE Picks SET qtyOrdered = qtyOrdered - " + removeQty + " WHERE orderId = " + orderId + " AND itemId = " + itemIdToRemove + ";";
			}
			pool.query(update_query, (err, updateData) => {
				console.log(err);
			})
		})
		res.redirect('back');
	}
	else if (confirm == '1') {
		res.redirect('/customerOrderConfirmPage/?user=' + customerId + '&order=' + orderId);
	}
});

module.exports = router;
