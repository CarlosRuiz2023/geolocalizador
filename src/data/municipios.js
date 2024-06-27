// Importamos el cliente PostgreSQL
const pgClient = require('./conexion');

// Variable para almacenar los estados una vez que se hayan consultado
let municipiosCache = null;

// Función asincrónica para obtener los estados desde la base de datos
async function obtenerMunicipios() {
    // Si los estados ya han sido consultados previamente, retornarlos directamente desde el caché
    if (municipiosCache !== null) {
        return municipiosCache;
    }

    try {
       // Consultar los municipios por estado desde la base de datos
       const query = `SELECT UPPER(UNACCENT(estado)) as estado, json_agg(UPPER(UNACCENT(municipio))) AS municipios FROM carto_municipio GROUP BY estado;`;
       const result = await pgClient.query(query);

       // Mapear los resultados y almacenarlos en el caché
       municipiosCache = {};
       result.rows.forEach(row => {
           municipiosCache[row.estado] = row.municipios;
       });

        // Retornar los estados
        return municipiosCache;
    } catch (error) {
        // Manejar cualquier error que ocurra
        console.error('Error al obtener los municipios desde la base de datos:', error);
        throw error; // Propagar el error para que el consumidor pueda manejarlo
    }
}

// Exportar una promesa que resuelve los estados una vez que han sido obtenidos
module.exports = obtenerMunicipios().then(municipios => {
    return municipios;
});
