const CACHE_NAME = 'tasks-app-shell-v4';
const DYNAMIC_CACHE_NAME = 'dynamic-content-v3';

const ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    '/content/home.html',
    '/content/about.html',
    '/icons/favicon-16x16.png',
    '/icons/favicon-32x32.png',
    '/icons/favicon-48x48.png',
    '/icons/favicon-128x128.png',
    '/icons/favicon-256x256.png',
    '/icons/favicon-512x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('notificationclick', (event) => {
    const reminderId = event.notification.data?.reminderId;

    if (event.action === 'snooze' && reminderId) {
        event.waitUntil(
            fetch(`http://localhost:3001/snooze?reminderId=${reminderId}`, {
                method: 'POST'
            })
        );
    }
    event.notification.close();
});

self.addEventListener('push', (event) => {
    let data = { title: 'Новое уведомление', body: '', reminderId: null };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            const text = event.data.text();
            console.warn('Получено не-JSON уведомление:', text);
            
            data = {
                title: 'Уведомление',
                body: text,
                reminderId: null
            };
        }
    }
    
    const options = {
        body: data.body,
        icon: '/icons/favicon-128x128.png',
        badge: '/icons/favicon-48x48.png',
        data: { reminderId: data.reminderId }
    };
    
    if (data.reminderId) {
        options.actions = [
            { action: 'snooze', title: 'Отложить на 5 минут' }
        ];
    }
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});