const { Client } = require('pg');
// CARGA LAS VARIABLES DE ENTORNO DESDE EL ARCHIVO .env
require("dotenv").config();
// Configuración del cliente PostgreSQL
const pgClient = new Client({
    host: process.env.NEON_HOST,
    user: process.env.NEON_USER,
    password: process.env.NEON_PASSWORD,
    database: process.env.NEON_BD,
    port: process.env.NEON_PORT,
    // ssl: false // require
    ssl:{
            rejectUnauthorized: false, // Esto evita errores de certificado SSL en la conexión
        },
});
pgClient.connect();

module.exports=pgClient;