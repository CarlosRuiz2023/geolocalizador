const { Client } = require('pg');
// CARGA LAS VARIABLES DE ENTORNO DESDE EL ARCHIVO .env
require("dotenv").config();
// Configuración del cliente PostgreSQL
const pgClient = new Client({
    host: process.env.NEON_HOST || 'localhost',
    user: process.env.NEON_USER || 'postgres',
    password: process.env.NEON_PASSWORD || 'root',
    database: process.env.NEON_BD || 'BGW',
    port: process.env.NEON_PORT || '5432',
    ssl:require // false
});
pgClient.connect();

module.exports=pgClient;