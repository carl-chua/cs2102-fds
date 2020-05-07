var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require('express-session');

require("dotenv").config();
var indexRouter = require("./routes/index");
var customerRouter = require("./routes/customer");
var customerOrderConfirmPageRouter = require("./routes/customerOrderConfirmPage");
var riderHomePageRouter = require("./routes/riderHomePage");
var restaurantStaffHomePageRouter = require("./routes/restaurantStaffHomePage");
var managerHomePageRouter = require("./routes/managerHomePage");
var staffHomePageRouter = require("./routes/staffHomePage");
var viewSchedulesPageRouter = require("./routes/viewSchedulesPage");
var newSchedulesPageRouter = require("./routes/newSchedulesPage");
var viewPastSchedulesPageRouter = require("./routes/viewPastSchedulesPage");
var viewPaymentsPageRouter = require("./routes/viewPaymentsPage");
var viewDeliveriesPageRouter = require("./routes/viewDeliveriesPage")
var usersRouter = require("./routes/users");
var aboutRouter = require("./routes/about");
var tableRouter = require("./routes/table");
var loopsRouter = require("./routes/loops");
var selectRouter = require("./routes/select");
var formsRouter = require("./routes/forms");
var insertRouter = require("./routes/insert");

var app = express();

// view engine setup
app.use(session({secret: 'mySecret', resave: false, saveUninitialized: false}));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));


app.use("/", indexRouter);
app.use("/customer", customerRouter);
app.use("/customerOrderConfirmPage", customerOrderConfirmPageRouter);
app.use("/riderHomePage", riderHomePageRouter);
app.use("/restaurantStaffHomePage", restaurantStaffHomePageRouter);
app.use("/managerHomePage", managerHomePageRouter);
app.use("/staffHomePage", staffHomePageRouter);
app.use("/viewSchedulesPage", viewSchedulesPageRouter);
app.use("/newSchedulesPage", newSchedulesPageRouter);
app.use("/viewPastSchedulesPage", viewPastSchedulesPageRouter);
app.use("/viewPaymentsPage", viewPaymentsPageRouter);
app.use("/viewDeliveriesPage", viewDeliveriesPageRouter);
app.use("/users", usersRouter);
app.use("/about", aboutRouter);
app.use("/table", tableRouter);
app.use("/loops", loopsRouter);
app.use("/select", selectRouter);
app.use("/forms", formsRouter);

var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/insert", insertRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
