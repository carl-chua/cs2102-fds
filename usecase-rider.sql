/* for rider to see current schedule */
select scheduleId, scheduleType
from Schedules S
where S.riderId = (query);
and NOW.date BETWEEN S.startDate AND S.endDate;

-- if scheduleType is MWS:
-- first, get shifts for all days of the week 

select *
from MonthlyWorkSchedules MWS
where MWS.scheduleId = (scheduleId);

select name, 
    email,
	phoneNo,
from DeliveryRiders
where riderId = x    -- use current session id?

-- update account info
update DeliveryRiders set
    name, 
    email,
    password,
where riderId = x

-- then, for all shifts (monShift, tueShift...), get hourly schedule
(for all shifts:)
select hourlySchedule
from Shifts SH
where shiftId = (monShift);

-- if scheduleType is WWS:

select WWS.hourlySchedule
from WeeklyWorkSchedules WWS
where WWS.scheduleId = (scheduleId);

-- convert 2D array to list of hours in back-end

/* for rider to edit current schedule */ 
-- assume he has already queried scheduleId above
-- should only be allowed to edit current schedule

-- if scheduleType is MWS:

update MonthlyWorkSchedules
set whatever shift to whatever you want
where S.scheduleId = (scheduleId)

-- if scheduleType is WWS:

update WeeklyWorkSchedules
set hourlySchedule[whatever][whatever] = whatever
where S.scheduleId = (scheduleId)

/* view past schedules */

select scheduleId, scheduleType
from Schedules S
where S.riderId = (query)
and S.endDate < Now;

-- if MWS:
select *
from MonthlyWorkSchedules MWS
where MWS.endDate < Now

-- if WWS
select *
from WWS
where WWS.endDate < Now

/* see base salary */
-- assume already have scheduleId

select baseSalary
from Schedules S
where S.scheduleId = (scheduleId);

/* view past salary payments */

-- for base salaries:

select baseSalary
from Schedules S
where S.riderId = (riderId);

-- for delivery payments:

select feePerDelivery, noOfDeliveries, (multiply both)
from Schedules S
where S.riderId = (riderId);

/* view completed orders, delivery payments and ratings */

select O.orderId, O.deliveryFee, O.deliveryRating, R.name, R.address, O.address, C.phoneNumber
from Orders O join Restaurants R on (O.restaurantId = R.restaurantId)
			  join Customers C on (customerId)
where O.riderId = (riderId);

/* view in-progress orders */

select O.orderId, O.deliveryFee, R.name, R.address, O.address, C.phoneNumber, O.timePlaced
from Orders O join Restaurants R on (O.restaurantId = R.restaurantId)
where O.riderId = (riderId)
and O.status <> "DELIVERED";

/* view overall rating */

select overallRating
from DeliveryRiders
where riderId = (riderId);

/* see if supposed to be working now */

SELECT DR.riderId
	FROM DeliveryRiders DR JOIN Schedules S ON (DR.riderId = S.riderId) 
						   LEFT JOIN MonthlyWorkSchedules MWS ON (MWS.scheduleId = S.scheduleId)
						   FULL JOIN WeeklyWorkSchedules WWS ON (WWS.scheduleId = S.scheduleId)
	WHERE DR.isAvailable = TRUE
	AND (S.startDate <= NEW.timePlaced AND S.endDate >= NEW.timePlaced)
	AND ((S.scheduleType = 'WEEKLY' AND WWS.hourlySchedule[EXTRACT(DOW FROM NEW.timePlaced::DATE)][EXTRACT(HOUR FROM NEW.timePlaced) - 9] = TRUE)
	OR (S.scheduleType = 'MONTHLY' AND CASE
											WHEN (EXTRACT(DOW FROM NEW.timePlaced::DATE)) = 1 THEN MWS.monShift
											WHEN (EXTRACT(DOW FROM NEW.timePlaced::DATE)) = 2 THEN MWS.tueShift
											WHEN (EXTRACT(DOW FROM NEW.timePlaced::DATE)) = 3 THEN MWS.wedShift
											WHEN (EXTRACT(DOW FROM NEW.timePlaced::DATE)) = 4 THEN MWS.thuShift
											WHEN (EXTRACT(DOW FROM NEW.timePlaced::DATE)) = 5 THEN MWS.friShift
											WHEN (EXTRACT(DOW FROM NEW.timePlaced::DATE)) = 6 THEN MWS.satShift
										    WHEN (EXTRACT(DOW FROM NEW.timePlaced::DATE)) = 7 THEN MWS.sunShift
										END
									= ANY(CASE
											WHEN (EXTRACT(HOUR FROM NEW.timePlaced) = 10) THEN ARRAY[1]
											WHEN (EXTRACT(HOUR FROM NEW.timePlaced) = 11) THEN ARRAY[1,2]
											WHEN (EXTRACT(HOUR FROM NEW.timePlaced) = 12) THEN ARRAY[1,2,3]
											WHEN (EXTRACT(HOUR FROM NEW.timePlaced) BETWEEN 13 AND 19) THEN ARRAY[1,2,3,4]
											WHEN (EXTRACT(HOUR FROM NEW.timePlaced) = 20) THEN ARRAY[2,3,4]
											WHEN (EXTRACT(HOUR FROM NEW.timePlaced) = 21) THEN ARRAY[3,4]
											WHEN (EXTRACT(HOUR FROM NEW.timePlaced) = 22) THEN ARRAY[4]
		
										END)))
	LIMIT 1;

-- (if your rider in this list, he is supposed to be working)











