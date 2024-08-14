import { Product } from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const addProduct = asyncHandler( async (req, res) => {
    const { title, description, stock, price, category, productNumber } = req.body;
    
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;   

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail file is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail) {
        throw new ApiError(400, "thumbnail file is required")
    }

    const product = await Product.create({
        title, category, productNumber,
        thumbnail: thumbnail.url,
        description, stock, price 
    })

    const createdProduct = await Product.findById(product._id)

    if (!createdProduct) {
        throw new ApiError(500, "Something went wrong while adding the product")
    }

    return res.status(201).json(
        new ApiResponse(200, createdProduct, "Product added Successfully")
    )
})

const deleteProduct = asyncHandler( async (req, res) => {
    const {id} = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
        res.status(404).json({ message: "Product not found" });
        throw new ApiError(500, "Something went wrong while deleting the product");
    }

    return res.status(201).json(
        new ApiResponse(200, product, "Product deleted Successfully")
    )
})

const getAllProducts = asyncHandler(async (req,res)=>{
    const products = await Product.find({})
    return res.status(201).json(
        new ApiResponse(200, products, "Products fetched Successfully")
    )
})

export {
    addProduct, deleteProduct, getAllProducts
}