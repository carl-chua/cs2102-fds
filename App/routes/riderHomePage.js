var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

var riderId = null;
var riderData = null;

router.get('/', function(req, res, next) {
	riderId = req.query.user;
	var riderInfoQuery = "SELECT * FROM DeliveryRiders DR WHERE riderId = " + req.query.user + " AND isDeleted = FALSE;";
	pool.query(riderInfoQuery, (err, riderData) => {
		var orderQuery = "SELECT O.orderId, O.deliveryFee, R.name AS rname, R.address AS raddress, O.address as caddress, C.name as cname, C.phoneNo, O.timePlaced FROM Orders O JOIN Restaurants R ON (O.restaurantId = R.restaurantId) JOIN Customers C ON (O.customerId = C.customerId) WHERE O.riderId = " + req.query.user + " AND O.status <> 'DELIVERED';";
		pool.query(orderQuery, (err, orderData) => {
			console.log(err); console.log(orderData);
			res.render('riderHomePage', {riderData: riderData.rows, orderData: orderData.rows});			
		})

	});
});

router.post('/', function(req, res, next) {
	var arrivedAtRestaurant = req.body.arrived;
	var collectedOrder = req.body.collected;
	var deliveredOrder = req.body.delivered;
	var viewSchedules = req.body.schedules;
	var viewPayments = req.body.payments;
	var viewDeliveries = req.body.deliveries;
});

module.exports = router;
