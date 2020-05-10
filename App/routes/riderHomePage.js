var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

// NEED edit email/details button as well!!


function getSQLuserData(riderid) {
	return "SELECT * \
		FROM DeliveryRiders \
		WHERE riderid = '" + riderid + "';";
}

function updateSQLuserData(riderid, input) {
	var passwordLine = "password = '" + input.inputPassword + "',";
	if (input.inputPassword == '-') {
		passwordLine = "";
	}
	console.log("input:", input);
	return "update DeliveryRiders set \
		name = '" + input.inputName + "', \
		email = '" + input.inputEmail + "', \
		" + passwordLine + " \
		phoneno = " + input.inputPhoneNo + " \
		where riderid = " + riderid + ";";
}

function deactivateSQLrider(riderid) {
	return "update DeliveryRiders set \
		isDeleted = true \
		where riderid = " + riderid + ";";
}

function activateSQLrider(riderid) {
	return "update DeliveryRiders set \
		isDeleted = false \
		where riderid = " + riderid + ";";
}


router.get('/', function(req, res, next) {
	var riderInfoQuery = "SELECT * FROM DeliveryRiders DR WHERE riderId = " + req.session.riderId + " AND isDeleted = FALSE;";
	pool.query(riderInfoQuery, (err, riderData) => {
		var orderQuery = "SELECT O.paymentCardNoIfUsed, O.orderId, O.deliveryFee, R.name AS rname, R.address AS raddress, O.address as caddress, C.name as cname, C.phoneNo, O.timePlaced, O.timeRiderArrivesRestaurant, O.timeRiderLeavesRestaurant FROM Orders O JOIN Restaurants R ON (O.restaurantId = R.restaurantId) JOIN DeliveryRiders C ON (O.riderid = C.riderid) WHERE O.riderId = " + req.session.riderId + " AND O.status <> 'DELIVERED';";
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
		console.log(deliveredOrder);
		pool.query(submit_timestamp, (err, submitData) => {
			if (typeof err != "undefined") {
				res.send(err.message);
			}
			else {
				res.redirect('back');
			}
		});
	}
	else if (typeof viewSchedules != 'undefined') {
		res.redirect('/viewSchedulesPage');
	}
	else if (typeof viewDeliveries != 'undefined') {
		res.redirect('/viewDeliveriesPage');
	}
});


/* ACCCOUNTS */

router.get('/accounts', function (req, res, next) {
	let riderid = req.session.riderId;
	pool.query(getSQLuserData(riderid), (err, userData) => {
		console.log(userData.rows[0]);
		var name = userData.rows[0].name;
		var email = userData.rows[0].email;
		var password = '**********';
		var phoneNo = userData.rows[0].phoneno;
		var overallRating = userData.rows[0].overallrating;

		res.render('riderAccountPage', { 
			riderid: riderid,
			userName: name,
			email: email,
			password: password,
			phoneNo: phoneNo,
			overallRating: overallRating
		});
	});
});
router.post('/editAccountDetails', function(req, res, next) {
	let riderid = req.session.riderId;
	pool.query(getSQLuserData(riderid), (err, userData) => {
		// console.log(userData.rows[0]);
		var name = userData.rows[0].name;
		var email = userData.rows[0].email;
		var password = '**********';
		var phoneNo = userData.rows[0].phoneno;
		
		res.render('riderAccountEditPage', { 
			riderid: riderid,
			userName: name,
			email: email,
			password: password,
			phoneNo: phoneNo
		});
	});
});
router.post('/submitAccountDetails', function(req, res, next) {
	let riderid = req.session.riderId;
	var input = req.body;
	var query = updateSQLuserData(riderid, input);
	console.log(query);
	pool.query(query, (err, data) => {
		console.log(err)
		res.redirect('/riderHomePage/accounts');
	});
});
router.post('/deactivateAccount', function(req, res, next) {
	let riderid = req.session.riderId;
	pool.query(deactivateSQLrider(riderid), (err, data) => {
		console.log(err)
		res.redirect('/');
	});
});
// hidden URL for reactivation
// type: 
// http://localhost:3000/riderHomePage/activateAccount?rid=1
router.get('/activateAccount', function(req, res, next) {
	pool.query(activateSQLrider(req.query.rid), (err, data) => {
		res.redirect('/');
	});
});

module.exports = router;
