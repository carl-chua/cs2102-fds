var express = require('express');
var router = express.Router();

var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

var customerId = null;

/* GET users listing. */
router.get('/', function(req, res, next) {
	console.log(req.query.order);
  res.render('customerOrderConfirmPage', { title: 'Express' });
});

module.exports = router;
