const pgClient = require("../../data/conexion");
const { levenshteinDistance } = require("../funciones");

// Aplicable solo en caso de llevar todos los campos
async function sinEstado(direccionParsed) {
    let query = '';
    let values = [];
    let rows = [];
    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
    query = `
        SELECT *,
        ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                        WHEN $4 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                            CASE 
                                                                WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                ELSE 0.5
                                                            END
                                                        WHEN $4 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                            CASE 
                                                                WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                ELSE 0.5
                                                            END
                                                     END)) AS y_centro,
        ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                        WHEN $4 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                            CASE 
                                                                WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                ELSE 0.5
                                                            END
                                                        WHEN $4 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                            CASE 
                                                                WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                ELSE 0.5
                                                            END
                                                     END)) AS x_centro
        FROM carto_geolocalizador
        WHERE nombre_vialidad like '%' || $1 || '%'
        AND (codigo_postal = '' OR codigo_postal = $2 )
        AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
        OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
        AND (colonia = '' OR colonia LIKE '%' || $3 || '%')
        ;
    `;
    values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        result.rows[i].scoring = {
            fiability: 20,
            calle: 0,
            codigo_postal: 0,
            numero_exterior: 100,
            colonia: 0
        };
        const matchNombreCalle = result.rows[i].calle.match(new RegExp(direccionParsed.CALLE, 'i'));
        if (matchNombreCalle) {
            const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
            let igualdad = matchedText.length * 100 / result.rows[i].calle.length;
            if (igualdad > 100) igualdad = 100;
            result.rows[i].scoring.calle += Math.round(igualdad);
            result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
        }
        const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
        if (matchColonia) {
            const matchedText = matchColonia[0]; // Obtiene el texto coincidente
            let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
            if (igualdad > 100) igualdad = 100;
            result.rows[i].scoring.colonia += Math.round(igualdad);
            result.rows[i].scoring.fiability += Math.round(igualdad * 0.15);
        }
        const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
        if (matchCP) {
            result.rows[i].scoring.codigo_postal += 100;
            result.rows[i].scoring.fiability += 15;
        }
    }
    rows = rows.concat(result.rows);
    if (result.rows.length === 0) {
        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
        query = `
            SELECT *,
            ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                            WHEN $3 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                CASE 
                                                                    WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($3 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                    ELSE 0.5
                                                                END
                                                            WHEN $3 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                CASE 
                                                                    WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($3 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                    ELSE 0.5
                                                                END
                                                         END)) AS y_centro,
            ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                            WHEN $3 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                CASE 
                                                                    WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($3 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                    ELSE 0.5
                                                                END
                                                            WHEN $3 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                CASE 
                                                                    WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($3 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                    ELSE 0.5
                                                                END
                                                         END)) AS x_centro
            FROM carto_geolocalizador
            WHERE nombre_vialidad like '%' || $1 || '%'
            AND ((CAST(l_refaddr AS INTEGER) <= $3 AND CAST(l_nrefaddr AS INTEGER) >= $3)
            OR (CAST(r_refaddr AS INTEGER) <= $3 AND CAST(r_nrefaddr AS INTEGER) >= $3))
            AND (colonia = '' OR colonia LIKE '%' || $2 || '%')
            ;
        `;
        values = [direccionParsed.CALLE, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
        const result = await pgClient.query(query, values);
        for (let i = 0; i < result.rows.length; i++) {
            result.rows[i].scoring = {
                fiability: 20,
                calle: 0,
                codigo_postal: 0,
                numero_exterior: 100,
                colonia: 0
            };
            const matchNombreCalle = result.rows[i].calle.match(new RegExp(direccionParsed.CALLE, 'i'));
            if (matchNombreCalle) {
                const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                let igualdad = matchedText.length * 100 / result.rows[i].calle.length;
                if (igualdad > 100) igualdad = 100;
                result.rows[i].scoring.calle += Math.round(igualdad);
                result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
            }
            const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
            if (matchColonia) {
                const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                if (igualdad > 100) igualdad = 100;
                result.rows[i].scoring.colonia += Math.round(igualdad);
                result.rows[i].scoring.fiability += Math.round(igualdad * 0.15);
            }
        }
        rows = rows.concat(result.rows);
        if (result.rows.length === 0) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,
                ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                                WHEN $3 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                    CASE 
                                                                        WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($3 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                        ELSE 0.5
                                                                    END
                                                                WHEN $3 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                    CASE 
                                                                        WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($3 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                        ELSE 0.5
                                                                    END
                                                             END)) AS y_centro,
                ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                                WHEN $3 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                    CASE 
                                                                        WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($3 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                        ELSE 0.5
                                                                    END
                                                                WHEN $3 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                    CASE 
                                                                        WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($3 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                        ELSE 0.5
                                                                    END
                                                             END)) AS x_centro
                FROM carto_geolocalizador
                WHERE nombre_vialidad like '%' || $1 || '%'
                AND (codigo_postal = '' OR codigo_postal = $2 )
                AND ((CAST(l_refaddr AS INTEGER) <= $3 AND CAST(l_nrefaddr AS INTEGER) >= $3)
                OR (CAST(r_refaddr AS INTEGER) <= $3 AND CAST(r_nrefaddr AS INTEGER) >= $3))
                ;
            `;
            values = [direccionParsed.COLONIA, direccionParsed.CP, direccionParsed.NUMEXTNUM1];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 20,
                    calle: 0,
                    codigo_postal: 0,
                    numero_exterior: 100,
                    colonia: 0
                };
                const matchNombreCalle = result.rows[i].calle.match(new RegExp(direccionParsed.COLONIA, 'i'));
                if (matchNombreCalle) {
                    const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                    let igualdad = matchedText.length * 100 / result.rows[i].calle.length;
                    if (igualdad > 100) igualdad = 100;
                    result.rows[i].scoring.calle += Math.round(igualdad);
                    result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                }
                // Calcular la distancia de Levenshtein
                const distanceColonia = levenshteinDistance(result.rows[i].colonia, direccionParsed.COLONIA);
                // Calcular la similitud como el inverso de la distancia de Levenshtein
                const maxLengthColonia = Math.max(result.rows[i].colonia.length, direccionParsed.COLONIA.length);
                const similarityColonia = ((maxLengthColonia - distanceColonia) / maxLengthColonia) * 100;
                if (similarityColonia) {
                    result.rows[i].scoring.colonia += similarityColonia;
                    result.rows[i].scoring.fiability += (similarityColonia * 0.15);
                }
                const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                if (matchCP) {
                    result.rows[i].scoring.codigo_postal += 100;
                    result.rows[i].scoring.fiability += 15;
                }
            }
            rows = rows.concat(result.rows);
            if (result.rows.length === 0) {
                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                query = `
                    SELECT *,
                    ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                                    WHEN $2 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                        CASE 
                                                                            WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($2 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                            ELSE 0.5
                                                                        END
                                                                    WHEN $2 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                        CASE 
                                                                            WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($2 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                            ELSE 0.5
                                                                        END
                                                                 END)) AS y_centro,
                    ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                                    WHEN $2 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                        CASE 
                                                                            WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($2 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                            ELSE 0.5
                                                                        END
                                                                    WHEN $2 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                        CASE 
                                                                            WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($2 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                            ELSE 0.5
                                                                        END
                                                                 END)) AS x_centro
                    FROM carto_geolocalizador
                    WHERE nombre_vialidad like '%' || $1 || '%'
                    AND ((CAST(l_refaddr AS INTEGER) <= $2 AND CAST(l_nrefaddr AS INTEGER) >= $2)
                    OR (CAST(r_refaddr AS INTEGER) <= $2 AND CAST(r_nrefaddr AS INTEGER) >= $2))
                    ;
                `;
                values = [direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
                const result = await pgClient.query(query, values);
                for (let i = 0; i < result.rows.length; i++) {
                    result.rows[i].scoring = {
                        fiability: 20,
                        calle: 0,
                        codigo_postal: 0,
                        numero_exterior: 100,
                        colonia: 0
                    };
                    const matchNombreCalle = result.rows[i].calle.match(new RegExp(direccionParsed.COLONIA, 'i'));
                    if (matchNombreCalle) {
                        const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                        let igualdad = matchedText.length * 100 / result.rows[i].calle.length;
                        if (igualdad > 100) igualdad = 100;
                        result.rows[i].scoring.calle += Math.round(igualdad);
                        result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                    }
                    // Calcular la distancia de Levenshtein
                    const distanceColonia = levenshteinDistance(result.rows[i].colonia, direccionParsed.COLONIA);
                    // Calcular la similitud como el inverso de la distancia de Levenshtein
                    const maxLengthColonia = Math.max(result.rows[i].colonia.length, direccionParsed.COLONIA.length);
                    const similarityColonia = ((maxLengthColonia - distanceColonia) / maxLengthColonia) * 100;
                    if (similarityColonia) {
                        result.rows[i].scoring.colonia += similarityColonia;
                        result.rows[i].scoring.fiability += (similarityColonia * 0.15);
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
                        AND (colonia = '' OR colonia LIKE '%' || $3 || '%')
                        ;
                    `;
                    values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.COLONIA];
                    const result = await pgClient.query(query, values);
                    for (let i = 0; i < result.rows.length; i++) {
                        result.rows[i].scoring = {
                            fiability: 0,
                            calle: 0,
                            codigo_postal: 0,
                            numero_exterior: 0,
                            colonia: 0
                        };
                        const matchNombreCalle = result.rows[i].calle.match(new RegExp(direccionParsed.CALLE, 'i'));
                        if (matchNombreCalle) {
                            const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                            let igualdad = matchedText.length * 100 / result.rows[i].calle.length;
                            if (igualdad > 100) igualdad = 100;
                            result.rows[i].scoring.calle += Math.round(igualdad);
                            result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                        }
                        const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
                        if (matchColonia) {
                            const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                            let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                            if (igualdad > 100) igualdad = 100;
                            result.rows[i].scoring.colonia += Math.round(igualdad);
                            result.rows[i].scoring.fiability += Math.round(igualdad * 0.15);
                        }
                        const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                        if (matchCP) {
                            result.rows[i].scoring.codigo_postal += 100;
                            result.rows[i].scoring.fiability += 15;
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
                            AND (colonia = '' OR colonia LIKE '%' || $2 || '%')
                            ;
                        `;
                        values = [direccionParsed.CALLE, direccionParsed.COLONIA];
                        const result = await pgClient.query(query, values);
                        for (let i = 0; i < result.rows.length; i++) {
                            result.rows[i].scoring = {
                                fiability: 0,
                                calle: 0,
                                codigo_postal: 0,
                                numero_exterior: 0,
                                colonia: 0
                            };
                            const matchNombreCalle = result.rows[i].calle.match(new RegExp(direccionParsed.CALLE, 'i'));
                            if (matchNombreCalle) {
                                const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                let igualdad = matchedText.length * 100 / result.rows[i].calle.length;
                                if (igualdad > 100) igualdad = 100;
                                result.rows[i].scoring.calle += Math.round(igualdad);
                                result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                            }
                            const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
                            if (matchColonia) {
                                const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                                let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                                if (igualdad > 100) igualdad = 100;
                                result.rows[i].scoring.colonia += Math.round(igualdad);
                                result.rows[i].scoring.fiability += Math.round(igualdad * 0.15);
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
                                    numero_exterior: 0,
                                    colonia: 0
                                };
                                const matchNombreCalle = result.rows[i].calle.match(new RegExp(direccionParsed.COLONIA, 'i'));
                                if (matchNombreCalle) {
                                    const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                    let igualdad = matchedText.length * 100 / result.rows[i].calle.length;
                                    if (igualdad > 100) igualdad = 100;
                                    result.rows[i].scoring.calle += Math.round(igualdad);
                                    result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                                }
                                // Calcular la distancia de Levenshtein
                                const distanceColonia = levenshteinDistance(result.rows[i].colonia, direccionParsed.COLONIA);
                                // Calcular la similitud como el inverso de la distancia de Levenshtein
                                const maxLengthColonia = Math.max(result.rows[i].colonia.length, direccionParsed.COLONIA.length);
                                const similarityColonia = ((maxLengthColonia - distanceColonia) / maxLengthColonia) * 100;
                                if (similarityColonia) {
                                    result.rows[i].scoring.colonia += similarityColonia;
                                    result.rows[i].scoring.fiability += (similarityColonia * 0.15);
                                }
                                const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                if (matchCP) {
                                    result.rows[i].scoring.codigo_postal += 100;
                                    result.rows[i].scoring.fiability += 15;
                                }
                            }
                            rows = rows.concat(result.rows);
                            if (result.rows.length === 0) {
                                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                query = `
                                    SELECT *,
                                    ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                                                    WHEN $3 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                                        CASE 
                                                                                            WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($3 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                            ELSE 0.5
                                                                                        END
                                                                                    WHEN $3 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                                        CASE 
                                                                                            WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($3 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                            ELSE 0.5
                                                                                        END
                                                                                 END)) AS y_centro,
                                    ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                                                    WHEN $3 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                                        CASE 
                                                                                            WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($3 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                            ELSE 0.5
                                                                                        END
                                                                                    WHEN $3 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                                        CASE 
                                                                                            WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($3 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                            ELSE 0.5
                                                                                        END
                                                                                 END)) AS x_centro
                                    FROM carto_geolocalizador
                                    WHERE (codigo_postal = '' OR codigo_postal = $1 )
                                    AND ((CAST(l_refaddr AS INTEGER) <= $3 AND CAST(l_nrefaddr AS INTEGER) >= $3)
                                    OR (CAST(r_refaddr AS INTEGER) <= $3 AND CAST(r_nrefaddr AS INTEGER) >= $3))
                                    AND (colonia = '' OR colonia LIKE '%' || $2 || '%')
                                    ;
                                `;
                                values = [direccionParsed.CP, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
                                const result = await pgClient.query(query, values);
                                for (let i = 0; i < result.rows.length; i++) {
                                    result.rows[i].scoring = {
                                        fiability: 20,
                                        calle: 0,
                                        codigo_postal: 0,
                                        numero_exterior: 100,
                                        colonia: 0
                                    };
                                    // Calcular la distancia de Levenshtein
                                    const distance = levenshteinDistance(result.rows[i].calle, direccionParsed.CALLE);
                                    // Calcular la similitud como el inverso de la distancia de Levenshtein
                                    const maxLength = Math.max(result.rows[i].calle.length, direccionParsed.CALLE.length);
                                    const similarity = ((maxLength - distance) / maxLength) * 100;
                                    if (similarity) {
                                        result.rows[i].scoring.calle += similarity;
                                        result.rows[i].scoring.fiability += (similarity * 0.5);
                                    }
                                    const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
                                    if (matchColonia) {
                                        const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                                        let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                                        if (igualdad > 100) igualdad = 100;
                                        result.rows[i].scoring.colonia += Math.round(igualdad);
                                        result.rows[i].scoring.fiability += Math.round(igualdad * 0.15);
                                    }
                                    const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                    if (matchCP) {
                                        result.rows[i].scoring.codigo_postal += 100;
                                        result.rows[i].scoring.fiability += 15;
                                    }
                                }
                                rows = rows.concat(result.rows);
                                if (result.rows.length === 0) {
                                    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                    query = `
                                        SELECT *,
                                        ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                                                        WHEN $2 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                                            CASE 
                                                                                                WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($2 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                ELSE 0.5
                                                                                            END
                                                                                        WHEN $2 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                                            CASE 
                                                                                                WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($2 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                                ELSE 0.5
                                                                                            END
                                                                                     END)) AS y_centro,
                                        ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                                                        WHEN $2 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                                            CASE 
                                                                                                WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($2 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                ELSE 0.5
                                                                                            END
                                                                                        WHEN $2 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                                            CASE 
                                                                                                WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($2 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                                ELSE 0.5
                                                                                            END
                                                                                     END)) AS x_centro
                                        FROM carto_geolocalizador
                                        WHERE ((CAST(l_refaddr AS INTEGER) <= $2 AND CAST(l_nrefaddr AS INTEGER) >= $2)
                                        OR (CAST(r_refaddr AS INTEGER) <= $2 AND CAST(r_nrefaddr AS INTEGER) >= $2))
                                        AND (colonia = '' OR colonia LIKE '%' || $1 || '%')
                                        ;
                                    `;
                                    values = [direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
                                    const result = await pgClient.query(query, values);
                                    for (let i = 0; i < result.rows.length; i++) {
                                        result.rows[i].scoring = {
                                            fiability: 20,
                                            calle: 0,
                                            codigo_postal: 0,
                                            numero_exterior: 100,
                                            colonia: 0
                                        };
                                        // Calcular la distancia de Levenshtein
                                        const distance = levenshteinDistance(result.rows[i].calle, direccionParsed.CALLE);
                                        // Calcular la similitud como el inverso de la distancia de Levenshtein
                                        const maxLength = Math.max(result.rows[i].calle.length, direccionParsed.CALLE.length);
                                        const similarity = ((maxLength - distance) / maxLength) * 100;
                                        if (similarity) {
                                            result.rows[i].scoring.calle += similarity;
                                            result.rows[i].scoring.fiability += (similarity * 0.5);
                                        }
                                        const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
                                        if (matchColonia) {
                                            const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                                            let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                                            if (igualdad > 100) igualdad = 100;
                                            result.rows[i].scoring.colonia += Math.round(igualdad);
                                            result.rows[i].scoring.fiability += Math.round(igualdad * 0.15);
                                        }
                                    }
                                    rows = rows.concat(result.rows);
                                    if (result.rows.length === 0) {
                                        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                        query = `
                                            SELECT *,
                                            ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                                                            WHEN $2 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                                                CASE 
                                                                                                    WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($2 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                    ELSE 0.5
                                                                                                END
                                                                                            WHEN $2 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                                                CASE 
                                                                                                    WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($2 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                                    ELSE 0.5
                                                                                                END
                                                                                         END)) AS y_centro,
                                            ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                                                            WHEN $2 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                                                CASE 
                                                                                                    WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($2 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                    ELSE 0.5
                                                                                                END
                                                                                            WHEN $2 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                                                CASE 
                                                                                                    WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($2 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                                    ELSE 0.5
                                                                                                END
                                                                                         END)) AS x_centro
                                            FROM carto_geolocalizador
                                            WHERE (codigo_postal = '' OR codigo_postal = $1 )
                                            AND ((CAST(l_refaddr AS INTEGER) <= $2 AND CAST(l_nrefaddr AS INTEGER) >= $2)
                                            OR (CAST(r_refaddr AS INTEGER) <= $2 AND CAST(r_nrefaddr AS INTEGER) >= $2))
                                            ;
                                        `;
                                        values = [direccionParsed.CP, direccionParsed.NUMEXTNUM1];
                                        const result = await pgClient.query(query, values);
                                        for (let i = 0; i < result.rows.length; i++) {
                                            result.rows[i].scoring = {
                                                fiability: 30,
                                                calle: 0,
                                                codigo_postal: 0,
                                                municipio: 100,
                                                numero_exterior: 100,
                                                colonia: 0
                                            };
                                            // Calcular la distancia de Levenshtein
                                            const distance = levenshteinDistance(result.rows[i].calle, direccionParsed.COLONIA);
                                            // Calcular la similitud como el inverso de la distancia de Levenshtein
                                            const maxLength = Math.max(result.rows[i].calle.length, direccionParsed.COLONIA.length);
                                            const similarity = ((maxLength - distance) / maxLength) * 100;
                                            if (similarity) {
                                                result.rows[i].scoring.calle += similarity;
                                                result.rows[i].scoring.fiability += (similarity * 0.5);
                                            }
                                            // Calcular la distancia de Levenshtein
                                            const distanceColonia = levenshteinDistance(result.rows[i].colonia, direccionParsed.COLONIA);
                                            // Calcular la similitud como el inverso de la distancia de Levenshtein
                                            const maxLengthColonia = Math.max(result.rows[i].colonia.length, direccionParsed.COLONIA.length);
                                            const similarityColonia = ((maxLengthColonia - distanceColonia) / maxLengthColonia) * 100;
                                            if (similarityColonia) {
                                                result.rows[i].scoring.colonia += similarityColonia;
                                                result.rows[i].scoring.fiability += (similarityColonia * 0.15);
                                            }
                                            const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                            if (matchCP) {
                                                result.rows[i].scoring.codigo_postal += 100;
                                                result.rows[i].scoring.fiability += 15;
                                            }
                                        }
                                        rows = rows.concat(result.rows);
                                        if (result.rows.length === 0) {
                                            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                            query = `
                                                SELECT *,
                                                CASE
                                                    WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5))
                                                    ELSE lat_y
                                                END AS y_centro,
                                                CASE
                                                    WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5))
                                                    ELSE lon_x
                                                END AS x_centro
                                                FROM carto_geolocalizador
                                                WHERE (codigo_postal = '' OR codigo_postal = $1 )
                                                AND (colonia = '' OR colonia LIKE '%' || $2 || '%')
                                                ;
                                            `;
                                            values = [direccionParsed.CP, direccionParsed.COLONIA];
                                            const result = await pgClient.query(query, values);
                                            for (let i = 0; i < result.rows.length; i++) {
                                                result.rows[i].scoring = {
                                                    fiability: 0,
                                                    calle: 0,
                                                    codigo_postal: 0,
                                                    numero_exterior: 0,
                                                    colonia: 0
                                                };
                                                // Calcular la distancia de Levenshtein
                                                const distance = levenshteinDistance(result.rows[i].calle, direccionParsed.CALLE);
                                                // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                const maxLength = Math.max(result.rows[i].calle.length, direccionParsed.CALLE.length);
                                                const similarity = ((maxLength - distance) / maxLength) * 100;
                                                if (similarity) {
                                                    result.rows[i].scoring.calle += similarity;
                                                    result.rows[i].scoring.fiability += (similarity * 0.5);
                                                }
                                                const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
                                                if (matchColonia) {
                                                    const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                                                    let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                                                    if (igualdad > 100) igualdad = 100;
                                                    result.rows[i].scoring.colonia += Math.round(igualdad);
                                                    result.rows[i].scoring.fiability += Math.round(igualdad * 0.15);
                                                }
                                                const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                                if (matchCP) {
                                                    result.rows[i].scoring.codigo_postal += 100;
                                                    result.rows[i].scoring.fiability += 15;
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

module.exports = sinEstado;