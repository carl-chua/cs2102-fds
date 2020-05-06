var express = require('express');
var router = express.Router();

var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

var customerId = null;
var orderId = null;

/* GET users listing. */
router.get('/', function(req, res, next) {
	var get_picks = "WITH Temptable AS (SELECT O.orderId, O.foodSubTotal, R.restaurantId, R.name AS rname, P.itemId, FMI.name AS iname, FMI.price, P.qtyOrdered, (P.qtyOrdered * FMI.price) AS sumPrice FROM Picks P NATURAL JOIN Orders O JOIN FoodMenuItems FMI ON (P.itemId = FMI.itemId) JOIN Restaurants R ON (FMI.restaurantId = R.restaurantId) WHERE O.customerId = " + req.query.user + " AND O.status = 'CART' ORDER BY O.orderId desc) SELECT * FROM Temptable T WHERE T.orderId = (SELECT MAX(orderId) FROM Temptable);";
 	pool.query(get_picks, (err, picksData) => {
 		console.log(picksData);
 		res.render('customerOrderConfirmPage', {picksData: picksData.rows});
 	})
});

module.exports = router;
