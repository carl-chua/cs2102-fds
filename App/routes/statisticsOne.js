var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.get('/', function (req, res, next) {
    var statisticsOne_query = "WITH NewCustomers as (SELECT EXTRACT(YEAR FROM C.dateRegistered) AS year, EXTRACT(MONTH FROM C.dateRegistered) AS month, COUNT(*) AS newCustomers FROM Customers C GROUP BY EXTRACT(YEAR FROM C.dateRegistered), EXTRACT(MONTH FROM C.dateRegistered)), TempTable as (SELECT O.timePlaced AS timePlaced, CASE WHEN PC.discountType IS NULL THEN O.foodSubTotal + O.deliveryFee WHEN PC.discountType = 'PERCENT' THEN (O.foodSubTotal)*((100-PC.discount)/100)+O.deliveryFee WHEN PC.discountType = 'DOLLAR' THEN (O.foodSubTotal + O.deliveryFee - PC.discount) WHEN PC.discountType = 'FREE-DELIVERY' THEN (O.foodSubTotal) END AS orderCost FROM Orders O LEFT OUTER JOIN PromotionalCampaigns PC ON O.promoCode = PC.promoCode WHERE O.status = 'DELIVERED'), OrderInformation as (SELECT EXTRACT(YEAR FROM TT.timePlaced) AS year, EXTRACT(MONTH FROM TT.timePlaced) AS month, COUNT(*) AS totalNumberOfOrders, TRUNC(SUM(TT.orderCost), 2) AS totalOrderCost FROM TempTable TT GROUP BY EXTRACT(YEAR FROM TT.timePlaced), EXTRACT(MONTH FROM TT.timePlaced)) SELECT COALESCE(OI.year,NC.year) AS year, COALESCE(OI.month,NC.month) AS month, COALESCE(NC.newCustomers,0) AS newCustomers, COALESCE(OI.totalNumberOfOrders,0) AS totalNumberOfOrders, COALESCE(OI.totalOrderCost,0) AS totalOrderCost FROM NewCustomers NC FULL OUTER JOIN OrderInformation OI ON NC.year = OI.year AND NC.month = OI.month ORDER BY NC.year DESC, NC.month DESC, OI.year DESC, OI.month DESC;";
    pool.query(statisticsOne_query, (err, statisticsOneData) => {
        console.log(err);
        res.render('statisticsOne', { statisticsOneData: statisticsOneData.rows });
    });
});

module.exports = router;