-- register account
INSERT INTO Customers values 
(1, 'customer001', 'password', 'customer001@gmail.com', '80000001', 
    '2020-04-04 00:00:00', 0, null, false, null, null, null, null, null),

-- check account info - DONE
-- update account info - DONE
-- deactive account - DONE
-- browse restaurants - DONE

-- click on restaurant: - DONE
    -- display foodMenuItems
    -- display current restaurant
    -- display food item promotions - low priority
    -- display restaurant promotions - low priority

-- search food by category (within restaurant)
select name, category, price, rating
from FoodMenuItems
where restaurantId = 0
and isSelling = true
and category = 'Local'
-- and isAvailable = true  -- need to check and display


-- click on food: show reviews
select starRating, reviewText
from FoodReviews
where itemId = 0

-- add to cart
-- add address

-- search food by name (within restaurant)
-- apply promo code
-- rate delivery for order
-- review food for orders
-- browse part orders
-- browse past reviews

-- low priority: search food by name (across all restaurants)
-- and isAvailable = true  -- need to check and display