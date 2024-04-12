const pgClient = require("../../data/conexion");
const { levenshteinDistance, quitarAcentos } = require("../funciones");

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
        FROM carto_colonia
        WHERE codigo_postal = $1
        AND unaccent(municipio) = $2
        AND unaccent(estado) = $3
        AND unaccent(colonia) LIKE '%' || $4 || '%'
        ;
    `;
    values = [direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        result.rows[i].scoring = {
            fiability: 50,
            colonia: 0,
            codigo_postal: 100,
            municipio: 100,
            estado: 100
        };
        const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
        const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
        if (matchColonia) {
            const matchedText = matchColonia[0]; // Obtiene el texto coincidente
            let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
            if (igualdad > 100) igualdad = 100;
            result.rows[i].scoring.colonia += Math.round(igualdad);
            result.rows[i].scoring.fiability += Math.round(igualdad * 0.5);
        }
    }
    rows = rows.concat(result.rows);
    if (result.rows.length === 0) {
        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
        query = `
            SELECT *,
            ST_Y(ST_Centroid("SP_GEOMETRY")) AS x_centro,
            ST_X(ST_Centroid("SP_GEOMETRY")) AS y_centro
            FROM carto_colonia
            WHERE unaccent(municipio) = $1
            AND unaccent(estado) = $2
            AND unaccent(colonia) LIKE '%' || $3 || '%'
            ;
        `;
        values = [direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA];
        const result = await pgClient.query(query, values);
        for (let i = 0; i < result.rows.length; i++) {
            result.rows[i].scoring = {
                fiability: 30,
                colonia: 0,
                codigo_postal: 0,
                municipio: 100,
                estado: 100
            };
            const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
            const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
            if (matchColonia) {
                const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                if (igualdad > 100) igualdad = 100;
                result.rows[i].scoring.colonia += Math.round(igualdad);
                result.rows[i].scoring.fiability += Math.round(igualdad * 0.5);
            }
        }
        rows = rows.concat(result.rows);
        if (result.rows.length === 0) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,
                ST_Y(ST_Centroid("SP_GEOMETRY")) AS x_centro,
                ST_X(ST_Centroid("SP_GEOMETRY")) AS y_centro
                FROM carto_colonia
                WHERE codigo_postal = $1
                AND unaccent(estado) = $2
                AND unaccent(colonia) LIKE '%' || $3 || '%'
                ;
            `;
            values = [direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.COLONIA];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 30,
                    colonia: 0,
                    codigo_postal: 100,
                    municipio: 0,
                    estado: 100
                };
                const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
                const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
                if (matchColonia) {
                    const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                    let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                    if (igualdad > 100) igualdad = 100;
                    result.rows[i].scoring.colonia += Math.round(igualdad);
                    result.rows[i].scoring.fiability += Math.round(igualdad * 0.5);
                }
            }
            rows = rows.concat(result.rows);
            if (result.rows.length === 0) {
                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                query = `
                    SELECT *,
                    ST_Y(ST_Centroid("SP_GEOMETRY")) AS x_centro,
                    ST_X(ST_Centroid("SP_GEOMETRY")) AS y_centro
                    FROM carto_colonia
                    WHERE codigo_postal = $1
                    AND unaccent(municipio) = $2
                    AND unaccent(colonia) LIKE '%' || $3 || '%'
                    ;
                `;
                values = [direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.COLONIA];
                const result = await pgClient.query(query, values);
                for (let i = 0; i < result.rows.length; i++) {
                    result.rows[i].scoring = {
                        fiability: 40,
                        colonia: 0,
                        codigo_postal: 100,
                        municipio: 100,
                        estado: 0
                    };
                    const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
                    const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
                    if (matchColonia) {
                        const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                        let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                        if (igualdad > 100) igualdad = 100;
                        result.rows[i].scoring.colonia += Math.round(igualdad);
                        result.rows[i].scoring.fiability += Math.round(igualdad * 0.5);
                    }
                }
                rows = rows.concat(result.rows);
                if (result.rows.length === 0) {
                    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                    query = `
                        SELECT *,
                        ST_Y(ST_Centroid("SP_GEOMETRY")) AS x_centro,
                        ST_X(ST_Centroid("SP_GEOMETRY")) AS y_centro
                        FROM carto_colonia
                        WHERE unaccent(municipio) = $1
                        AND unaccent(colonia) LIKE '%' || $2 || '%'
                        ;
                    `;
                    values = [direccionParsed.MUNICIPIO, direccionParsed.COLONIA];
                    const result = await pgClient.query(query, values);
                    for (let i = 0; i < result.rows.length; i++) {
                        result.rows[i].scoring = {
                            fiability: 20,
                            colonia: 0,
                            codigo_postal: 0,
                            municipio: 100,
                            estado: 0
                        };
                        const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
                        const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
                        if (matchColonia) {
                            const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                            let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                            if (igualdad > 100) igualdad = 100;
                            result.rows[i].scoring.colonia += Math.round(igualdad);
                            result.rows[i].scoring.fiability += Math.round(igualdad * 0.5);
                        }
                    }
                    rows = rows.concat(result.rows);
                    if (result.rows.length === 0) {
                        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                        query = `
                            SELECT *,
                            ST_Y(ST_Centroid("SP_GEOMETRY")) AS x_centro,
                            ST_X(ST_Centroid("SP_GEOMETRY")) AS y_centro
                            FROM carto_colonia
                            WHERE codigo_postal = $1
                            AND unaccent(colonia) LIKE '%' || $2 || '%'
                            ;
                        `;
                        values = [direccionParsed.CP, direccionParsed.COLONIA];
                        const result = await pgClient.query(query, values);
                        for (let i = 0; i < result.rows.length; i++) {
                            result.rows[i].scoring = {
                                fiability: 20,
                                colonia: 0,
                                codigo_postal: 100,
                                municipio: 0,
                                estado: 0
                            };
                            const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
                            const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
                            if (matchColonia) {
                                const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                                let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                                if (igualdad > 100) igualdad = 100;
                                result.rows[i].scoring.colonia += Math.round(igualdad);
                                result.rows[i].scoring.fiability += Math.round(igualdad * 0.5);
                            }
                        }
                        rows = rows.concat(result.rows);
                        if (result.rows.length === 0) {
                            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                            query = `
                                SELECT *,
                                ST_Y(ST_Centroid("SP_GEOMETRY")) AS x_centro,
                                ST_X(ST_Centroid("SP_GEOMETRY")) AS y_centro
                                FROM carto_colonia
                                WHERE unaccent(estado) = $1
                                AND unaccent(colonia) LIKE '%' || $2 || '%'
                                ;
                            `;
                            values = [direccionParsed.ESTADO, direccionParsed.COLONIA];
                            const result = await pgClient.query(query, values);
                            for (let i = 0; i < result.rows.length; i++) {
                                result.rows[i].scoring = {
                                    fiability: 10,
                                    colonia: 0,
                                    codigo_postal: 0,
                                    municipio: 0,
                                    estado: 100
                                };
                                const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
                                const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
                                if (matchColonia) {
                                    const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                                    let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                                    if (igualdad > 100) igualdad = 100;
                                    result.rows[i].scoring.colonia += Math.round(igualdad);
                                    result.rows[i].scoring.fiability += Math.round(igualdad * 0.5);
                                }
                            }
                            rows = rows.concat(result.rows);
                            if (result.rows.length === 0) {
                                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                query = `
                                    SELECT *,
                                    ST_Y(ST_Centroid("SP_GEOMETRY")) AS x_centro,
                                    ST_X(ST_Centroid("SP_GEOMETRY")) AS y_centro
                                    FROM carto_colonia
                                    WHERE codigo_postal = $1
                                    AND unaccent(municipio) = $2
                                    AND unaccent(estado) = $3
                                    ;
                                `;
                                values = [direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                                const result = await pgClient.query(query, values);
                                for (let i = 0; i < result.rows.length; i++) {
                                    result.rows[i].scoring = {
                                        fiability: 50,
                                        colonia: 0,
                                        codigo_postal: 100,
                                        municipio: 100,
                                        estado: 100
                                    };
                                    // Calcular la distancia de Levenshtein
                                    const distanceColonia = levenshteinDistance(result.rows[i].colonia, direccionParsed.COLONIA);
                                    // Calcular la similitud como el inverso de la distancia de Levenshtein
                                    const maxLengthColonia = Math.max(result.rows[i].colonia.length, direccionParsed.COLONIA.length);
                                    const similarityColonia = ((maxLengthColonia - distanceColonia) / maxLengthColonia) * 100;
                                    if (similarityColonia) {
                                        result.rows[i].scoring.colonia += similarityColonia;
                                        result.rows[i].scoring.fiability += (similarityColonia * 0.5);
                                    }
                                }
                                rows = rows.concat(result.rows);
                                if (result.rows.length === 0) {
                                    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                    query = `
                                        SELECT *,
                                        ST_Y(ST_Centroid("SP_GEOMETRY")) AS x_centro,
                                        ST_X(ST_Centroid("SP_GEOMETRY")) AS y_centro
                                        FROM carto_colonia
                                        WHERE unaccent(municipio) = $1
                                        AND unaccent(estado) = $2
                                        ;
                                    `;
                                    values = [direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                                    const result = await pgClient.query(query, values);
                                    for (let i = 0; i < result.rows.length; i++) {
                                        result.rows[i].scoring = {
                                            fiability: 30,
                                            colonia: 0,
                                            codigo_postal: 0,
                                            municipio: 100,
                                            estado: 100
                                        };
                                        // Calcular la distancia de Levenshtein
                                        const distanceColonia = levenshteinDistance(result.rows[i].colonia, direccionParsed.COLONIA);
                                        // Calcular la similitud como el inverso de la distancia de Levenshtein
                                        const maxLengthColonia = Math.max(result.rows[i].colonia.length, direccionParsed.COLONIA.length);
                                        const similarityColonia = ((maxLengthColonia - distanceColonia) / maxLengthColonia) * 100;
                                        if (similarityColonia) {
                                            result.rows[i].scoring.colonia += similarityColonia;
                                            result.rows[i].scoring.fiability += (similarityColonia * 0.5);
                                        }
                                    }
                                    rows = rows.concat(result.rows);
                                    if (result.rows.length === 0) {
                                        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                        query = `
                                            SELECT *,
                                            ST_Y(ST_Centroid("SP_GEOMETRY")) AS x_centro,
                                            ST_X(ST_Centroid("SP_GEOMETRY")) AS y_centro
                                            FROM carto_colonia
                                            WHERE codigo_postal = $1
                                            AND unaccent(estado) = $2
                                            ;
                                        `;
                                        values = [direccionParsed.CP, direccionParsed.ESTADO];
                                        const result = await pgClient.query(query, values);
                                        for (let i = 0; i < result.rows.length; i++) {
                                            result.rows[i].scoring = {
                                                fiability: 30,
                                                colonia: 0,
                                                codigo_postal: 100,
                                                municipio: 0,
                                                estado: 100
                                            };
                                            // Calcular la distancia de Levenshtein
                                            const distanceColonia = levenshteinDistance(result.rows[i].colonia, direccionParsed.COLONIA);
                                            // Calcular la similitud como el inverso de la distancia de Levenshtein
                                            const maxLengthColonia = Math.max(result.rows[i].colonia.length, direccionParsed.COLONIA.length);
                                            const similarityColonia = ((maxLengthColonia - distanceColonia) / maxLengthColonia) * 100;
                                            if (similarityColonia) {
                                                result.rows[i].scoring.colonia += similarityColonia;
                                                result.rows[i].scoring.fiability += (similarityColonia * 0.5);
                                            }
                                        }
                                        rows = rows.concat(result.rows);
                                        if (result.rows.length === 0) {
                                            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                            query = `
                                                SELECT *,
                                                ST_Y(ST_Centroid("SP_GEOMETRY")) AS x_centro,
                                                ST_X(ST_Centroid("SP_GEOMETRY")) AS y_centro
                                                FROM carto_colonia
                                                WHERE codigo_postal = $1
                                                AND unaccent(municipio) = $2
                                                ;
                                            `;
                                            values = [direccionParsed.CP, direccionParsed.MUNICIPIO];
                                            const result = await pgClient.query(query, values);
                                            for (let i = 0; i < result.rows.length; i++) {
                                                result.rows[i].scoring = {
                                                    fiability: 40,
                                                    colonia: 0,
                                                    codigo_postal: 100,
                                                    municipio: 100,
                                                    estado: 0
                                                };
                                                // Calcular la distancia de Levenshtein
                                                const distanceColonia = levenshteinDistance(result.rows[i].colonia, direccionParsed.COLONIA);
                                                // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                const maxLengthColonia = Math.max(result.rows[i].colonia.length, direccionParsed.COLONIA.length);
                                                const similarityColonia = ((maxLengthColonia - distanceColonia) / maxLengthColonia) * 100;
                                                if (similarityColonia) {
                                                    result.rows[i].scoring.colonia += similarityColonia;
                                                    result.rows[i].scoring.fiability += (similarityColonia * 0.5);
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
        }
    }
    return rows;
}
module.exports = all;