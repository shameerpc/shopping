// models/Cart.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    userId: String, // This can be your user ID or session identifier
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: Number,
        }
    ],
});

module.exports = mongoose.model('CartItem', cartItemSchema);
