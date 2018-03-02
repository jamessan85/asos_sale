require('dotenv').config()
var express = require("express");
var http = require("http");
var path = require("path");
var logger = require("morgan");
var bodyParser = require("body-parser");
var mysql = require('mysql');
var bcrypt = require('bcrypt');
var session = require('express-session');
var request_middleware = require('request');
var convert = require('convert-units')
var puppeteer = require('puppeteer');
var email = require('mailer');


var app = express ();

app.set('port', (process.env.PORT || 5000));

var email_address = [];
var url = [];
var idsales_data = [];

// create sql connection
var con = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB
});

app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({secret: "kkldha8994893493jkjfkljsdklfjsdklf"}));

getData();
checkSale();

app.get("/", function(req, res, next) {
    res.render("index");
})

app.post("/", function(req, res, next) {
  data = req.body
  var email = data.email
  var sliced_url = StringSlice(data.url)
  insertDetails(email, sliced_url)
  res.redirect("/message");
})

app.get("/message", function(req, res, next){
  res.render("message");
})

app.get("/unsubscribe/:email&:url&:id", function(req, res, next) {
  url = req.params
  console.log(url)
  res.render('unsubscribe')
})

app.post("/unsubscribe/:email&:url&:id", function(req, res, next) {
  url = req.params
  unsubscribe(url.id)
  res.redirect('/success')
})

app.get("/success", function(req, res, next){
  res.render("success");
})

app.use(function(err, req, res, next) {
 res.status(500);
 res.send("Internal server error.");
});

app.use(function(err, req, res, next) {
  res.status(404);
  res.send("Page not found, dingbat....");
 });

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


function insertDetails(x, y) {
    var sql = "INSERT INTO sale_data (email, url, email_flag) VALUES ?";
    var values = [
      [x, y, 1]
    ]
		con.query(sql, [values], function (err, result) {
		if (err) throw err;
		});
};

function getData() {
    con.query("SELECT * FROM sale_data", function (err, result, fields) {
      if (err) throw err;
      for (i = 0; i < result.length; i++) {
        email_address.push(result[i].email);
        url.push(result[i].url);
      }
    });
}

function checkSale(){ // Checks if item is on Sale
  try {
    (async () => {
      const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
      const page = await browser.newPage()
      for (var i = 0; i < url.length; i++) {
        try {
          await page.goto(url[i])
          price = await page.evaluate(() => document.querySelector('#product-price > div.grid-row.rendered > span.current-price.product-price-discounted').innerText)
          product = await page.evaluate(() => document.querySelector('#aside-content > div.product-hero > h1').innerText);
          sendEmail(email_address[i], product, price, url[i], idsales_data[i])
        } catch (err) {
        }
      }
      browser.close()
    })()
    } catch (err) {
    } 
}

function sendEmail(email, product, price, url, id) { // Sends the email
  email.send({
      host : 'smtp.123-reg.co.uk',              // smtp server hostname
      port : "25",                     // smtp server port
    ssl: false,						// for SSL support - REQUIRES NODE v0.3.x OR HIGHER
      domain : "localhost",            // domain used by client to identify itself to server
      to : email,
      from : "sale.alert@sandmandesign.co.uk",
      subject : "ASOS Sale Alert, your item " + product,
      body: "Hello, the item you wished to be alerted about is now on sale for " + price + ", Click here to view it " + url + " If you wish to stop recieving these emails please click on this link www.localhost:3002/unsubscribe/" + email + "&" + url + "&" + id,
      authentication : "login",        // auth login is supported; anything else is no auth
      username : process.env.SMTP_USER,        // username
      password : process.env.SMTP_PASS         // password
    },
    function(err, result){
  });
}

function StringSlice(x) { // Remove anything after the question mark in the url string
  url_find = x.search('\\?')
  url_slice = x.slice('0', url_find )
  return url_slice
}

function unsubscribe(id) {
  var sql = "UPDATE sale_data (email_flag) VALUES ? WHERE (idsales_data) = " + id ;
  var values = [
    [1]
  ]
		con.query(sql, [values], function (err, result) {
		if (err) throw err;
		});
}
