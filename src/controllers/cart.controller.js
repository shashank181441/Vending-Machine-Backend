
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from 'crypto';
import axios from 'axios';
import WebSocket from 'ws';


import {Cart} from "../models/cart.model.js"
import { Product } from "../models/product.model.js";

const addToCart = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    // Find the product in the cart
    const existingProduct = await Cart.findOne({ productId });
    const addedProduct = await Product.findById(productId);

    if (!addedProduct) {
        throw new ApiError(404, "Product not found");
    }

    if (existingProduct) {
        if (addedProduct.stock === 0) {
            throw new ApiError(400, "We don't have enough stock remaining");
        }

        // If the product is already in the cart, update the count
        existingProduct.count += 1;
        const updatedProductInCart = await existingProduct.save();

        if (!updatedProductInCart) {
            throw new ApiError(500, "Something went wrong while updating the product count in the cart");
        }

        // Decrease the stock value in the product table by 1
        addedProduct.stock -= 1;
        const updatedProduct = await addedProduct.save();

        if (!updatedProduct) {
            throw new ApiError(500, "Something went wrong while updating the product stock");
        }

        return res.status(200).json(
            new ApiResponse(200, updatedProductInCart, "Product count updated in Cart successfully")
        );
    } else {
        // If the product is not in the cart, add it to the cart
        const addedToCart = await Cart.create({
            productId,
            count: 1
        });

        if (!addedToCart) {
            throw new ApiError(500, "Something went wrong while adding the product to cart");
        }

        // Decrease the stock value in the product table by 1
        addedProduct.stock -= 1;
        const updatedProduct = await addedProduct.save();

        if (!updatedProduct) {
            throw new ApiError(500, "Something went wrong while updating the product stock");
        }

        return res.status(201).json(
            new ApiResponse(201, {addedToCart, updatedProduct}, "Product added to Cart successfully")
        );
    }
});

const deleteFromCart = asyncHandler(async (req, res) => {
    const cartId = req.params.id;

    // Find the product in the cart before deleting
    const productInCart = await Cart.findById(cartId);

    if (!productInCart) {
        throw new ApiError(404, "Product not found in the cart");
    }

    // Find the corresponding product in the Product table
    const product = await Product.findById(productInCart.productId);

    if (!product) {
        throw new ApiError(404, "Product not found in the product table");
    }

    // Increase the stock by the count of the product in the cart
    product.stock += productInCart.count;
    const updatedProduct = await product.save();

    if (!updatedProduct) {
        throw new ApiError(500, "Something went wrong while updating the product stock");
    }

    // Delete the product from the cart
    const deletedFromCart = await Cart.findByIdAndDelete(cartId);

    if (!deletedFromCart) {
        throw new ApiError(500, "Something went wrong while deleting the product from the cart");
    }

    return res.status(200).json(
        new ApiResponse(200, deletedFromCart, "Product deleted from Cart Successfully")
    );
});

const getAllCartItems = asyncHandler(async (req, res) => {
    const cartItems = await Cart.aggregate([
        {
            $lookup: {
                from: "products", // The collection name of the products
                localField: "productId",
                foreignField: "_id",
                as: "productDetails"
            }
        },
        {
            $unwind: "$productDetails" // To deconstruct the array and bring the product details inline
        }
    ]);

    if (!cartItems) {
        throw new ApiError(500, "Something went wrong while fetching cart items");
    }

    return res.status(200).json(
        new ApiResponse(200, cartItems, "Products fetched from Cart successfully")
    );
});

const getCartCount = asyncHandler(async (req, res)=>{
    const cartCount = await Cart.countDocuments()
    if (!cartCount){
        throw new ApiError(500, "Something went wrong while getting cart count")
    }
    return res.status(201).json(
        new ApiResponse(200, cartCount, "Products count fetched from Cart Successfully")
    )
})



const initiatePayment = async (req, res) => {
    const amount = req.body.amount;

    const remarks1 = req.body.remarks1 || "test 1";
    const remarks2 = req.body.remarks2 || "test 2";
    const secret = process.env.SECRET;
    const merchantCode = process.env.MERCHANT_CODE;
    const username = process.env.USERNAME;
    const password = process.env.PASSWORD;

    const prn = Date.now();
    const data = `${amount},${merchantCode},${prn},${remarks1},${remarks2},`;

    // Function to generate SHA512 HMAC
    function generateSha512Hmac(data, secret) {
        return crypto.createHmac('sha512', secret).update(data).digest('hex');
    }

    const dataValidation = generateSha512Hmac(data, secret);

    try {
        const response = await axios.post('https://merchantapi.fonepay.com/api/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrDownload', {
            amount: amount,
            remarks1: remarks1,
            remarks2: remarks2,
            prn: prn,
            merchantCode: merchantCode,
            dataValidation: dataValidation,
            username: username,
            password: password
        });

        // After successful API response, initiate WebSocket connection
        const wsUrl = response.data.merchantWebSocketUrl;
        
        // Send the QR Code and WebSocket URL to the frontend
        res.json({
            qrMessage: response.data.qrMessage,
            wsUrl: wsUrl,
            prn: prn // Send PRN back to the client
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error initiating payment.');
    }
};

const listenForPayment = (req, res) => {
    const wsUrl = req.body.wsUrl;

    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
        console.log('WebSocket connection opened');
    });

    ws.on('message', (message) => {
        const decodedMessage = message.toString('utf8');
        try {
            const jsonData = JSON.parse(decodedMessage);
            console.log('Decoded WebSocket message:', jsonData);
            res.json(jsonData); // Send the decoded WebSocket message to the client
        } catch (error) {
            console.error('Failed to parse WebSocket message as JSON:', error);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
};












export {
    addToCart, deleteFromCart, getAllCartItems, getCartCount, initiatePayment, listenForPayment
}