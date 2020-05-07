var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

/* GET users listing. */
router.get('/', function(req, res, next) {
	var ordersQuery = "SELECT O.orderId, O.deliveryFee, O.deliveryRating, R.name, R.address AS raddress, O.address AS caddress, O.timePlaced, O.timeRiderArrivesRestaurant, O.timeRiderLeavesRestaurant, O.timeRiderDelivered FROM Orders O JOIN Restaurants R ON (O.restaurantId = R.restaurantId) WHERE O.riderId = " + req.session.riderId + " ORDER BY O.timePlaced desc;";
	pool.query(ordersQuery, (err, ordersData) => {
		console.log(err);
		res.render('viewDeliveriesPage', {ordersData: ordersData.rows});
	});
});

module.exports = router;
