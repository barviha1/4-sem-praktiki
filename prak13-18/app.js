const socket = io();

document.addEventListener('DOMContentLoaded', () => {

    loadContent('home');

    document.getElementById('home-btn').addEventListener('click', () => loadContent('home'));
    document.getElementById('about-btn').addEventListener('click', () => loadContent('about'));

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker зарегистрирован'))
            .catch(err => console.error('Ошибка SW', err));
    }

    const enableBtn = document.getElementById('enable-push');
    const disableBtn = document.getElementById('disable-push');

    if (enableBtn && disableBtn) {

        navigator.serviceWorker.ready.then(async (reg) => {
            const sub = await reg.pushManager.getSubscription();

            if (sub) {
                enableBtn.style.display = 'none';
                disableBtn.style.display = 'inline-block';
            }
        });

        enableBtn.onclick = async () => {

            if (Notification.permission === 'denied') {
                alert('Разреши уведомления в настройках браузера');
                return;
            }

            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') return;
            }

            await subscribeToPush();

            enableBtn.style.display = 'none';
            disableBtn.style.display = 'inline-block';
        };

        disableBtn.onclick = async () => {
            await unsubscribeFromPush();

            disableBtn.style.display = 'none';
            enableBtn.style.display = 'inline-block';
        };
    }
});

async function loadContent(page) {
    try {
        const response = await fetch(`/content/${page}.html`);
        const html = await response.text();

        document.getElementById('app-content').innerHTML = html;

        document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${page}-btn`).classList.add('active');

        if (page === 'home') {
            initNotes();
        }

    } catch (err) {
        console.error('Ошибка загрузки:', err);
    }
}

function initNotes() {
    const form = document.getElementById('note-form');
    const input = document.getElementById('note-input');

    const reminderForm = document.getElementById('reminder-form');
    const reminderText = document.getElementById('reminder-text');
    const reminderTime = document.getElementById('reminder-time');

    const list = document.getElementById('notes-list');

    function loadNotes() {
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');

        list.innerHTML = notes.map(note => {
            let reminderInfo = '';

            if (note.reminder) {
                const date = new Date(note.reminder);
                reminderInfo = `<br><small style="color:red;">⏰ ${date.toLocaleString()}</small>`;
            }

            return `
                <li class="card" style="margin-bottom: 0.5rem; padding: 0.5rem;">
                    ${note.text}
                    ${reminderInfo}
                </li>
            `;
        }).join('');
    }

    function addNote(text, reminderTimestamp = null) {
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');

        const newNote = {
            id: Date.now(),
            text,
            reminder: reminderTimestamp
        };

        notes.push(newNote);
        localStorage.setItem('notes', JSON.stringify(notes));

        loadNotes();

        if (reminderTimestamp) {
            socket.emit('newReminder', {
                id: newNote.id,
                text,
                reminderTime: reminderTimestamp
            });
        } else {
            socket.emit('newTask', {
                text,
                timestamp: Date.now()
            });
        }
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const text = input.value.trim();

        if (text) {
            addNote(text);
            input.value = '';
        }
    });

    reminderForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const text = reminderText.value.trim();
        const datetime = reminderTime.value;

        if (text && datetime) {
            const timestamp = new Date(datetime).getTime();

            if (timestamp > Date.now()) {
                addNote(text, timestamp);

                reminderText.value = '';
                reminderTime.value = '';
            } else {
                alert('Дата должна быть в будущем');
            }
        }
    });

    loadNotes();
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);

    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

async function subscribeToPush() {
    try {
        const reg = await navigator.serviceWorker.ready;

        const existing = await reg.pushManager.getSubscription();
        if (existing) return;

        const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
                'BKWIcjW7w-uk3zG3p8cxeuH228iSHsh-oXlsbKLJtrxu7CQUdWyH8T-XusGjT5OdG3zWC9z57mnQ7eCEqbjWe14'
            )
        });

        await fetch('/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub)
        });

        console.log('Подписка есть');

    } catch (err) {
        console.error('Ошибка подписки:', err);
    }
}

async function unsubscribeFromPush() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();

    if (sub) {
        await fetch('/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint })
        });

        await sub.unsubscribe();
        console.log('Отписка');
    }
}