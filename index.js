require('events').EventEmitter.defaultMaxListeners = 20;


const express = require("express");
const session = require("express-session");

const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser")



const router = require("./routes/user");
const merchantRouter = require("./routes/merchant");
const productRouter = require("./routes/product");
const homeRoutes = require('./routes/home');

const orderRouter = require("./routes/order");
const cartRoutes = require('./routes/cart');
const { attachUser } = require("./services/attachUser");


const { checkForAuthenticationCookie } = require("./middlewares/authentication");

const app = express();
const port = process.env.PORT;

const Product = require("./models/Product"); // adjust path if needed
require('events').EventEmitter.defaultMaxListeners = 20;
mongoose.connect("mongodb://localhost:27017/ecommerce").then((e) => console.log("MongoDB Connected"));

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "IAMABIGMAN",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));


app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
app.use(express.static(path.resolve('./public')))
// app.use(express.static(path.resolve('./views/partials')))
app.use('/uploads', express.static(path.resolve('./public/uploads/products/')));
app.use(attachUser);





app.get("/", async (req, res) => {
    try {
        const products = await Product.find().populate("createdBy");


        if (!products || products.length === 0) {
            return res.render("home", {
                user: req.user,
                products: [],
                message: "No products available right now.",
            });
        }

        else {
            // res.render("home", {
            //     user: res.locals.user || res.locals.merchant,
            //     isMerchant: res.locals.isMerchant,
            //     products,
            // });
            res.render("home", {
                user: res.locals.user,
                isMerchant: res.locals.isMerchant,
                products,
                message: products.length ? null : "No products available right now."
            });
        }

    } catch (err) {
        console.error("Error loading products for homepage:", err);
        res.status(500).send("Something went wrong");
    }
});

app.use("/user", router);
app.use("/merchant", merchantRouter);
app.use("/product", productRouter);
app.use("/order", orderRouter);


app.use("/cart", cartRoutes);
app.use('/', homeRoutes);

app.listen(port, () => console.log(`port started at ${port}`));