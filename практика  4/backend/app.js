const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const { describe } = require('node:test');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000"
}));
let products = [
  { 
    id: nanoid(1), 
    name: 'Наушники Sony',
    category: 'Наушники',
    description: 'Шумоподавление, качественный звук',
    price: 15999,
    stock: 20
  }, 
  { id: nanoid(2), 
    name: 'Смартфон Samsung', 
    category: 'Телефон',
    description: 'Качественные фото, долгая автономность',
    price: 24999,
    stock: 13
  }, 
  { id: nanoid(3), 
    name: 'Часы Apple Watch',
    category: 'Умные-часы"', 
    description: 'Измеряет пульс, качество сна',
    price: 18999,
    stock: 23
  },
    {
    id: nanoid(4),
    name: "Игровые наушники Ardor",
    category: "Периферия",
    description: "Микрофон, подсветка",
    price: 7000,
    stock: 21
  },
    {
    id: nanoid(5),
    name: "Ноутбук Lenovo",
    category: "Ноутбуки",
    description: "Хорошая автономность, мощный процессор",
    price: 60990,
    stock: 7
  },
  {
    id: nanoid(6),
    name: "Игровая мышь",
    category: "Периферия",
    description: "RGB подсветка, 12000 DPI",
    price: 3500,
    stock: 15
  },
    {
    id: nanoid(7),
    name: "Колонки Sven",
    category: "Периферия",
    description: "Качественный звук, ренулировка громкости",
    price: 5000,
    stock: 34
  },
    {
    id: nanoid(8),
    name: "Чехол для Samsung",
    category: "Аксессуары",
    description: "Натуральная кожа",
    price: 10000,
    stock: 25
  },
    {
    id: nanoid(9),
    name: "Виниловый проигрыватель",
    category: "Проигрыватель",
    description: "Поддерживает разные формы виниловых пластинок",
    price: 45678,
    stock: 9
  },
    {
    id: nanoid(10),
    name: "Ноутбук Apple",
    category: "Ноутбук",
    description: "Хорошая камера, мощный процессор",
    price: 75000,
    stock: 12
  },
];
// Вспомогательная функция
function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return null;
  }
  return product;
}

// GET ALL
app.get("/api/products", (req, res) => {
  res.json(products);
});

// GET BY ID
app.get("/api/products/:id", (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  res.json(product);
});

// CREATE
app.post("/api/products", (req, res) => {
  const { name, category, description, price, stock } = req.body;

  if (!name || !category || price == null || stock == null) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const newProduct = {
    id: nanoid(6),
    name: name.trim(),
    category: category.trim(),
    description: description?.trim() || "",
    price: Number(price),
    stock: Number(stock)
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

// UPDATE
app.patch("/api/products/:id", (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;

  const { name, category, description, price, stock } = req.body;

  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);

  res.json(product);
});

// DELETE
app.delete("/api/products/:id", (req, res) => {
  const exists = products.some(p => p.id === req.params.id);
  if (!exists) {
    return res.status(404).json({ error: "Product not found" });
  }

  products = products.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});