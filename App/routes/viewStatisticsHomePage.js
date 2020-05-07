var express = require('express');
var router = express.Router();

var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.get('/', function (req, res, next) {
    res.render('viewStatisticsHomePage', { title: 'Express' });
});

router.post('/', function (req, res, next) {
    var navigation = req.body.navigation;
    if (navigation == '1') {
        res.redirect("statisticsOne");
    } else if (navigation == '2') {
        res.redirect("statisticsTwo");
    } else if (navigation == '3') {
        res.redirect("statisticsThree");
    } else {
        res.redirect("statisticsFour");
    }
});

module.exports = router;