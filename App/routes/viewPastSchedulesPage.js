var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});


/* GET users listing. */
router.get('/', function(req, res, next) {
	var scheduleQuery = "SELECT * FROM Schedules WHERE riderId = " + req.session.riderId + ";";
	pool.query(scheduleQuery, (err, scheduleData) => {
		console.log(err);
		res.render('viewPastSchedulesPage', {scheduleData: scheduleData.rows});
	})
});

module.exports = router;
