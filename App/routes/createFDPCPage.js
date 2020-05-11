var express = require('express');
var router = express.Router();

var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

var managerId = null;

router.get('/', function (req, res, next) {
    managerId = req.query.user;
    res.render('createFDPCPage', { title: 'Express' });
});

router.post('/', function(req, res, next) {
    var promoCode = req.body.promoCode;
    var endDateTime = req.body.endDateTime;
    var discountType = req.body.discountType;
    var discount = req.body.discount;
    var minSpend = req.body.minSpend;
    var promoApplicableFor = req.body.promoApplicableFor;
    var daysSinceLastOrder = req.body.daysSinceLastOrder;
    var createdFDPC = req.body.createdFDPC;

    var insert_statement = "INSERT INTO PromotionalCampaigns(promoCode, endDateTime, promoType, discountType, discount, minSpend, promoApplicableFor, daysSinceLastOrder, isActive)VALUES('" + promoCode + "', '" + endDateTime + "'::timestamp, 'FDPC', '" + discountType + "', '" + discount + "', '" + minSpend + "', '" + promoApplicableFor + "', '" + daysSinceLastOrder + "', 'true');";

    if (daysSinceLastOrder == "") {
        var insert_statement = "INSERT INTO PromotionalCampaigns(promoCode, endDateTime, promoType, discountType, discount, minSpend, promoApplicableFor, daysSinceLastOrder, isActive)VALUES('" + promoCode + "', '" + endDateTime + "'::timestamp, 'FDPC', '" + discountType + "', '" + discount + "', '" + minSpend + "', '" + promoApplicableFor + "', null, 'true');";
    }

    pool.query(insert_statement, (err, res) => {
        console.log(err, res);

        var insert_statement2 = "INSERT INTO DeliveryServicePromotionalCampaigns(promoCode, FDSManagerId)VALUES('" + promoCode + "', '" + managerId + "');";

        pool.query(insert_statement2, (err, res) => {
            console.log(err, res);
        });
    });

    if (createdFDPC == '1') {
        res.redirect('/managerHomePage/?user=' + managerId);
    } 
});

module.exports = router;