var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

/* GET all FDPC listing. */
router.get('/', function (req, res, next) {
    // req.query.user is passed in from index.js
    var FDPC_query = "SELECT * FROM DeliveryServicePromotionalCampaigns NATURAL JOIN PromotionalCampaigns ORDER BY startDateTime DESC, endDateTime DESC;";
    pool.query(FDPC_query, (err, FDPCData) => {
        console.log(err);
        res.render('viewAllFDPCPage', { FDPCData: FDPCData.rows });
    });
});

module.exports = router;