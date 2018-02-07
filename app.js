var express = require("express");
var http = require("http");
var path = require("path");
var logger = require("morgan");
var bodyParser = require("body-parser");
var mysql = require('mysql');
var bcrypt = require('bcrypt');

var app = express ();
//create sql connection
var con = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "roy100",
  database: "mydb"
});

app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");

var entries = [];
app.locals.entries = entries;

app.use(logger("dev"));

app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", function(request, response) {
    response.render("index");
})

app.get("/new-entry", function(request, response){
    response.render("new-entry")
})

app.post("/new-entry", function(request, response){
    if (!request.body.username || !request.body.password) {
        response.status(400).send("Entries must have a title and a body.");
        return;
    }
        username = request.body.username,
        password = bcrypt.hashSync(request.body.password, 10),
        created = new Date()
        insertDetails();

    response.redirect("/");
})

app.get("/login", function(request, response){
    response.render("login")
})

app.post("/login", function(request, response){
        username = request.body.username,
        password = request.body.password,

        sql = "SELECT * FROM users WHERE username = " + "'" + username + "'";
        con.query(sql, function (err, result) {
        if (err) throw err;
        var hash = result[0].password;
          if (bcrypt.compareSync(password, hash) == true) {
            response.redirect("/new-entry");
          } else {
            response.send("wrong password")
          }
        });

})

app.use(function(request, response){
    response.status(404).render("404");
})

http.createServer(app).listen(3000, function(){
    console.log("Guestbook app started on port 3000.");
});

// function insertDetails() {
//     var sql = "INSERT INTO users (username, password, create_date) VALUES ?";
//     var values = [
//       [username, password, created]
//     ]
// 		con.query(sql, [values], function (err, result) {
// 		if (err) throw err;
// 		});
// };
