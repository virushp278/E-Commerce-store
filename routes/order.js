const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const Product = require("../models/Product");
const User = require("../models/user");
const { requireUser } = require("../services/authentication");
const razorpay = require("..services/razorpay");

// ------------------ Place a new order ------------------
router.post("/buy", requireUser, async (req, res) => {
    try {
        let { productId, quantity, shippingAddress } = req.body;

        if (!Array.isArray(productId)) {
            productId = [productId];
            quantity = [quantity];
        }

        for (let i = 0; i < productId.length; i++) {
            const product = await Product.findById(productId[i]);
            if (!product) continue;

            const totalAmount = product.price * quantity[i];

            const newOrder = new Order({
                product: productId[i],
                buyer: req.user._id,
                quantity: quantity[i],
                totalAmount,
                shippingAddress: [shippingAddress],
            });

            await newOrder.save();
        }

        await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });

        res.redirect("/orders"); // Redirect to order history page
    } catch (err) {
        console.error("Error placing order:", err);
        res.status(500).send("Something went wrong while placing the order.");
    }
});

// ------------------ Checkout page ------------------
router.get("/checkout", requireUser, async (req, res) => {
    try {
        const { productId } = req.query; // check if single product

        const user = await User.findById(req.user._id).populate("cart.product");

        let itemsToBuy = [];

        if (productId) {
            const product = await Product.findById(productId);
            if (!product) return res.status(404).send("Product not found");

            itemsToBuy = [{
                _id: product._id,
                productName: product.productName,
                price: product.price,
                quantity: 1,
                image: product.ProductImage
            }];
        } else {
            // Cart checkout
            if (!user.cart || user.cart.length === 0) {
                return res.redirect("/cart");
            }

            itemsToBuy = user.cart
                .filter(item => item.product)
                .map(item => ({
                    _id: item.product._id,
                    productName: item.product.productName,
                    price: item.product.price,
                    quantity: item.quantity,
                    image: item.product.ProductImage
                }));
        }

        res.render("buy", { cartItems: itemsToBuy, user });
    } catch (err) {
        console.error("Error during checkout:", err);
        res.status(500).send("Server error during checkout");
    }
});


// ------------------ View all user orders ------------------
router.get("/your-orders", requireUser, async (req, res) => {
    try {
        const orders = await Order.find({ buyer: req.user._id })
            .populate("product")
            .sort({ placedAt: -1 });

        res.render("user-orders", {
            orders,
            user: req.user
        });
    } catch (err) {
        console.error("Error fetching user orders:", err);
        res.status(500).send("Error fetching your orders.");
    }
});

// // ------------------for Buying a single product ------------------
// router.get("/buy/:productId", requireUser, async (req, res) => {
//     try {
//         const { productId } = req.params;

//         const product = await Product.findById(productId);
//         if (!product) return res.status(404).send("Product not found");

//         const user = await User.findById(req.user._id);

//         // Redirect to checkout page with query param
//         return res.redirect(`/order/checkout?productId=${productId}`);
//     } catch (err) {
//         console.error(err);
//         res.status(500).send("Server error.");
//     }
// });


// ------------------- Razorpay integration ------------------

router.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    // Razorpay expects amount in paise (₹1 = 100 paise)
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
});
 /////////////


 // ------------------ Cash on Delivery ------------------
router.post("/place-cod", requireUser, async (req, res) => {
  try {
    const { address, amount } = req.body;
    // Create order document directly
    const order = new Order({
      buyer: req.user._id,
      totalAmount: amount,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      shippingAddress: address,
    });
    await order.save();

    res.json({ success: true, message: "COD order placed successfully" });
  } catch (err) {
    console.error("Error placing COD order:", err);
    res.status(500).json({ success: false });
  }
});


// ------------------ Razorpay Online Payment ------------------
router.post("/create-razorpay", requireUser, async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100, // paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({ success: false });
  }
});


// ------------------ Verify Payment ------------------
const crypto = require("crypto");

router.post("/verify-payment", requireUser, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, address } = req.body;
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_ID_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (expectedSign === razorpay_signature) {
      // payment verified → save order
      const order = new Order({
        buyer: req.user._id,
        totalAmount: 500, // dynamic later
        paymentMethod: "Online",
        paymentStatus: "Paid",
        shippingAddress: address,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });
      await order.save();
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Invalid signature" });
    }
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ success: false });
  }
});


module.exports = router;
