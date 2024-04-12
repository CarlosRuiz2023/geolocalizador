const pgClient = require("../../data/conexion");

// Aplicable solo en caso de llevar todos los campos
async function all(direccionParsed) {
    let query = '';
    let values = [];
    let rows = [];
    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
    query = `
        SELECT *,
        ST_Y(ST_Centroid("SP_GEOMETRY")) AS x_centro,
        ST_X(ST_Centroid("SP_GEOMETRY")) AS y_centro
        FROM carto_codigo_postal
        WHERE codigo_postal = $1
        AND unaccent(municipio) = $2
        AND unaccent(estado) = $3
        ;
    `;
    values = [direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        result.rows[i].scoring = {
            fiability: 100,
            codigo_postal: 100,
            municipio: 100,
            estado: 100
        };
    }
    rows = rows.concat(result.rows);
    if (result.rows.length === 0) {
        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
        query = `
            SELECT *,
            ST_Y(ST_Centroid("SP_GEOMETRY")) AS x_centro,
            ST_X(ST_Centroid("SP_GEOMETRY")) AS y_centro
            FROM carto_codigo_postal
            WHERE codigo_postal = $1
            AND unaccent(estado) = $2
            ;
        `;
        values = [direccionParsed.CP, direccionParsed.ESTADO];
        const result = await pgClient.query(query, values);
        for (let i = 0; i < result.rows.length; i++) {
            result.rows[i].scoring = {
                fiability: 75,
                codigo_postal: 100,
                municipio: 0,
                estado: 100
            };
        }
        rows = rows.concat(result.rows);
        if (result.rows.length === 0) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,
                ST_Y(ST_Centroid("SP_GEOMETRY")) AS x_centro,
                ST_X(ST_Centroid("SP_GEOMETRY")) AS y_centro
                FROM carto_codigo_postal
                WHERE codigo_postal = $1
                AND unaccent(municipio) = $2
                ;
            `;
            values = [direccionParsed.CP, direccionParsed.MUNICIPIO];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 75,
                    codigo_postal: 100,
                    municipio: 100,
                    estado: 0
                };
            }
            rows = rows.concat(result.rows);
            if (result.rows.length === 0) {
                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                query = `
                    SELECT *,
                    ST_Y(ST_Centroid("SP_GEOMETRY")) AS x_centro,
                    ST_X(ST_Centroid("SP_GEOMETRY")) AS y_centro
                    FROM carto_codigo_postal
                    WHERE codigo_postal = $1
                    ;
                `;
                values = [direccionParsed.CP];
                const result = await pgClient.query(query, values);
                for (let i = 0; i < result.rows.length; i++) {
                    result.rows[i].scoring = {
                        fiability: 50,
                        codigo_postal: 100,
                        municipio: 0,
                        estado: 0
                    };
                }
                rows = rows.concat(result.rows);
            }
        }
    }
    return rows;
}
module.exports = all;