const express = require("express");
const router = express.Router();

const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

var staffId;
var staffName;
var restaurantId;

function getSQLuserData(restaurantstaffid) {
	return "SELECT * \
		FROM restaurantStaffs \
		WHERE restaurantstaffid = '" + restaurantstaffid + "';";
}

function updateSQLuserData(restaurantstaffid, input) {
	if (input.inputCardNo === "-") input.inputCardNo = "null";
	var passwordLine = "password = '" + input.inputPassword + "',";
	if (input.inputPassword == '-') {
		passwordLine = "";
	}
	console.log("input:", input);
	return "update restaurantStaffs set \
		name = '" + input.inputName + "', \
		" + passwordLine + " \
		email = '" + input.inputEmail + "' \
		where restaurantstaffid = " + restaurantstaffid + ";";
}

function deactivateSQLrstaff(restaurantstaffid) {
	return "update restaurantStaffs set \
		isDeleted = true \
		where restaurantstaffid = " + restaurantstaffid + ";";
}

function activateSQLrstaff(restaurantstaffid) {
	return "update restaurantStaffs set \
		isDeleted = false \
		where restaurantstaffid = " + restaurantstaffid + ";";
}

function getPendingOrdersQuery(restaurantId) {
  return "SELECT o.orderid, o.foodsubtotal, o.timeplaced, f.name, f.price, p.qtyordered \
    FROM ORDERS o JOIN PICKS p ON o.orderid = p.orderid JOIN FOODMENUITEMS f ON p.itemid = f.itemid \
    WHERE o.restaurantid = " +
    restaurantId +
    " AND o.status = 'PENDING' \
    ORDER BY o.timeplaced";
}
function getPreparingOrdersQuery(restaurantId) {
  return "SELECT o.orderid, o.foodsubtotal, o.timeplaced, f.name, f.price, p.qtyordered \
    FROM ORDERS o JOIN PICKS p ON o.orderid = p.orderid JOIN FOODMENUITEMS f ON p.itemid = f.itemid \
    WHERE o.restaurantid = " +
    restaurantId +
    " AND o.status = 'PREPARING' \
    ORDER BY o.timeplaced";
}
function getCompletedOrdersQuery(restaurantId) {
  return "SELECT o.orderid, o.foodsubtotal, o.timeplaced, f.name, f.price, p.qtyordered \
    FROM ORDERS o JOIN PICKS p ON o.orderid = p.orderid JOIN FOODMENUITEMS f ON p.itemid = f.itemid \
    WHERE o.restaurantid = " +
    restaurantId +
    " AND (o.status = 'READY-FOR-DELIVERY' OR o.status = 'DELIVERING' OR o.status = 'DELIVERED') \
    ORDER BY o.timeplaced";
}
function getEarningsTodayQuery(restaurantId) {
  return "SELECT SUM(o.foodsubtotal) as earnings \
  FROM ORDERS o JOIN PICKS p ON o.orderid = p.orderid \
  WHERE o.restaurantid = " +
  restaurantId +
  " GROUP BY o.restaurantid";
}
function getChangeOrderStatusToPreparingQuery(orderId) {
  return "UPDATE ORDERS SET status = 'PREPARING' WHERE orderid = " + orderId;
}
function getChangeOrderStatusToCompletedQuery(orderId) {
  return "UPDATE ORDERS SET status = 'READY-FOR-DELIVERY' WHERE orderid = " + orderId;
}
function getMenuQuery(restaurantId) {
  return "SELECT f.itemid, f.category, f.name, f.price, f.qtyorderedtoday, f.dailylimit, f.isselling, f.isavailabletoday, f.rating \
  FROM FOODMENUITEMS f \
  WHERE f.restaurantid = " +
  restaurantId +
  " ORDER BY f.category ASC, f.itemid ASC";
}
function getMaxItemIdQuery() {
  return "SELECT MAX(itemid) FROM FOODMENUITEMS";
}
function getAddItemQuery(restaurantId, itemId, name, dailyLimit, price, category, isAvailableToday) {
  return "INSERT INTO FOODMENUITEMS VALUES(" +
  itemId +
  ", '" +
  name +
  "', " +
  dailyLimit +
  "," +
  price +
  ", '" +
  category +
  "', 0, true, " +
  isAvailableToday +
  ", " +
  restaurantId +
  ", null)";
}
function getEditItemQuery(itemId, name, dailyLimit, price, category, isAvailableToday) {
  return "UPDATE FOODMENUITEMS \
  SET name = '" +
  name +
  "', dailyLimit = " +
  dailyLimit +
  ", price = " +
  price +
  ", category = '" +
  category +
  "', isAvailableToday = " +
  isAvailableToday +
  " WHERE itemId = " +
  itemId;
}
function getDeleteItemQuery(itemId) {
  return "UPDATE FOODMENUITEMS \
  SET isSelling = false, \
  isAvailableToday = false \
  WHERE itemId = " + itemId;
}
function getTopItemQuery(restaurantId) {
  return "SELECT SUM(p.qtyordered) as total, f.itemid, f.name, f.price, f.qtyorderedtoday, f.rating \
  FROM FOODMENUITEMS f JOIN PICKS p ON f.itemId = p.itemId \
  WHERE f.restaurantid = " +
  restaurantId +
  " GROUP BY f.itemId \
  ORDER BY total DESC \
  LIMIT 5";
}
function getBottomItemQuery(restaurantId) {
  return "SELECT SUM(p.qtyordered) as total, f.itemid, f.name, f.price, f.qtyorderedtoday, f.rating \
  FROM FOODMENUITEMS f JOIN PICKS p ON f.itemId = p.itemId \
  WHERE f.restaurantid = " +
  restaurantId +
  " GROUP BY f.itemId \
  ORDER BY total ASC \
  LIMIT 5";
}

function getNoOfOrderMonthlyQuery(restaurantId) {
  return "SELECT EXTRACT(YEAR FROM o.timeplaced) AS year, EXTRACT(MONTH FROM o.timeplaced) AS month, COUNT(*) AS nooforders, SUM(o.foodsubtotal) AS totalcost FROM ORDERS o WHERE o.restaurantid = " + restaurantId + " GROUP BY EXTRACT(YEAR FROM o.timeplaced), EXTRACT(MONTH FROM o.timeplaced) ORDER BY EXTRACT(YEAR FROM o.timeplaced) DESC, EXTRACT(MONTH FROM o.timeplaced) DESC";
}

function getTotalNumberOfOrdersQuery(restaurantId) {
  return "SELECT SUM(o.orderid) as total \
  FROM ORDERS o \
  WHERE o.restaurantid = " +
  restaurantId +
  " GROUP BY o.orderid";
}
function getTotalSalesQuery(restaurantId) {
  return "SELECT SUM(o.foodsubtotal) as sales \
    FROM ORDERS o \
    WHERE o.restaurantid = " +
    restaurantId +
    " AND (o.status = 'READY-FOR-DELIVERY' OR o.status = 'DELIVERING' OR o.status = 'DELIVERED')";
}
function getActiveCampaignsQuery(restaurantId) {
  return "SELECT pc.promocode, pc.startdatetime, pc.enddatetime, pc.promotype, pc.discounttype, pc.discount, pc.minspend, pc.promoapplicablefor, pc.dayssincelastorder, ((EXTRACT(EPOCH FROM (pc.enddatetime - pc.startdatetime))) /3600) as hours FROM PROMOTIONALCAMPAIGNS pc JOIN RESTAURANTPROMOTIONALCAMPAIGNS rpc  ON pc.promocode = rpc.promocode WHERE rpc.restaurantid = " + restaurantId + " AND pc.isactive = true UNION SELECT pc.promocode, pc.startdatetime, pc.enddatetime, pc.promotype, pc.discounttype, pc.discount, pc.minspend, pc.promoapplicablefor, pc.dayssincelastorder, ((EXTRACT(EPOCH FROM (pc.enddatetime - pc.startdatetime))) /3600) as hours FROM PROMOTIONALCAMPAIGNS pc JOIN FOODITEMPROMOTIONALCAMPAIGNS fipc ON pc.promocode = fipc.promocode WHERE fipc.restaurantid = " + restaurantId + " AND pc.isactive = true";
}
function getInactiveCampaignsQuery(restaurantId) {
  return "SELECT pc.promocode, pc.startdatetime, pc.enddatetime, pc.promotype, pc.discounttype, pc.discount, pc.minspend, pc.promoapplicablefor, pc.dayssincelastorder, ((EXTRACT(EPOCH FROM (pc.enddatetime - pc.startdatetime))) /3600) as hours FROM PROMOTIONALCAMPAIGNS pc JOIN RESTAURANTPROMOTIONALCAMPAIGNS rpc  ON pc.promocode = rpc.promocode WHERE rpc.restaurantid = " + restaurantId + " AND pc.isactive = false UNION SELECT pc.promocode, pc.startdatetime, pc.enddatetime, pc.promotype, pc.discounttype, pc.discount, pc.minspend, pc.promoapplicablefor, pc.dayssincelastorder, ((EXTRACT(EPOCH FROM (pc.enddatetime - pc.startdatetime))) /3600) as hours FROM PROMOTIONALCAMPAIGNS pc JOIN FOODITEMPROMOTIONALCAMPAIGNS fipc ON pc.promocode = fipc.promocode WHERE fipc.restaurantid = " + restaurantId + " AND pc.isactive = false";
}
function getAddCampaignQuery(promoCode, startDateTime, endDateTime, promoType, discountType, discount, minSpend, promoApplicableFor, daysSinceLastOrder) {
  return "INSERT INTO PROMOTIONALCAMPAIGNS VALUES('" +
  promoCode +
  "', '" +
  startDateTime +
  "', '" +
  endDateTime +
  "', '" +
  promoType +
  "', '" +
  discountType +
  "', " +
  discount +
  ", " +
  minSpend +
  ", '" +
  promoApplicableFor +
  "', " +
  daysSinceLastOrder +
  ", true)";
}
function getAddPromotionalCampaignQuery(restaurantId, promoCode) {
  return "INSERT INTO RESTAURANTPROMOTIONALCAMPAIGNS VALUES('" +
  promoCode +
  "', " +
  restaurantId + 
  ")";
}
function getAddFoodItemCampaignQuery(restaurantId, promoCode, itemId) {
  return "INSERT INTO FOODITEMPROMOTIONALCAMPAIGNS VALUES('" +
  promoCode +
  "', " +
  restaurantId + 
  ", " +
  itemId +
  ")";
}
function getEditCampaignQuery(promoCode, startDateTime, endDateTime, discountType, discount, minSpend, promoApplicableFor, daysSinceLastOrder) {
  return "UPDATE PROMOTIONALCAMPAIGNS \
  SET startDateTime = '" +
  startDateTime +
  "', endDateTime = '" +
  endDateTime +
  "', discountType = '" +
  discountType +
  "', discount = " +
  discount +
  ", minSpend = " +
  minSpend +
  ", promoApplicableFor = '" +
  promoApplicableFor +
  "', daysSinceLastOrder = " +
  daysSinceLastOrder +
  " WHERE promoCode = '" +
  promoCode +
  "'";
}

function getDeleteCampaignQuery(promoCode) {
  return "UPDATE PROMOTIONALCAMPAIGNS \
  SET isActive = false \
  WHERE promoCode = '" +
  promoCode +
  "'";
}

function getMinSpendQuery(restaurantId) {
  return "SELECT minspend FROM RESTAURANTS WHERE restaurantId = " +
  restaurantId;
}

function getEditMinSpendQuery(restaurantId, minSpend) {
  return "UPDATE RESTAURANTS \
  SET minSpend = " +
  minSpend +
  " WHERE restaurantId = " +
  restaurantId;
}

router.get("/", function (req, res, next) {
  //values are passed in from index.js
  staffId = req.session.staffId;
  staffName = req.session.name;
  restaurantId = req.session.restaurantId;
  res.render("restaurantStaffHomePage", {
    title: "Restaurant Staff Homepage",
    id: staffId,
    name: staffName,
  });
});

router.use("/orders", function (req, res, next) {
  pool.query(getPendingOrdersQuery(restaurantId), (err, pendingData) => {
    pool.query(getPreparingOrdersQuery(restaurantId), (err, preparingData) => {
      pool.query(getCompletedOrdersQuery(restaurantId), (err, completedData) => {
        pool.query(getEarningsTodayQuery(restaurantId), (err, earningsTodayData) => {
          console.log(err);
          res.render("ordersPage", {
            title: "Orders Page",
            pending: pendingData.rows,
            preparing: preparingData.rows,
            completed: completedData.rows,
            earningsToday: earningsTodayData.rows,
          });
        });
      });
    });
  });
});

router.use("/toPreparing", function (req, res, next) {
  var orderId = req.body.orderId;
  pool.query(getChangeOrderStatusToPreparingQuery(orderId), (err, data) => {
    console.log(err);
    res.redirect("/restaurantStaffHomePage/orders");
  });
});

router.use("/toCompleted", function (req, res, next) {
  var orderId = req.body.orderId;
  pool.query(getChangeOrderStatusToCompletedQuery(orderId), (err, data) => {
    console.log(err);
    res.redirect("/restaurantStaffHomePage/orders");
  });
});

//This will render menuPage.ejs and return other arguments (data)
router.use("/menu", function (req, res, next) {
  pool.query(getMenuQuery(restaurantId), (err, menuData) => {
    console.log(err);
    res.render("menuPage", {
      title: "Menu Page",
      menu: menuData.rows,
    });
  });
});

router.get("/addItem", function (req, res, next) {
  res.render("addItemPage", { title: "Add Item Page" });
});

router.post("/addItem", function (req, res, next) {
  var name = req.body.name;
  var dailyLimit = req.body.dailyLimit;
  var price = req.body.price;
  var category = req.body.category;
  var isAvailableToday = req.body.isAvailableToday;
  pool.query(getMaxItemIdQuery(), (err, maxData) => {
    console.log(err);
    var addId = maxData.rows[0].max + 1;
    pool.query(getAddItemQuery(restaurantId, addId, name, dailyLimit, price, category, isAvailableToday), (err, data) => {
      console.log(err);
      res.redirect("/restaurantStaffHomePage/menu");
    });
  });
});

router.get("/editItem", function (req, res, next) {
  res.render("editItemPage", { title: "Edit Item Page" });
});

router.post("/editItem", function (req, res, next) {
  var itemId = req.body.itemId;
  var name = req.body.name;
  var dailyLimit = req.body.dailyLimit;
  var price = req.body.price;
  var category = req.body.category;
  var isAvailableToday = req.body.isAvailableToday;

  pool.query(getEditItemQuery(itemId, name, dailyLimit, price, category, isAvailableToday), (err, data) => {
    console.log(err);
    res.redirect("/restaurantStaffHomePage/menu");
  });
});

router.get("/deleteItem", function (req, res, next) {
  res.render("deleteItemPage", { title: "Delete Item Page" });
});

router.post("/deleteItem", function (req, res, next) {
  var itemId = req.body.itemId;
  pool.query(getDeleteItemQuery(itemId), (err, data) => {
    console.log(err);
    res.redirect("/restaurantStaffHomePage/menu");
  });
});

router.use("/statistics", function (req, res, next) {
  pool.query(getTopItemQuery(restaurantId), (err, topData) => {
    pool.query(getBottomItemQuery(restaurantId), (err, bottomData) => {
      pool.query(getTotalNumberOfOrdersQuery(restaurantId), (err, totalData) => {
        pool.query(getTotalSalesQuery(restaurantId), (err, salesData) => {
          pool.query(getNoOfOrderMonthlyQuery(restaurantId), (err, monthData) => {
            console.log(err);
            res.render("statisticsPage", {
              title: "Statistics Page",
              top: topData.rows,
              bottom: bottomData.rows,
              total: totalData.rows,
              sales: salesData.rows,
              month: monthData.rows,
            });
          });
        });
      });
    });
  });
});

router.use("/campaigns", function (req, res, next) {
  pool.query(getActiveCampaignsQuery(restaurantId), (err1, activeData) => {
    pool.query(getInactiveCampaignsQuery(restaurantId), (err2, inactiveData) => {
      res.render("campaignsPage", {
        title: "Campaigns Page",
        active: activeData.rows,
        inactive: inactiveData.rows,
      });
    });
  });
});

router.get("/addCampaign", function (req, res, next) {
  res.render("addCampaignPage", { title: "Add Campaign Page" });
});

router.post("/addCampaign", function (req, res, next) {
  var promoCode = req.body.promoCode
  var startDateTime = req.body.startDateTime;
  var endDateTime = req.body.endDateTime;
  var promoType = req.body.promoType;
  var discountType = req.body.discountType;
  var discount = req.body.discount;
  var minSpend = req.body.minSpend;
  var promoApplicableFor = req.body.promoApplicableFor;
  var daysSinceLastOrder = req.body.daysSinceLastOrder;
  var itemId = req.body.itemId;
  if (daysSinceLastOrder == '') {
    daysSinceLastOrder = "null";
  }
  if (promoType == "RPC") {
    pool.query(getAddCampaignQuery(promoCode, startDateTime, endDateTime, promoType, discountType, discount, minSpend, promoApplicableFor, daysSinceLastOrder), (err, data) => {
      console.log(err);
      pool.query(getAddPromotionalCampaignQuery(restaurantId, promoCode), (err, data) => {
      console.log(err);
      res.redirect("/restaurantStaffHomePage/campaigns");
      });
    });
  } else if (promoType == "FIPC") {
    pool.query(getAddCampaignQuery(promoCode, startDateTime, endDateTime, promoType, discountType, discount, minSpend, promoApplicableFor, daysSinceLastOrder), (err, data) => {
      console.log(err);
      pool.query(getAddFoodItemCampaignQuery(restaurantId, promoCode, itemId), (err, data) => {
      console.log(err);
      res.redirect("/restaurantStaffHomePage/campaigns");
      });
    });
  }
});

router.get("/editCampaign", function (req, res, next) {
  res.render("editCampaignPage", { title: "Edit Campaign Page" });
});

router.post("/editCampaign", function (req, res, next) {
  var promoCode = req.body.promoCode
  var startDateTime = req.body.startDateTime;
  var endDateTime = req.body.endDateTime;
  var discountType = req.body.discountType;
  var discount = req.body.discount;
  var minSpend = req.body.minSpend;
  var promoApplicableFor = req.body.promoApplicableFor;
  var daysSinceLastOrder = req.body.daysSinceLastOrder;
  if (daysSinceLastOrder == '') {
    daysSinceLastOrder = "null";
  }
  pool.query(getEditCampaignQuery(promoCode, startDateTime, endDateTime, discountType, discount, minSpend, promoApplicableFor, daysSinceLastOrder), (err, data) => {
    console.log(err);
    res.redirect("/restaurantStaffHomePage/campaigns");
  });
});

router.get("/deleteCampaign", function (req, res, next) {
  res.render("deleteCampaignPage", { title: "Delete Campaign Page" });
});

router.post("/deleteCampaign", function (req, res, next) {
  var promoCode = req.body.promoCode;
  pool.query(getDeleteCampaignQuery(promoCode), (err, data) => {
    console.log(err);
    res.redirect("/restaurantStaffHomePage/campaigns");
  });
});

router.get("/admin", function (req, res, next) {
  pool.query(getMinSpendQuery(restaurantId), (err, minSpendData) => {
    console.log(err);
    res.render("adminPage", { title: "Admin Page", minSpend : minSpendData.rows,});
  });
});

router.post("/admin", function (req, res, next) {
  var minSpend = req.body.minSpend;
  pool.query(getEditMinSpendQuery(restaurantId, minSpend), (err, data) => {
    console.log(err);
    res.redirect("/restaurantStaffHomePage/admin");
  });
});


/* ACCCOUNTS */

router.get('/accounts', function (req, res, next) {
  console.log("StaffId: ", staffId);
	pool.query(getSQLuserData(staffId), (err, userData) => {
		console.log(userData.rows[0]);
		var name = userData.rows[0].name;
		var email = userData.rows[0].email;
		var password = '**********';

		res.render('rstaffAccountPage', { 
			restaurantstaffid: staffId,
			userName: name,
			email: email,
			password: password
		});
	});
});
router.post('/editAccountDetails', function(req, res, next) {
	pool.query(getSQLuserData(staffId), (err, userData) => {
		// console.log(userData.rows[0]);
		var name = userData.rows[0].name;
		var email = userData.rows[0].email;
		var password = '**********';

		res.render('rstaffAccountEditPage', { 
			restaurantstaffid: staffId,
			userName: name,
			email: email,
			password: password
		});
	});
});
router.post('/submitAccountDetails', function(req, res, next) {
	var input = req.body;
	var query = updateSQLuserData(staffId, input);
	console.log(query);
	pool.query(query, (err, data) => {
		console.log(err)
		res.redirect('/restaurantStaffHomePage/accounts');
	});
});
router.post('/deactivateAccount', function(req, res, next) {
	pool.query(deactivateSQLrstaff(staffId), (err, data) => {
		console.log(err)
		res.redirect('/');
	});
});
// hidden URL for reactivation
// type: 
// http://localhost:3000/restaurantStaffHomePage/activateAccount?rsid=4
router.get('/activateAccount', function(req, res, next) {
	pool.query(activateSQLrstaff(req.query.rsid), (err, data) => {
		res.redirect('/');
	});
});

module.exports = router;