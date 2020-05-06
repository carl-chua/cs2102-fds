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
		res.render('riderHomePage', {riderData: riderData.rows});
	});
});

module.exports = router;
