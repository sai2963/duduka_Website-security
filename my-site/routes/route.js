const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const mongodb = require("mongodb");
const db = require("../data/database");
const ObjectId = mongodb.ObjectId;
const bodyParser = require("body-parser");

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
router.use((req, res, next) => {
    if (req.session.isAuthenticated) {
      res.locals.user = req.session.user;
    }
    next();
  });
  
router.get("/login", (req, res) => {
  res.render("login", { req: req });
});
router.get("/signup", (req, res) => {
  let sessiondata = req.session.inputData;
  if (!sessiondata) {
    sessiondata = {
      hasError: false,
      email: "",
      confirmemail: "",
      password: "",
    };
  }
  req.session.inputData = null;
  res.render("signup", { inputData: sessiondata, req: req });
});
router.get("/Home", (req, res) => {
  res.render("home", { req: req });
});

router.get("/sendmoney", (req, res) => {
  if (!req.session.isAuthenticated) {
      return res.status(401).send("Authentication Not Proceeded ");
  }
 const csrfToken=req.csrfToken();
  res.render("sendmoney", {  csrfToken:csrfToken,req: req });
});
router.post("/signup", async (req, res) => {
  const userdata = req.body;
  const useremail = userdata.email;
  const confirmuseremail = userdata["confirm=email"];
  console.log(confirmuseremail);
  const userpassword = userdata.inputPassword;
  const enteredpassword = userpassword.trim();
  const hashedPassword = await bcrypt.hash(userpassword, 12);
  console.log(hashedPassword);
  if (
    !useremail ||
    !confirmuseremail ||
    !userpassword ||
    useremail !== confirmuseremail ||
    enteredpassword.length < 8 ||
    !useremail.includes("@")
  ) {
    req.session.inputData = {
      hasError: true,
      message: "Invalid input -please check your data",
      email: useremail,
      confirmemail: confirmuseremail,
      password: enteredpassword,
    };
    return res.redirect("/signup");
  }

  const existinguser = await db
    .getDb()
    .collection("users")
    .findOne({ email: useremail });

  if (existinguser) {
    console.log("User already registered");
    return res.redirect("/signup");
  }

  const user = {
    email: useremail,
    password: hashedPassword,
  };

  db.getDb().collection("users").insertOne(user);
  res.redirect("/login");
});

router.post(
  "/login",
  async (req, res) => {
    const userdata = req.body;
    const useremail = userdata.email;
    const userpassword = userdata.inputPassword;

    const existinguser = await db
      .getDb()
      .collection("users")
      .findOne({ email: useremail });

    if (!existinguser) {
      console.log("User not found");
      return res.redirect("/login");
    }

    const passwordAreEqual = await bcrypt.compare(
      userpassword,
      existinguser.password
    );

    if (!passwordAreEqual) {
      console.log("Password incorrect");
      return res.redirect("/login");
    }
    req.session.user = { id: existinguser._id, email: existinguser.email };
    req.session.isAuthenticated = true;
    req.session.save(function () {
        res.locals.user = req.session.user;
      res.redirect("/sendmoney");
    });
    console.log("User Authenticated");
    //res.redirect("/admin");
  } //  catch (error) {
  //   console.error("Error during login:", error);
  //   res.redirect("/login");
  // }
);
router.post("/Send", async (req, res) => {
  // Check if the user is authenticated
  if (!req.session.isAuthenticated) {
    return res.status(401).send("Authentication Denied");
  }

  try {
    const transaction = req.body;
    const sentemail=res.locals.user.email;
    console.log(sentemail)
    const enteredEmail = transaction.email;
    const enteredAmount = transaction.Amount;

    const transactionData = await {
      sentEmail: sentemail,
      
      receivedEmail: enteredEmail,
      amount: enteredAmount,
    };
    console.log(transactionData)

    await db.getDb().collection("transactions").insertOne(transactionData);

    res.render("200", { req: req });
  } catch (error) {
    console.error("Error during transaction:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/logout", (req, res) => {
  req.session.user = null;
  req.session.isAuthenticated = false;

  res.redirect("/login");
});

module.exports = router;
