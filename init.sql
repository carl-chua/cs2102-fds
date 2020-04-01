DROP TABLE IF EXISTS FoodReviews CASCADE;
DROP TABLE IF EXISTS Picks CASCADE;
DROP TABLE IF EXISTS DeliveryServicePromotionalCampaigns CASCADE;
DROP TABLE IF EXISTS RestaurantPromotionalCampaigns CASCADE;
DROP TABLE IF EXISTS FoodItemPromotionalCampaigns CASCADE;
DROP TABLE IF EXISTS Orders CASCADE;
DROP TABLE IF EXISTS FoodMenuItems CASCADE;
DROP TABLE IF EXISTS Restaurants CASCADE;
DROP TABLE IF EXISTS Locations CASCADE;
DROP TABLE IF EXISTS RestaurantStaffs CASCADE;
DROP TABLE IF EXISTS Customers CASCADE;
DROP TABLE IF EXISTS DeliveryRiders CASCADE;
DROP TABLE IF EXISTS MonthlyWorkSchedule CASCADE;
DROP TABLE IF EXISTS WeeklyWorkSchedule CASCADE;
DROP TABLE IF EXISTS Schedules CASCADE;
DROP TABLE IF EXISTS Shifts CASCADE;
DROP TABLE IF EXISTS FoodDeliveryServiceManagers CASCADE;
DROP TABLE IF EXISTS PromotionalCampaigns CASCADE;

CREATE TABLE PromotionalCampaigns (
	promoCode varchar,
	startDateTime timestamp not null,
	endDateTime timestamp not null check (endDateTime > startDateTime),
	percentDiscount numeric(10, 2) check (percentDiscount >= 0),
	dollarDiscount numeric(10, 2) check (dollarDiscount >= 0),
	isFreeDelivery boolean not null,
	minSpend numeric(10, 2) check (minSpend >= 0),
	onlyApplicableToFirstOrder boolean not null,
	maxDaysSinceLastOrder integer check (maxDaysSinceLastOrder >= 0),
	minDaysSinceLastOrder integer check (minDaysSinceLastOrder >= 0),
	primary key (promoCode)
    -- bcnf
    -- promoCode -> every other attribute
);

CREATE TABLE FoodDeliveryServiceManagers (
    FDSManagerId integer,
    name varchar not null,
    email varchar unique not null,
    password varchar not null,
    isActive boolean not null,
    primary key (FDSManagerId)
    -- bcnf
    -- FDSManagerId -> *
);

CREATE TABLE Locations (
    address varchar not null,
    areaName integer not null,
    primary key (address)
    -- bcnf
    -- address -> areaName; address is a primary key
);

CREATE TABLE RestaurantStaffs (
    restaurantStaffId integer,
    name varchar not null,
    password varchar not null,
    email varchar unique not null,
    isActive boolean not null,
    primary key (restaurantStaffId)
    -- bcnf
    -- restaurantStaffId -> *
);

CREATE TABLE Customers (
	customerId integer,
	name varchar not null,
    password varchar not null,
    email varchar unique not null,
	phoneNo varchar not null,
	registeredDate timestamp not null,
	rewardPoints integer not null check (rewardPoints >=0),
	registeredCardNo varchar,
    isActive boolean not null,
	primary key (customerId)
    -- bcnf
    -- customerId -> *
);

CREATE TABLE DeliveryRiders (
 	riderId integer,
    name varchar not null,
    password varchar not null,
	phoneNo varchar not null,
    email varchar unique not null,
    isActive boolean not null,
    isAvailable boolean not null,
    overallRating numeric(3, 2) not null check ((overallRating >= 1) and (overallRating <= 5)),
	primary key (riderId)
    -- bcnf
    -- riderId -> *
);

CREATE TABLE Schedules (
	scheduleId integer,
    riderId integer not null,
	startDate timestamp not null,
	endDate timestamp not null check (endDate >= startDate),
    datePaid timestamp not null check (datePaid >= endDate),
	feePerDelivery integer not null check (feePerDelivery >= 0),
	noOfDeliveries integer not null check (noOfDeliveries >= 0),
	baseSalary integer not null check (baseSalary >= 0),
	primary key (scheduleId)
    -- bcnf
    -- scheduleId -> *
);

CREATE TABLE MonthlyWorkSchedule (
	shifts integer[7] not null
    -- bcnf
    -- scheduleId -> *
) INHERITS (Schedules);

CREATE TABLE WeeklyWorkSchedule (
	hourlySchedule boolean[7][12] not null
    -- bcnf
    -- scheduleId -> *
    -- maintain constraints with Triggers
) INHERITS (Schedules);

CREATE TABLE Shifts (
    shiftId integer,
    hourlySchedule boolean[12] not null,
    primary key (shiftId)
    -- bcnf
    -- shiftId -> hourlySchedule
);

CREATE TABLE Restaurants (
    restaurantId integer,
    minSpend numeric(10, 2) check (minSpend >= 0),
    address varchar not null,
    foreign key (address) references Locations(address),
    primary key (restaurantId)
    -- bcnf
    -- restaurantId -> address
    -- restaurantId -> minSpend
);

CREATE TABLE FoodMenuItems (
	itemId integer,
	dailyLimit integer check (dailyLimit >= 0),
    price numeric(10, 2) not null check (price >= 0), 
	category varchar not null,
	qtyOrderedToday integer not null check (qtyOrderedToday >= 0),
	isSelling boolean not null,
	isAvailableToday boolean not null,
	restaurantId integer not null,
    foreign key(restaurantId) references Restaurants(restaurantId),
	primary key(itemId)
	-- bcnf
	-- itemId -> restaurantId, and itemId is a primary key
);

CREATE TABLE FoodReviews (
    reviewId integer,
    rating integer  not null check ((rating > 0) and (rating <= 5)),
    description varchar,
    itemId integer not null,
    customerId integer not null,
    foreign key (itemId) references FoodMenuItems(itemId),
    foreign key (customerId) references Customers(customerId),
    primary key(reviewId)
    -- bcnf
    -- reviewId -> *
);

CREATE TABLE RestaurantPromotionalCampaigns (
	restaurantStaffId integer not null,
	foreign key (restaurantStaffId) references RestaurantStaffs(restaurantStaffId)
    -- no FDs
) INHERITS (PromotionalCampaigns);

CREATE TABLE FoodItemPromotionalCampaigns (
	itemId integer not null,
	foreign key (itemId) references FoodMenuItems(itemId)
    -- no FDs
) INHERITS (PromotionalCampaigns);

CREATE TABLE DeliveryServicePromotionalCampaigns (
	FDSManagerId integer not null,
    foreign key (FDSManagerId) references FoodDeliveryServiceManagers (FDSManagerId)
    --should we include association with FoodDeliveryServiceManagers??
	--if we were to include association with FDSM, we have to include
	--association of RestaurantStaffs with RPC and include the creation of PromoCampaign use case in restaurant staff and manager system
) INHERITS (PromotionalCampaigns);

CREATE TABLE Orders (
	orderId integer,
	subTotal numeric(10, 2) not null check (subTotal >= 0),
	deliveryFee numeric(10, 2) not null check (deliveryFee >= 0),
	promoDiscount numeric(10, 2) not null check (promoDiscount >= 0),
	promoCode varchar,
    timePlaced timestamp not null,
	timeRiderAccepts timestamp check (timeRiderAccepts >= timePlaced),
	timeRiderArrivesRestaurant timestamp check (timeRiderArrivesRestaurant >= timeRiderAccepts),
	timeRiderLeavesRestaurant timestamp check (timeRiderLeavesRestaurant >= timeRiderArrivesRestaurant),
	timeRiderDelivered timestamp check (timeRiderDelivered >= timeRiderLeavesRestaurant),
	deliveryRating integer check ((deliveryRating) > 0 and (deliveryRating <=5)),
	paymentType varchar not null,
	hasPaid boolean not null,
	riderId integer not null,
	address varchar not null,
	customerId integer not null,
	foreign key(promoCode) references PromotionalCampaigns(promoCode),
	foreign key(riderId) references DeliveryRiders(riderId),
	foreign key(address) references Locations(address),
	foreign key(customerId) references Customers(customerId),
    primary key(orderId)
    -- no FDs
);

CREATE TABLE Picks (
	orderId integer,
	itemId integer,
    qtyOrdered integer not null check (qtyOrdered >= 0),
	foreign key (orderId) references Orders(orderId),
	foreign key (itemId) references FoodMenuItems(itemId),
	primary key (orderId, itemId)
    -- no FDs
);