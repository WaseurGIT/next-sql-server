const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "myshop",
});

db.connect((err) => {
  if (err) {
    console.log("Error connecting to database", err);
    res.status(500).json({ error: "Error connecting to database" });
  } else {
    console.log("Connected to database");
  }
});

module.exports = db;
