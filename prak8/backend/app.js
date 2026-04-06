const express = require('express');
const { nanoid } = require("nanoid");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Импортируем cors

const app = express();
const port = 3000;

// Настройка CORS - разрешаем запросы с фронтенда
app.use(cors({
    origin: 'http://localhost:3001', // Разрешаем запросы с React приложения
    credentials: true, // Разрешаем отправку cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const JWT_ACCESS_SECRET = "access_secret_key_here";
const JWT_REFRESH_SECRET = "refresh_secret_key_here";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

let users = [];
let products = [];
let refreshTokens = new Set();

async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}

const findUserByEmail = (email) => {
    return users.find(user => user.email === email);
};

const findUserById = (id) => {
    return users.find(user => user.id === id);
};

function generateAccessToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email },
        JWT_ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email },
        JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );
}

// Регистрация
app.post('/api/auth/register', async (req, res) => {
    console.log('Register request:', req.body);
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    if (findUserByEmail(email)) {
        return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = {
        id: nanoid(8),
        email,
        first_name,
        last_name,
        password: hashedPassword
    };

    users.push(newUser);
    console.log('User created:', newUser.email);
    console.log('All users:', users);

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
});

// Логин
app.post('/api/auth/login', async (req, res) => {
    console.log('Login request:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const user = findUserByEmail(email);
    if (!user) {
        return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
        return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    refreshTokens.add(refreshToken);
    console.log('Login successful:', email);
    console.log('Tokens generated for user:', user.id);

    res.json({ accessToken, refreshToken });
});

// Получение текущего пользователя
app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    console.log('Me request, auth header:', authHeader);
    
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const payload = jwt.verify(token, JWT_ACCESS_SECRET);
        const user = findUserById(payload.sub);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (err) {
        console.error('Token verification error:', err);
        return res.status(401).json({ error: 'Invalid token' });
    }
});

// Обновление токена
app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;
    console.log('Refresh request');

    if (!refreshToken) {
        return res.status(400).json({ error: 'refreshToken is required' });
    }

    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({ error: 'Invalid refresh token' });
    }

    try {
        const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const user = findUserById(payload.sub);
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        refreshTokens.delete(refreshToken);
        
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        
        refreshTokens.add(newRefreshToken);
        
        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
});

// Товары
app.get('/api/products', (req, res) => {
    res.json(products);
});

app.post('/api/products', (req, res) => {
    const { title, category, description, price } = req.body;
    
    if (!title || !category || !description || price === undefined) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }
    
    const newProduct = {
        id: nanoid(8),
        title,
        category,
        description,
        price
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
});

app.put('/api/products/:id', (req, res) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    products[index] = { ...products[index], ...req.body };
    res.json(products[index]);
});

app.delete('/api/products/:id', (req, res) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    products.splice(index, 1);
    res.status(204).send();
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`CORS разрешен для http://localhost:3001`);
});