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

app.post('/', (req, res) => {
    try {
        const { name, price, quantity } = req.body;

        const newProduct = new Product({
            name: name,
            price: price,
            quantity: quantity
        });

        newProduct.save((err) => {
            if (err) {
                res.json({
                    status: "error",
                    message: err,
                });
            } else {
                res.json({
                    status: "success",
                    message: 'Updated Successfully',
                    data: newProduct
                });
            }
        });
    } catch (error) {
        // Handle exceptions or errors here
        res.json(error)
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

        // Assuming you have a Product model defined
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

        // Check if the user has an existing cart, or create one if not
        let userCart = await Cart.findOne({ userId: req.session.userId });

        if (!userCart) {
            userCart = new Cart({
                userId: req.session.userId, // Assuming you use sessions for user identification
                items: [],
            });
        }

        // Add the product to the user's cart
        userCart.items.push({ product: productId, quantity });

        // Update the product's stock
        product.quantity -= quantity;
        await product.save();

        // Save the user's cart
        await userCart.save();

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

app.get('/cart', async (req, res) => {
    try {
        // Find the user's cart and populate the 'items.product' field to get product information
        const userCart = await Cart.findOne({ userId: req.session.userId }).populate('items.product');

        if (!userCart) {
            return res.status(404).json({
                status: "error",
                message: "Cart not found.",
            });
        }

        res.status(200).json({
            status: "success",
            message: "Cart items loaded successfully.",
            data: userCart.items, // Send the cart items with product information
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

app.delete('/cart/:productId', async (req, res) => {
    try {
        const productIdToRemove = req.params.productId;

        // Find the user's cart and update it to remove the specified product
        const userCart = await Cart.findOne({ userId: req.session.userId });

        if (!userCart) {
            return res.status(404).json({
                status: "error",
                message: "Cart not found.",
            });
        }

        // Find the index of the product to remove in the items array
        const itemIndexToRemove = userCart.items.findIndex(item => item.product == productIdToRemove);

        if (itemIndexToRemove === -1) {
            return res.status(404).json({
                status: "error",
                message: "Product not found in the cart.",
            });
        }

        // Remove the product from the items array
        userCart.items.splice(itemIndexToRemove, 1);

        // Save the updated cart
        await userCart.save();

        res.status(200).json({
            status: "success",
            message: "Product removed from the cart successfully.",
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


app.get('/cart/total', async (req, res) => {
    try {
        // Find the user's cart and populate the 'items.product' field to get product information
        const userCart = await Cart.findOne({ userId: req.session.userId }).populate('items.product');

        if (!userCart) {
            return res.status(404).json({
                status: "error",
                message: "Cart not found.",
            });
        }

        // Calculate the total price
        let total = 0;
        for (const item of userCart.items) {
            total += item.quantity * item.product.price;
        }

        res.status(200).json({
            status: "success",
            message: "Total price calculated successfully.",
            total: total,
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






app.listen(port,()=>{
    console.log(`Server is running at http://localhost:${port}`)
})    


