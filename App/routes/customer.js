var express = require('express');
var router = express.Router();

var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

var customerTuple;
var orderId;
var customerId;
var customerName;

function getSQLuserData(customerId) {
	return "SELECT * \
		FROM Customers \
		WHERE customerId = '" + customerId + "';";
}

function updateSQLuserData(customerId, input) {
	if (input.inputCardNo === "-") input.inputCardNo = "null";
	var passwordLine = "password = '" + input.inputPassword + "',";
	if (input.inputPassword == '-') {
		passwordLine = "";
	}
	console.log("input:", input);
	return "update customers set \
		name = '" + input.inputName + "', \
		email = '" + input.inputEmail + "', \
		" + passwordLine + " \
		phoneno = " + input.inputPhoneNo + ", \
		registeredcardno = '" + input.inputCardNo + "' \
		where customerid = " + customerId + ";";
}

function deactivateSQLcustomer(customerId) {
	return "update Customers set \
		isDeleted = true \
		where customerid = " + customerId + ";";
}

function activateSQLcustomer(customerId) {
	return "update Customers set \
		isDeleted = false \
		where customerid = " + customerId + ";";
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

function getSQLFood(restaurantIdPicked) {
	return "SELECT FMI.itemId, FMI.name as itemName, FMI.price, FMI.category, FMI.rating \
		FROM FoodMenuItems FMI \
		WHERE FMI.isSelling = TRUE \
		AND FMI.restaurantId = " + restaurantIdPicked + " \
		AND FMI.isAvailableToday = TRUE;";
}

/* GET users listing. */
router.get('/', function (req, res, next) {
	// req.query.user is passed in from index.js
	// var customerId = req.query.user;
	customerTuple = req.session.message;
	console.log(customerTuple);
	customerId = customerTuple.customerid;
	customerName = customerTuple.name;
	// console.log("req:", req);

	pool.query(getSQLRestaurants(), (err, restaurants) => {
		res.render('customerOrderPage', {
			userName: customerName,
			restaurants: restaurants.rows
		}
		);
	});
});

router.post('/', function (req, res, next) {
	var confirm = req.body.confirm;
	var restaurantIdPicked = req.body.restaurantIdPicked

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
				res.send(err);
			})
		})
		res.redirect('back');
	}
	else if (confirm == '1') {
		res.redirect('/customerOrderConfirmPage/?user=' + customerId + '&order=' + orderId);
	}
	// res.render('about', {title: restaurantIdPicked});
});

router.post('/chooseFood', function (req, res, next) {
	var restaurantIdPicked = req.body.restaurantIdPicked;
	pool.query(getSQLPicks(customerId), (err, picksData) => {
		console.log(err);
		// get latest unconfirmed order of this customer
		pool.query(getSQLFood(restaurantIdPicked), (err, foodData) => {
			console.log(err);
			res.render('customerPickItems', {
				userName: customerName,
				picksData: picksData.rows,
				foodData: foodData.rows
			});
		})
	});
});

router.post('/confirmOrder', function (req, res, next) {
	res.send("hello" + req.body.confirm);
});
router.get('/accounts', function (req, res, next) {
	// res.send("accoutns");
	
	pool.query(getSQLuserData(customerId), (err, userData) => {
		// console.log(userData.rows[0]);
		var name = userData.rows[0].name;
		var email = userData.rows[0].email;
		var password = '**********';
		var phoneNo = userData.rows[0].phoneno;
		var registeredCard = userData.rows[0].registeredcardno;
		var rewardPoints = userData.rows[0].rewardpoints;

		if (registeredCard == null) {
			registeredCard = '-';
		}

		res.render('customerAccountPage', { 
			customerId: customerId,
			userName: name,
			email: email,
			password: password,
			phoneNo: phoneNo,
			registeredCard: registeredCard,
			rewardPoints: rewardPoints
		});
	});
});
router.post('/editAccountDetails', function(req, res, next) {
	pool.query(getSQLuserData(customerId), (err, userData) => {
		// console.log(userData.rows[0]);
		var name = userData.rows[0].name;
		var email = userData.rows[0].email;
		var password = '**********';
		var phoneNo = userData.rows[0].phoneno;
		var registeredCard = userData.rows[0].registeredcardno;
		var rewardPoints = userData.rows[0].rewardpoints;

		if (registeredCard == null) {
			registeredCard = '-';
		}

		res.render('customerAccountEditPage', { 
			customerId: customerId,
			userName: name,
			email: email,
			password: password,
			phoneNo: phoneNo,
			registeredCard: registeredCard,
			rewardPoints: rewardPoints
		});
	});
});
router.post('/submitAccountDetails', function(req, res, next) {
	var input = req.body;
	var query = updateSQLuserData(customerId, input);
	console.log(query);
	pool.query(query, (err, data) => {
		console.log(err)
		res.redirect('/customer/accounts');
	});
});
router.post('/deactivateAccount', function(req, res, next) {
	pool.query(deactivateSQLcustomer(customerId), (err, data) => {
		console.log(err)
		res.redirect('/');
	});
});
// hidden URL for reactivation
// type: 
// http://localhost:3000/customer/activateAccount?cid=4
router.get('/activateAccount', function(req, res, next) {
	pool.query(activateSQLcustomer(req.query.cid), (err, data) => {
		res.redirect('/');
	});
});
module.exports = router;
