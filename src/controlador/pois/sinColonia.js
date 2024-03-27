const pgClient = require("../../data/conexion");
const { levenshteinDistance } = require("../funciones");

// Aplicable solo en caso de llevar todos los campos
async function sinColonia(direccionParsed) {
    let query = '';
    let values = [];
    let rows = [];
    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
    query = `
        SELECT *,
        lat_y AS y_centro,
        lon_x AS x_centro
        FROM carto_geolocalizador
        WHERE (codigo_postal = '' OR codigo_postal = $1 )
        AND municipio = $2
        AND estado = $3
        AND (numero = '' OR numero = $4)
        ;
    `;
    values = [direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        result.rows[i].scoring = {
            fiability: 75,
            codigo_postal: 0,
            municipio: 100,
            estado: 100,
            numero_exterior: 100
        };
        const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
        if (matchCP) {
            result.rows[i].scoring.codigo_postal += 100;
            result.rows[i].scoring.fiability += 25;
        }
    }
    rows = rows.concat(result.rows);
    if (result.rows.length === 0) {
        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
        query = `
            SELECT *,
            lat_y AS y_centro,
            lon_x AS x_centro
            FROM carto_geolocalizador
            WHERE municipio = $1
            AND estado = $2
            AND (numero = '' OR numero = $3)
            ;
        `;
        values = [direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
        const result = await pgClient.query(query, values);
        for (let i = 0; i < result.rows.length; i++) {
            result.rows[i].scoring = {
                fiability: 75,
                codigo_postal: 0,
                municipio: 100,
                estado: 100,
                numero_exterior: 100
            };
        }
        rows = rows.concat(result.rows);
        if (result.rows.length === 0) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,
                lat_y AS y_centro,
                lon_x AS x_centro
                FROM carto_geolocalizador
                WHERE (codigo_postal = '' OR codigo_postal = $1 )
                AND municipio = $2
                AND (numero = '' OR numero = $3)
                ;
            `;
            values = [direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 50,
                    codigo_postal: 0,
                    municipio: 100,
                    estado: 0,
                    numero_exterior: 100
                };
                const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                if (matchCP) {
                    result.rows[i].scoring.codigo_postal += 100;
                    result.rows[i].scoring.fiability += 25;
                }
            }
            rows = rows.concat(result.rows);
            if (result.rows.length === 0) {
                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                query = `
                    SELECT *,
                    lat_y AS y_centro,
                    lon_x AS x_centro
                    FROM carto_geolocalizador
                    WHERE (codigo_postal = '' OR codigo_postal = $1 )
                    AND estado = $2
                    AND (numero = '' OR numero = $3)
                    ;
                `;
                values = [direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
                const result = await pgClient.query(query, values);
                for (let i = 0; i < result.rows.length; i++) {
                    result.rows[i].scoring = {
                        fiability: 50,
                        codigo_postal: 0,
                        municipio: 0,
                        estado: 100,
                        numero_exterior: 100
                    };
                    const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                    if (matchCP) {
                        result.rows[i].scoring.codigo_postal += 100;
                        result.rows[i].scoring.fiability += 25;
                    }
                }
                rows = rows.concat(result.rows);
                if (result.rows.length === 0) {
                    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                    query = `
                        SELECT *,
                        lat_y AS y_centro,
                        lon_x AS x_centro
                        FROM carto_geolocalizador
                        WHERE (codigo_postal = '' OR codigo_postal = $1 )
                        AND municipio = $2
                        AND estado = $3
                        ;
                    `;
                    values = [direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                    const result = await pgClient.query(query, values);
                    for (let i = 0; i < result.rows.length; i++) {
                        result.rows[i].scoring = {
                            fiability: 50,
                            codigo_postal: 0,
                            municipio: 100,
                            estado: 100,
                            numero_exterior: 0
                        };
                        const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                        if (matchCP) {
                            result.rows[i].scoring.codigo_postal += 100;
                            result.rows[i].scoring.fiability += 25;
                        }
                    }
                    rows = rows.concat(result.rows);
                }
            }
        }
    }
    return rows;
}
module.exports = sinColonia;