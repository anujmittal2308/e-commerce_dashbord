const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
require("./db/config");
const User = require("./db/User");
const Products = require("./db/Product");
const mongodb = require("mongodb");
const Jwt = require("jsonwebtoken");
const jwtKey = "e-commdash";

//configure env
dotenv.config();
const cors = require("cors");

console.log(process.env);

const app = express();
const port = 9500;

app.use(express.json());
app.use(cors());

//user
app.post("/register", async (req, res) => {
  let user = new User(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result.password;

  Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
    if (err) {
      res.send("something went wrong");
    } else {
      res.send({ result, auth: token });
    }
  });
  res.send(result);

  console.warn(req.body);
});

app.post("/login", async (req, res) => {
  if (req.body.password && req.body.email) {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
      Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
          res.send("something went wrong");
        }
        res.send({ user, auth: token });
      });
    } else {
      res.send({ result: "No User found" });
    }
  } else {
    res.send({ result: "No User found" });
  }
  // console.warn(user);
  // console.warn(req.body);
});

//product
app.post(
  "/add-product",
  /*verifyToken,*/ async (req, res) => {
    let product = new Products(req.body);
    let result = await product.save();
    res.send(result);
    console.warn(result);
  }
);

// now get a product to show in as list
app.get("/product", verifyToken, async (req, res) => {
  const product = await Products.find();
  if (product.length > 0) {
    res.send(product);
  } else {
    res.send("No Product Found");
  }
});

//delete
app.delete("/product/:id", verifyToken, async (req, res) => {
  console.warn(req.params.id);
  let result = await Products.deleteOne({
    _id: new mongodb.ObjectId(req.params.id),
  });
  if (result) {
    res.send(result);
  } else {
    res.send({ result: "No Record Found" });
  }
  // console.warn(result);
  // res.send(result);
});

//get id form update
app.get("/product/:id", verifyToken, async (req, res) => {
  let result = await Products.find({
    _id: new mongodb.ObjectId(req.params.id),
  });
  if (result) {
    res.send(result);
    console.log(result);
  } else {
    res.send("no Product Found");
  }
});

//
app.put("/product/:id", verifyToken, async (req, res) => {
  let result = await Products.updateOne(
    { _id: new mongodb.ObjectId(req.params.id) },
    { $set: req.body }
  );
  res.send(result);
});

app.get("/search/:key", verifyToken, async (req, res) => {
  let result = await Products.find({
    $or: [
      {
        name: { $regex: req.params.key },
      },
      {
        company: { $regex: req.params.key },
      },
      {
        category: { $regex: req.params.key },
      },
      {
        price: { $regex: req.params.key },
      },
    ],
  });
  res.send(result);
});

function verifyToken(req, res, next) {
  let token = req.headers["authorization"];
  if (token) {
    token = token.split(" ")[1];
    Jwt.verify(token, jwtKey, (err, valid) => {
      if (err) {
        res.status(401).send({ result: "please provide valid token" });
      } else {
        next();
      }
    });
  } else {
    res.status(403).send({ result: "please add tokenn with header" });
  }
  console.warn(token);
}

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
