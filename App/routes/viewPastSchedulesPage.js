var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});


/* GET users listing. */
router.get('/', function(req, res, next) {
	var scheduleQuery = "SELECT * FROM Schedules WHERE riderId = " + req.session.riderId + "ORDER BY scheduleId desc;";
	pool.query(scheduleQuery, (err, scheduleData) => {
		console.log(err);
		res.render('viewPastSchedulesPage', {scheduleData: scheduleData.rows});
	})
});

router.post('/', function(req, res, next) { 
	var scheduleId = req.body.orders;
	console.log(scheduleId);
	var datesQuery = "SELECT startDate, endDate FROM Schedules WHERE scheduleId = " + scheduleId + ";";
	pool.query(datesQuery, (err, datesData) => {
		console.log(err);
		time = new Date(Date.now()).toISOString().replace('T',' ').replace('Z','');
		var startDate = (datesData.rows[0].startdate).toISOString().replace('T',' ').replace('Z','');
		var endDate = (datesData.rows[0].enddate).toISOString().replace('T',' ').replace('Z','');
		console.log(startDate, endDate);
		var ordersQuery = "SELECT O.orderId, O.deliveryFee, O.deliveryRating, R.name, R.address AS raddress, O.address AS caddress, O.timePlaced, O.timeRiderArrivesRestaurant, O.timeRiderLeavesRestaurant, O.timeRiderDelivered FROM Orders O JOIN Restaurants R ON (O.restaurantId = R.restaurantId) WHERE O.riderId = " + req.session.riderId + " AND O.timePlaced BETWEEN '" + startDate + "' AND '" + endDate + "' ORDER BY O.timePlaced desc;";
		pool.query(ordersQuery, (err, ordersData) => {
			console.log(ordersData);
			res.render('viewDeliveriesPage', {ordersData: ordersData.rows});
		});
	})
});

module.exports = router;
