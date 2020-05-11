var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.get('/', function (req, res, next) {
    var statisticsThree_query = "WITH TempTable as (SELECT O.timePlaced AS timePlaced, O.address AS address, CASE WHEN PC.discountType IS NULL THEN O.foodSubTotal + O.deliveryFee WHEN PC.discountType = 'PERCENT' THEN (O.foodSubTotal)*((100-PC.discount)/100)+O.deliveryFee WHEN PC.discountType = 'DOLLAR' THEN (O.foodSubTotal + O.deliveryFee - PC.discount) WHEN PC.discountType = 'FREE-DELIVERY' THEN (O.foodSubTotal) END AS orderCost FROM Orders O LEFT OUTER JOIN PromotionalCampaigns PC ON O.promoCode = PC.promoCode WHERE O.status = 'DELIVERED') SELECT EXTRACT(YEAR FROM TT.timePlaced) AS year, EXTRACT(MONTH FROM TT.timePlaced) AS month, EXTRACT(DAY FROM TT.timePlaced) AS day, EXTRACT(HOUR FROM TT.timePlaced) AS hour, L.areaName AS area, count(*) AS totalNumberOfOrders, TRUNC(sum(orderCost),2) AS totalOrderCost FROM TempTable TT INNER JOIN Locations L ON TT.address = L.address GROUP BY EXTRACT(YEAR FROM TT.timePlaced), EXTRACT(MONTH FROM TT.timePlaced), EXTRACT(DAY FROM TT.timePlaced), EXTRACT(HOUR FROM TT.timePlaced), L.areaName ORDER BY EXTRACT(YEAR FROM TT.timePlaced) DESC, EXTRACT(MONTH FROM TT.timePlaced) DESC, EXTRACT(DAY FROM TT.timePlaced) DESC, EXTRACT(HOUR FROM TT.timePlaced) DESC;";
    pool.query(statisticsThree_query, (err, statisticsThreeData) => {
        console.log(err);
        res.render('statisticsThree', { statisticsThreeData: statisticsThreeData.rows });
    });
});

module.exports = router;