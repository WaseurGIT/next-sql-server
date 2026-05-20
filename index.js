const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const db = require("./db");

app.use(cors());
app.use(express.json());

app.post("/products", (req, res) => {
  try {
    const { name, price, image } = req.body;

    const query = "INSERT INTO products (name, price, image) VALUES (?, ?, ?)";
    db.query(query, [name, price, image], (err, results) => {
      if (err) {
        console.log("Error adding product", err);
        res.status(500).json({ error: "Error adding product" });
      }
      res.json({
        message: "Product added successfully",
        productId: results.insertId,
      });
    });
  } catch (error) {
    console.log("Error adding product", error);
    res.status(500).json({ error: "Error adding product" });
  }
});

app.get("/products", (req, res) => {
  try {
    const query = "SELECT * FROM products";

    db.query(query, (err, results) => {
      if (err) {
        console.log("Error fetching products", err);
        res.status(500).json({ error: "Error fetching products" });
      }
      res.json(results);
    });
  } catch (error) {}
});

app.delete("/products/:id", (req, res) => {
  try {
    const id = req.params.id;
    const query = "DELETE FROM products WHERE id = ?";
    db.query(query, [id], (err, results) => {
      if (err) {
        console.log("Error deleting product", err);
        res.status(500).json({ error: "Error deleting product" });
      }
      res.json({ message: "Product deleted successfully" });
    });
  } catch (error) {
    console.log("Error deleting product", error);
    res.status(500).json({ error: "Error deleting product" });
  }
});

app.get("/", (req, res) => {
  res.send(`First SQL Project is running on port ${PORT}`);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
