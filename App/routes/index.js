var express = require('express');
var router = express.Router();

// connecting to Postgres DB
const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

/* SQL Query */
var sql_query = 'SELECT ';

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


// retrieving information from index.ejs page
// POST
router.post('/', function(req, res, next) {
	// Retrieve Information
	var email  = req.body.email;
	var password = req.body.password;
	var customerVal = req.body.customer;
	var riderVal = req.body.rider;

	console.log(riderVal);

	// Construct Specific SQL Query
	var insert_query = "SELECT name FROM Customers WHERE email = '" + email + "';";
	console.log(insert_query);
	
	pool.query(insert_query, (err, data) => {
		res.render('customerHomePage', {data: data.rows})
	});
	
});

module.exports = router;
