-- register account
INSERT INTO Customers values 
(1, 'customer001', 'password', 'customer001@gmail.com', '80000001', 
    '2020-04-04 00:00:00', 0, null, false, null, null, null, null, null),

-- check account info
select name, 
    email,
	phoneNo,
	dateRegistered,
	rewardPoints,
	registeredCardNo,
    mostRecentAddress1,  -- if null display nothing
    mostRecentAddress2,
    mostRecentAddress3,
    mostRecentAddress4,
    mostRecentAddress5,
from Customers
where customerId = 0    -- use current session id?

-- update account info
update Customers set
    name, 
    email,
    password,
	phoneNo,
	registeredCardNo
where customerId = 0

-- deactive account
update Customers set
    isDeleted = true
where customerId = 0

-- browse restaurants
select name
from Restaurants R
-- order by (select foodMenuItems)

-- click on restaurant: 
    -- display foodMenuItems
    -- display current restaurant
    -- display food item promotions
    -- display restaurant promotions
select name, category, price, rating
from FoodMenuItems
where restaurantId = 0
and isSelling = true
-- and isAvailable = true  -- need to check and display
select 
from RestaurantPromotionalCampaign

select from FoodItemPromotionalCampaign

-- search food by category (within restaurant)
select name, category, price, rating
from FoodMenuItems
where restaurantId = 0
and isSelling = true
and category = 'Local'  
-- and isAvailable = true  -- need to check and display

-- search food by name

-- click on food: show reviews
select starRating, reviewText
from FoodReviews
where itemId = 0

-- add to cart
-- apply promo code
-- add address

-- rate delivery for order
-- review food for orders

-- browse part orders
-- browse past reviews

-- low priority: search food by name (across all restaurants)
-- and isAvailable = true  -- need to check and display