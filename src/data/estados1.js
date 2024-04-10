// Importamos el cliente PostgreSQL
const pgClient = require('../data/conexion');

// Variable para almacenar los estados una vez que se hayan consultado
let estadosCache = null;

// Función asincrónica para obtener los estados desde la base de datos
async function obtenerEstados() {
    // Si los estados ya han sido consultados previamente, retornarlos directamente desde el caché
    if (estadosCache !== null) {
        return estadosCache;
    }

    try {
        // Consultar los estados desde la base de datos
        const query = `SELECT unaccent(estado) as estado FROM carto_estado`;
        const result = await pgClient.query(query);

        // Mapear los resultados y almacenarlos en el caché
        estadosCache = result.rows.map(row => row.estado);

        // Retornar los estados
        return estadosCache;
    } catch (error) {
        // Manejar cualquier error que ocurra
        console.error('Error al obtener los estados desde la base de datos:', error);
        throw error; // Propagar el error para que el consumidor pueda manejarlo
    }
}

// Exportar una promesa que resuelve los estados una vez que han sido obtenidos
module.exports = obtenerEstados().then(estados => {
    return estados;
});
