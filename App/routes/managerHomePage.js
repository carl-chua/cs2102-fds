var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

var managerId = null;

function getSQLuserData(fdsmanagerid) {
	return "SELECT * \
		FROM FoodDeliveryServiceManagers \
		WHERE fdsmanagerid = '" + fdsmanagerid + "';";
}

function updateSQLuserData(fdsmanagerid, input) {
	var passwordLine = "password = '" + input.inputPassword + "',";
	if (input.inputPassword == '-') {
		passwordLine = "";
	}
	console.log("input:", input);
	return "update FoodDeliveryServiceManagers set \
		name = '" + input.inputName + "', \
		" + passwordLine + " \
		email = '" + input.inputEmail + "' \
		where fdsmanagerid = " + fdsmanagerid + ";";
}

function deactivateSQLmanager(fdsmanagerid) {
	return "update FoodDeliveryServiceManagers set \
		isDeleted = true \
		where fdsmanagerid = " + fdsmanagerid + ";";
}

function activateSQLmanager(fdsmanagerid) {
	return "update FoodDeliveryServiceManagers set \
		isDeleted = false \
		where fdsmanagerid = " + fdsmanagerid + ";";
}

/* GET manager name listing. */
router.get('/', function(req, res, next) {
  // req.query.user is passed in from index.js
  managerId = req.session.fdsmanagerid;
  var user_query = "SELECT * FROM FoodDeliveryServiceManagers WHERE FDSManagerId = '" + managerId + "';";
  pool.query(user_query, (err, userData) => {
    console.log(err);
    res.render('managerHomePage', { userData: userData.rows });
  });
});

// Handling navigation to other pages
router.post('/', function(req, res, next) {
  var navigation = req.body.navigation;
  if (navigation == '1') {
    res.redirect('/viewAllFDPCPage');
  } else if (navigation == '2') {
    res.redirect('/createFDPCPage/?user=' + managerId);
  } else {
    res.redirect('/viewStatisticsHomePage');
  }
});



/* ACCCOUNTS */

router.get('/accounts', function (req, res, next) {
	pool.query(getSQLuserData(managerId), (err, userData) => {
		console.log(userData.rows[0]);
		var name = userData.rows[0].name;
		var email = userData.rows[0].email;
    var password = '**********';
    
		res.render('managerAccountPage', { 
			fdsmanagerid: managerId,
			userName: name,
			email: email,
			password: password
		});
	});
});
router.post('/editAccountDetails', function(req, res, next) {
	pool.query(getSQLuserData(managerId), (err, userData) => {
		// console.log(userData.rows[0]);
		var name = userData.rows[0].name;
		var email = userData.rows[0].email;
		var password = '**********';

		res.render('managerAccountEditPage', { 
			fdsmanagerid: managerId,
			userName: name,
			email: email,
			password: password
		});
	});
});
router.post('/submitAccountDetails', function(req, res, next) {
	var input = req.body;
	var query = updateSQLuserData(managerId, input);
	console.log(query);
	pool.query(query, (err, data) => {
		console.log(err)
		res.redirect('/managerHomePage/accounts');
	});
});
router.post('/deactivateAccount', function(req, res, next) {
	pool.query(deactivateSQLmanager(managerId), (err, data) => {
		console.log(err)
		res.redirect('/');
	});
});
// hidden URL for reactivation
// type: 
// http://localhost:3000/managerHomePage/activateAccount?mid=5
router.get('/activateAccount', function(req, res, next) {
	pool.query(activateSQLmanager(req.query.mid), (err, data) => {
		res.redirect('/');
	});
});


module.exports = router;
