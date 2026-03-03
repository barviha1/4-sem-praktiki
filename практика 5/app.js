const express = require("express");
const { nanoid } = require("nanoid");

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = 3000;

app.use(express.json());

let users = [
  { id: nanoid(1), name: "Петр", age: 16 },
  { id: nanoid(2), name: "Иван", age: 18 },
  { id: nanoid(3), name: "Лиза", age: 20 }
];

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API управления пользователями",
      version: "1.0.0",
      description: "CRUD API для пользователей"
    },
    servers: [
      {
        url: `http://localhost:${port}`
      }
    ]
  },
  apis: ["./app.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - age
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         age:
 *           type: integer
 *       example:
 *         id: "abc123"
 *         name: "Петр"
 *         age: 16
 */

function findUserOr404(id, res) {
  const user = users.find(u => u.id === id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return null;
  }
  return user;
}

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить всех пользователей
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Список пользователей
 */
app.get("/api/users", (req, res) => {
  res.json(users);
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Создать пользователя
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Пользователь создан
 */
app.post("/api/users", (req, res) => {
  const { name, age } = req.body;

  if (!name || age === undefined) {
    return res.status(400).json({ error: "Name and age required" });
  }

  const newUser = {
    id: nanoid(6),
    name: name.trim(),
    age: Number(age)
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Пользователь найден
 *       404:
 *         description: Пользователь не найден
 */
app.get("/api/users/:id", (req, res) => {
  const user = findUserOr404(req.params.id, res);
  if (!user) return;
  res.json(user);
});

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Обновить пользователя
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Пользователь обновлен
 */
app.patch("/api/users/:id", (req, res) => {
  const user = findUserOr404(req.params.id, res);
  if (!user) return;

  const { name, age } = req.body;

  if (name === undefined && age === undefined) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  if (name !== undefined) user.name = name.trim();
  if (age !== undefined) user.age = Number(age);

  res.json(user);
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Удалить пользователя
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Удалено
 */
app.delete("/api/users/:id", (req, res) => {
  const exists = users.some(u => u.id === req.params.id);
  if (!exists) {
    return res.status(404).json({ error: "User not found" });
  }

  users = users.filter(u => u.id !== req.params.id);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/api-docs`);
});