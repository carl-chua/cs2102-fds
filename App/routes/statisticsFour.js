var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.get('/', function (req, res, next) {
    var statisticsFour_query = "WITH RiderAverageDeliveryTime AS (SELECT O.riderId, EXTRACT(YEAR FROM O.timePlaced) as year, EXTRACT(MONTH FROM O.timePlaced) as month, AVG(age(O.timeRiderDelivered, O.timeRiderAccepts)) as avgDeliveryTime FROM Orders O GROUP BY O.riderId, EXTRACT(YEAR FROM O.timePlaced), EXTRACT(MONTH FROM O.timePlaced)), RiderRatings AS (SELECT O.riderId, EXTRACT(YEAR FROM O.timePlaced) as year, EXTRACT(MONTH FROM O.timePlaced) as month, COUNT(O.deliveryRating) as numRating, AVG(O.deliveryRating) as avgRating FROM Orders O GROUP BY O.riderId, EXTRACT(YEAR FROM O.timePlaced), EXTRACT(MONTH FROM O.timePlaced)), RiderTotalDeliveries AS (SELECT O.riderId, EXTRACT(YEAR FROM O.timePlaced) as year, EXTRACT(MONTH FROM O.timePlaced) as month, COUNT(*) AS numDeliveries FROM Orders O GROUP BY O.riderId, EXTRACT(YEAR FROM O.timePlaced), EXTRACT(MONTH FROM O.timePlaced)) SELECT R1.year, R1.month, R1.avgDeliveryTime, COALESCE(R2.numRating,0) as numRating, COALESCE(R2.avgRating,0) as avgRating, R3.numDeliveries as numDeliveries, R1.riderId FROM RiderAverageDeliveryTime R1 LEFT OUTER JOIN RiderRatings R2 ON R1.riderId = R2.riderId AND R1.year = R2.year AND R1.month = R2.month LEFT OUTER JOIN RiderTotalDeliveries R3 ON R1.riderId = R3.riderId AND R1.year = R3.year AND R1.month = R3.month ORDER BY R1.year DESC, R1.MONTH DESC, R1.riderId ASC;";
    pool.query(statisticsFour_query, (err, statisticsFourData) => {
        console.log(err);
        res.render('statisticsFour', { statisticsFourData: statisticsFourData.rows });
    });
});

module.exports = router;