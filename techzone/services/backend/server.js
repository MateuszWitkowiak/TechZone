import express from 'express';
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import orderRouter from './src/routes/orders.js';
import productsRouter from "./src/routes/products.js"

dotenv.config();
const app = express()
const PORT = 3001

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-type', 'Authorization']
}))
app.use(express.json())

const mongoUri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${process.env.MONGODB_DBNAME}`;

mongoose.connect(mongoUri)
  .then(() => {
    console.log("Połączono z bazą danych techzone");
  })
  .catch((error) => {
    console.error("Błąd połączenia z bazą danych", error);
});

app.use("/api/order", orderRouter)
app.use("/api/products", productsRouter)

app.listen(PORT, () => {
    console.log(`Aplikacja słucha na porcie ${PORT}`)
})