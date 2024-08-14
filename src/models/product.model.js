import mongoose, {Schema} from "mongoose";


const productSchema = new Schema(
    {
        thumbnail: {
            type: String, //cloudinary url
            required: true
        },
        productNumber: {
            type: Number,
            required: true,
            unique: true
        },
        title: {
            type: String, 
            required: true, unique: true
        },
        description: {
            type: String, 
            required: true
        },
        stock: {
            type: Number, 
            default: 0
        },
        price: {
            type: Number, 
            required: true
        },
        category: {
            type: String, 
            enum: ['beverage', 'snacks', 'chocolate'],
            // required: true
        }
    }, 
    {
        timestamps: true
    }
)



export const Product = mongoose.model("Product", productSchema)