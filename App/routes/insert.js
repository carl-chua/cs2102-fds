var express = require('express');
var router = express.Router();

// connecting to Postgres DB
const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

/* SQL Query */
var sql_query = 'INSERT INTO student_info VALUES';

// rendering insert.ejs page
// GET
router.get('/', function(req, res, next) {
	res.render('insert', { title: 'Modifying Database' });
});

// retrieving information from insert.ejs page
// POST
router.post('/', function(req, res, next) {
	// Retrieve Information
	var matric  = req.body.matric;
	var name    = req.body.name;
	var faculty = req.body.faculty;
	
	// Construct Specific SQL Query
	var insert_query = sql_query + "('" + matric + "','" + name + "','" + faculty + "')";
	
	pool.query(insert_query, (err, data) => {
		res.redirect('/select')
	});
});

module.exports = router;
