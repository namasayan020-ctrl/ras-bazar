const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Frontend HTML files ko serve karne ke liye
app.use(express.static(__dirname));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// Real-time Socket.io Connection
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Customer se naya order sunna
    socket.on('newOrder', (orderData) => {
        console.log('New Order Received:', orderData);
        io.emit('orderBroadcast', orderData);
    });

    // Order status update sunna (Accepted / Dispatched / Delivered)
    socket.on('updateOrderStatus', (statusData) => {
        io.emit('orderStatusChanged', statusData);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`RAS BAZAR Server running on port ${PORT}`);
});
