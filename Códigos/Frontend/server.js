const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/Laboratorio', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error al conectar a MongoDB:', err));

// Esquema y modelo para Items
const ItemSchema = new mongoose.Schema({
    nombre: String,
    tipo: String,
    estado: String,
});
const Item = mongoose.model('Item', ItemSchema);

// Esquema y modelo para Reservas
const ReservaSchema = new mongoose.Schema({
    equipo: String,
    fecha: String,
    horaInicio: String,
    horaFin: String,
});
const Reserva = mongoose.model('Reserva', ReservaSchema);

// Esquema y modelo para Usuarios
const UsuarioSchema = new mongoose.Schema({
    nombre: String,
    contraseña: String,
});
const Usuario = mongoose.model('Usuario', UsuarioSchema);

// Rutas principales
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rutas para Items
app.get('/items', async (req, res) => {
    try {
        const items = await Item.find();
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener los items' });
    }
});

app.post('/items', async (req, res) => {
    try {
        const newItem = new Item(req.body);
        await newItem.save();
        res.json(newItem);
    } catch (err) {
        res.status(500).json({ message: 'Error al crear el item' });
    }
});

// Rutas para Reservas
app.get('/reservas', async (req, res) => {
    try {
        const reservas = await Reserva.find();
        res.json(reservas);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener las reservas' });
    }
});

app.post('/reservas', async (req, res) => {
    try {
        const nuevaReserva = new Reserva(req.body);
        await nuevaReserva.save();
        res.json(nuevaReserva);
    } catch (err) {
        res.status(500).json({ message: 'Error al crear la reserva' });
    }
});

app.delete('/reservas/:id', async (req, res) => {
    try {
        await Reserva.findByIdAndDelete(req.params.id);
        res.json({ message: 'Reserva eliminada' });
    } catch (err) {
        res.status(500).json({ message: 'Error al eliminar la reserva' });
    }
});

// Rutas para Usuarios
app.get('/usuarios', async (req, res) => {
    try {
        const usuarios = await Usuario.find();
        res.json(usuarios);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener los usuarios' });
    }
});

app.post('/usuarios',
    // Validación de datos
    body('correo').isEmail().withMessage('Correo inválido'),
    body('contraseña').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    async (req, res) => {
        const errores = validationResult(req);
        if (!errores.isEmpty()) {
            return res.status(400).json({ errores: errores.array() });
        }

        try {
            const { nombre, correo, contraseña, rol } = req.body;

            // Encriptar contraseña
            const salt = await bcrypt.genSalt(10);
            const contraseñaHash = await bcrypt.hash(contraseña, salt);

            const nuevoUsuario = new Usuario({
                nombre,
                correo,
                contraseña: contraseñaHash,
                rol
            });

            await nuevoUsuario.save();
            res.json({ message: 'Usuario creado con éxito', usuario: nuevoUsuario });
        } catch (err) {
            res.status(500).json({ message: 'Error al crear el usuario', error: err.message });
        }
    }
);

app.delete('/usuarios/:id', async (req, res) => {
    try {
        await Usuario.findByIdAndDelete(req.params.id);
        res.json({ message: 'Usuario eliminado' });
    } catch (err) {
        res.status(500).json({ message: 'Error al eliminar el usuario' });
    }
});

// Iniciar el servidor
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
