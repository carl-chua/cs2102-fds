sqlFormatter.format('SELECT *', {
  language: 'pl/sql', // Defaults to "sql"
  indent: '    ', // Defaults to two spaces,
  uppercase: true, // Defaults to false
  linesBetweenQueries: 2 // Defaults to 1
});

--Show pending orders
SELECT o.orderid, o.foodsubtotal, o.timeplaced, f.name, f.price, p.qtyordered
FROM ORDERS o
JOIN PICKS p
ON o.orderid = p.orderid
JOIN FOODMENUITEMS f
ON p.itemid = f.itemid 
WHERE o.status = 'PENDING'
ORDER BY o.timeplaced;

/*
--Change an order's status to preparing
UPDATE ORDER
SET status = 'PREPARING'
WHERE orderid = (orderid);
*/

--Show preparing orders
SELECT o.orderid, o.foodsubtotal, o.timeplaced, f.name, f.price, p.qtyordered
FROM ORDERS o
JOIN PICKS p
ON o.orderid = p.orderid
JOIN FOODMENUITEMS f
ON p.itemid = f.itemid 
WHERE o.status = 'PREPARING'
ORDER BY o.timeplaced;

/*
--Change an order's status to completed
UPDATE ORDER
SET status = 'READY-FOR-DELIVERY'
WHERE orderid = (orderid);
*/

--Show completed orders
SELECT o.orderid, o.foodsubtotal, o.timeplaced, f.name, f.price, p.qtyordered
FROM ORDERS o
JOIN PICKS p
ON o.orderid = p.orderid
JOIN FOODMENUITEMS f
ON p.itemid = f.itemid 
WHERE o.status = 'READY-FOR-DELIVERY'
OR o.status = 'DELIVERING'
OR o.status = 'DELIVERED'
ORDER BY o.timeplaced;

/*
--Show total earnings todays
SELECT SUM(o.foodsubtotal)
FROM ORDERS o
WHERE o.timeplaced = (today's date)
AND o.status = 'READY-FOR-DELIVERY'
*/

--Show food menu items
SELECT f.itemid, f.name, f.price, f.qtyorderedtoday, f.dailylimit, f.isselling, f.isavailabletoday, f.rating
FROM FOODMENUITEMS f
ORDER BY f.category;

--Add food menu item
INSERT INTO FOODMENUITEMS
VALUES (26, 'chicken rice', 100, 3.0, 'Local', 0, true, true, 5, null);

/*
--Edit a food menu item
UPDATE FOODMENUITEMS
SET name = 'chicken rice', dailylimit = 100, price = 3.0, category = 'Hai Nan', qtyorderedtoday = 0, isselling = true, isavailabletoday = true, 5, rating = null
WHERE itemid = (itemid);
*/

/*
--Delete a food menu item
DELETE FROM FOODMENUITEMS
WHERE itemid = (itemid);
*/

/* 
--Show Top 5 items statistcs
--Foodmenuitems should have a count attribute
SELECT ROW_NUMBER() OVER (ORDER BY) rank, f.itemid, f.name, f.price, f.qtyorderedtoday, f.dailylimit, f.isselling, f.isavailabletoday, f.rating
FROM FOODMENUITEMS f
LIMIT 5;
 */

--Promotional campaign should have a usage count attribute
--Show active campaigns
SELECT rpc.promocode, rpc.startdatetime, rpc.enddatetime, rpc.discount, rpc.minspend, rpc.enddatetime - rpc.startdatetime as hours
FROM RESTAURANTPROMOTIONALCAMPAIGNS rpc 
WHERE rpc.isActive = true;

--Show inactive campaigns
SELECT rpc.promocode, rpc.startdatetime, rpc.enddatetime, rpc.discount, rpc.minspend, rpc.enddatetime - rpc.startdatetime as hours
FROM RESTAURANTPROMOTIONALCAMPAIGNS rpc 
WHERE rpc.isActive = false;

/*
--Add campaign (must also insert into general promo campaign)
INSERT INTO RESTAURANTPROMOTIONALCAMPAIGNS
VALUES ('R001-50PERCENTOFF-ALL', '2020-04-04 00:00:00', '2020-06-04 00:00:00', 'PERCENT', 50, 5.00, 'ALL-CUSTOMERS', null, true, 1);
*/

/*
--Edit a campaign
UPDATE RESTAURANTPROMOTIONALCAMPAIGNS
SET promocode = '50OFF', startdatetime = '2020-04-04 00:00:00', enddatetimeprice = '2020-06-04 00:00:00', promotype = 'PERCENT', discount = 50, minspend = 5.00, promoapplicablefor = 'ALL-CUSTOMERS', dayssincelastorder = null, isactive = true
WHERE restaurantstaffid = (restaurantstaffid);
*/

/*
--Edit min order price
UPDATE RESTURANTS
SET minspend = (minspend)
where resturantid = restaurantid;
*/

/*
--Edit resturant staff name, password, email
UPDATE RESTURANTSTAFFS
SET name = (name), password = (password), email = (email)
where restaurantstaffid = restaurantstaffid;
*/








