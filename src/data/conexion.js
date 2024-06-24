const { Client } = require('pg');
// CARGA LAS VARIABLES DE ENTORNO DESDE EL ARCHIVO .env
require("dotenv").config();
// Configuración del cliente PostgreSQL
const pgClient = new Client({
    host: process.env.AWS_HOST,
    user: process.env.AWS_USER,
    password: process.env.AWS_PASSWORD,
    database: process.env.AWS_BD,
    port: process.env.AWS_PORT,
    // ssl: false // require
    ssl:{
            rejectUnauthorized: false, // Esto evita errores de certificado SSL en la conexión
        },
});
pgClient.connect();

module.exports=pgClient;