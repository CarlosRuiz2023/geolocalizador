const pgClient = require("../../data/conexion");
const { quitarAcentos } = require("../funciones");

// Aplicable solo en caso de llevar todos los campos
async function alone(direccionParsed) {
    let query = '';
    let values = [];
    let rows = [];
    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
    query = `
                SELECT *,
                CASE
                    WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5))
                    lat_y
                END AS y_centro,
                CASE
                    WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5))
                    lon_x
                END AS x_centro
                FROM carto_geolocalizador
                WHERE unaccent(tipo_vialidad) = $1
                AND unaccent(nombre_vialidad) like '%' || $2 || '%'
                ;
            `;
    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        result.rows[i].scoring = {
            fiability: 20,
            tipo_vialidad: 100,
            nombre_vialidad: 0
        };
        const nombreVialidadSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
        const matchNombreVialidad = nombreVialidadSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
        if (matchNombreVialidad) {
            const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
            let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
            if (igualdad > 100) igualdad = 100;
            result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
            result.rows[i].scoring.fiability += Math.round(igualdad) / 1.25;
        }
    }
    rows = rows.concat(result.rows);

    return rows;
}
module.exports = alone;