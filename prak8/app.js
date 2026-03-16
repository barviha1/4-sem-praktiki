const express = require('express');
const { nanoid } = require("nanoid");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

const JWT_SECRET = "your_secret_key_here";
const ACCESS_EXPIRES_IN = "15m";

let users = [];
let products = [];

app.use(express.json());

const saltRounds = 10;

async function hashPassword(password) {
    return bcrypt.hash(password, saltRounds);
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

function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ 
            error: "Missing or invalid Authorization header. Expected format: Bearer <token>" 
        });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ 
            error: "Invalid or expired token" 
        });
    }
}

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API для управления товарами (с JWT авторизацией)',
            version: '1.0.0',
            description: 'Практическое занятие 8: JWT токены',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['./app.js']
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - first_name
 *         - last_name
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: Автоматически сгенерированный ID
 *         email:
 *           type: string
 *           description: Email пользователя (логин)
 *         first_name:
 *           type: string
 *           description: Имя
 *         last_name:
 *           type: string
 *           description: Фамилия
 *     Product:
 *       type: object
 *       required:
 *         - title
 *         - category
 *         - description
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           description: Автоматически сгенерированный ID товара
 *         title:
 *           type: string
 *           description: Название товара
 *         category:
 *           type: string
 *           description: Категория товара
 *         description:
 *           type: string
 *           description: Описание товара
 *         price:
 *           type: number
 *           description: Цена товара
 */

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Регистрация, вход и информация о пользователе
 *   - name: Products
 *     description: Управление товарами (требуется JWT)
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - first_name
 *               - last_name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: ivan@mail.com
 *               first_name:
 *                 type: string
 *                 example: Иван
 *               last_name:
 *                 type: string
 *                 example: Иванов
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Неверные данные или email уже существует
 */
app.post('/api/auth/register', async (req, res) => {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: 'Все поля (email, first_name, last_name, password) обязательны' });
    }

    if (findUserByEmail(email)) {
        return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
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

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему (получение JWT токена)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: ivan@mail.com
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       200:
 *         description: Успешный вход, возвращает JWT токен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Отсутствуют email или пароль
 *       401:
 *         description: Неверные учетные данные
 */
app.post('/api/auth/login', async (req, res) => {
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

    const accessToken = jwt.sign(
        { 
            sub: user.id,
            email: user.email
        },
        JWT_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );

    res.json({ accessToken });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить информацию о текущем пользователе (защищенный маршрут)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные текущего пользователя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Не авторизован (отсутствует или недействителен токен)
 *       404:
 *         description: Пользователь не найден
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
    const userId = req.user.sub;
    const user = findUserById(userId);
    
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар (требуется JWT)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Товар создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Не авторизован
 */
app.post('/api/products', authMiddleware, (req, res) => {
    const { title, category, description, price } = req.body;

    if (!title || !category || !description || price === undefined) {
        return res.status(400).json({ error: 'Все поля (title, category, description, price) обязательны' });
    }
    
    if (typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ error: 'Цена должна быть положительным числом' });
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

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров (требуется JWT)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       401:
 *         description: Не авторизован
 */
app.get('/api/products', authMiddleware, (req, res) => {
    res.status(200).json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID (требуется JWT)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Товар найден
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Товар не найден
 */
app.get('/api/products/:id', authMiddleware, (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    res.status(200).json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар по ID (требуется JWT)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Товар обновлен
 *       400:
 *         description: Нет данных для обновления
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Товар не найден
 */
app.put('/api/products/:id', authMiddleware, (req, res) => {
    const productIndex = products.findIndex(p => p.id === req.params.id);
    if (productIndex === -1) {
        return res.status(404).json({ error: 'Товар не найден' });
    }

    const { title, category, description, price } = req.body;

    if (title !== undefined) products[productIndex].title = title;
    if (category !== undefined) products[productIndex].category = category;
    if (description !== undefined) products[productIndex].description = description;
    if (price !== undefined) {
        if (typeof price !== 'number' || price <= 0) {
            return res.status(400).json({ error: 'Цена должна быть положительным числом' });
        }
        products[productIndex].price = price;
    }

    res.status(200).json(products[productIndex]);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар по ID (требуется JWT)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Товар успешно удален
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/products/:id', authMiddleware, (req, res) => {
    const productIndex = products.findIndex(p => p.id === req.params.id);
    if (productIndex === -1) {
        return res.status(404).json({ error: 'Товар не найден' });
    }

    products.splice(productIndex, 1);
    res.status(204).send();
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`Swagger UI доступен по адресу http://localhost:${port}/api-docs`);
});