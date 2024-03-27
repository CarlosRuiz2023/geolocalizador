const pgClient = require("../../data/conexion");
const { levenshteinDistance } = require("../funciones");

async function sinNumeroExteriorColonia(direccionParsed) {
    let query = '';
    let values = [];
    let rows = [];
    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
    query = `
        SELECT *,
        ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5)) AS y_centro,
        ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5)) AS x_centro
        FROM carto_geolocalizador
        WHERE tipo_vialidad = $1
        AND nombre_vialidad like '%' || $2 || '%'
        AND (codigo_postal = '' OR codigo_postal = $3 )
        AND municipio = $4
        AND estado = $5
        ;
    `;
    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        result.rows[i].scoring = {
            fiability: 40,
            tipo_vialidad: 100,
            nombre_vialidad: 0,
            codigo_postal: 0,
            municipio: 100,
            estado: 100
        };
        const matchNombreVialidad = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
        if (matchNombreVialidad) {
            const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
            let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
            if (igualdad > 100) igualdad = 100;
            result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
            result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
        }
        const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
        if (matchCP) {
            result.rows[i].scoring.codigo_postal += 100;
            result.rows[i].scoring.fiability += 10;
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
            WHERE tipo_vialidad = $1
            AND nombre_vialidad like '%' || $2 || '%'
            AND municipio = $3
            AND estado = $4
            ;
        `;
        values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
        const result = await pgClient.query(query, values);
        for (let i = 0; i < result.rows.length; i++) {
            result.rows[i].scoring = {
                fiability: 40,
                tipo_vialidad: 100,
                nombre_vialidad: 0,
                codigo_postal: 0,
                municipio: 100,
                estado: 100
            };
            const matchNombreVialidad = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
            if (matchNombreVialidad) {
                const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
                let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                if (igualdad > 100) igualdad = 100;
                result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
                result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
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
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND (codigo_postal = '' OR codigo_postal = $3 )
                AND estado = $4
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.ESTADO];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 30,
                    tipo_vialidad: 100,
                    nombre_vialidad: 0,
                    codigo_postal: 0,
                    municipio: 0,
                    estado: 100
                };
                const matchNombreVialidad = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                if (matchNombreVialidad) {
                    const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
                    let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                    if (igualdad > 100) igualdad = 100;
                    result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
                    result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                }
                const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                if (matchCP) {
                    result.rows[i].scoring.codigo_postal += 100;
                    result.rows[i].scoring.fiability += 10;
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
                    WHERE tipo_vialidad = $1
                    AND nombre_vialidad like '%' || $2 || '%'
                    AND municipio = $3
                    ;
                `;
                values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO];
                const result = await pgClient.query(query, values);
                for (let i = 0; i < result.rows.length; i++) {
                    result.rows[i].scoring = {
                        fiability: 30,
                        tipo_vialidad: 100,
                        nombre_vialidad: 0,
                        codigo_postal: 0,
                        municipio: 100,
                        estado: 0
                    };
                    const matchNombreVialidad = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                    if (matchNombreVialidad) {
                        const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
                        let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                        if (igualdad > 100) igualdad = 100;
                        result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
                        result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                    }
                    const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                    if (matchCP) {
                        result.rows[i].scoring.codigo_postal += 100;
                        result.rows[i].scoring.fiability += 10;
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
                        WHERE tipo_vialidad = $1
                        AND nombre_vialidad like '%' || $2 || '%'
                        AND (codigo_postal = '' OR codigo_postal = $3 )
                        ;
                    `;
                    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP];
                    const result = await pgClient.query(query, values);
                    for (let i = 0; i < result.rows.length; i++) {
                        result.rows[i].scoring = {
                            fiability: 20,
                            tipo_vialidad: 100,
                            nombre_vialidad: 0,
                            codigo_postal: 0,
                            municipio: 0,
                            estado: 0
                        };
                        const matchNombreVialidad = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                        if (matchNombreVialidad) {
                            const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
                            let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                            if (igualdad > 100) igualdad = 100;
                            result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
                            result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                        }
                        const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                        if (matchCP) {
                            result.rows[i].scoring.codigo_postal += 100;
                            result.rows[i].scoring.fiability += 10;
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
                            WHERE tipo_vialidad = $1
                            AND (codigo_postal = '' OR codigo_postal = $2 )
                            AND municipio = $3
                            AND estado = $4
                            ;
                        `;
                        values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                        const result = await pgClient.query(query, values);
                        for (let i = 0; i < result.rows.length; i++) {
                            result.rows[i].scoring = {
                                fiability: 40,
                                tipo_vialidad: 100,
                                nombre_vialidad: 0,
                                codigo_postal: 0,
                                municipio: 100,
                                estado: 100
                            };
                            // Calcular la distancia de Levenshtein
                            const distance = levenshteinDistance(result.rows[i].nombre_vialidad, direccionParsed.NOMVIAL);
                            // Calcular la similitud como el inverso de la distancia de Levenshtein
                            const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.NOMVIAL.length);
                            const similarity = ((maxLength - distance) / maxLength) * 100;
                            if (similarity) {
                                result.rows[i].scoring.nombre_vialidad += similarity;
                                result.rows[i].scoring.fiability += (similarity * 0.5);
                            }
                            const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                            if (matchCP) {
                                result.rows[i].scoring.codigo_postal += 100;
                                result.rows[i].scoring.fiability += 10;
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
                                WHERE tipo_vialidad = $1
                                AND municipio = $2
                                AND estado = $3
                                ;
                            `;
                            values = [direccionParsed.TIPOVIAL, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                            const result = await pgClient.query(query, values);
                            for (let i = 0; i < result.rows.length; i++) {
                                result.rows[i].scoring = {
                                    fiability: 40,
                                    tipo_vialidad: 100,
                                    nombre_vialidad: 0,
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
                                    WHERE tipo_vialidad = $1
                                    AND (codigo_postal = '' OR codigo_postal = $2 )
                                    AND municipio = $3
                                    ;
                                `;
                                values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO];
                                const result = await pgClient.query(query, values);
                                for (let i = 0; i < result.rows.length; i++) {
                                    result.rows[i].scoring = {
                                        fiability: 30,
                                        tipo_vialidad: 100,
                                        nombre_vialidad: 0,
                                        codigo_postal: 0,
                                        municipio: 100,
                                        estado: 0
                                    };
                                    // Calcular la distancia de Levenshtein
                                    const distance = levenshteinDistance(result.rows[i].nombre_vialidad, direccionParsed.NOMVIAL);
                                    // Calcular la similitud como el inverso de la distancia de Levenshtein
                                    const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.NOMVIAL.length);
                                    const similarity = ((maxLength - distance) / maxLength) * 100;
                                    if (similarity) {
                                        result.rows[i].scoring.nombre_vialidad += similarity;
                                        result.rows[i].scoring.fiability += (similarity * 0.5);
                                    }
                                    const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                    if (matchCP) {
                                        result.rows[i].scoring.codigo_postal += 100;
                                        result.rows[i].scoring.fiability += 10;
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
                                        WHERE tipo_vialidad = $1
                                        AND (codigo_postal = '' OR codigo_postal = $2 )
                                        AND estado = $3
                                        ;
                                    `;
                                    values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.ESTADO];
                                    const result = await pgClient.query(query, values);
                                    for (let i = 0; i < result.rows.length; i++) {
                                        result.rows[i].scoring = {
                                            fiability: 30,
                                            tipo_vialidad: 100,
                                            nombre_vialidad: 0,
                                            codigo_postal: 0,
                                            municipio: 0,
                                            estado: 100
                                        };
                                        // Calcular la distancia de Levenshtein
                                        const distance = levenshteinDistance(result.rows[i].nombre_vialidad, direccionParsed.NOMVIAL);
                                        // Calcular la similitud como el inverso de la distancia de Levenshtein
                                        const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.NOMVIAL.length);
                                        const similarity = ((maxLength - distance) / maxLength) * 100;
                                        if (similarity) {
                                            result.rows[i].scoring.nombre_vialidad += similarity;
                                            result.rows[i].scoring.fiability += (similarity * 0.5);
                                        }
                                        const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                        if (matchCP) {
                                            result.rows[i].scoring.codigo_postal += 100;
                                            result.rows[i].scoring.fiability += 10;
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
module.exports = sinNumeroExteriorColonia;