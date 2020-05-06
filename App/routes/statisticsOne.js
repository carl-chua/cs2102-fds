var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

/* GET all FDPC listing. */
router.get('/', function (req, res, next) {
    // req.query.user is passed in from index.js
    var statisticsOne_query = "FROM Customers C FULL OUTER JOIN Orders O ON EXTRACT(YEAR FROM C.dateRegistered) = EXTRACT(YEAR FROM O.timePlaced) AND EXTRACT(MONTH FROM C.dateRegistered) = EXTRACT(MONTH FROM O.timePlaced) GROUP BY MONTH(``)";
    pool.query(statisticsOne_query, (err, statisticsOneData) => {
        console.log(err);
        res.render('statisticsOne', { statisticsOneData: statisticsOneData.rows });
    });
});

module.exports = router;