const mongoose = require("mongoose");

/* -------------------------------
    items[]
--------------------------------*/
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
    required: true,
  },
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "merchant",   // or "User" if merchant is stored inside User
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
  type: String,
  enum: [
    "PLACED",
    "PACKAGED",
    "OUT_FOR_SHIPMENT",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "RETURNED"
  ],
  default: "PLACED",
},
  trackingId: {
    type: String,
  },
});

/* -------------------------------
   MAIN ORDER SCHEMA
--------------------------------*/
const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    // ✅ multiple products inside one order
    items: [orderItemSchema],

    totalAmount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },

    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      landmark: { type: String },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },

    // ✅ Razorpay order ID (or system ID)
    razorpayOrderId: {
      type: String,
    },

    placedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

module.exports = mongoose.model("Order", orderSchema);
