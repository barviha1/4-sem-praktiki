const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const vapidKeys = {
    publicKey: 'BKWIcjW7w-uk3zG3p8cxeuH228iSHsh-oXlsbKLJtrxu7CQUdWyH8T-XusGjT5OdG3zWC9z57mnQ7eCEqbjWe14',
    privateKey: 'iBihSBA6eLZzs6328mONGhhoP24UugDh9cGR9eUoyV4'
};

webpush.setVapidDetails(
    'mailto:test@test.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

let subscriptions = [];

const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
    socket.on('newTask', (task) => {

        io.emit('taskAdded', task);

        const payload = JSON.stringify({
            title: 'Новая задача',
            body: task.text
        });

        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload)
                .catch(err => {
                    console.error('Push error:', err);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        const index = subscriptions.indexOf(sub);
                        if (index !== -1) subscriptions.splice(index, 1);
                    }
                });
        });
    });

    socket.on('disconnect', () => {
    });
});

app.post('/subscribe', (req, res) => {
    subscriptions.push(req.body);
    res.json({ message: 'OK' });
});

app.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    subscriptions = subscriptions.filter(s => s.endpoint !== endpoint);
    res.json({ message: 'Removed' });
});

server.listen(3001, () => {
    console.log('Server started on http://localhost:3001');
});