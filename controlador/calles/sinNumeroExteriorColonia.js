const pgClient = require("../../data/conexion");
const { levenshteinDistance } = require("../funciones");

async function sinNumeroExteriorCalle(direccionParsed) {
    let query = '';
    let values = [];
    let rows = [];
    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
    query = `
        SELECT *,
        ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5)) AS y_centro,
        ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5)) AS x_centro
        FROM carto_geolocalizador
        WHERE nombre_vialidad like '%' || $1 || '%'
        AND (codigo_postal = '' OR codigo_postal = $2 )
        AND municipio = $3
        AND estado = $4
        ;
    `;
    values = [direccionParsed.COLONIA, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        result.rows[i].scoring = {
            fiability: 40,
            calle: 0,
            codigo_postal: 0,
            municipio: 100,
            estado: 100
        };
        const matchNombreCalle = result.rows[i].calle.match(new RegExp(direccionParsed.COLONIA, 'i'));
        if (matchNombreCalle) {
            const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
            let igualdad = matchedText.length * 100 / result.rows[i].calle.length;
            if (igualdad > 100) igualdad = 100;
            result.rows[i].scoring.calle += Math.round(igualdad);
            result.rows[i].scoring.fiability += Math.round(igualdad*0.4);
        }
        const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
        if (matchCP) {
            result.rows[i].scoring.codigo_postal += 100;
            result.rows[i].scoring.fiability += 20;
        }
    }
    rows = rows.concat(result.rows);
    if (result.rows.length === 0) {
        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
        query = `
            SELECT *,
            ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5)) AS y_centro,
            ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5)) AS x_centro
            FROM carto_geolocalizador
            WHERE nombre_vialidad like '%' || $1 || '%'
            AND municipio = $2
            AND estado = $3
            ;
        `;
        values = [direccionParsed.COLONIA, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
        const result = await pgClient.query(query, values);
        for (let i = 0; i < result.rows.length; i++) {
            result.rows[i].scoring = {
                fiability: 40,
                calle: 0,
                codigo_postal: 0,
                municipio: 100,
                estado: 100
            };
            const matchNombreCalle = result.rows[i].calle.match(new RegExp(direccionParsed.COLONIA, 'i'));
            if (matchNombreCalle) {
                const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                let igualdad = matchedText.length * 100 / result.rows[i].calle.length;
                if (igualdad > 100) igualdad = 100;
                result.rows[i].scoring.calle += Math.round(igualdad);
                result.rows[i].scoring.fiability += Math.round(igualdad*0.4);
            }
        }
        rows = rows.concat(result.rows);
        if (result.rows.length === 0) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,
                ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5)) AS y_centro,
                ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5)) AS x_centro
                FROM carto_geolocalizador
                WHERE nombre_vialidad like '%' || $1 || '%'
                AND (codigo_postal = '' OR codigo_postal = $2 )
                AND estado = $3
                ;
            `;
            values = [direccionParsed.COLONIA, direccionParsed.CP, direccionParsed.ESTADO];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 20,
                    calle: 0,
                    codigo_postal: 0,
                    municipio: 0,
                    estado: 100
                };
                const matchNombreCalle = result.rows[i].calle.match(new RegExp(direccionParsed.COLONIA, 'i'));
                if (matchNombreCalle) {
                    const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                    let igualdad = matchedText.length * 100 / result.rows[i].calle.length;
                    if (igualdad > 100) igualdad = 100;
                    result.rows[i].scoring.calle += Math.round(igualdad);
                    result.rows[i].scoring.fiability += Math.round(igualdad*0.4);
                }
                const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                if (matchCP) {
                    result.rows[i].scoring.codigo_postal += 100;
                    result.rows[i].scoring.fiability += 20;
                }
            }
            rows = rows.concat(result.rows);
            if (result.rows.length === 0) {
                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                query = `
                    SELECT *,
                    ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5)) AS y_centro,
                    ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5)) AS x_centro
                    FROM carto_geolocalizador
                    WHERE nombre_vialidad like '%' || $1 || '%'
                    AND municipio = $2
                    ;
                `;
                values = [direccionParsed.COLONIA, direccionParsed.MUNICIPIO];
                const result = await pgClient.query(query, values);
                for (let i = 0; i < result.rows.length; i++) {
                    result.rows[i].scoring = {
                        fiability: 20,
                        calle: 0,
                        codigo_postal: 0,
                        municipio: 100,
                        estado: 0
                    };
                    const matchNombreCalle = result.rows[i].calle.match(new RegExp(direccionParsed.COLONIA, 'i'));
                    if (matchNombreCalle) {
                        const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                        let igualdad = matchedText.length * 100 / result.rows[i].calle.length;
                        if (igualdad > 100) igualdad = 100;
                        result.rows[i].scoring.calle += Math.round(igualdad);
                        result.rows[i].scoring.fiability += Math.round(igualdad*0.4);
                    }
                    const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                    if (matchCP) {
                        result.rows[i].scoring.codigo_postal += 100;
                        result.rows[i].scoring.fiability += 20;
                    }
                }
                rows = rows.concat(result.rows);
                if (result.rows.length === 0) {
                    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                    query = `
                        SELECT *,
                        ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5)) AS y_centro,
                        ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5)) AS x_centro
                        FROM carto_geolocalizador
                        WHERE nombre_vialidad like '%' || $1 || '%'
                        AND (codigo_postal = '' OR codigo_postal = $2 )
                        ;
                    `;
                    values = [direccionParsed.COLONIA, direccionParsed.CP];
                    const result = await pgClient.query(query, values);
                    for (let i = 0; i < result.rows.length; i++) {
                        result.rows[i].scoring = {
                            fiability: 0,
                            calle: 0,
                            codigo_postal: 0,
                            municipio: 0,
                            estado: 0
                        };
                        const matchNombreCalle = result.rows[i].calle.match(new RegExp(direccionParsed.COLONIA, 'i'));
                        if (matchNombreCalle) {
                            const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                            let igualdad = matchedText.length * 100 / result.rows[i].calle.length;
                            if (igualdad > 100) igualdad = 100;
                            result.rows[i].scoring.calle += Math.round(igualdad);
                            result.rows[i].scoring.fiability += Math.round(igualdad*0.4);
                        }
                        const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                        if (matchCP) {
                            result.rows[i].scoring.codigo_postal += 100;
                            result.rows[i].scoring.fiability += 20;
                        }
                    }
                    rows = rows.concat(result.rows);
                    if (result.rows.length === 0) {
                        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                        query = `
                            SELECT *,
                            ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5)) AS y_centro,
                            ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5)) AS x_centro
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
                                fiability: 40,
                                calle: 0,
                                codigo_postal: 0,
                                municipio: 100,
                                estado: 100
                            };
                            const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                            if (matchCP) {
                                result.rows[i].scoring.codigo_postal += 100;
                                result.rows[i].scoring.fiability += 20;
                            }
                        }
                        rows = rows.concat(result.rows);
                        if (result.rows.length === 0) {
                            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                            query = `
                                SELECT *,
                                ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5)) AS y_centro,
                                ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5)) AS x_centro
                                FROM carto_geolocalizador
                                WHERE municipio = $1
                                AND estado = $2
                                ;
                            `;
                            values = [direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                            const result = await pgClient.query(query, values);
                            for (let i = 0; i < result.rows.length; i++) {
                                result.rows[i].scoring = {
                                    fiability: 40,
                                    calle: 0,
                                    codigo_postal: 0,
                                    municipio: 100,
                                    estado: 100
                                };
                            }
                            rows = rows.concat(result.rows);
                            if (result.rows.length === 0) {
                                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                query = `
                                    SELECT *,
                                    ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5)) AS y_centro,
                                    ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5)) AS x_centro
                                    FROM carto_geolocalizador
                                    WHERE (codigo_postal = '' OR codigo_postal = $1 )
                                    AND municipio = $2
                                    ;
                                `;
                                values = [direccionParsed.CP, direccionParsed.MUNICIPIO];
                                const result = await pgClient.query(query, values);
                                for (let i = 0; i < result.rows.length; i++) {
                                    result.rows[i].scoring = {
                                        fiability: 20,
                                        calle: 0,
                                        codigo_postal: 0,
                                        municipio: 100,
                                        estado: 0
                                    };
                                    const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                    if (matchCP) {
                                        result.rows[i].scoring.codigo_postal += 100;
                                        result.rows[i].scoring.fiability += 20;
                                    }
                                }
                                rows = rows.concat(result.rows);
                                if (result.rows.length === 0) {
                                    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                    query = `
                                        SELECT *,
                                        CASE
                                            WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5))
                                            ELSE NULL
                                        END AS y_centro,
                                        CASE
                                            WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5))
                                            ELSE NULL
                                        END AS x_centro
                                        FROM carto_geolocalizador
                                        WHERE (codigo_postal = '' OR codigo_postal = $1 )
                                        AND estado = $2
                                        ;
                                    `;
                                    values = [direccionParsed.CP, direccionParsed.ESTADO];
                                    const result = await pgClient.query(query, values);
                                    for (let i = 0; i < result.rows.length; i++) {
                                        result.rows[i].scoring = {
                                            fiability: 20,
                                            calle: 0,
                                            codigo_postal: 0,
                                            municipio: 0,
                                            estado: 100
                                        };
                                        const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                        if (matchCP) {
                                            result.rows[i].scoring.codigo_postal += 100;
                                            result.rows[i].scoring.fiability += 20;
                                        }
                                    }
                                    rows = rows.concat(result.rows);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return rows;
}
module.exports = sinNumeroExteriorCalle;