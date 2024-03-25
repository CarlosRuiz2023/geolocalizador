const { Client } = require('pg');

// ST_AsText("SP_GEOMETRY") AS coordenadas

// Configuración del cliente PostgreSQL
const pgClient = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'BGW',
    password: 'root',
    port: 5432, // Cambia esto si tu servidor PostgreSQL está en un puerto diferente
});
pgClient.connect();

module.exports=pgClient;