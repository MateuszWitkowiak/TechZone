import express from 'express';
import Product from '../models/Product.js';
import checkJwt from "../middleware/checkJwt.js";

const router = express.Router();

router.get("/getProduct/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({message: "Product not found"})
        }
        res.status(200).json(product);
    } catch (err) {
        console.log("BŁĄD BACKEND:", err)
        res.status(500).json({ message: "Server error: getting product unavailable"})
    }
})

router.get("/getAll", async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (err) {
        console.error("BŁĄD BACKEND:", err);
        res.status(500).json({ message: "Server error: getting all products unavailable" });
    }
});

router.post("/addProduct", checkJwt, async (req, res) => {
    try {
        if (!req.user?.realm_access?.roles?.includes("admin")) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const { name, description, price, category, brand, images, stock, isActive } = req.body;

        if (!name || !description || !price || !category || !brand || stock === undefined) {
            return res.status(400).json({ message: "Brakuje wymaganych pól" });
        }

        const newProduct = new Product({
            name,
            description,
            price,
            category,
            brand,
            images: images || [],
            stock,
            isActive: isActive !== undefined ? isActive : true
        });

        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error: Adding product unavailable" });
    }
});

router.delete("/delete/:id", checkJwt, async (req, res) => {
    try {
        if (!req.user?.realm_access?.roles?.includes("admin")) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const productId = req.params.id;
        const deletedProduct = await Product.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json({ message: "Product deleted", product: deletedProduct });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error: deleting product unavailable" });
    }
});

router.put("/update/:id", checkJwt, async (req, res) => {
  try {
    if (!req.user?.realm_access?.roles?.includes("admin")) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const productId = req.params.id;
    const { name, description, price, category, brand, images, stock, isActive } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
          name,
          description,
          price,
          category,
          brand,
          images: images || [],
          stock,
          isActive: isActive !== undefined ? isActive : true
        },
        { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(updatedProduct);
  } catch (err) {
    return res.status(500).json({message: "Server error: Cannot update product"})
  }
})

export default router;