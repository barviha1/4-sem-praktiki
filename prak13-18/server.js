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
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

let subscriptions = [];
const reminders = new Map();

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Клиент подключён:', socket.id);
  socket.on('newTask', (task) => {
    io.emit('taskAdded', task);

    const payload = JSON.stringify({
      title: 'Новая задача',
      body: task.text
    });
    subscriptions.forEach(sub => {
      webpush.sendNotification(sub, payload).catch(err => {
        console.error('Push error:', err);
      });
    });
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
        webpush.sendNotification(sub, payload).catch(err =>
          console.error('Push error:', err));
      });
      reminders.set(id, { timeoutId: null, text, reminderTime });
    }, delay);

    reminders.set(id, { timeoutId, text, reminderTime });
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключён:', socket.id);
  });
});

app.post('/subscribe', (req, res) => {
  subscriptions.push(req.body);
  res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
  res.status(200).json({ message: 'Подписка удалена' });
});

app.post('/snooze', (req, res) => {
  const reminderId = parseInt(req.query.reminderId, 10);
  console.log(` Получен запрос на откладывание ID: ${reminderId}`);
  
  if (!reminderId || !reminders.has(reminderId)) {
    console.log('Напоминание не найдено');
    return res.status(404).json({ error: 'Reminder not found' });
  }

  const reminder = reminders.get(reminderId);
  
  clearTimeout(reminder.timeoutId);

  const newDelay = 10 * 1000;

  const newTimeoutId = setTimeout(() => {
    console.log(`Таймер сработал! Отправляем Push для ID: ${reminderId}`);
    const payload = JSON.stringify({
      title: 'Напоминание (отложено)',
      body: reminder.text,
      reminderId: reminderId
    });

    subscriptions.forEach(sub => {
      webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
    });
    reminders.delete(reminderId);
  }, newDelay);
  reminders.set(reminderId, { timeoutId: newTimeoutId, text: reminder.text });
  
  res.status(200).json({ message: 'Snoozed' });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});