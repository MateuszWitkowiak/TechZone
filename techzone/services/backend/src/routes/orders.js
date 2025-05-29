import express from "express";
import Order from "../models/Order.js"
const router = express.Router();

import checkJwt from "../middleware/checkJwt.js";

// pobierz wszystkie zamówienia (dla admina)
router.get("/getAll", checkJwt, (req, res, next) => {
    if (!req.user?.realm_access?.roles?.includes("admin")) {
        return res.status(403).json({ message: "Forbidden" });
    }
    next();
}, async (req, res) => {
    try {
        const orders = await Order.find();
        res.status(200).json(orders);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error: getting all orders unavailable" });
    }
});

// Pobierz zamówienia aktualnie zalogowanego użytkownika
router.get("/getUserOrders", checkJwt, async (req, res) => {
    try {
        const userId = req.user.sub;
        const orders = await Order.find({ userId });
        res.status(200).json(orders);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error: getting user orders unavailable" });
    }
});

// Dodanie zamówienia
router.post("/addOrder", checkJwt, async (req, res) => {
    try {
        const userId = req.user.sub;
        const { products } = req.body;
        if (!userId || !products) {
            return res.status(400).json({ message: "userId and products are required" });
        }

        const newOrder = new Order({
            userId,
            products
        });

        await newOrder.save();
        res.status(201).json(newOrder)
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error: adding Order unavailable"})
    }
})

// usuń zamówienie z bazy - tylko admin
router.delete("/delete/:id", checkJwt, async (req, res) => {
    if (!req.user?.realm_access?.roles?.includes("admin")) {
        return res.status(403).json({ message: "Forbidden" });
    }

    try {
        const orderId = req.params.id;
        const deletedOrder = await Order.findByIdAndDelete(orderId);

        if (!deletedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ message: "Order deleted", order: deletedOrder });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error: deleting order unavailable" });
    }
});

export default router;