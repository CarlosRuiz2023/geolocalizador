const express = require('express');
const bodyParser = require('body-parser');
const parseDireccion = require('./controlador/funciones');
const scoringMaestro = require('./controlador/scoring');


// Creación de la aplicación Express
const app = express();
const port = 3000;

// Middleware para analizar el cuerpo de las solicitudes en formato JSON
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true })); // x-www-form-urlencoded

// Endpoint para geolocalizar una dirección proporcionada por el usuario
app.post('/geolocalizar', async (req, res) => {
    try {
        // Obtener la dirección proporcionada por el usuario desde el cuerpo de la solicitud
        const { direccion } = req.body;

        // Parsear la dirección según la Norma Técnica sobre Domicilios Geográficos
        const direccionParsed = parseDireccion(direccion);
        console.log(direccionParsed);
        
        const rows= await scoringMaestro(direccionParsed)

        // Devolver las coordenadas encontradas
        if (rows.length > 0) {
            res.status(200).json({ok:true,results:rows});
        } else {
            res.status(404).json({ error: 'Dirección especificada no encontrada.' });
        }
    } catch (error) {
        // Manejar cualquier error que pueda ocurrir durante el proceso de geolocalización
        console.error('Error al geolocalizar dirección:', error);
        res.status(500).json({ error: 'Error al geolocalizar dirección.' });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor Express escuchando en el puerto ${port}`);
});
