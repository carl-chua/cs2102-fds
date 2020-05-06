var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

// NEED edit email/details button as well!!

router.get('/', function(req, res, next) {
	var riderInfoQuery = "SELECT * FROM DeliveryRiders DR WHERE riderId = " + req.session.riderId + " AND isDeleted = FALSE;";
	pool.query(riderInfoQuery, (err, riderData) => {
		var orderQuery = "SELECT O.orderId, O.deliveryFee, R.name AS rname, R.address AS raddress, O.address as caddress, C.name as cname, C.phoneNo, O.timePlaced FROM Orders O JOIN Restaurants R ON (O.restaurantId = R.restaurantId) JOIN Customers C ON (O.customerId = C.customerId) WHERE O.riderId = " + req.session.riderId + " AND O.status <> 'DELIVERED';";
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

	console.log(viewSchedules);

	var submit_timestamp;
	if (typeof arrivedAtRestaurant != 'undefined') {
		submit_timestamp = "UPDATE Orders SET timeRiderArrivesRestaurant = NOW() WHERE orderId = " + arrivedAtRestaurant + ";";
	}
	else if (typeof collectedOrder != 'undefined') {
		submit_timestamp = "UPDATE Orders SET timeRiderLeavesRestaurant = NOW() WHERE orderId = " + collectedOrder + ";";
	}
	else if (typeof deliveredOrder != 'undefined') {
		submit_timestamp = "UPDATE Orders SET timeRiderDelivered = NOW() WHERE orderId = " + deliveredOrder + ";";
	}

	if (typeof arrivedAtRestaurant != 'undefined' || typeof collectedOrder != 'undefined' || typeof deliveredOrder != 'undefined') {
		pool.query(submit_timestamp, (err, submitData) => {
			console.log(err);
			res.send(err.message);
		});
	}
	else if (typeof viewSchedules != 'undefined') {
		res.redirect('/viewSchedulesPage');
	}
	else if (typeof viewPayments != 'undefined') {
		res.redirect('/viewPaymentsPage');	
	}
	else if (typeof viewDeliveries != 'undefined') {
		res.redirect('/viewDeliveriesPage');
	}
});

module.exports = router;
