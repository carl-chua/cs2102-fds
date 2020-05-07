var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

// NEED schedule to check minimum working hours for MWS and WWS!

// MWS
var shift1 = [true,true,true,true,false,true,true,true,true,false,false,false];
var shift2 = [false,true,true,true,true,false,true,true,true,true,false,false];
var shift3 = [false,false,true,true,true,true,false,true,true,true,true,false];
var shift4 = [false,false,false,true,true,true,true,false,true,true,true,true];
var nullshift = [false,false,false,false,false,false,false,false,false,false,false,false];

riderId = null;

function WWSconstructor(shiftArray) {
	for (var i = 0; i < 7; i++) {
		for (var j = 0; j < 12; j++) {
			if (typeof shiftArray[i][j] == 'undefined') {
				shiftArray[i][j] = false;
			}
			else {
				shiftArray[i][j] = true;
			}
		}
	}
	return shiftArray;
}

function PGArrayConstructor(shiftArray) {
	finalArray = "'{";
	for (var i = 0; i < 7; i++) {
		finalArray += "{";
		for (var j = 0; j < 12; j++) {
			finalArray += shiftArray[i][j];
			if (j != 11) {
				finalArray += ",";
			}
		}
		finalArray += "}";
		if (i != 6) {
			finalArray += ",";
		}
	}
	finalArray += "}'";
	return finalArray;
}

function MWScheck(monShift, tueShift, wedShift, thuShift, friShift, satShift, sunShift) {
	// 5 consecutive work days in a week.
	var workStreak = 0;
	var highestStreak = 0;
	var shiftArray = [monShift, tueShift, wedShift, thuShift, friShift, satShift, sunShift];
	console.log(shiftArray);
	for (var i = 0; i < 13; i++) {
		if (shiftArray[i%7] != "null") {
			workStreak++;
		}
		else {
			if (workStreak > highestStreak) {
				highestStreak = workStreak;
			}
			workStreak = 0;
		}
	}
	if (highestStreak == 5) {
		return true;
	}
	return false;
}

function WWScheck(shiftArray) {
	// work intervals cannot exceed 4 hours
	// must work BETWEEN 10 and 48 hours a week
	workStreak = 0;
	highestStreak = 0;
	hourSum = 0;
	for (var i = 0; i < 7; i++) {
		for (var j = 0; j < 12; j++) {
			if (shiftArray[i][j] == true) {
				workStreak++;
				hourSum++;
			}
			else {
				if (workStreak > highestStreak) {
					highestStreak = workStreak;
					workStreak = 0;
				}
			}
		}
	}
	if (highestStreak > 4) {
		return false;
	}
	if (hourSum < 10 || hourSum > 48) {
		return false;
	}
	return true;
}

/* GET users listing. */
router.get('/', function(req, res, next) {
	riderId = req.session.riderId;
 	res.render('newSchedulesPage');
});

router.post('/', function(req, res, next) { 
	console.log(riderId);
	var scheduleType = req.body.type;
	console.log(req.body.type)
	var scheduleIdQuery = "SELECT MAX(scheduleId) FROM Schedules;";
	pool.query(scheduleIdQuery, (err, scheduleIdData) => {
		console.log(err); console.log(scheduleIdData);
		var newScheduleId = scheduleIdData.rows[0].max + 1;
		if (scheduleType == "mws") {
			if (MWScheck(req.body.mondaymws, req.body.tuesdaymws, req.body.wednesdaymws, req.body.thursdaymws, req.body.fridaymws, req.body.saturdaymws, req.body.sundaymws)) {
				var insertMWSQuery = "INSERT INTO MonthlyWorkSchedules VALUES (" + newScheduleId + "," + req.body.mondaymws + "," + req.body.tuesdaymws + "," + req.body.wednesdaymws + "," + req.body.thursdaymws + "," + req.body.fridaymws + "," + req.body.saturdaymws + "," + req.body.sundaymws + ");";
				console.log(req.body.startdate, req.body.enddate);
				var insertScheduleQuery = "INSERT INTO Schedules VALUES (" + newScheduleId + "," + riderId + ",'" + req.body.startdate + "','" + req.body.enddate + "'," + "null" + "," + "'MONTHLY'" + "," + "2" + "," + "0" + "," + "1500);";
				pool.query(insertScheduleQuery, (err, insertData) => {
					console.log(err); console.log(insertData);
					pool.query(insertMWSQuery, (err2, MWSData) => {
						console.log(err2);
						if (typeof err2 != "undefined") {
							res.send(err.message);
						}
						else {
							res.redirect("/viewSchedulesPage");
						}
					});
				});
			}
			else {
				res.send("Please choose a schedule with 5 consecutive work days.");
			}
		}
		else if (scheduleType == "wws") {
			console.log(req.body);
			var tempArray = [[req.body.mon10, req.body.mon11, req.body.mon12, req.body.mon13, req.body.mon14, req.body.mon15, req.body.mon16, req.body.mon17, req.body.mon18, req.body.mon19, req.body.mon20, req.body.mon21], [req.body.tue10, req.body.tue11, req.body.tue12, req.body.tue13, req.body.tue14, req.body.tue15, req.body.tue16, req.body.tue17, req.body.tue18, req.body.tue19, req.body.tue20, req.body.tue21], [req.body.wed10, req.body.wed11, req.body.wed12, req.body.wed13, req.body.wed14, req.body.wed15, req.body.wed16, req.body.wed17, req.body.wed18, req.body.wed19, req.body.wed20, req.body.wed21], [req.body.thu10, req.body.thu11, req.body.thu12, req.body.thu13, req.body.thu14, req.body.thu15, req.body.thu16, req.body.thu17, req.body.thu18, req.body.thu19, req.body.thu20, req.body.thu21], [req.body.fri10, req.body.fri11, req.body.fri12, req.body.fri13, req.body.fri14, req.body.fri15, req.body.fri16, req.body.fri17, req.body.fri18, req.body.fri19, req.body.fri20, req.body.fri21], [req.body.sat10, req.body.sat11, req.body.sat12, req.body.sat13, req.body.sat14, req.body.sat15, req.body.sat16, req.body.sat17, req.body.sat18, req.body.sat19, req.body.sat20, req.body.sat21], [req.body.sun10, req.body.sun11, req.body.sun12, req.body.sun13, req.body.sun14, req.body.sun15, req.body.sun16, req.body.sun17, req.body.sun18, req.body.sun19, req.body.sun20, req.body.sun21]];
			var shiftArray = WWSconstructor(tempArray);
			if (WWScheck(shiftArray)) {
				var stringArray = PGArrayConstructor(shiftArray);
				console.log(stringArray);
				var insertWWSQuery = "INSERT INTO WeeklyWorkSchedules VALUES (" + newScheduleId + "," + stringArray + ");";
				var insertScheduleQuery = "INSERT INTO Schedules VALUES (" + newScheduleId + "," + riderId + ",'" + req.body.startdate + "','" + req.body.enddate + "'," + "null" + "," + "'WEEKLY'" + "," + "2" + "," + "0" + "," + "1500);";
				pool.query(insertScheduleQuery, (err, insertData) => {
					console.log(err);
					pool.query(insertWWSQuery, (err2, WWSData) => {
						console.log(err2);
						if (typeof err2 != "undefined") {
							res.send(err.message);
						}
						else {
							res.redirect("/viewSchedulesPage");
						}
					})
				})
			}
			else {
				res.send("Please ensure your schedule puts in between 10 and 48 hours of work, and that your longest work interval does not exceed 4 hours.");
			}
		}
	})
});

module.exports = router;
