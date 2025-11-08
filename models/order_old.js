// const mongoose = require("mongoose");

// const orderSchema = new mongoose.Schema({
//     product: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Product",
//         required: true,
//     },
//     buyer: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User", // or "Customer" if you're using a different model
//         required: true,
//     },
//     quantity: {
//         type: Number,
//         default: 1,
//         min: 1,
//     },
//     totalAmount: {
//         type: Number,
//         required: true,
//     },
//     status: {
//         type: String,
//         enum: ["PLACED", "SHIPPED", "DELIVERED", "CANCELLED"],
//         default: "PLACED",
//     },
//     shippingAddress: [{
//         street: {type: String , required: true},
//         city: {type: String , required: true},
//         state: {type: String , required: true},
//         landmark:{type: String},
//         zipCode: {type: String , required: true},
//         country: {type: String , required: true},
//     }],
//     placedAt: {
//         type: Date,
//         default: Date.now,
//     },
// }, {
//     timestamps: true, // adds createdAt and updatedAt fields
// });

// const Order = mongoose.model("Order", orderSchema);
// module.exports = Order;
