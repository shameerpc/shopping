const express=require('express');
const mongoose = require('mongoose');
var bodyParser = require("body-parser");
const Product= require('./models/Product')
const CartItem = require('./models/Cart');
const port = process.env.PORT || 8081;
const app = express();


app.use(express.json());  // for parsing application/json

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

let cors = require('cors');
const Cart = require('./models/Cart');
app.use(cors())

mongoose.connect('mongodb://localhost:27017/shopingcart', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));

app.post('/products', async (req, res) => {
    try {
        const { name, price, quantity } = req.body;

        const newProduct = new Product({
            name: name,
            price: price,
            quantity: quantity
        });

        await newProduct.save(); // Use await to wait for the save operation to complete

        res.json({
            status: "success",
            message: 'Product added successfully',
            data: newProduct
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            message: "Internal server error.",
            error: error
        });
    }
});


app.get('/products', async (req, res) => {
    try {
        // Implement code to fetch all available products from the database
        const productList = await Product.find({}); // Assuming "Product" is the Mongoose model for your products

        res.json({
            status: "success",
            message: 'Product list loaded successfully',
            data: productList
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: 'Failed to retrieve product list',
            error: err
        });
    }
});

app.post('/cart', async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userIdentifier = 'user123'; // Replace with the actual user identifier

        // Check if the user has an existing cart; create one if not
        let userCart = await Cart.findOne({ userId: userIdentifier });

        if (!userCart) {
            userCart = new Cart({ userId: userIdentifier, items: [] });
        }

        // Check if the product exists
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                status: "error",
                message: "Product not found.",
            });
        }

        if (product.quantity < quantity) {
            return res.status(400).json({
                status: "error",
                message: "Insufficient stock for this product.",
            });
        }

        // Check if the product is already in the user's cart; if yes, update the quantity
        const existingCartItem = userCart.items.find(item => item.product.equals(productId));

        if (existingCartItem) {
            existingCartItem.quantity += quantity;
        } else {
            userCart.items.push({ product: productId, quantity });
        }

        // Save the user's cart
        await userCart.save();

        // Update the product's quantity
        product.quantity -= quantity;
        await product.save();

        res.status(200).json({
            status: "success",
            message: "Product added to the cart successfully.",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "Internal server error.",
            error: err,
        });
    }
});


app.get('/cart/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        const userCart = await Cart.findOne({ userId }).populate('items.product');

        if (!userCart) {
            return res.status(404).json({
                status: 'error',
                message: 'Cart not found.',
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Cart items loaded successfully.',
            data: userCart.items,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error.',
            error: err,
        });
    }
});

// Remove an item from the user's cart
app.delete('/cart/:userId/:productId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const productIdToRemove = req.params.productId;

        const userCart = await Cart.findOne({ userId });

        if (!userCart) {
            return res.status(404).json({
                status: 'error',
                message: 'Cart not found.',
            });
        }

        const itemIndexToRemove = userCart.items.findIndex(
            (item) => item.product.equals(productIdToRemove)
        );

        if (itemIndexToRemove === -1) {
            return res.status(404).json({
                status: 'error',
                message: 'Product not found in the cart.',
            });
        }

        userCart.items.splice(itemIndexToRemove, 1);

        await userCart.save();

        res.status(200).json({
            status: 'success',
            message: 'Product removed from the cart successfully.',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error.',
            error: err,
        });
    }
});




// Calculate the total price of items in the user's cart
app.get('/cart/total/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        const userCart = await Cart.findOne({ userId }).populate('items.product');

        if (!userCart) {
            return res.status(404).json({
                status: 'error',
                message: 'Cart not found.',
            });
        }

        let total = 0;
        for (const item of userCart.items) {
            total += item.quantity * item.product.price;
        }

        res.status(200).json({
            status: 'success',
            message: 'Total price calculated successfully.',
            total: total,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error.',
            error: err,
        });
    }
});






app.listen(port,()=>{
    console.log(`Server is running at http://localhost:${port}`)
})    


