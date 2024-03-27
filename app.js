const express = require('express');
const bodyParser = require('body-parser');
const {parseDireccion} = require('./src/controlador/funciones');
const scoringMaestro = require('./src/controlador/scoring');
// CARGA LAS VARIABLES DE ENTORNO DESDE EL ARCHIVO .env
require("dotenv").config();


// Creación de la aplicación Express
const app = express();
const port = process.env.PORT || 3000;

// Middleware para analizar el cuerpo de las solicitudes en formato JSON
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true })); // x-www-form-urlencoded
// MIDDLEWARE PARA SERVIR ARCHIVOS ESTÁTICOS DESDE LA CARPETA 'public'
app.use(express.static("public"));

// Endpoint para geolocalizar una dirección proporcionada por el usuario
app.post('/geolocalizar', async (req, res) => {
    try {
        // Obtener la dirección proporcionada por el usuario desde el cuerpo de la solicitud
        const { direccion='' } = req.body;

        // Parsear la dirección según la Norma Técnica sobre Domicilios Geográficos
        const direccionParsed = parseDireccion(direccion);
        console.log(direccionParsed);
        
        const results= await scoringMaestro(direccionParsed);

        // Ordenar scoring mas alto primero
        const sortedResults = results.sort((a, b) => b.scoring.fiability - a.scoring.fiability);
        // Recortar a solo 10 resultados
        const topResults = sortedResults.slice(0, 5);
        // Devolver las coordenadas encontradas
        if (results.length > 0) {
            res.status(200).json({ok:true,results:topResults});
        } else {
            res.status(404).json({ ok:false,error: 'Sin resultados.' });
        }
    } catch (error) {
        // Manejar cualquier error que pueda ocurrir durante el proceso de geolocalización
        console.error('Error al geolocalizar dirección:', error);
        res.status(500).json({ ok:false,error: 'Contacte al Administrador.' });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor Express escuchando en el puerto ${port}`);
});
