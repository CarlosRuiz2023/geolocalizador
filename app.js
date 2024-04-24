const express = require('express');
const bodyParser = require('body-parser');
const { parseDireccion } = require('./src/controlador/funciones');
const scoringMaestro = require('./src/controlador/scoring');
const cors = require("cors"); // Middleware para manejar CORS (Cross-Origin Resource Sharing)
// CARGA LAS VARIABLES DE ENTORNO DESDE EL ARCHIVO .env
require("dotenv").config();


// Creación de la aplicación Express.
const app = express();
const port = process.env.PORT || 3000;

// Middleware para analizar el cuerpo de las solicitudes en formato JSON.
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true })); // x-www-form-urlencoded.
// MIDDLEWARE PARA MANEJAR CORS
app.use(
    cors({
      origin: ["http://localhost:4200"],
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: false,
      optionsSuccessStatus: 204,
    })
  );
// MIDDLEWARE PARA SERVIR ARCHIVOS ESTÁTICOS DESDE LA CARPETA 'public'.
app.use(express.static("public"));

// Endpoint para geolocalizar una dirección proporcionada por el usuario.
app.post('/geolocalizar', async (req, res) => {
    try {
        // Obtener la dirección proporcionada por el usuario desde el cuerpo de la solicitud.
        const { direccion = '', limit = 5 } = req.body;

        // Validar que venga la direccion con algun valor de busqueda.
        if (!direccion) return res.status(404).json({ ok: false, error: 'Falta capturar alguna direccion al servicio. Intente nuevamente' });

        // Parsear la dirección según la Norma Técnica sobre Domicilios Geográficos.
        const direccionParsed = parseDireccion(direccion);
        console.log(direccionParsed);

        // Funcion que enrutara acorde al parseo recibido.
        const results = await scoringMaestro(direccionParsed);
        // Reorganizamos por mayor fiabilidad.
        let sortedResults = results.sort((a, b) => b.scoring.fiability - a.scoring.fiability);
        // Recortar a solo 10 resultados.
        sortedResults = sortedResults.slice(0, limit);
        // Devolver las coordenadas encontradas.
        if (results.length > 0) {
            return res.status(200).json({ ok: true, results: sortedResults });
        } else {
            return res.status(404).json({ ok: false, error: 'Sin resultados.' });
        }
    } catch (error) {
        // Manejar cualquier error que pueda ocurrir durante el proceso de geolocalización.
        console.error('Error al geolocalizar dirección:', error);
        return res.status(500).json({ ok: false, error: 'Contacte al Administrador.' });
    }
});

// Iniciar el servidor.
app.listen(port, () => {
    console.log(`Servidor Express escuchando en el puerto ${port}`);
});
