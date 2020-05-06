var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

require("dotenv").config();

var indexRouter = require("./routes/index");
var customerHomePageRouter = require("./routes/customerHomePage");
var customerOrderConfirmPageRouter = require("./routes/customerOrderConfirmPage");
var riderHomePageRouter = require("./routes/riderHomePage");
var managerHomePageRouter = require("./routes/managerHomePage");
var staffHomePageRouter = require("./routes/staffHomePage");
var usersRouter = require("./routes/users");
var aboutRouter = require("./routes/about");
var tableRouter = require("./routes/table");
var loopsRouter = require("./routes/loops");
var selectRouter = require("./routes/select");
var formsRouter = require("./routes/forms");
var insertRouter = require("./routes/insert");
var ordersRouter = require("./routes/orders");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/customerHomePage", customerHomePageRouter);
app.use("/customerOrderConfirmPage", customerOrderConfirmPageRouter);
app.use("/riderHomePage", riderHomePageRouter);
app.use("/managerHomePage", managerHomePageRouter);
app.use("/staffHomePage", staffHomePageRouter);
app.use("/users", usersRouter);
app.use("/about", aboutRouter);
app.use("/table", tableRouter);
app.use("/loops", loopsRouter);
app.use("/select", selectRouter);
app.use("/forms", formsRouter);
app.use("/orders", ordersRouter);
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
