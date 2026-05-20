const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = process.env.PORT || 5000;
const db = require("./db");

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

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
  } catch (error) {
    console.log("Error fetching products", error);
    res.status(500).json({ error: "Error fetching products" });
  }
});

app.get("/products/:id", (req, res) => {
  try {
    const id = req.params.id;
    const query = "SELECT * FROM products WHERE id = ?";

    db.query(query, [id], (err, results) => {
      if (err) {
        console.log("Error fetching product", err);
        return res.status(500).json({ error: "Error fetching product" });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(results[0]);
    });
  } catch (error) {
    console.log("Error fetching product", error);
    res.status(500).json({ error: "Error fetching product" });
  }
});

app.put("/products/:id", (req, res) => {
  try {
    const id = req.params.id;
    const { name, price, image } = req.body;

    const query =
      "UPDATE products SET name = ?, price = ?, image = ? WHERE id = ?";
    db.query(query, [name, price, image, id], (err, results) => {
      if (err) {
        console.log("Error updating product", err);
        return res.status(500).json({ error: "Error updating product" });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json({ message: "Product updated successfully" });
    });
  } catch (error) {
    console.log("Error updating product", error);
    res.status(500).json({ error: "Error updating product" });
  }
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

app.post("/register", (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 12);
    const newUser = { name, email, password: hashedPassword };
    const query = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    db.query(
      query,
      [newUser.name, newUser.email, newUser.password],
      (err, results) => {
        if (err) {
          console.log("Error adding user", err);
          return res.status(500).json({ error: "Error adding user" });
        }
        res.json({
          message: "User added successfully",
          userId: results.insertId,
        });
      },
    );
  } catch (error) {
    console.log("Error adding user", error);
    res.status(500).json({ error: "Error adding user" });
  }
});

app.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;
    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query, [email], (err, results) => {
      if (err) {
        console.log("Error fetching user", err);
        return res.status(500).json({ error: "Error fetching user" });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      const user = results[0];
      const isPasswordValid = bcrypt.compareSync(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid password" });
      }
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      });
      res.json({
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    });
  } catch (error) {
    console.log("Error during login", error);
    res.status(500).json({ error: "Error during login" });
  }
});

app.get("/me", verifyToken, (req, res) => {
  try {
    const query = "SELECT id, name, email FROM users WHERE id = ?";
    db.query(query, [req.userId], (err, results) => {
      if (err || results.length === 0) {
        return res.status(500).json({ success: false });
      }

      res.json({
        success: true,
        user: results[0],
      });
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out" });
});

app.get("/", (req, res) => {
  res.send(`First SQL Project is running on port ${PORT}`);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
