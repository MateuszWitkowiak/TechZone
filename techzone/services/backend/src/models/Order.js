import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userEmail: { type: String },
    userName: { type: String },
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: Number,
    }],
    status: { type: String, default: 'pending' },
    total: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Order', orderSchema);