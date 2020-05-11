var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.get('/', function (req, res, next) {
    var statisticsTwo_query = "WITH TempTable as (SELECT O.timePlaced AS timePlaced, O.customerId AS customerId, CASE WHEN PC.discountType IS NULL THEN O.foodSubTotal + O.deliveryFee WHEN PC.discountType = 'PERCENT' THEN (O.foodSubTotal)*((100-PC.discount)/100)+O.deliveryFee WHEN PC.discountType = 'DOLLAR' THEN (O.foodSubTotal + O.deliveryFee - PC.discount) WHEN PC.discountType = 'FREE-DELIVERY' THEN (O.foodSubTotal) END AS orderCost FROM Orders O LEFT OUTER JOIN PromotionalCampaigns PC ON O.promoCode = PC.promoCode WHERE O.status = 'DELIVERED') SELECT EXTRACT(YEAR FROM TT.timePlaced) AS year, EXTRACT(MONTH FROM TT.timePlaced) AS month, C.customerId AS customerId, COUNT(*) AS totalNumberOfOrders, TRUNC(SUM(TT.orderCost),2) AS totalOrderCost FROM Customers C INNER JOIN TempTable TT ON C.customerId = TT.customerId GROUP BY C.customerId, EXTRACT(YEAR FROM TT.timePlaced), EXTRACT(MONTH FROM TT.timePlaced) ORDER BY EXTRACT(YEAR FROM TT.timePlaced) DESC, EXTRACT(MONTH FROM TT.timePlaced) DESC;";
    pool.query(statisticsTwo_query, (err, statisticsTwoData) => {
        console.log(err);
        res.render('statisticsTwo', { statisticsTwoData: statisticsTwoData.rows });
    });
});

module.exports = router;