const express = require('express');
const app = express(); 
const port = 3000;
app.use(express.json());

//массив товаров
let products = [
    { id: 1, name: 'Наушники Sony', price: 15999 },
    { id: 2, name: 'Смартфон Samsung', price: 24999 },
    { id: 3, name: 'Часы Apple Watch', price: 18999 }
];

//GET /products, получение всех товаров
app.get('/products', (req, res) => {
    res.json(products);
});

//GET /products/:id, получение товар по id
app.get('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: 'Товар не найден' });
    }
});

//POST /products - создание нового товара
app.post('/products', (req, res) => {
    const { name, price } = req.body;
    if (!name || !price) {
        return res.status(400).json({ message: 'Укажите название и цену товара' });
    }
    const newProduct = {
        id: Date.now(),
        name: name,
        price: price
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

//PATCH /products/:id - обновление товара
app.patch('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    
    if (!product) {
        return res.status(404).json({ message: 'Товар не найден' });
    }
    const { name, price } = req.body;
    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    res.json(product);
});

// 5. DELETE /products/:id - удалиние товара
app.delete('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id); 
    if (index === -1) {
        return res.status(404).json({ message: 'Товар не найден' });
    }
    products.splice(index, 1);
    res.json({ message: 'Товар удален' });
});
//запуск сервера 
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});