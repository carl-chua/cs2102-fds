var express = require('express');
var router = express.Router();

var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

var customerTuple;
var currentOrderId;
var currentOrderRestaurantId;
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

// return order status as in schema
function getSQLCurrentOrder(customerId) {
	query = 
	"select * \
	from Orders\
	where customerId = " + customerId + "\
	and status = 'CART';";
	return query;
}

function insertSQLNewOrder(orderId, customerId, restaurantId) {
	query = 
	"INSERT INTO Orders VALUES (" 
	+ orderId + ", 'CART', 0, 5, 0, \
	null, null, null, null, \
	null, null, null, null, \
	false, null, null, " + customerId + ", " + restaurantId + ");";
	return query;
}

function getSQLridOfItem(itemId) {
	query = 
	"select restaurantId as rid \
	from foodmenuitems \
	where itemId = " + itemId + ";";
	return query;
}

function isSQLitemInOrder(itemId, orderId) {
	return "SELECT * \
	FROM Picks \
	WHERE orderId = " + orderId + " \
	AND itemId = " + itemId + ";";
}

function deleteCurrentOrder(orderId) {
	query = "delete from orders \
	where orderid = " + orderId + ";"
	return query;
}

function insertSQLAddress(address) {
	query = 
	"INSERT INTO Locations values \
	('" + address + "', 'area004'); "
	return query;
}

function placeSQLOrder(address, cardNo, orderId) {
	let addCardSentence = ""
	if (cardNo != null) {
		addCardSentence = "paymentCardNoIfUsed = '" + cardNo + "', ";
	}
	let dateTime = new Date(Date.now())
	dateTime.setHours(dateTime.getHours() + 8)
	query = 
	"UPDATE Orders SET \
		" + addCardSentence +" \
		haspaid = true, \
		timePlaced = '" + dateTime.toISOString().replace('T',' ').replace('Z','') + "', \
		address = '" + address + "' \
	where orderId = " + orderId + ";"
	return query
}

function getOrderHistory(customerId) {
	query = 
	""
	return query;
}

function getPromoDetails(inputPromoCode) {
	inputPromoCode = inputPromoCode.trim();
	query = 
	"select * \
	from ((promotionalcampaigns natural left join DeliveryServicePromotionalCampaigns) \
		natural left join RestaurantPromotionalCampaigns) \
		natural left join FoodItemPromotionalCampaigns \
	where promoCode = '" + inputPromoCode + "';"
	return query;
}

/* GET users listing. */
router.get('/', function (req, res, next) {
	customerTuple = req.session.message;
	console.log(customerTuple);
	res.redirect("/customer/orders");
});

router.get('/orders', function (req, res, next) {
	console.log(customerTuple);
	customerId = customerTuple.customerid;
	customerName = customerTuple.name;
	// console.log("req:", req);

	pool.query(getSQLCurrentOrder(customerId), (err, data) => {
		console.log("current Orders:",data.rowCount);
		if(data.rowCount == 1)  {
			// console.log(data);
			restaurantIdPicked = data.rows[0].restaurantid;
			currentOrderId = data.rows[0].orderid;
			console.log("currentOrderId: ", currentOrderId);
			// displayCurrentOrderForRestaurant(restaurantIdPicked);
			pool.query(getSQLPicks(customerId), (err, picksData) => {
				console.log("picksErr: ", err);
				// get latest unconfirmed order of this customer
				pool.query(getSQLFood(restaurantIdPicked), (err, foodData) => {
					// console.log("fooderr: ",err);
					// console.log("foodData:",foodData);
					res.render('customerCurrentOrder', {
						userName: customerName,
						picksData: picksData.rows,
						foodData: foodData.rows
					});
				})
			});
			// res.send("currentorderpage");
		} else {
			console.log("no current order")
			pool.query(getSQLRestaurants(), (err, restaurants) => {
				res.render('customerOrderPage', {
					userName: customerName,
					restaurants: restaurants.rows
				});
			});
		}
	});
});

router.post('/deleteCurrentOrder', function (req, res, next) {
	pool.query(deleteCurrentOrder(currentOrderId), (err, data) => {
		console.log("order delete success : ", currentOrderId);
		currentOrderId = null;
		res.redirect('/customer/orders');
	})
});

router.post('/addItem', function (req, res, next) {
	
	var itemIdToAdd = req.body.add;
	var itemQty = req.body.itemQty;

	if (itemQty == null || itemQty < 1) {
		res.send("enter a qty");
		return
	}

	if (currentOrderId == null) {
		console.log("to create new order");
		var getMaxOrderId = "SELECT MAX(orderId) FROM Orders;";
		pool.query(getMaxOrderId, (err, orderData) => {
			currentOrderId = orderData.rows[0].max + 1;
			pool.query(getSQLridOfItem(itemIdToAdd), (err, data) => {
				// console.log(data)
				currentOrderRestaurantId = data.rows[0].rid;
				pool.query(insertSQLNewOrder(currentOrderId, customerId, currentOrderRestaurantId), (err, orderData) => {
					console.log("Order created:", err);
					var check_items_exist_query = isSQLitemInOrder(itemIdToAdd, currentOrderId);
					pool.query(check_items_exist_query, (err, existData) => {
						// console.log(existData);
						var updateOrder
						if (existData.rowCount == 1) {
							// item already in order
							update_query = "UPDATE Picks SET \
							qtyOrdered = qtyOrdered + " + itemQty +" \
							WHERE orderId = " + currentOrderId + " \
							AND itemId = " + itemIdToAdd + ";";
						} else {
							// item not in order
							update_query = "INSERT INTO Picks VALUES (\
								" + currentOrderId + ", " + itemIdToAdd + ", " + itemQty + ");";
						}
						pool.query(update_query, (err, updateData) => {
							console.log("Order Updated: ", updateData);
							res.redirect('/customer/orders');
						});
					})
				});
			})
		})
	} else {
		console.log("currentOrder: ", currentOrderId);
		// current Order exists
		var check_items_exist_query = isSQLitemInOrder(itemIdToAdd, currentOrderId);
		pool.query(check_items_exist_query, (err, existData) => {
			// console.log(existData);
			var updateOrder
			if (existData.rowCount == 1) {
				// item already in order
				update_query = "UPDATE Picks SET \
				qtyOrdered = qtyOrdered + " + itemQty +" \
				WHERE orderId = " + currentOrderId + " \
				AND itemId = " + itemIdToAdd + ";";
			} else {
				// item not in order
				update_query = "INSERT INTO Picks VALUES (\
					" + currentOrderId + ", " + itemIdToAdd + ", " + itemQty + ");";
			}
			pool.query(update_query, (err, updateData) => {
				console.log("Order Updated: ", updateData);
				res.redirect('/customer/orders');
			});
		})
	}
	console.log("Add Item ENDed");
});

router.post('/removeItem', function (req, res, next) {
	
	var itemIdToRemove = req.body.itemIdtoRemove;
	var removeQty = req.body.removeQty;
	
	var get_number_of_items = "SELECT * \
		FROM Picks \
		WHERE orderId = " + currentOrderId + " \
		AND itemId = " + itemIdToRemove + ";";
	pool.query(get_number_of_items, (err, numberData) => {
		console.log(err);
		var update_query;
		if (numberData.rows[0].qtyordered <= removeQty) {
			update_query = "DELETE FROM Picks \
			WHERE orderId = " + currentOrderId + " \
			AND itemId = " + itemIdToRemove + ";";
		}
		else {
			update_query = "UPDATE Picks SET \
			qtyOrdered = qtyOrdered - " + removeQty + " \
			WHERE orderId = " + currentOrderId + " \
			AND itemId = " + itemIdToRemove + ";";
		}
		pool.query(update_query, (err, updateData) => {
			console.log("Order Updated: ", updateData);
			res.redirect('/customer/orders');
		})
	})
});

router.post('/chooseFood', function (req, res, next) {
	var restaurantIdPicked = req.body.restaurantIdPicked;
	// displayCurrentOrderForRestaurant(restaurantIdPicked);
	pool.query(getSQLPicks(customerId), (err, picksData) => {
		console.log(err);
		// get latest unconfirmed order of this customer
		pool.query(getSQLFood(restaurantIdPicked), (err, foodData) => {
			console.log(err);
			res.render('customerCurrentOrder', {
				userName: customerName,
				picksData: picksData.rows,
				foodData: foodData.rows
			});
		})
	});
});

router.get('/history', function (req, res, next) {
	res.send("history not implemented!");
	// res.render('customerOrderHistory',  {
	// })
})

router.post('/confirmOrder', function (req, res, next) {
	// res.send("hello" + req.body.confirm);
	if (currentOrderId == null) {
		res.redirect('/customer/orders');
		return;
	}

 	pool.query(getSQLPicks(customerId), (err, picksData) => {
		pool.query(getSQLCurrentOrder(customerId), (err, order) => {
			pool.query(getSQLuserData(customerId), (err, userData) => {
				// console.log(err); 
				// console.log(picksData);
				var addresses = [
					userData.rows[0].mostrecentaddress1,
					userData.rows[0].mostrecentaddress2,
					userData.rows[0].mostrecentaddress3,
					userData.rows[0].mostrecentaddress4,
					userData.rows[0].mostrecentaddress5
				];
				var addressDisplay = [];
				for (i = 0; i<addresses.length; i++) {
					if (addresses[i] != null) {
						addressDisplay.push(addresses[i])
					}
				}
				console.log("addresDisplay: ",addressDisplay);
				res.render('customerOrderConfirmPage', {
					userName: customerName,
					picksData: picksData.rows,
					addresses: addressDisplay,
					cardNo: userData.rows[0].registeredcardno
				});
			});
		})
 	})
});

router.post('/checkPromo', function (req, res, next) {
	// res.send("check promo code not implemented!")
	let inputPromoCode = req.body.inputPromoCode;
	let query = getPromoDetails(inputPromoCode);
	console.log(query);
	pool.query(query, (err, data) => {
		console.log("promo: ", data.rows);
		if (data.rowCount == 0) {
			console.log("promo doesn't exist")
			res.redirect('/customers/confirmOrder');
			return
		}
		res.send("check promo code not implemented!")
		return 
		let promo = data.rows[0]
		if (promo.restaurantid != null  && promo.itemid != null) {
			// FIPC has both rid and iid
			// get qty of item in current order
			// multiply dollar discount by qty
			// update orders table & reload

		} else if (promo.restaurantid != null) {
			// RPC has only rid
			// get order food subtotal
			// get dollar discount
			// update orders table & reload

		} else {
			// FDPC has managerid
			
		}

	})
});


router.post('/placeOrder', function (req, res, next) {
	
	let newAddress = req.body.newAddress
	let oldAddress = req.body.oldAddress
	let paymentType = req.body.paymentType == 1 ? 'CASH' : 'CARD'
	let deliveryAddress;
	
	if (newAddress != "") {
		deliveryAddress = newAddress;
	} else {
		deliveryAddress = oldAddress;
	}
	
	console.log("newAddress: ", newAddress)
	console.log("oldAddress: ", oldAddress)
	console.log("delivery address:", deliveryAddress)
	pool.query(insertSQLAddress(deliveryAddress), (err, data) => {
		console.log("insertAdd: ", err);
		pool.query(getSQLuserData(customerId), (err, userData) => {
			let cardNo = userData.rows[0].registeredcardno;
			query = placeSQLOrder(deliveryAddress, paymentType == 'CARD' ? cardNo : null, currentOrderId);
			console.log(query);
			pool.query(query, (err, data) => {
				console.log("orderPlaced: ", err);
				if (err == null) {
					currentOrderId == null;
				}
				console.log("currentOrderId: ", currentOrderId);
				res.redirect('/customer/history');
			})
		})
	})
});


/* ACCCOUNTS */

router.get('/accounts', function (req, res, next) {
	pool.query(getSQLuserData(customerId), (err, userData) => {
		console.log(userData.rows[0]);
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
