import { Router } from "express";
import { addProduct, deleteProduct, getAllProducts } from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()

router.route("/")
.post(upload.fields([
    {
        name: "thumbnail",
        maxCount: 1
    }, 
]), addProduct)
.get(getAllProducts)

router.route("/:id").delete(deleteProduct)

export default router