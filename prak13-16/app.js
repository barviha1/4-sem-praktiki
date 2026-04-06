const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');

const socket = io('http://localhost:3001');

function setActiveButton(activeId) {
    [homeBtn, aboutBtn].forEach(btn => btn.classList.remove('active'));
    document.getElementById(activeId).classList.add('active');
}

async function loadContent(page) {
    try {
        const response = await fetch(`/content/${page}.html`);
        const html = await response.text();
        contentDiv.innerHTML = html;

        if (page === 'home') {
            initNotes();
        }

    } catch (err) {
        contentDiv.innerHTML = `<p class="is-center text-error">Ошибка загрузки страницы.</p>`;
        console.error(err);
    }
}

homeBtn.addEventListener('click', () => {
    setActiveButton('home-btn');
    loadContent('home');
});

aboutBtn.addEventListener('click', () => {
    setActiveButton('about-btn');
    loadContent('about');
});

loadContent('home');

function initNotes() {
    const form = document.getElementById('note-form');
    const input = document.getElementById('note-input');
    const list = document.getElementById('notes-list');

    function loadNotes() {
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');

        list.innerHTML = notes.map(note =>
            `<li class="card" style="margin-bottom: 0.5rem; padding: 0.5rem;">
                ${typeof note === 'string' ? note : note.text}
            </li>`
        ).join('');
    }

    function addNote(text) {
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');

        const newNote = {
            text: text,
            timestamp: Date.now()
        };

        notes.push(newNote);
        localStorage.setItem('notes', JSON.stringify(notes));

        loadNotes();
        socket.emit('newTask', newNote);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const text = input.value.trim();
        if (text) {
            addNote(text);
            input.value = '';
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

    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

async function subscribeToPush() {
    try {
        const reg = await navigator.serviceWorker.ready;

        const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array('BKWIcjW7w-uk3zG3p8cxeuH228iSHsh-oXlsbKLJtrxu7CQUdWyH8T-XusGjT5OdG3zWC9z57mnQ7eCEqbjWe14')
        });

        await fetch('http://localhost:3001/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub)
        });

        console.log('Подписка оформлена');

    } catch (err) {
        console.error('Ошибка подписки:', err);
    }
}

async function unsubscribeFromPush() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();

    if (sub) {
        await fetch('http://localhost:3001/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint })
        });

        await sub.unsubscribe();
        console.log('Отписка выполнена');
    }
}


if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const reg = await navigator.serviceWorker.register('/sw.js');
            console.log('SW registered');

            const enableBtn = document.getElementById('enable-push');
            const disableBtn = document.getElementById('disable-push');

            if (enableBtn && disableBtn) {

                const sub = await reg.pushManager.getSubscription();

                if (sub) {
                    enableBtn.style.display = 'none';
                    disableBtn.style.display = 'inline-block';
                }

                enableBtn.onclick = async () => {

                    if (Notification.permission === 'denied') {
                        alert('Разреши уведомления в браузере');
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

        } catch (err) {
            console.log('SW registration failed:', err);
        }
    });
}

socket.on('taskAdded', (task) => {
    const notif = document.createElement('div');

    notif.textContent = 'Новая задача: ' + task.text;

    notif.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #4285f4;
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 1000;
    `;

    document.body.appendChild(notif);

    setTimeout(() => notif.remove(), 3000);
});