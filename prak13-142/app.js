const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const list = document.getElementById('tasks-list');

function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    list.innerHTML = tasks.map(task => `<li>${task}</li>`).join('');
}

function addTask(text) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    tasks.push(text);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    loadTasks();
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
        addTask(text);
        input.value = '';
    }
});

loadTasks();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker успешно зарегистрирован:', registration.scope);
        } catch (err) {
            console.error('Ошибка регистрации Service Worker:', err);
        }
    });
}