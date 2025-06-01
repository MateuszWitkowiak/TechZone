import express from "express";
import Order from "../models/Order.js"
const router = express.Router();
import mongoose from 'mongoose';
import Product from "../models/Product.js";
import checkJwt from "../middleware/checkJwt.js";

// pobierz wszystkie zamówienia (dla admina)
router.get("/getAll", checkJwt, (req, res, next) => {
    if (!req.user?.realm_access?.roles?.includes("admin")) {
        return res.status(403).json({ message: "Forbidden" });
    }
    next();
}, async (req, res) => {
    try {
        const orders = await Order.find().populate("userId", "email username").populate("products.productId", "name");;
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
        const orders = await Order.find({ userId }).populate('products.productId');
        res.status(200).json(orders);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error: getting user orders unavailable" });
    }
});

router.post("/addOrder", checkJwt, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user.sub;
        const { products } = req.body;
        if (!userId || !products) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "userId and products are required" });
        }

        // Pobierz produkty z bazy z blokadą na czas transakcji
        const productIds = products.map(p => p.productId);
        const productsFromDb = await Product.find({ _id: { $in: productIds } }).session(session);

        let total = 0;
        // Sprawdź dostępność i wylicz sumę
        for (const item of products) {
            const prod = productsFromDb.find(p => p._id.toString() === item.productId);
            if (!prod) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ message: `Produkt nie istnieje: ${item.productId}` });
            }
            if (prod.stock < item.quantity) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: `Brak odpowiedniej ilości produktu: ${prod.name}` });
            }
            total += prod.price * item.quantity;
        }

        // Zmniejsz stan magazynowy
        for (const item of products) {
            const result = await Product.updateOne(
                { _id: item.productId, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } },
                { session }
            );
            if (result.modifiedCount === 0) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: `Nie udało się zaktualizować stanu magazynowego produktu: ${item.productId}` });
            }
        }

        const newOrder = new Order({
            userId: req.user.sub,
            userEmail: req.user.email,
            userName: req.user.preferred_username,
            products,
            total
        });

        await newOrder.save({ session });
        await session.commitTransaction();
        session.endSession();

        res.status(201).json(newOrder);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.log(err);
        res.status(500).json({ message: "Server error: adding Order unavailable" });
    }
});
router.put("/updateStatus/:orderid", checkJwt, async (req, res) => {
    if (!req.user?.realm_access?.roles?.includes("admin")) {
        return res.status(403).json({ message: "Forbidden" });
    }

    const orderId = req.params.orderid;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: "Brak nowego statusu w żądaniu!" });
    }

    try {
        console.log("Aktualizuję zamówienie o _id:", orderId);
        const order = await Order.findByIdAndUpdate(
            new mongoose.Types.ObjectId(orderId),
            { status },
            { new: true }
        );
        console.log("Wynik:", order);

        if (!order) {
            return res.status(404).json({ message: "Nie znaleziono zamówienia!" });
        }

        res.status(200).json(order);
    } catch (err) {
        console.error("Błąd serwera przy aktualizacji statusu:", err);
        res.status(500).json({ message: "Błąd serwera przy aktualizacji statusu." });
    }
});

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