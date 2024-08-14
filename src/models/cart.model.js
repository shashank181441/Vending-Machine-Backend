import mongoose, {Schema} from "mongoose";


const cartSchema = new Schema(
    {
        productId: {
            type: Schema.Types.ObjectId, //cloudinary url
            ref: "Product"
        },
        count: {
            type: Number, default: 1
        },
    }, 
    {
        timestamps: true
    }
)



export const Cart = mongoose.model("Cart", cartSchema)