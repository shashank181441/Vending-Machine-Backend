import { Router } from "express";
import { addToCart, deleteFromCart, getAllCartItems, getCartCount, initiatePayment, listenForPayment } from "../controllers/cart.controller.js";

import {upload} from "../middlewares/multer.middleware.js"

const router = Router()

router.route("/")
.get(getAllCartItems)

router.route("/:id")
.delete(deleteFromCart)

router.route("/:productId")
.post(addToCart)

router.route("/count").get(getCartCount)


router.route('/payment/initiate').post(initiatePayment);
router.route('/payment/listen').post(listenForPayment);



export default router