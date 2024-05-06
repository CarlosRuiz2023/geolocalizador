const express = require('express');
const bodyParser = require('body-parser');
const { parseDireccion, capitalizeFirstLetter } = require('./src/controlador/funciones');
const scoringMaestro = require('./src/controlador/scoring');
const cors = require("cors"); // Middleware para manejar CORS (Cross-Origin Resource Sharing)
const { config } = require('dotenv');
// CARGA LAS VARIABLES DE ENTORNO DESDE EL ARCHIVO .env
require("dotenv").config();

// Creación de la aplicación Express.
const app = express();
// Declaracion del puerto.
const port = process.env.PORT || 3000;

// Middleware para analizar el cuerpo de las solicitudes en formato JSON.
app.use(bodyParser.json());
// Middleware para analizar el cuerpo de las solicitudes en formato x-www-form-urlencoded..
app.use(express.urlencoded({ extended: true }));
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
        // Imprimimos las solicitudes que van llegando.
        console.log(direccionParsed);
        // Funcion que enrutara acorde al parseo recibido.
        const results = await scoringMaestro(direccionParsed);
        // Reorganizamos por mayor fiabilidad.
        let sortedResults = results.sort((a, b) => b.scoring.fiability - a.scoring.fiability);
        // Creamos un objeto para solventar resultados únicos.
        let resultadosUnicos = {};
        // Validamos que sea punto y que lleve el numero_exterior.
        if (!results[0].scoring.numero_exterior) {
            // Filtrar los resultados para mantener solo los únicos basados en la propiedad 'resultado'
            sortedResults = sortedResults.filter(result => {
                // Verificar si el resultado ya ha sido encontrado
                if (!resultadosUnicos[result.resultado]) {
                    // Marcar el resultado como encontrado
                    resultadosUnicos[result.resultado] = true; 
                    // Mantener este resultado
                    return true; 
                }
                // Descartar este resultado porque ya se ha encontrado
                return false; 
            });
        }
        // Hacemos un recorrido dentro del arreglo de direcciones.
        sortedResults.forEach(result => {
            // Validamos que lleve la propiedad de 'resultado'
            if (result.hasOwnProperty('resultado')) {
                // Capitalizar todas las palabras en la propiedad 'resultado'
                result['resultado'] = capitalizeFirstLetter(result['resultado']);
            }
        });
        // Recortar el arreglo de direcciones segun el valor del 'limit' solicitado.
        sortedResults = sortedResults.slice(0, limit);
        // Validamos que el arrglo de direcciones no tenga un largo de 0.
        if (results.length !== 0) {
            // Regresamos la respuesta con un estatus 200 junto con las direcciones obtenidas.
            return res.status(200).json({ ok: true, results: sortedResults });
        } else {
            // Regresamos la respuesta con un estatus 404 debido a que no se han encontrado coincidencias.
            return res.status(404).json({ ok: false, error: 'Sin resultados.' });
        }
    } catch (error) {
        // Manejar cualquier error que pueda ocurrir durante el proceso de geolocalización.
        console.error('Error al geolocalizar dirección:', error);
        // Regresamos la respuesta con un estatus 500 debido a que ocurrio un error durante el proceso de geolocalizacion.
        return res.status(500).json({ ok: false, error: 'Contacte al Administrador.' });
    }
});

// Endpoint para geolocalizar una dirección proporcionada por el usuario usando Here.
app.post('/geolocalizadorHere', async (req, res) => {
    try {
        // Obtener la dirección proporcionada por el usuario desde el cuerpo de la solicitud.
        const { direccion = '', limit = 5 } = req.body;
        // Validar que venga la direccion con algun valor de busqueda.
        if (!direccion) return res.status(404).json({ ok: false, error: 'Falta capturar alguna direccion al servicio. Intente nuevamente' });
        // Tomamos el token de las variables de entorno global.
        const apiKey = process.env.API_HERE;
        // Estandarizamos la direccion proporcionada para poder viajar dentro de la url.
        const direccionEstandar = encodeURIComponent(direccion);
        // Generamos la url concatenando la informacion a utilizar.
        const url = `https://geocode.search.hereapi.com/v1/geocode?q=${direccionEstandar}&apiKey=${apiKey}`;
        // Hacemos la peticion a la url mediante fetch.
        const response = await fetch(url);
        // Hacemos de tipo JSON la respuesta del servicio de HERE.
        const data = await response.json();
        // Recortamos las direcciones a el numero 'limit' proporcionado por el usuario.
        let sortedResults = data.items.slice(0, limit);
        // Agregamos el atributo "resultado" a cada direccion obtenida con el valor de title. 
        sortedResults = sortedResults.map(result => {
            return { ...result, resultado: result.title };
        });
        // Validamos que el arrglo de direcciones no tenga un largo de 0.
        if (sortedResults.length !== 0) {
            // Regresamos la respuesta con un estatus 200 junto con las direcciones obtenidas.
            return res.status(200).json({ ok: true, results: sortedResults });
        } else {
            // Regresamos la respuesta con un estatus 404 debido a que no se han encontrado coincidencias.
            return res.status(404).json({ ok: false, error: 'Sin resultados.' });
        }
    } catch (error) {
        // Manejar cualquier error que pueda ocurrir durante el proceso de geolocalización.
        console.error('Error al geolocalizar dirección:', error);
        // Regresamos la respuesta con un estatus 500 debido a que ocurrio un error durante el proceso de geolocalizacion.
        return res.status(500).json({ ok: false, error: 'Contacte al Administrador.' });
    }
});

// Iniciar el servidor.
app.listen(port, () => {
    // Mensaje de ejecucion, indicando el puerto en la consola.
    console.log(`Servidor Express escuchando en el puerto ${port}`);
});
