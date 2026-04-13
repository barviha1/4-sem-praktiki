const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const reminders = new Map();

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
    console.log('Клиент подключен:', socket.id);

    socket.on('newTask', (task) => {
        console.log('Новая задача:', task.text);

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
        console.log('Клиент отключен:', socket.id);
    });

    socket.on('newReminder', (reminder) => {
        const { id, text, reminderTime } = reminder; 
        const delay = reminderTime - Date.now();
        if (delay <= 0) return;
        
        const timeoutId = setTimeout(() => {
            const payload = JSON.stringify({
                title: 'Напоминание!!!',
                body: text,
                reminderId: id
            });
            subscriptions.forEach(sub => {
                webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
            });
            reminders.delete(id);
        }, delay);

        reminders.set(id, { timeoutId, text, reminderTime });
    });
});

app.post('/subscribe', (req, res) => {
    console.log('Новая подписка, всего:', subscriptions.length + 1);
    subscriptions.push(req.body);
    res.json({ message: 'OK' });
});

app.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    subscriptions = subscriptions.filter(s => s.endpoint !== endpoint);
    console.log('Отписка, осталось:', subscriptions.length);
    res.json({ message: 'Removed' });
});

app.post('/snooze', (req, res) => {
    const reminderId = parseInt(req.query.reminderId, 10);
    if (!reminderId || !reminders.has(reminderId)) {
        return res.status(404).json({ error: 'Reminder not found' });
    }
    const reminder = reminders.get(reminderId);
    clearTimeout(reminder.timeoutId);
    
    const newDelay = 5 * 60 * 1000;
    
    const newTimeoutId = setTimeout(() => {
        const payload = JSON.stringify({
            title: 'Напоминание отложено',
            body: reminder.text,
            reminderId: reminderId
        });
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
        });
        reminders.delete(reminderId); 
    }, newDelay);
    
    reminders.set(reminderId, {
        timeoutId: newTimeoutId,
        text: reminder.text,
        reminderTime: Date.now() + newDelay
    });
    res.status(200).json({ message: 'Reminder snoozed for 5 minutes' });
});

server.listen(3001, () => {
    console.log('Server started on http://localhost:3001');
});