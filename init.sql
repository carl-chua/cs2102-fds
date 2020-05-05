DROP TABLE IF EXISTS FoodReviews CASCADE;
DROP TABLE IF EXISTS Picks CASCADE;
DROP TABLE IF EXISTS DeliveryServicePromotionalCampaigns CASCADE;
DROP TABLE IF EXISTS RestaurantPromotionalCampaigns CASCADE;
DROP TABLE IF EXISTS FoodItemPromotionalCampaigns CASCADE;
DROP TABLE IF EXISTS Orders CASCADE;
DROP TABLE IF EXISTS FoodMenuItems CASCADE;
DROP TABLE IF EXISTS RestaurantStaffs CASCADE;
DROP TABLE IF EXISTS Restaurants CASCADE;
DROP TABLE IF EXISTS Customers CASCADE;
DROP TABLE IF EXISTS MonthlyWorkSchedules CASCADE;
DROP TABLE IF EXISTS WeeklyWorkSchedules CASCADE;
DROP TABLE IF EXISTS Schedules CASCADE;
DROP TABLE IF EXISTS Shifts CASCADE;
DROP TABLE IF EXISTS DeliveryRiders CASCADE;
DROP TABLE IF EXISTS FoodDeliveryServiceManagers CASCADE;
DROP TABLE IF EXISTS PromotionalCampaigns CASCADE;
DROP TABLE IF EXISTS Locations CASCADE;
DROP TYPE IF EXISTS promoTypeEnum CASCADE;
DROP TYPE IF EXISTS discountTypeEnum CASCADE;
DROP TYPE IF EXISTS promoApplicableForEnum CASCADE;
DROP TYPE IF EXISTS orderStatusEnum CASCADE;
DROP TYPE IF EXISTS foodCategoryEnum CASCADE;
DROP TYPE IF EXISTS scheduleTypeEnum CASCADE;

CREATE TYPE orderStatusEnum as ENUM (
    'CART',
    'PENDING',
    'PREPARING',
    'READY-FOR-DELIVERY',
    'DELIVERING',
    'DELIVERED'
);

CREATE TYPE foodCategoryEnum as ENUM (
    'Local',
    'Western',
    'Japanese',
    'Indian',
    'Chinese',
    'Exotic',
    'Others'
);

CREATE TYPE discountTypeEnum as ENUM (
    'PERCENT',
    'DOLLAR',
    'FREE-DELIVERY'
);

CREATE TYPE promoTypeEnum as ENUM (
    'FDPC',
    'RPC',
    'FIPC'
);

CREATE TYPE promoApplicableForEnum as ENUM (
    'ALL-CUSTOMERS',
    'ONLY-FOR-FIRST-ACCOUNT-ORDER',
    'MAX-DAYS-SINCE-LAST-ORDER',
    'MIN-DAYS-SINCE-LAST-ORDER'
);

CREATE TYPE scheduleTypeEnum as ENUM (
	'MONTHLY',
	'WEEKLY'
);

CREATE TABLE PromotionalCampaigns (
	promoCode varchar,
	startDateTime timestamp not null,
	endDateTime timestamp not null check (endDateTime > startDateTime),
	promoType promoTypeEnum not null,
    discountType discountTypeEnum not null,
    discount numeric(10, 2) check (Discount >= 0),
	minSpend numeric(10, 2) check (minSpend >= 0),
	promoApplicableFor promoApplicableForEnum not null,
    daysSinceLastOrder integer check (daysSinceLastOrder >= 0),
	isActive boolean not null,
	primary key (promoCode)
    -- bcnf
    -- promoCode -> every other attribute
);

-- initial trigger ideas:
-- 1. If today's date is between the startDateTime and endDateTime, isActive needs to be automatically changed to true
-- 2. Once today's date passes endDateTime, set isActive to false.

-- final implementation:
-- triggers based on time cannot be implemented. 
-- isActive is now used only when manager chooses to disable PC within available period (not when it's expired)
-- time-validity of promo campaign is instead checked upon addition into an Orders tuple, using a trigger.
-- trigger checks:
	-- 1. is campaign expired?
	-- 2. if not, isActive = false?
	-- if not, promo code is valid

CREATE TABLE FoodDeliveryServiceManagers (
    FDSManagerId integer,
    name varchar not null,
    email varchar unique not null,
    password varchar not null,
    isDeleted boolean not null,
    primary key (FDSManagerId)
    -- bcnf
    -- FDSManagerId -> *
);

CREATE TABLE Locations (
    address varchar not null,
    areaName varchar not null,
    primary key (address)
    -- bcnf
    -- address -> areaName; address is a primary key
);

CREATE TABLE Customers (
	customerId integer,
	name varchar not null,
    password varchar not null,
    email varchar unique not null,
	phoneNo integer not null,
	dateRegistered timestamp not null,
	rewardPoints integer not null check (rewardPoints >=0),
	registeredCardNo varchar,
    isDeleted boolean not null,
    mostRecentAddress1 varchar,
    mostRecentAddress2 varchar,
    mostRecentAddress3 varchar,
    mostRecentAddress4 varchar,
    mostRecentAddress5 varchar,
    foreign key (mostRecentAddress1) references Locations (address),
    foreign key (mostRecentAddress2) references Locations (address),
    foreign key (mostRecentAddress3) references Locations (address),
    foreign key (mostRecentAddress4) references Locations (address),
    foreign key (mostRecentAddress5) references Locations (address),
	primary key (customerId)
    -- bcnf
    -- customerId -> *
);

-- to enforce in front-end:
-- 1. check that phone number is valid 8-digit number starting with 6, 8 or 9
-- 2. check email string is valid

CREATE TABLE DeliveryRiders (
 	riderId integer,
    name varchar not null,
    password varchar not null,
	phoneNo varchar not null,
    email varchar unique not null,
    isDeleted boolean not null,
    isAvailable boolean not null,
    overallRating numeric(3, 2) not null check ((overallRating >= 1) and (overallRating <= 5)),
	primary key (riderId)
    -- bcnf
    -- riderId -> *

);

-- initial trigger ideas:
-- 1. If the current time is out of the schedule time, isAvailable needs to be set to false.
-- 2. If rider is deleted, isDeleted must be set to true and isAvailable to false.
-- 3. Every hour, check that at least 5 delivery riders are working. If not, raise error to FDS manager's UI.

-- final implementation:
-- no way to schedule a time-based trigger in Postgres.
-- 1 can instead be implemented by using application logic to query for all riders every hour (check if currentTime.hour in rider's working hours)
-- use JS to determine if current hour in rider's working hours; if rider not supposed to be working, turn isAvailable off
-- a trigger is written for 2
-- 3 can be implemented by querying for all riders available in the current hour, and checking if that number > 5.

CREATE TABLE Shifts (
    shiftId integer,
    hourlySchedule boolean[12] not null,
    primary key (shiftId)
    -- bcnf
    -- shiftId -> hourlySchedule
);

CREATE TABLE Schedules (
	scheduleId integer,
    riderId integer not null,
	startDate timestamp not null,
	endDate timestamp not null check (endDate >= startDate),
    datePaid timestamp check (datePaid >= endDate),
    scheduleType scheduleTypeEnum not null,
	feePerDelivery numeric(10, 2) not null check (feePerDelivery >= 0),
	noOfDeliveries integer not null check (noOfDeliveries >= 0),
	baseSalary integer not null check (baseSalary >= 0),
    foreign key (riderId) references DeliveryRiders (riderId),
	primary key (scheduleId)
    -- bcnf
    -- scheduleId -> *
);

-- initial trigger ideas:
-- 1. every insertion into this table needs to be accompanied by an insertion into monthly or weekly schedules table
-- 2. for every insertion, check all other tuples with same riderId and ensure no clash of startDate and endDate
        -- if clash, raise exception: schedule already exists for this time period

-- final implementation:
-- 1 can be monitored in the front-end (ensure that schedule details and daily schedule are submitted tgt)
-- 2 is implemented as a trigger

CREATE TABLE MonthlyWorkSchedules (
    scheduleId integer,
	monShift integer,
    tueShift integer,
    wedShift integer,
    thuShift integer,
    friShift integer,
    satShift integer,
    sunShift integer,
    foreign key (monShift) references Shifts (shiftId),
    foreign key (tueShift) references Shifts (shiftId),
    foreign key (wedShift) references Shifts (shiftId),
    foreign key (thuShift) references Shifts (shiftId),
    foreign key (friShift) references Shifts (shiftId),
    foreign key (satShift) references Shifts (shiftId),
    foreign key (sunShift) references Shifts (shiftId),
    foreign key (scheduleId) references Schedules (scheduleId),
    primary key (scheduleId)
    -- bcnf
    -- scheduleId -> *
);

-- initial trigger ideas:
-- 1. ensure start date end date have exactly 4 weeks difference (27-31 days) in Schedules
-- 2. insert into Schedules table for every insertion into this table

-- final implementation:
-- 1 is implemented as a trigger on Schedules
-- 2 is to be enforced in front-end.

CREATE TABLE WeeklyWorkSchedules (
    scheduleId integer,
	hourlySchedule boolean[7][12] not null,
    foreign key (scheduleId) references Schedules (scheduleId),
    primary key (scheduleId)
    -- bcnf
    -- scheduleId -> *
);

-- initial trigger ideas:
-- 1. start date end date should have exactly 1 week difference in Schedules
-- 2. insert into Schedules table for every insertion into this table

-- final implementation:
-- 1 is implemented as a trigger on Schedules
-- 2 is to be enforced in front-end.

CREATE TABLE Restaurants (
    restaurantId integer, 
    name varchar not null,
    minSpend numeric(10, 2) check (minSpend >= 0),
    address varchar not null,
    foreign key (address) references Locations(address),
    primary key (restaurantId)
    -- bcnf
    -- restaurantId -> address
    -- restaurantId -> minSpend
);

-- address: on update cascade

CREATE TABLE RestaurantStaffs (
    restaurantStaffId integer,
    name varchar not null,
    password varchar not null,
    email varchar unique not null,
    isDeleted boolean not null,
    restaurantId integer not null,
    foreign key (restaurantId) references Restaurants (restaurantId),
    primary key (restaurantStaffId)
    -- bcnf
    -- restaurantStaffId -> *
);

-- to enforce in front-end:
-- 1. check email validity

CREATE TABLE FoodMenuItems (
	itemId integer,
    name varchar not null,
	dailyLimit integer check (dailyLimit >= 0),
    price numeric(10, 2) not null check (price >= 0), 
	category foodCategoryEnum not null,
	qtyOrderedToday integer not null check (qtyOrderedToday >= 0),
	isSelling boolean not null,
	isAvailableToday boolean not null,
	restaurantId integer not null,
    rating numeric(3, 2) check ((rating) >= 1 and (rating <=5)),
    foreign key(restaurantId) references Restaurants(restaurantId),
	primary key(itemId)
	-- bcnf 
	-- itemId -> restaurantId, and itemId is a primary key
);

-- initial trigger ideas:
-- 1. When qtyOrderedToday >= dailyLimit, isAvailableToday must be set to false immediately.

-- final implementation:
-- trigger implemented for 1

CREATE TABLE RestaurantPromotionalCampaigns (
    promoCode varchar,
	restaurantId integer not null,
	foreign key (restaurantId) references Restaurants(restaurantId),
    foreign key (promoCode) references PromotionalCampaigns (promoCode),
    primary key (promoCode)
    -- no FDs
);

-- initial trigger ideas:
-- 1. insert into PromotionalCampaigns table for every insertion into this table
-- 2. ensure promoTypeEnum is selected correctly in corresponding PromotionalCampaigns tuple

-- final implementation:
-- 1 and 2 can be enforced in front-end.


CREATE TABLE FoodItemPromotionalCampaigns (
    promoCode varchar,
    restaurantId integer not null,
	itemId integer not null,
	foreign key (restaurantId) references Restaurants(restaurantId),
	foreign key (itemId) references FoodMenuItems(itemId),
    foreign key (promoCode) references PromotionalCampaigns (promoCode),
    primary key (promoCode)
    -- no FDs

);

-- initial trigger ideas:
-- 1. insert into PromotionalCampaigns table for every insertion into this table
-- 2. ensure promoTypeEnum is selected correctly in PromotionalCampaigns table

-- final implementation:
-- 1 and 2 can be enforced in front-end.

CREATE TABLE DeliveryServicePromotionalCampaigns (
	promoCode varchar,
    FDSManagerId integer not null,
    foreign key (FDSManagerId) references FoodDeliveryServiceManagers (FDSManagerId),
    foreign key (promoCode) references PromotionalCampaigns (promoCode),
    primary key (promoCode)
    -- no FDs
);

-- initial trigger ideas:
-- 1. insert into PromotionalCampaigns table for every insertion into this table
-- 2. ensure promoTypeEnum is selected correctly in PromotionalCampaigns table

CREATE TABLE Orders (
	orderId integer,
    status OrderStatusEnum not null,
	foodSubTotal numeric(10, 2) not null check (foodSubTotal >= 0),
	deliveryFee numeric(10, 2) not null check (deliveryFee >= 0),
	promoDiscount numeric(10, 2) not null check (promoDiscount >= 0),
	promoCode varchar,
    timePlaced timestamp,
	timeRiderAccepts timestamp check (timeRiderAccepts >= timePlaced),
	timeRiderArrivesRestaurant timestamp check (timeRiderArrivesRestaurant >= timeRiderAccepts),
	timeRiderLeavesRestaurant timestamp check (timeRiderLeavesRestaurant >= timeRiderArrivesRestaurant),
	timeRiderDelivered timestamp check (timeRiderDelivered >= timeRiderLeavesRestaurant),
	deliveryRating integer check ((deliveryRating) >= 1 and (deliveryRating <=5)),
	paymentCardNoIfUsed varchar,
	hasPaid boolean not null,
	riderId integer,
	address varchar,
	customerId integer not null,
	foreign key(promoCode) references PromotionalCampaigns(promoCode),
	foreign key(riderId) references DeliveryRiders(riderId),
	foreign key(address) references Locations(address),
	foreign key(customerId) references Customers(customerId),
    primary key(orderId)
    -- no FDs
   
);

-- triggers:
-- 1. when order is placed, a new orderId needs to be generated and tagged to this customer
-- 2. update foodSubTotal upon insertion into Picks table with same orderId
-- 3. when promoCode added to order:
	-- a. check type of promoCode
	-- b. check if promoCode is valid (correct restaurant, or appropriate food item selected)
	-- c. if valid, update promoDiscount accordingly
	-- d. else, promoDiscount will be 0
-- 4. before/when adding timePlaced, check for:
	-- a. non-null address (ensure customer has placed address) 
	-- b. hasPaid (if paying by card - paymentCardNoIfUsed)
	-- c. check if order exceeds restaurant's minSpend for each restaurant
-- 5. upon adding of timePlaced:
	-- a. update order status enum
	-- b. allocate riderId and deliveryFee
		-- set isAvailable for chosen rider (in DeliveryRiders table) to false
		-- if no riders available, raise error
	-- c. increment qtyOrderedToday of all food items chosen by 1
	-- d. add delivery address to user's 5 most recent addresses (if not already there), push oldest address out
-- 7. before adding timeRider***, check previous timeRider*** and order status
-- 8. change status to 'DELIVERING' only when timeRiderLeavesRestaurant is non-null
-- 9. change status to 'DELIVERED' only when timeRiderDelivered is non-null
-- 10. hasPaid needs to be set to true after rider delivers food. (only when payment mode is cash)
-- 11. When rider finishes an order: 
	-- if hasPaid = true, allocate reward points to customers
	-- set isAvailable for rider (in DeliveryRiders) to true
    -- increment noOfDeliveries by 1 for rider in DeliveryRiders table
-- 12. if the customer rates the order, the rider's rating must be updated accordingly.


CREATE TABLE Picks (
	orderId integer,
	itemId integer,
    qtyOrdered integer not null check (qtyOrdered >= 0),
	foreign key (orderId) references Orders(orderId),
	foreign key (itemId) references FoodMenuItems(itemId),
	primary key (orderId, itemId)
    -- no FDs
);

-- triggers:
-- 1. every insertion should update foodSubTotal in the corresponding Orders record

CREATE TABLE FoodReviews (
    reviewId integer,
    starRating integer not null check ((starRating >= 1) and (starRating <= 5)),
    reviewText varchar,
    reviewDate timestamp not null,
    orderId integer not null,
    itemId integer not null,
    customerId integer not null,
    foreign key (orderId, itemId) references Picks(orderId, itemId),
    foreign key (customerId) references Customers(customerId),
    primary key(reviewId)
    -- bcnf
    -- reviewId -> *
);

-- triggers:
-- 1. ensure review can only be submitted for a completed order.
-- 2. when a customer rates his food, the rating in FoodMenuItems must be updated.

/**
 * Triggers
 */

/* Food Review Triggers */
CREATE OR REPLACE FUNCTION check_valid_review() RETURNS TRIGGER AS $$
DECLARE
	status orderStatusEnum;
BEGIN
	SELECT O.status INTO status
	FROM Picks P NATURAL JOIN Orders O
	WHERE NEW.orderId = P.orderID
	AND NEW.itemId = P.itemId;

	IF status <> 'DELIVERED' THEN 
		RAISE exception 'Review can only be created when order is completed';
	END IF
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS review_validity_trigger ON FoodReviews;
CREATE TRIGGER review_validity_trigger
	BEFORE INSERT ON FoodReviews
	FOR EACH ROW
	EXECUTE FUNCTION check_valid_review();

/* DeliveryRiders triggers */
-- if rider isDeleted, make isAvailable false
CREATE OR REPLACE FUNCTION make_unavailable() RETURNS TRIGGER AS $$
BEGIN
	UPDATE DeliveryRiders
	SET isAvailable = FALSE
	WHERE riderId = NEW.riderId;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS not_available_when_deleted ON DeliveryRiders;
CREATE TRIGGER not_available_when_deleted
	AFTER UPDATE OF isDeleted ON DeliveryRiders
	FOR EACH ROW
	EXECUTE FUNCTION make_unavailable();

/* Schedules triggers */

-- for every insertion, check all other tuples with same riderId and ensure no tuples with same date
CREATE OR REPLACE FUNCTION check_existing_schedule() RETURNS TRIGGER AS $$
BEGIN
	IF EXISTS (SELECT 1 
			   FROM Schedules S
			   WHERE S.riderId = NEW.riderId
			   AND ((NEW.startDate BETWEEN S.startDate AND S.endDate)
			   		OR (NEW.endDate BETWEEN S.startDate AND S.endDate))
			   ) THEN
		RAISE exception 'You already have a schedule for this time period.';
	ELSE
		RETURN NEW;
	END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS existing_schedule_trigger ON Schedules;
CREATE TRIGGER existing_schedule_trigger
	BEFORE INSERT ON Schedules
	FOR EACH ROW
	EXECUTE FUNCTION check_existing_schedule();

-- ensure each schedule is either monthly (28-31 days) or weekly (7 days)
CREATE OR REPLACE FUNCTION check_date_validity() RETURNS TRIGGER AS $$
BEGIN
	IF NEW.scheduleType = 'MONTHLY' THEN
		IF NEW.endDate::DATE - NEW.startDate::DATE < 28 OR NEW.endDate::DATE - NEW.startDate::DATE > 31 THEN
			RAISE exception 'Please select a schedule for a 1-month period.';
		END IF;
	ELSIF NEW.scheduleType = 'WEEKLY' THEN
		IF NEW.endDate::DATE - NEW.startDate::DATE <> 7 THEN
			RAISE exception 'Please select a schedule for a 1-week period.';
		END IF;
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS date_validity_trigger ON Schedules;
CREATE TRIGGER date_validity_trigger
	BEFORE INSERT ON Schedules
	FOR EACH ROW
	EXECUTE FUNCTION check_date_validity();

/* FoodMenuItems triggers */

-- set isAvailableToday to false when qtyOrderedToday >= dailyLimit
CREATE OR REPLACE FUNCTION food_item_unavailable() RETURNS TRIGGER AS $$
DECLARE
	qtyOrderedToday integer;
	dailyLimit integer;
BEGIN
	SELECT FMI.qtyOrderedToday, FMI.dailyLimit INTO qtyOrderedToday, dailyLimit
	FROM FoodMenuItems FMI
	WHERE itemId = NEW.itemId;

	IF qtyOrderedToday >= dailyLimit THEN
		UPDATE FoodMenuItems
		SET isAvailableToday = FALSE
		WHERE itemId = NEW.itemId;
	END IF;
	RETURN NEW;	
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS daily_limit_trigger ON FoodMenuItems;
CREATE TRIGGER daily_limit_trigger
	AFTER UPDATE OF qtyOrderedToday ON FoodMenuItems
	FOR EACH ROW
	EXECUTE FUNCTION food_item_unavailable();

/* Orders triggers */

-- triggers:
-- 1. when order is placed, a new orderId needs to be generated and tagged to this customer
-- 2. update foodSubTotal upon insertion into Picks table with same orderId
-- 3. when promoCode added to order:
	-- a. check type of promoCode
	-- b. check if promoCode is valid (correct restaurant, or appropriate food item selected)
	-- c. if valid, update promoDiscount accordingly
	-- d. else, promoDiscount will be 0
-- 4. before/when adding timePlaced, check for:
	-- a. non-null address (ensure customer has placed address) 
	-- b. hasPaid (if paying by card - paymentCardNoIfUsed)
	-- c. check if order exceeds restaurant's minSpend for each restaurant
-- 5. upon adding of timePlaced:
	-- a. update order status enum
	-- b. allocate riderId and deliveryFee
		-- set isAvailable for chosen rider (in DeliveryRiders table) to false
		-- if no riders available, raise error
	-- c. increment qtyOrderedToday of all food items chosen by 1
	-- d. add delivery address to user's 5 most recent addresses (if not already there), push oldest address out
-- 7. before adding timeRider***, check previous timeRider*** and order status
-- 8. change status to 'DELIVERING' only when timeRiderLeavesRestaurant is non-null
-- 9. change status to 'DELIVERED' only when timeRiderDelivered is non-null
-- 10. hasPaid needs to be set to true after rider delivers food. (only when payment mode is cash)
-- 11. When rider finishes an order: 
	-- if hasPaid = true, allocate reward points to customers
	-- set isAvailable for rider (in DeliveryRiders) to true
    -- increment noOfDeliveries by 1 for rider in DeliveryRiders table
-- 12. if the customer rates the order, the rider's rating must be updated accordingly.

-- update foodSubTotal in Orders upon insertion into Picks table
CREATE OR REPLACE FUNCTION subtotal_update() RETURNS TRIGGER AS $$
DECLARE
	price numeric(10, 2);
BEGIN
	SELECT FMI.price INTO price
	FROM FoodMenuItems FMI
	WHERE FMI.itemId = NEW.itemId;

	UPDATE Orders
	SET foodSubTotal = foodSubTotal + (NEW.qtyOrdered - COALESCE(OLD.qtyOrdered, 0)) * price
	WHERE orderId = NEW.orderId;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS food_subtotal_trigger ON Picks;
CREATE TRIGGER food_subtotal_trigger
	AFTER UPDATE OF itemId, qtyOrdered OR INSERT ON Picks
	FOR EACH ROW
	EXECUTE FUNCTION subtotal_update();

-- upon selection of promo code into order, check if promo code is still in date / disabled
-- runs first due to alphabetical order
CREATE OR REPLACE FUNCTION code_date_check() RETURNS TRIGGER AS $$
DECLARE
	endDateTime timestamp;
	isActive boolean;
BEGIN
	SELECT PC.endDateTime, PC.isActive INTO endDateTime, isActive
	FROM PromotionalCampaigns PC 
	WHERE PC.promoCode = NEW.promoCode;

	IF endDateTime < NOW()::timestamp THEN
		-- cannot update isActive here as exception is raised.
		RAISE exception 'This code is no longer valid.';
	ELSIF isActive = FALSE THEN
		RAISE exception 'This code is not currently available.';
	ELSE
		RETURN NEW;
	END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS code_date_trigger ON Orders;
CREATE TRIGGER code_date_trigger
	BEFORE UPDATE OF promoCode ON Orders
	FOR EACH ROW
	EXECUTE FUNCTION code_date_check();

-- check if promo code applies to this order
	-- min. expenditure met?
	-- correct restaurant? 
	-- appropriate food item selected?
CREATE OR REPLACE FUNCTION code_requirements_check() RETURNS TRIGGER AS $$
DECLARE
	promoType promoTypeEnum;
	minSpend numeric(10, 2);
	currentSubtotal numeric(10, 2);
	restaurantId integer;
	itemId integer; 
BEGIN
	SELECT PC.promoType, PC.minSpend INTO promoType, minSpend
	FROM PromotionalCampaigns PC
	WHERE NEW.promoCode = PC.promoCode;

	-- rpc or food item promo campaign
	IF promoType = 'RPC' THEN
		SELECT RPC.restaurantId INTO restaurantId
		FROM RestaurantPromotionalCampaigns RPC
		WHERE NEW.promoCode = RPC.promoCode;

		IF restaurantId NOT IN (SELECT FMI.restaurantId
							FROM Picks P JOIN FoodMenuItems FMI ON (P.itemId = FMI.itemId)
							WHERE NEW.orderId = P.orderId) THEN
			RAISE exception 'This code does not apply to your order.';
		END IF;
	ELSIF promoType = 'FIPC' THEN
		SELECT FIPC.itemId INTO itemId
		FROM FoodItemPromotionalCampaigns FIPC
		WHERE FIPC.promoCode = NEW.promoCode;

		IF itemId NOT IN (SELECT P.itemId
						  FROM Picks P
						  WHERE P.orderId = NEW.orderId) THEN
			RAISE exception 'This code does not apply to your order.';
		END IF;
	END IF;

	IF NEW.foodSubTotal < minSpend THEN
		RAISE exception 'Your order has not met the minimum expenditure requirement.';
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS code_requirements_trigger ON Orders;
CREATE TRIGGER code_requirements_trigger
	BEFORE UPDATE OF promoCode ON Orders
	FOR EACH ROW
	EXECUTE FUNCTION code_requirements_check();

-- check if promo code applies to this user
	-- max./min. x days since last order by user? (check by querying past orders)
	-- first time ordering?
CREATE OR REPLACE FUNCTION code_user_check() RETURNS TRIGGER AS $$
DECLARE
	promoApplicableFor promoApplicableForEnum;
	daysSinceLastOrder integer;
	timeLastOrderPlaced timestamp; 
BEGIN
	SELECT PC.promoApplicableFor, PC.daysSinceLastOrder INTO promoApplicableFor, daysSinceLastOrder
	FROM PromotionalCampaigns PC
	WHERE NEW.promoCode = PC.promoCode;

	SELECT O.timePlaced INTO timeLastOrderPlaced
	FROM Orders O
	WHERE O.customerId = NEW.customerId
	AND O.orderId <> NEW.orderId
	ORDER BY O.timePlaced desc
	LIMIT 1;

	-- rpc or food item promo campaign
	IF promoApplicableFor = 'ONLY-FOR-FIRST-ACCOUNT-ORDER' THEN
		IF timeLastOrderPlaced IS NOT NULL THEN
			RAISE exception 'This code is no longer valid for your account.';
		END IF;
	ELSIF promoApplicableFor = 'MAX-DAYS-SINCE-LAST-ORDER' THEN
		IF NOW()::DATE - timeLastOrderPlaced::DATE > daysSinceLastOrder OR timeLastOrderPlaced IS NULL THEN
			RAISE exception 'This code is no longer valid for your order.';
		END IF;
	ELSIF promoApplicableFor = 'MIN-DAYS-SINCE-LAST-ORDER' THEN
		IF NOW()::DATE - timeLastOrderPlaced::DATE < daysSinceLastOrder THEN
			RAISE exception 'This code does not apply to your order.';
		END IF;
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS code_user_trigger ON Orders;
CREATE TRIGGER code_user_trigger
	BEFORE UPDATE OF promoCode ON Orders
	FOR EACH ROW
	EXECUTE FUNCTION code_user_check();

-- apply discount to foodSubTotal
	-- promoCode can only be selected after order items are confirmed
CREATE OR REPLACE FUNCTION code_valuation() RETURNS TRIGGER AS $$
DECLARE
	discountType discountTypeEnum;
	discount numeric(10, 2);
BEGIN
	SELECT PC.discountType, PC.discount INTO discountType, discount
	FROM PromotionalCampaigns PC
	WHERE NEW.promoCode = PC.promoCode;

	-- what about free-delivery discounts?
	IF discountType = 'PERCENT' THEN
		NEW.promoDiscount = (discount / 100.0) * NEW.foodSubTotal;
	ELSIF discountType = 'DOLLAR' THEN
		NEW.promoDiscount = discount;
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS code_valuation_trigger ON Orders;
CREATE TRIGGER code_valuation_trigger
	BEFORE UPDATE OF promoCode ON Orders
	FOR EACH ROW
	EXECUTE FUNCTION code_valuation();

-- 4. before/when adding timePlaced, check for:
	-- a. non-null address (ensure customer has placed address) 
	-- b. hasPaid (if paying by card - paymentCardNoIfUsed)
	-- c. check if order exceeds restaurant's minSpend for each restaurant
CREATE OR REPLACE FUNCTION order_details_check() RETURNS TRIGGER AS $$
DECLARE
	restaurantsUnderspent integer;
BEGIN
	SELECT count(DISTINCT R.restaurantId) INTO restaurantsUnderspent
	FROM FoodMenuItems FMI JOIN Picks P ON (P.orderId = NEW.orderId AND P.itemId = FMI.itemId)
					       JOIN Restaurants R ON (R.restaurantId = FMI.restaurantId)
	GROUP BY R.restaurantId, R.minSpend
	HAVING SUM(P.qtyOrdered * FMI.price) < R.minSpend;

	IF restaurantsUnderspent > 0 THEN
		RAISE exception 'Your order has not fulfilled the minimum expenditure requirements of all restaurants.';
	END IF;

	IF NEW.address IS NULL THEN
		RAISE exception 'Please input your delivery address.';
	END IF;

	NEW.status = 'PENDING';
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_confirmation_trigger ON Orders;
CREATE TRIGGER order_confirmation_trigger
	BEFORE UPDATE OF timePlaced ON Orders
	FOR EACH ROW
	EXECUTE FUNCTION order_details_check();

-- 5. upon adding of timePlaced:
	-- a. update order status enum
	-- b. allocate riderId and deliveryFee
		-- set isAvailable for chosen rider (in DeliveryRiders table) to false
		-- if no riders available, raise error
CREATE OR REPLACE FUNCTION allocate_rider() RETURNS TRIGGER AS $$
DECLARE
	riderChosenId integer;
	deliveryFee numeric(10, 2);
	monthlyShift integer;
BEGIN
	SELECT DR.riderId, S.feePerDelivery INTO riderChosenId, deliveryFee
	FROM DeliveryRiders DR JOIN Schedules S ON (DR.riderId = S.riderId) 
						   JOIN MonthlyWorkSchedules MWS ON (MWS.scheduleId = S.scheduleId)
						   LEFT JOIN WeeklyWorkSchedules WWS ON (WWS.scheduleId = S.scheduleId)
	WHERE (S.scheduleType = 'WEEKLY' AND WWS.hourlySchedule[EXTRACT(DOW FROM NOW()::DATE) - 1][EXTRACT(HOUR FROM NOW()) - 10] = TRUE)
	OR (S.scheduleType = 'MONTHLY' AND CASE
											WHEN (EXTRACT(DOW FROM NOW()::DATE)) = 1 THEN MWS.monShift
											WHEN (EXTRACT(DOW FROM NOW()::DATE)) = 2 THEN MWS.tueShift
											WHEN (EXTRACT(DOW FROM NOW()::DATE)) = 3 THEN MWS.wedShift
											WHEN (EXTRACT(DOW FROM NOW()::DATE)) = 4 THEN MWS.thuShift
											WHEN (EXTRACT(DOW FROM NOW()::DATE)) = 5 THEN MWS.friShift
											WHEN (EXTRACT(DOW FROM NOW()::DATE)) = 6 THEN MWS.satShift
										    WHEN (EXTRACT(DOW FROM NOW()::DATE)) = 7 THEN MWS.sunShift
										END
									= CASE
											WHEN ((EXTRACT(HOUR FROM NOW()) >= 10 AND EXTRACT(HOUR FROM NOW()) <= 14) OR (EXTRACT(HOUR FROM NOW()) >= 15 AND EXTRACT(HOUR FROM NOW()) <= 19)) THEN 1
											WHEN ((EXTRACT(HOUR FROM NOW()) >= 11 AND EXTRACT(HOUR FROM NOW()) <= 15) OR (EXTRACT(HOUR FROM NOW()) >= 16 AND EXTRACT(HOUR FROM NOW()) <= 20)) THEN 2
											WHEN ((EXTRACT(HOUR FROM NOW()) >= 12 AND EXTRACT(HOUR FROM NOW()) <= 16) OR (EXTRACT(HOUR FROM NOW()) >= 17 AND EXTRACT(HOUR FROM NOW()) <= 21)) THEN 3
											WHEN ((EXTRACT(HOUR FROM NOW()) >= 13 AND EXTRACT(HOUR FROM NOW()) <= 17) OR (EXTRACT(HOUR FROM NOW()) >= 18 AND EXTRACT(HOUR FROM NOW()) <= 22)) THEN 4
										END)
	LIMIT 1;

	UPDATE DeliveryRiders
	SET isAvailable = FALSE
	WHERE riderId = riderChosenId;

	NEW.riderId = riderChosenId;
	NEW.deliveryFee = deliveryFee;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rider_allocation_trigger ON Orders;
CREATE TRIGGER rider_allocation_trigger
	BEFORE UPDATE OF timePlaced ON Orders
	FOR EACH ROW
	EXECUTE FUNCTION allocate_rider();

-- c. increment qtyOrderedToday of all food items chosen by 1
-- d. add delivery address to user's 5 most recent addresses (if not already there), push oldest address out
CREATE OR REPLACE FUNCTION update_details() RETURNS TRIGGER AS $$
BEGIN
	UPDATE FoodMenuItems FMI
	SET qtyOrderedToday = qtyOrderedToday + P.qtyOrdered
	FROM Picks P
	WHERE FMI.itemId = P.itemId
	AND P.orderId = NEW.orderId;

	-- add delivery address to customer IF does not exist

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS time_placed_trigger ON Orders;
CREATE TRIGGER time_placed_trigger
	BEFORE UPDATE OF timePlaced ON Orders
	FOR EACH ROW
	EXECUTE FUNCTION update_details();

/**
 * Insertion of test data
 */

INSERT INTO FoodDeliveryServiceManagers
values 
(1, 'manager001', 'manager001@gmail.com', 'manager001Password', false),
(2, 'manager002', 'manager002@gmail.com', 'manager002Password', false),
(3, 'manager003', 'manager003@gmail.com', 'manager003Password', true),
(4, 'manager004', 'manager004@gmail.com', 'manager004Password', true),
(5, 'manager005', 'manager005@gmail.com', 'manager005Password', false);

INSERT INTO PromotionalCampaigns
values
('20%OFF-FORALL', '2020-04-04', '2020-04-24', 'FDPC', 'PERCENT', 20.00, 10.00, 'ALL-CUSTOMERS', NULL, true),
('$5OFF-FORFIRSTORDER', '2020-04-02', '2020-04-22', 'FDPC', 'DOLLAR', 5, 10.00, 'ONLY-FOR-FIRST-ACCOUNT-ORDER', NULL, true),
('FREEDELIVERY-HAVENOTORDEREDINLAST30DAYS', '2020-04-05', '2020-04-25', 'FDPC', 'FREE-DELIVERY', NULL, NULL, 'MIN-DAYS-SINCE-LAST-ORDER', 30, true),
('10%OFF-HAVEORDEREDINLAST5DAYS', '2020-04-07', '2020-04-27', 'FDPC', 'PERCENT', 10.00, NULL, 'MAX-DAYS-SINCE-LAST-ORDER', 5, true),
('10%OFF-HAVEORDEREDINLAST5DAYS-EXPIRED', '2020-03-07', '2020-03-27', 'FDPC', 'PERCENT', 10.00, NULL, 'MAX-DAYS-SINCE-LAST-ORDER', 5, false),
('$10FF-FORFIRSTORDER-EXPIRED', '2020-03-07', '2020-03-27', 'FDPC', 'DOLLAR', 10.00, NULL, 'ONLY-FOR-FIRST-ACCOUNT-ORDER', NULL, false);

INSERT INTO DeliveryServicePromotionalCampaigns
values
('20%OFF-FORALL', 1),
('$5OFF-FORFIRSTORDER', 2),
('FREEDELIVERY-HAVENOTORDEREDINLAST30DAYS', 3),
('10%OFF-HAVEORDEREDINLAST5DAYS', 4),
('10%OFF-HAVEORDEREDINLAST5DAYS-EXPIRED', 5),
('$10FF-FORFIRSTORDER-EXPIRED', 5);

INSERT INTO DeliveryRiders 
values
(1, 'rider001', 'password', '81111111', 'rider001@gmail.com', false, true, 4.67),
(2, 'rider002', 'password', '82222222', 'rider002@gmail.com', false, false, 4.75),
(3, 'rider003', 'password', '83333333', 'rider003@gmail.com', true, true, 4.32),
(4, 'rider004', 'password', '84444444', 'rider004@gmail.com', true, false, 4.03),
(5, 'rider005', 'password', '85555555', 'rider005@gmail.com', false, true, 4.85),
(6, 'rider006', 'password', '86666666', 'rider006@gmail.com', false, true, 4.97),
(7, 'rider007', 'password', '87777777', 'rider007@gmail.com', false, false, 4.87),
(8, 'rider008', 'password', '88888888', 'rider008@gmail.com', true, false, 4.54),
(9, 'rider009', 'password', '89999999', 'rider009@gmail.com', true, true, 4.44),
(10, 'rider010', 'password', '80000000', 'rider010@gmail.com', false, true, 4.89);

INSERT INTO Shifts 
values
(1, '{true,true,true,true,false,true,true,true,true,false,false,false}'),
(2, '{false,true,true,true,true,false,true,true,true,true,false,false}'),
(3, '{false,false,true,true,true,true,false,true,true,true,true,false}'),
(4, '{false,false,false,true,true,true,true,false,true,true,true,true}');

INSERT INTO Schedules
values
(1,1,'2020-04-05','2020-05-03','2020-05-04','MONTHLY',2,532,1500),
(2,2,'2020-04-10','2020-05-08','2020-05-10','MONTHLY',2,467,1500),
(3,3,'2020-04-07','2020-05-05','2020-05-06','MONTHLY',2,486,1500),
(4,4,'2020-04-09','2020-05-07','2020-05-08','MONTHLY',2,521,1500),
(5,5,'2020-04-03','2020-05-01','2020-05-03','MONTHLY',2,509,1500),
(6,6,'2020-04-03','2020-05-01','2020-05-03','MONTHLY',2,503,1500),
(7,7,'2020-04-04','2020-05-02','2020-05-04','MONTHLY',2,498,1500);

INSERT INTO MonthlyWorkSchedules
values
(1,4,4,2,1,2,null,null),
(2,null,1,4,2,3,2,null),
(3,null,null,3,4,2,3,1),
(4,2,null,null,4,2,1,3),
(5,3,2,null,null,1,2,2),
(6,1,3,2,null,null,2,2),
(7,4,4,2,1,null,null,2);

INSERT INTO Schedules
values
(8, 8, '2020-04-05', '2020-04-12', '2020-04-14', 'WEEKLY', 2, 145, 1500),
(9, 9, '2020-04-06', '2020-04-13', '2020-04-15', 'WEEKLY', 2, 150, 1500),
(10, 10, '2020-04-03', '2020-04-10', '2020-04-12', 'WEEKLY', 2, 143, 1500);

INSERT INTO WeeklyWorkSchedules
values
(8,
    '{{true, true, true, false, true, false, false, false, false, true, true, false}, 
    {false, false, false, false, true, true, true, true, false, false, false, false}, 
    {true, true, false, false, false, false, true, true, true, true, false, false}, 
    {false, false, false, false, false, false, false, true, true, true, true, false}, 
    {false, true, true, true, false, false, false, false, true, true, true, true}, 
    {true, true, true, false, false, false, false, false, false, false, false, false}, 
    {false, false, false, false, false, false, false, false, false, false, false, false}}'),
(9,
    '{{false, true, true, false, true, false, false, false, false, true, true, false}, 
    {false, false, false, false, true, true, true, true, false, false, false, false}, 
    {true, true, false, false, false, false, true, true, true, true, false, false}, 
    {false, false, false, false, false, false, false, true, true, true, false, false}, 
    {false, false, true, true, false, false, false, false, true, true, true, true}, 
    {true, true, false, false, false, false, false, false, false, false, false, false}, 
    {false, false, false, true, true, false, false, false, false, false, false, false}}'),
(10,
    '{{true, true, false, false, true, false, false, false, false, true, true, false}, 
    {false, false, false, false, true, true, true, true, false, false, false, false}, 
    {true, true, false, false, false, false, false, true, true, true, false, false}, 
    {false, true, true, false, false, false, false, false, true, true, true, false}, 
    {false, true, true, true, false, false, false, false, true, true, true, true}, 
    {true, true, false, false, false, false, false, false, false, false, false, false}, 
    {false, false, false, false, false, false, true, true, false, false, false, false}}');

INSERT INTO Locations values 
('restaurant001add001area001', 'area001'),
('restaurant002add002area002', 'area002'),
('restaurant003add003area003', 'area003'),
('restaurant004add004area002', 'area002'),
('restaurant005add005area003', 'area003');

INSERT INTO Restaurants values
(1, 'restaurant001', 10.00, 'restaurant001add001area001'),
(2, 'restaurant002', 20.00, 'restaurant002add002area002'),
(3, 'restaurant003', 30.00, 'restaurant003add003area003'),
(4, 'restaurant004', 40.00, 'restaurant004add004area002'),
(5, 'restaurant005', 50.00, 'restaurant005add005area003');

INSERT INTO FoodMenuItems values
(1, 'item001r004', 1, 1099, 'Exotic', 0, true, true, 1, null),
(2, 'item002r004', 2, 499, 'Exotic', 0, true, true, 1, null),
(3, 'item003r004', 3, 299, 'Exotic', 0, true, true, 1, null),
(4, 'item004r004', 4, 399, 'Exotic', 0, true, true, 1, null),
(5, 'item005r004', 5, 99, 'Exotic', 0, true, true, 1, null);

INSERT INTO FoodMenuItems values
(6, 'item001r002', 100, 10, 'Western', 0, true, true, 2, null),
(7, 'item002r002', 200, 15, 'Western', 0, true, true, 2, null),
(8, 'item003r002', 300, 13, 'Western', 0, true, true, 2, null),
(9, 'item004r002', 400,  7, 'Western', 0, true, true, 2, null),
(10, 'item005r002', 500, 9, 'Others', 0, true, true, 2, null);

INSERT INTO FoodMenuItems values
(11, 'item001r003', 100, 6.50, 'Indian', 0, true, true, 3, null),
(12, 'item002r003', 200, 7.80, 'Indian', 0, true, true, 3, null),
(13, 'item003r003', 300, 3.2, 'Indian', 0, true, true, 3, null),
(14, 'item004r003', 400, 5.0, 'Indian', 0, true, true, 3, null),
(15, 'item005r003', 5, 10.8, 'Others', 0, true, true, 3, null);

INSERT INTO FoodMenuItems values
(16, 'item001r004', 100, 4.2, 'Local', 0, true, true, 4, null),
(17, 'item002r004', 200, 3.8, 'Local', 0, true, true, 4, null),
(18, 'item003r004', 300, 6.5, 'Local', 0, true, true, 4, null),
(19, 'item004r004', 400, 2, 'Local', 0, true, true, 4, null),
(20, 'item005r004', 3, 8.88, 'Exotic', 0, true, true, 4, null);

INSERT INTO FoodMenuItems values
(21, 'item001r005', 100, 5.5, 'Chinese', 0, true, true, 5, null),
(22, 'item002r005', 200, 2.2, 'Chinese', 0, true, true, 5, null),
(23, 'item003r005', 300, 3.3, 'Chinese', 0, true, true, 5, null),
(24, 'item004r005', 400, 4.4, 'Chinese', 0, true, true, 5, null),
(25, 'item005r005', 100, 6.6, 'Chinese', 0, true, true, 5, null);


INSERT INTO RestaurantStaffs values 
(1, 'rstaff001r001', 'password', 'rstaff001@r001.com', false, 1),
(2, 'rstaff002r001', 'password', 'rstaff002@r001.com', false, 1),
(3, 'rstaff001r002', 'password', 'rstaff001@r002.com', false, 2),
(4, 'rstaff002r002', 'password', 'rstaff002@r002.com', false, 2),
(5, 'rstaff001r003', 'password', 'rstaff001@r003.com', false, 3),
(6, 'rstaff002r003', 'password', 'rstaff002@r003.com', false, 3),
(7, 'rstaff001r004', 'password', 'rstaff001@r004.com', false, 4),
(8, 'rstaff002r004', 'password', 'rstaff002@r004.com', false, 4),
(9, 'rstaff001r005', 'password', 'rstaff001@r005.com', false, 5),
(10, 'rstaff002r005', 'password', 'rstaff002@r005.com', false, 5);

INSERT INTO PromotionalCampaigns values
('R001-50PERCENTOFF-ALL', '2020-04-04 00:00:00', '2020-06-04 00:00:00', 'RPC', 
    'PERCENT', 50, 5.00, 'ALL-CUSTOMERS', null, true),
('R002-FREEDELIVERY-ALL', '2020-04-04 00:00:00', '2020-06-04 00:00:00', 'RPC', 
    'FREE-DELIVERY', 50, 10.00, 'ALL-CUSTOMERS', null, true),
('R003-2DOLLAROFF-FIRSTACCOUNT', '2020-04-04 00:00:00', '2020-06-04 00:00:00', 'RPC', 
    'DOLLAR', 2.00, 10.00, 'ONLY-FOR-FIRST-ACCOUNT-ORDER', null, true),
('R001-FREEDELIVERY-INACTIVE', '2020-04-04 00:00:00', '2020-06-04 00:00:00', 'RPC', 
    'FREE-DELIVERY', 50, 10.00, 'ALL-CUSTOMERS', null, false);

INSERT INTO RestaurantPromotionalCampaigns values
('R001-50PERCENTOFF-ALL', 1),
('R002-FREEDELIVERY-ALL', 2),
('R003-2DOLLAROFF-FIRSTACCOUNT', 3),
('R001-FREEDELIVERY-INACTIVE', 2);

INSERT INTO PromotionalCampaigns values
('R004-30PERCENTOFF-ITEM004-ALL', '2020-04-04 00:00:00', '2020-06-04 00:00:00', 'FIPC', 
	'PERCENT', 30, 0, 'ALL-CUSTOMERS', null, true),
('R004-0.5DOLLAROFF-ITEM003-ALL', '2020-04-04 00:00:00', '2020-06-04 00:00:00', 'FIPC', 
	'DOLLAR', 0.5, 0, 'ALL-CUSTOMERS', null, true),
('R002-FREEDELIVERY-3MAXDAYS-ITEM002', '2020-04-04 00:00:00', '2020-06-04 00:00:00', 'FIPC', 
	'FREE-DELIVERY', null, 0, 'MAX-DAYS-SINCE-LAST-ORDER', 3, true),
('R004-100PERCENTOFF-INACTIVE', '2020-04-04 00:00:00', '2020-06-04 00:00:00', 'FIPC', 
	'PERCENT', 100, 0, 'ALL-CUSTOMERS', null, false);

INSERT INTO FoodItemPromotionalCampaigns values
('R004-30PERCENTOFF-ITEM004-ALL', 4, 19),
('R004-0.5DOLLAROFF-ITEM003-ALL', 4, 18),
('R002-FREEDELIVERY-3MAXDAYS-ITEM002', 3, 7),
('R004-100PERCENTOFF-INACTIVE', 4, 19);

INSERT INTO Customers values 
(1, 'customer001', 'password', 'customer001@gmail.com', '80000001', 
    '2020-04-04 00:00:00', 0, null, false, null, null, null, null, null),
(2, 'customer002', 'password', 'customer002@gmail.com', '80000002', 
    '2020-04-04 20:00:00', 0, null, false, null, null, null, null, null),
(3, 'customer003', 'password', 'customer003@gmail.com', '80000003', 
    '2020-04-05 00:00:00', 0, null, false, null, null, null, null, null),
(4, 'customer004', 'password', 'customer004@gmail.com', '80000004', 
    '2020-04-05 12:12:00', 0, null, false, null, null, null, null, null),
(5, 'customer005', 'password', 'customer005@gmail.com', '80000005', 
    '2020-04-05 18:05:00', 0, null, false, null, null, null, null, null);

INSERT INTO Orders values
(1, 'CART', 0, 5, 0, null, null, null, null, null, null, null, null, false, null, null, 1),
(2, 'CART', 0, 5, 0, null, null, null, null, null, null, null, null, false, null, null, 2),
(3, 'CART', 0, 5, 0, null, null, null, null, null, null, null, null, false, null, null, 3),
(4, 'CART', 0, 5, 0, null, null, null, null, null, null, null, null, false, null, null, 4),
(5, 'CART', 0, 5, 0, null, null, null, null, null, null, null, null, false, null, null, 5);

-- PROBLEM: if customer re-chooses extra portions of same item, there is a clash of (orderId, itemId)
-- e.g. chooses (1, 6, 10) and then 12 more portions later: (1, 6, 12) again
-- fix by querying before inserting; if (orderId, itemId) exists, just update

-- customer 1 orders with cash:
INSERT INTO Picks values
(1, 6, 10),
(1, 10, 20),
(1, 8, 15); 
INSERT INTO Locations values
('customer001add001area001', 'area001');
-- order placed
UPDATE Orders SET
    status = 'PENDING',
    deliveryFee = 5,
    timePlaced = '2020-04-04 12:00:01',
    address = 'customer001add001area001'
where orderId = 1;
-- restaurant accepts order
UPDATE Orders SET
    status = 'PREPARING'
where orderId = 1;
-- FDS assigns rider
-- rider accepts order
UPDATE Orders SET
    riderId = 3,
    timeRiderAccepts = '2020-04-04 12:05:01'
where orderId = 1;
-- restaurant finishes preparing order
UPDATE Orders SET
    status = 'READY-FOR-DELIVERY'
where orderId = 1;
-- rider arrives at restaurant
UPDATE Orders SET
    timeRiderArrivesRestaurant = '2020-04-04 12:10:44'
where orderId = 1;
-- rider leaves restaurant
UPDATE Orders SET
    status = 'DELIVERING',
    timeRiderLeavesRestaurant = '2020-04-04 12:11:01'
where orderId = 1;
-- rider delivers successfully
UPDATE Orders SET
    hasPaid = true,
    status = 'DELIVERED',
    timeRiderDelivered = '2020-04-04 12:34:01'
where orderId = 1;
 
-- customer 2 orders with card
INSERT INTO Picks values 
(2, 15, 2),
(2, 14, 23);
INSERT INTO Locations values
('customer002add001area004', 'area004');
UPDATE Customers SET
    registeredCardNo = 'customer002card001'
where CustomerId = 2;
-- customer places order
UPDATE Orders SET
    status = 'PENDING',
    paymentCardNoIfUsed = 'customer002card001',
    timePlaced = '2020-04-04 12:10:01',
    hasPaid = true,
    address = 'customer002add001area004'
where orderId = 2;
-- restaurant accepts order
UPDATE Orders SET
    status = 'PREPARING'
where orderId = 2;
-- FDS assigns rider
-- rider accepts order
UPDATE Orders SET
    riderId = 8,
    timeRiderAccepts = '2020-04-04 12:11:01'
where orderId = 2;
-- rider arrives at restaurant
UPDATE Orders SET
    timeRiderArrivesRestaurant = '2020-04-04 12:18:44'
where orderId = 2;
-- restaurant finishes preparing order
UPDATE Orders SET
    status = 'READY-FOR-DELIVERY'
where orderId = 2;
-- rider leaves restaurant
UPDATE Orders SET
    status = 'DELIVERING',
    timeRiderLeavesRestaurant = '2020-04-04 12:22:01'
where orderId = 2;
-- rider delivers successfully
UPDATE Orders SET
    status = 'DELIVERED',
    timeRiderDelivered = '2020-04-04 12:30:01'
where orderId = 2;
 
-- customer 3 orders with cash
-- promo code R003-2DOLLAROFF-FIRSTACCOUNT
 
INSERT INTO Picks values 
(3, 11, 2),
(3, 12, 3),
(3, 13, 4),
(3, 14, 5);
INSERT INTO Locations values
('customer003add001area004', 'area004');
-- customer places order
UPDATE Orders SET
-- promo discount applied by trigger
    status = 'PENDING',
    promoCode = 'R003-2DOLLAROFF-FIRSTACCOUNT',
    timePlaced = '2020-04-06 12:10:01',
    address = 'customer003add001area004'
where orderId = 3;
-- restaurant accepts order
UPDATE Orders SET
    status = 'PREPARING'
where orderId = 3;
-- FDS assigns rider
-- rider accepts order
UPDATE Orders SET
    riderId = 6,
    timeRiderAccepts = '2020-04-06 12:11:01'
where orderId = 3;
-- rider arrives at restaurant
UPDATE Orders SET
    timeRiderArrivesRestaurant = '2020-04-06 12:18:44'
where orderId = 3;
-- restaurant finishes preparing order
UPDATE Orders SET
    status = 'READY-FOR-DELIVERY'
where orderId = 3;
-- rider leaves restaurant
UPDATE Orders SET
    status = 'DELIVERING',
    timeRiderLeavesRestaurant = '2020-04-06 12:22:01'
where orderId = 3;
-- rider delivers successfully
UPDATE Orders SET
    hasPaid = true,
    status = 'DELIVERED',
    timeRiderDelivered = '2020-04-06 12:30:01'
where orderId = 3;
 
INSERT INTO Picks values 
(4, 18, 5),
(4, 19, 2);
-- promo code R004-0.5DOLLAROFF-ITEM003-ALL
-- only 1 promo should apply even though 2 are eligible
 
INSERT INTO Locations values
('customer004add001area001', 'area001');
-- customer places order
UPDATE Orders SET
-- promo discount applied by trigger
    status = 'PENDING',
    promoCode = 'R004-0.5DOLLAROFF-ITEM003-ALL',
    timePlaced = '2020-03-31 12:10:01',
    address = 'customer004add001area001'
where orderId = 4;
-- restaurant accepts order
UPDATE Orders SET
    status = 'PREPARING'
where orderId = 4;
-- FDS assigns rider
-- rider accepts order
UPDATE Orders SET
    riderId = 2,
    timeRiderAccepts = '2020-03-31 12:11:01'
where orderId = 4;
-- rider arrives at restaurant
UPDATE Orders SET
    timeRiderArrivesRestaurant = '2020-03-31 12:18:44'
where orderId = 4;
-- restaurant finishes preparing order
UPDATE Orders SET
    status = 'READY-FOR-DELIVERY'
where orderId = 4;
-- rider leaves restaurant
UPDATE Orders SET
    status = 'DELIVERING',
    timeRiderLeavesRestaurant = '2020-03-31 12:22:01'
where orderId = 4;
-- rider delivers successfully
UPDATE Orders SET
    hasPaid = true,
    status = 'DELIVERED',
    timeRiderDelivered = '2020-03-31 12:30:01'
where orderId = 4;

-- Customer 5 pays card
-- R001-50PERCENTOFF-ALL
INSERT INTO Picks values
(5, 1, 1),
(5, 3, 2);
INSERT INTO Locations values
('customer005add001area005', 'area005');
UPDATE Customers SET
    registeredCardNo = 'customer005card001'
where CustomerId = 5;
-- customer places order
UPDATE Orders SET
    status = 'PENDING',
    promoCode = 'R001-50PERCENTOFF-ALL',
    paymentCardNoIfUsed = 'customer005card001',
    timePlaced = '2020-04-01 12:10:01',
    hasPaid = true,
    address = 'customer005add001area005'
where orderId = 5;
-- restaurant accepts order
UPDATE Orders SET
    status = 'PREPARING'
where orderId = 5;
-- FDS assigns rider
-- rider accepts order
UPDATE Orders SET
    riderId = 1,
    timeRiderAccepts = '2020-04-01 12:11:01'
where orderId = 5;
-- rider arrives at restaurant
UPDATE Orders SET
    timeRiderArrivesRestaurant = '2020-04-01 12:18:44'
where orderId = 5;
-- restaurant finishes preparing order
UPDATE Orders SET
    status = 'READY-FOR-DELIVERY'
where orderId = 5;
-- rider leaves restaurant
UPDATE Orders SET
    status = 'DELIVERING',
    timeRiderLeavesRestaurant = '2020-04-01 12:22:01'
where orderId = 5;
-- rider delivers successfully
UPDATE Orders SET
    status = 'DELIVERED',
    timeRiderDelivered = '2020-04-01 12:30:01'
where orderId = 5;
