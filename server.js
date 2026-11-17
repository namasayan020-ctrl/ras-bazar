const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Frontend files serve karne ke liye
app.use(express.static(__dirname));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// MongoDB Connection (Render par env variable ya direct string daal sakte ho)
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://namasayan020_db_user:1Hd6Fj99yEk13NVM@cluster0.d0k9xal.mongodb.net/";

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully!'))
    .catch((err) => console.error('MongoDB Connection Error:', err));

// Order Schema & Model for Permanent Database Storage
const orderSchema = new mongoose.Schema({
    orderId: String,
    customerName: String,
    items: Array,
    totalAmount: Number,
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Real-time Socket.io Connection
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Customer naya order bhejega toh DB mein save hoga aur sabko broadcast hoga
    socket.on('newOrder', async (orderData) => {
        try {
            const newOrder = new Order(orderData);
            await newOrder.save();
            console.log('Order saved to Database & Broadcasted:', orderData.orderId);
            io.emit('orderBroadcast', orderData);
        } catch (err) {
            console.error('Error saving order:', err);
        }
    });

    // Order status update (Shop/Delivery update karega)
    socket.on('updateOrderStatus', async (statusData) => {
        try {
            await Order.findOneAndUpdate(
                { orderId: statusData.orderId }, 
                { status: statusData.status }
            );
            io.emit('orderStatusChanged', statusData);
        } catch (err) {
            console.error('Error updating status:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`RAS BAZAR Server running on port ${PORT}`);
});
