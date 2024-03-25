const pgClient = require("../../data/conexion");

// Aplicable solo en caso de llevar todos los campos
async function all(direccionParsed) {
    let query = '';
    let values = [];
    let rows = [];
    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
    query = `
        SELECT *,
        ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                        WHEN $6 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                            CASE 
                                                                WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($6 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                ELSE 0.5
                                                            END
                                                        WHEN $6 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                            CASE 
                                                                WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($6 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                ELSE 0.5
                                                            END
                                                     END)) AS y_centro,
        ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                        WHEN $6 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                            CASE 
                                                                WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($6 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                ELSE 0.5
                                                            END
                                                        WHEN $6 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                            CASE 
                                                                WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($6 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                ELSE 0.5
                                                            END
                                                     END)) AS x_centro
        FROM carto_geolocalizador
        WHERE tipo_vialidad = $1
        AND nombre_vialidad like '%' || $2 || '%'
        AND (codigo_postal = '' OR codigo_postal = $3 )
        AND municipio = $4
        AND estado = $5
        AND ((CAST(l_refaddr AS INTEGER) <= $6 AND CAST(l_nrefaddr AS INTEGER) >= $6)
        OR (CAST(r_refaddr AS INTEGER) <= $6 AND CAST(r_nrefaddr AS INTEGER) >= $6))
        AND (colonia = '' OR colonia LIKE '%' || $7 || '%')
        ;
    `;
    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        result.rows[i].scoring = {
            fiability: 40,
            tipo_vialidad: 100,
            nombre_vialidad: 0,
            codigo_postal: 0,
            municipio: 100,
            estado: 100,
            numero_exterior: 100,
            colonia: 0
        };
        const matchNombreVialidad = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
        if (matchNombreVialidad) {
            const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
            let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
            if (igualdad > 100) igualdad = 100;
            result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
            result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
        }
        const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
        if (matchColonia) {
            const matchedText = matchColonia[0]; // Obtiene el texto coincidente
            let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
            if (igualdad > 100) igualdad = 100;
            result.rows[i].scoring.colonia += Math.round(igualdad);
            result.rows[i].scoring.fiability += Math.round(igualdad) / 20;
        }
        const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
        if (matchCP) {
            result.rows[i].scoring.codigo_postal += 100;
            result.rows[i].scoring.fiability += 5;
        }
    }
    rows = rows.concat(result.rows);
    if (result.rows.length === 0) {
        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
        query = `
            SELECT *,
            ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                            WHEN $5 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                CASE 
                                                                    WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                    ELSE 0.5
                                                                END
                                                            WHEN $5 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                CASE 
                                                                    WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                    ELSE 0.5
                                                                END
                                                         END)) AS y_centro,
            ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                            WHEN $5 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                CASE 
                                                                    WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                    ELSE 0.5
                                                                END
                                                            WHEN $5 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                CASE 
                                                                    WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                    ELSE 0.5
                                                                END
                                                         END)) AS x_centro
            FROM carto_geolocalizador
            WHERE tipo_vialidad = $1
            AND nombre_vialidad like '%' || $2 || '%'
            AND municipio = $3
            AND estado = $4
            AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
            OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
            AND (colonia = '' OR colonia LIKE '%' || $6 || '%')
            ;
        `;
        values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
        const result = await pgClient.query(query, values);
        for (let i = 0; i < result.rows.length; i++) {
            result.rows[i].scoring = {
                fiability: 40,
                tipo_vialidad: 100,
                nombre_vialidad: 0,
                codigo_postal: 0,
                municipio: 100,
                estado: 100,
                numero_exterior: 100,
                colonia: 0
            };
            const matchNombreVialidad = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
            if (matchNombreVialidad) {
                const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
                let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                if (igualdad > 100) igualdad = 100;
                result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
                result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
            }
            const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
            if (matchColonia) {
                const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                if (igualdad > 100) igualdad = 100;
                result.rows[i].scoring.colonia += Math.round(igualdad);
                result.rows[i].scoring.fiability += Math.round(igualdad) / 20;
            }
        }
        rows = rows.concat(result.rows);
        if (result.rows.length === 0) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,
                ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                                WHEN $5 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                    CASE 
                                                                        WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                        ELSE 0.5
                                                                    END
                                                                WHEN $5 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                    CASE 
                                                                        WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                        ELSE 0.5
                                                                    END
                                                             END)) AS y_centro,
                ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                                WHEN $5 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                    CASE 
                                                                        WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                        ELSE 0.5
                                                                    END
                                                                WHEN $5 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                    CASE 
                                                                        WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                        ELSE 0.5
                                                                    END
                                                             END)) AS x_centro
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND (codigo_postal = '' OR codigo_postal = $3 )
                AND estado = $4
                AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
                AND (colonia = '' OR colonia LIKE '%' || $6 || '%')
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 35,
                    tipo_vialidad: 100,
                    nombre_vialidad: 0,
                    codigo_postal: 0,
                    municipio: 0,
                    estado: 100,
                    numero_exterior: 100,
                    colonia: 0
                };
                const matchNombreVialidad = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                if (matchNombreVialidad) {
                    const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
                    let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                    if (igualdad > 100) igualdad = 100;
                    result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
                    result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                }
                const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
                if (matchColonia) {
                    const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                    let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                    if (igualdad > 100) igualdad = 100;
                    result.rows[i].scoring.colonia += Math.round(igualdad);
                    result.rows[i].scoring.fiability += Math.round(igualdad) / 20;
                }
                const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                if (matchCP) {
                    result.rows[i].scoring.codigo_postal += 100;
                    result.rows[i].scoring.fiability += 5;
                }
            }
            rows = rows.concat(result.rows);
            if (result.rows.length === 0) {
                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                query = `
                    SELECT *,
                    ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                                    WHEN $5 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                        CASE 
                                                                            WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                            ELSE 0.5
                                                                        END
                                                                    WHEN $5 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                        CASE 
                                                                            WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                            ELSE 0.5
                                                                        END
                                                                 END)) AS y_centro,
                    ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                                    WHEN $5 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                        CASE 
                                                                            WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                            ELSE 0.5
                                                                        END
                                                                    WHEN $5 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                        CASE 
                                                                            WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                            ELSE 0.5
                                                                        END
                                                                 END)) AS x_centro
                    FROM carto_geolocalizador
                    WHERE tipo_vialidad = $1
                    AND nombre_vialidad like '%' || $2 || '%'
                    AND (codigo_postal = '' OR codigo_postal = $3 )
                    AND municipio = $4
                    AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                    OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
                    AND (colonia = '' OR colonia LIKE '%' || $6 || '%')
                    ;
                `;
                values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
                const result = await pgClient.query(query, values);
                for (let i = 0; i < result.rows.length; i++) {
                    result.rows[i].scoring = {
                        fiability: 35,
                        tipo_vialidad: 100,
                        nombre_vialidad: 0,
                        codigo_postal: 0,
                        municipio: 100,
                        estado: 0,
                        numero_exterior: 100,
                        colonia: 0
                    };
                    const matchNombreVialidad = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                    if (matchNombreVialidad) {
                        const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
                        let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                        if (igualdad > 100) igualdad = 100;
                        result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
                        result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                    }
                    const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
                    if (matchColonia) {
                        const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                        let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                        if (igualdad > 100) igualdad = 100;
                        result.rows[i].scoring.colonia += Math.round(igualdad);
                        result.rows[i].scoring.fiability += Math.round(igualdad) / 20;
                    }
                    const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                    if (matchCP) {
                        result.rows[i].scoring.codigo_postal += 100;
                        result.rows[i].scoring.fiability += 5;
                    }
                }
                rows = rows.concat(result.rows);
                if (result.rows.length === 0) {
                    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                    query = `
                        SELECT *,
                        ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                                        WHEN $5 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                            CASE 
                                                                                WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                ELSE 0.5
                                                                            END
                                                                        WHEN $5 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                            CASE 
                                                                                WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                ELSE 0.5
                                                                            END
                                                                     END)) AS y_centro,
                        ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                                        WHEN $5 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                            CASE 
                                                                                WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                ELSE 0.5
                                                                            END
                                                                        WHEN $5 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                            CASE 
                                                                                WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                ELSE 0.5
                                                                            END
                                                                     END)) AS x_centro
                        FROM carto_geolocalizador
                        WHERE tipo_vialidad = $1
                        AND nombre_vialidad like '%' || $2 || '%'
                        AND (codigo_postal = '' OR codigo_postal = $3 )
                        AND municipio = $4
                        AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                        OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
                        AND estado = $6
                        ;
                    `;
                    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1, direccionParsed.ESTADO];
                    const result = await pgClient.query(query, values);
                    for (let i = 0; i < result.rows.length; i++) {
                        result.rows[i].scoring = {
                            fiability: 40,
                            tipo_vialidad: 100,
                            nombre_vialidad: 0,
                            codigo_postal: 0,
                            municipio: 100,
                            estado: 100,
                            numero_exterior: 100,
                            colonia: 0
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
                            result.rows[i].scoring.fiability += 5;
                        }
                    }
                    rows = rows.concat(result.rows);
                    if (result.rows.length === 0) {
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
                            WHERE tipo_vialidad = $1
                            AND nombre_vialidad like '%' || $2 || '%'
                            AND municipio = $3
                            AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                            OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                            AND estado = $5
                            ;
                        `;
                        values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1, direccionParsed.ESTADO];
                        const result = await pgClient.query(query, values);

                        for (let i = 0; i < result.rows.length; i++) {
                            result.rows[i].scoring = {
                                fiability: 40,
                                tipo_vialidad: 100,
                                nombre_vialidad: 0,
                                codigo_postal: 0,
                                municipio: 100,
                                estado: 100,
                                numero_exterior: 100,
                                colonia: 0
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
                                WHERE tipo_vialidad = $1
                                AND nombre_vialidad like '%' || $2 || '%'
                                AND (codigo_postal = '' OR codigo_postal = $3 )
                                AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                                AND estado = $5
                                ;
                            `;
                            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.NUMEXTNUM1, direccionParsed.ESTADO];
                            const result = await pgClient.query(query, values);

                            for (let i = 0; i < result.rows.length; i++) {
                                result.rows[i].scoring = {
                                    fiability: 35,
                                    tipo_vialidad: 100,
                                    nombre_vialidad: 0,
                                    codigo_postal: 0,
                                    municipio: 0,
                                    estado: 100,
                                    numero_exterior: 100,
                                    colonia: 0
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
                                    result.rows[i].scoring.fiability += 5;
                                }
                            }
                            rows = rows.concat(result.rows);
                            if (result.rows.length === 0) {
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
                                    WHERE tipo_vialidad = $1
                                    AND nombre_vialidad like '%' || $2 || '%'
                                    AND municipio = $3
                                    AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                    OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                                    AND (colonia = '' OR colonia LIKE '%' || $5 || '%')
                                    ;
                                `;
                                values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
                                const result = await pgClient.query(query, values);

                                for (let i = 0; i < result.rows.length; i++) {
                                    result.rows[i].scoring = {
                                        fiability: 45,
                                        tipo_vialidad: 100,
                                        nombre_vialidad: 0,
                                        codigo_postal: 0,
                                        municipio: 100,
                                        estado: 0,
                                        numero_exterior: 100,
                                        colonia: 0
                                    };
                                    const matchNombreVialidad = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                                    if (matchNombreVialidad) {
                                        const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
                                        let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                                        if (igualdad > 100) igualdad = 100;
                                        result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
                                        result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                                    }
                                    const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
                                    if (matchColonia) {
                                        const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                                        let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                                        if (igualdad > 100) igualdad = 100;
                                        result.rows[i].scoring.colonia += Math.round(igualdad);
                                        result.rows[i].scoring.fiability += Math.round(igualdad) / 20;
                                    }
                                }
                                rows = rows.concat(result.rows);
                                if (result.rows.length === 0) {
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
                                        WHERE tipo_vialidad = $1
                                        AND nombre_vialidad like '%' || $2 || '%'
                                        AND (codigo_postal = '' OR codigo_postal = $3 )
                                        AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                        OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                                        AND (colonia = '' OR colonia LIKE '%' || $5 || '%')
                                        ;
                                    `;
                                    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
                                    const result = await pgClient.query(query, values);

                                    for (let i = 0; i < result.rows.length; i++) {
                                        result.rows[i].scoring = {
                                            fiability: 40,
                                            tipo_vialidad: 100,
                                            nombre_vialidad: 0,
                                            codigo_postal: 0,
                                            municipio: 0,
                                            estado: 0,
                                            numero_exterior: 100,
                                            colonia: 0
                                        };
                                        const matchNombreVialidad = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                                        if (matchNombreVialidad) {
                                            const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
                                            let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                                            if (igualdad > 100) igualdad = 100;
                                            result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
                                            result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                                        }
                                        const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
                                        if (matchColonia) {
                                            const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                                            let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                                            if (igualdad > 100) igualdad = 100;
                                            result.rows[i].scoring.colonia += Math.round(igualdad);
                                            result.rows[i].scoring.fiability += Math.round(igualdad) / 20;
                                        }
                                        const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                        if (matchCP) {
                                            result.rows[i].scoring.codigo_postal += 100;
                                            result.rows[i].scoring.fiability += 5;
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
                                            AND municipio = $4
                                            AND estado = $5
                                            AND (colonia = '' OR colonia LIKE '%' || $6 || '%')
                                            ;
                                        `;
                                        values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                        const result = await pgClient.query(query, values);
                                        for (let i = 0; i < result.rows.length; i++) {
                                            result.rows[i].scoring = {
                                                fiability: 40,
                                                tipo_vialidad: 100,
                                                nombre_vialidad: 0,
                                                codigo_postal: 0,
                                                municipio: 100,
                                                estado: 100,
                                                numero_exterior: 0,
                                                colonia: 0
                                            };
                                            const matchNombreVialidad = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                                            if (matchNombreVialidad) {
                                                const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
                                                let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                                                if (igualdad > 100) igualdad = 100;
                                                result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
                                                result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                                            }
                                            const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
                                            if (matchColonia) {
                                                const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                                                let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                                                if (igualdad > 100) igualdad = 100;
                                                result.rows[i].scoring.colonia += Math.round(igualdad);
                                                result.rows[i].scoring.fiability += Math.round(igualdad) / 20;
                                            }
                                            const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                            if (matchCP) {
                                                result.rows[i].scoring.codigo_postal += 100;
                                                result.rows[i].scoring.fiability += 5;
                                            }
                                        }
                                        rows = rows.concat(result.rows);
                                        if (result.rows.length === 0) {
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
                                                WHERE tipo_vialidad = $1
                                                AND nombre_vialidad like '%' || $2 || '%'
                                                AND (codigo_postal = '' OR codigo_postal = $3 )
                                                AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                                                AND municipio = $5
                                                ;
                                            `;
                                            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.NUMEXTNUM1, direccionParsed.MUNICIPIO];
                                            const result = await pgClient.query(query, values);
                                            for (let i = 0; i < result.rows.length; i++) {
                                                result.rows[i].scoring = {
                                                    fiability: 40,
                                                    tipo_vialidad: 100,
                                                    nombre_vialidad: 0,
                                                    codigo_postal: 0,
                                                    municipio: 100,
                                                    estado: 0,
                                                    numero_exterior: 100,
                                                    colonia: 0
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
                                                    result.rows[i].scoring.fiability += 5;
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
                                                    AND municipio = $4
                                                    AND (colonia = '' OR colonia LIKE '%' || $5 || '%')
                                                    ;
                                                `;
                                                values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.COLONIA];
                                                const result = await pgClient.query(query, values);
                                                for (let i = 0; i < result.rows.length; i++) {
                                                    result.rows[i].scoring = {
                                                        fiability: 35,
                                                        tipo_vialidad: 100,
                                                        nombre_vialidad: 0,
                                                        codigo_postal: 0,
                                                        municipio: 100,
                                                        estado: 0,
                                                        numero_exterior: 0,
                                                        colonia: 0
                                                    };
                                                    const matchNombreVialidad = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                                                    if (matchNombreVialidad) {
                                                        const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
                                                        let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                                                        if (igualdad > 100) igualdad = 100;
                                                        result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
                                                        result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                                                    }
                                                    const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
                                                    if (matchColonia) {
                                                        const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                                                        let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                                                        if (igualdad > 100) igualdad = 100;
                                                        result.rows[i].scoring.colonia += Math.round(igualdad);
                                                        result.rows[i].scoring.fiability += Math.round(igualdad) / 20;
                                                    }
                                                    const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                                    if (matchCP) {
                                                        result.rows[i].scoring.codigo_postal += 100;
                                                        result.rows[i].scoring.fiability += 5;
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
                                                        AND (colonia = '' OR colonia LIKE '%' || $5 || '%')
                                                        ;
                                                    `;
                                                    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                                    const result = await pgClient.query(query, values);
                                                    for (let i = 0; i < result.rows.length; i++) {
                                                        result.rows[i].scoring = {
                                                            fiability: 40,
                                                            tipo_vialidad: 100,
                                                            nombre_vialidad: 0,
                                                            codigo_postal: 0,
                                                            municipio: 100,
                                                            estado: 100,
                                                            numero_exterior: 0,
                                                            colonia: 0
                                                        };
                                                        const matchNombreVialidad = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                                                        if (matchNombreVialidad) {
                                                            const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
                                                            let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                                                            if (igualdad > 100) igualdad = 100;
                                                            result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
                                                            result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                                                        }
                                                        const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
                                                        if (matchColonia) {
                                                            const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                                                            let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                                                            if (igualdad > 100) igualdad = 100;
                                                            result.rows[i].scoring.colonia += Math.round(igualdad);
                                                            result.rows[i].scoring.fiability += Math.round(igualdad) / 20;
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
                                                            AND (colonia = '' OR colonia LIKE '%' || $5 || '%')
                                                            ;
                                                        `;
                                                        values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                                        const result = await pgClient.query(query, values);
                                                        for (let i = 0; i < result.rows.length; i++) {
                                                            result.rows[i].scoring = {
                                                                fiability: 35,
                                                                tipo_vialidad: 100,
                                                                nombre_vialidad: 0,
                                                                codigo_postal: 0,
                                                                municipio: 0,
                                                                estado: 100,
                                                                numero_exterior: 0,
                                                                colonia: 0
                                                            };
                                                            const matchNombreVialidad = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                                                            if (matchNombreVialidad) {
                                                                const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
                                                                let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                                                                if (igualdad > 100) igualdad = 100;
                                                                result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
                                                                result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                                                            }
                                                            const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
                                                            if (matchColonia) {
                                                                const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                                                                let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                                                                if (igualdad > 100) igualdad = 100;
                                                                result.rows[i].scoring.colonia += Math.round(igualdad);
                                                                result.rows[i].scoring.fiability += Math.round(igualdad) / 20;
                                                            }
                                                            const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                                            if (matchCP) {
                                                                result.rows[i].scoring.codigo_postal += 100;
                                                                result.rows[i].scoring.fiability += 5;
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
                                                                AND municipio = $5
                                                                ;
                                                            `;
                                                            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.MUNICIPIO];
                                                            const result = await pgClient.query(query, values);
                                                            for (let i = 0; i < result.rows.length; i++) {
                                                                result.rows[i].scoring = {
                                                                    fiability: 30,
                                                                    tipo_vialidad: 100,
                                                                    nombre_vialidad: 0,
                                                                    codigo_postal: 0,
                                                                    municipio: 100,
                                                                    estado: 100,
                                                                    numero_exterior: 0,
                                                                    colonia: 0
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
                                                                    result.rows[i].scoring.fiability += 5;
                                                                }
                                                            }
                                                            rows = rows.concat(result.rows);
                                                            if (result.rows.length === 0) {
                                                                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                                                query = `
                                                                    SELECT *,
                                                                    ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                                                                                    WHEN $5 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                                                                        CASE 
                                                                                                                            WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                                            ELSE 0.5
                                                                                                                        END
                                                                                                                    WHEN $5 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                                                                        CASE 
                                                                                                                            WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                                                            ELSE 0.5
                                                                                                                        END
                                                                                                                 END)) AS y_centro,
                                                                    ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", CASE 
                                                                                                                    WHEN $5 BETWEEN l_refaddr::float AND l_nrefaddr::float THEN 
                                                                                                                        CASE 
                                                                                                                            WHEN l_nrefaddr::float - l_refaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                                            ELSE 0.5
                                                                                                                        END
                                                                                                                    WHEN $5 BETWEEN r_refaddr::float AND r_nrefaddr::float THEN 
                                                                                                                        CASE 
                                                                                                                            WHEN r_nrefaddr::float - r_refaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                                                            ELSE 0.5
                                                                                                                        END
                                                                                                                 END)) AS x_centro
                                                                    FROM carto_geolocalizador
                                                                    WHERE tipo_vialidad = $1
                                                                    AND (codigo_postal = '' OR codigo_postal = $2 )
                                                                    AND municipio = $3
                                                                    AND estado = $4
                                                                    AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                                                                    OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
                                                                    AND (colonia = '' OR colonia LIKE '%' || $6 || '%')
                                                                    ;
                                                                `;
                                                                values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
                                                                const result = await pgClient.query(query, values);
                                                                for (let i = 0; i < result.rows.length; i++) {
                                                                    result.rows[i].scoring = {
                                                                        fiability: 40,
                                                                        tipo_vialidad: 100,
                                                                        nombre_vialidad: 0,
                                                                        codigo_postal: 0,
                                                                        municipio: 100,
                                                                        estado: 100,
                                                                        numero_exterior: 100,
                                                                        colonia: 0
                                                                    };
                                                                    const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
                                                                    if (matchColonia) {
                                                                        const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                                                                        let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                                                                        if (igualdad > 100) igualdad = 100;
                                                                        result.rows[i].scoring.colonia += Math.round(igualdad);
                                                                        result.rows[i].scoring.fiability += Math.round(igualdad) / 20;
                                                                    }
                                                                    const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                                                    if (matchCP) {
                                                                        result.rows[i].scoring.codigo_postal += 100;
                                                                        result.rows[i].scoring.fiability += 5;
                                                                    }
                                                                }
                                                                rows = rows.concat(result.rows);
                                                                if (result.rows.length === 0) {
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
                                                                        WHERE tipo_vialidad = $1
                                                                        AND municipio = $2
                                                                        AND estado = $3
                                                                        AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                                        OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                                                                        AND (colonia = '' OR colonia LIKE '%' || $5 || '%')
                                                                        ;
                                                                    `;
                                                                    values = [direccionParsed.TIPOVIAL, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
                                                                    const result = await pgClient.query(query, values);
                                                                    for (let i = 0; i < result.rows.length; i++) {
                                                                        result.rows[i].scoring = {
                                                                            fiability: 40,
                                                                            tipo_vialidad: 100,
                                                                            nombre_vialidad: 0,
                                                                            codigo_postal: 0,
                                                                            municipio: 100,
                                                                            estado: 100,
                                                                            numero_exterior: 100,
                                                                            colonia: 0
                                                                        };
                                                                        const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
                                                                        if (matchColonia) {
                                                                            const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                                                                            let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                                                                            if (igualdad > 100) igualdad = 100;
                                                                            result.rows[i].scoring.colonia += Math.round(igualdad);
                                                                            result.rows[i].scoring.fiability += Math.round(igualdad) / 20;
                                                                        }
                                                                    }
                                                                    rows = rows.concat(result.rows);
                                                                    if (result.rows.length === 0) {
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
                                                                            WHERE tipo_vialidad = $1
                                                                            AND (codigo_postal = '' OR codigo_postal = $2 )
                                                                            AND municipio = $3
                                                                            AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                                            OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                                                                            AND (colonia = '' OR colonia LIKE '%' || $5 || '%')
                                                                            ;
                                                                        `;
                                                                        values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
                                                                        const result = await pgClient.query(query, values);
                                                                        for (let i = 0; i < result.rows.length; i++) {
                                                                            result.rows[i].scoring = {
                                                                                fiability: 35,
                                                                                tipo_vialidad: 100,
                                                                                nombre_vialidad: 0,
                                                                                codigo_postal: 0,
                                                                                municipio: 100,
                                                                                estado: 0,
                                                                                numero_exterior: 100,
                                                                                colonia: 0
                                                                            };
                                                                            const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
                                                                            if (matchColonia) {
                                                                                const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                                                                                let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                                                                                if (igualdad > 100) igualdad = 100;
                                                                                result.rows[i].scoring.colonia += Math.round(igualdad);
                                                                                result.rows[i].scoring.fiability += Math.round(igualdad) / 20;
                                                                            }
                                                                            const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                                                            if (matchCP) {
                                                                                result.rows[i].scoring.codigo_postal += 100;
                                                                                result.rows[i].scoring.fiability += 5;
                                                                            }
                                                                        }
                                                                        rows = rows.concat(result.rows);
                                                                        if (result.rows.length === 0) {
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
                                                                                WHERE tipo_vialidad = $1
                                                                                AND (codigo_postal = '' OR codigo_postal = $2 )
                                                                                AND estado = $3
                                                                                AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                                                OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                                                                                AND (colonia = '' OR colonia LIKE '%' || $5 || '%')
                                                                                ;
                                                                            `;
                                                                            values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
                                                                            const result = await pgClient.query(query, values);
                                                                            for (let i = 0; i < result.rows.length; i++) {
                                                                                result.rows[i].scoring = {
                                                                                    fiability: 35,
                                                                                    tipo_vialidad: 100,
                                                                                    nombre_vialidad: 0,
                                                                                    codigo_postal: 0,
                                                                                    municipio: 0,
                                                                                    estado: 100,
                                                                                    numero_exterior: 100,
                                                                                    colonia: 0
                                                                                };
                                                                                const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
                                                                                if (matchColonia) {
                                                                                    const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                                                                                    let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                                                                                    if (igualdad > 100) igualdad = 100;
                                                                                    result.rows[i].scoring.colonia += Math.round(igualdad);
                                                                                    result.rows[i].scoring.fiability += Math.round(igualdad) / 20;
                                                                                }
                                                                                const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                                                                if (matchCP) {
                                                                                    result.rows[i].scoring.codigo_postal += 100;
                                                                                    result.rows[i].scoring.fiability += 5;
                                                                                }
                                                                            }
                                                                            rows = rows.concat(result.rows);
                                                                            if (result.rows.length === 0) {
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
                                                                                    WHERE tipo_vialidad = $1
                                                                                    AND (codigo_postal = '' OR codigo_postal = $2 )
                                                                                    AND estado = $3
                                                                                    AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                                                    OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                                                                                    AND municipio = $5
                                                                                    ;
                                                                                `;
                                                                                values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1, direccionParsed.MUNICIPIO];
                                                                                const result = await pgClient.query(query, values);
                                                                                for (let i = 0; i < result.rows.length; i++) {
                                                                                    result.rows[i].scoring = {
                                                                                        fiability: 40,
                                                                                        tipo_vialidad: 100,
                                                                                        nombre_vialidad: 0,
                                                                                        codigo_postal: 0,
                                                                                        municipio: 100,
                                                                                        estado: 100,
                                                                                        numero_exterior: 100,
                                                                                        colonia: 0
                                                                                    };
                                                                                    const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                                                                    if (matchCP) {
                                                                                        result.rows[i].scoring.codigo_postal += 100;
                                                                                        result.rows[i].scoring.fiability += 5;
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
                                                                                        AND municipio = $3
                                                                                        AND estado = $4
                                                                                        AND (colonia = '' OR colonia LIKE '%' || $5 || '%')
                                                                                        ;
                                                                                    `;
                                                                                    values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                                                                    const result = await pgClient.query(query, values);
                                                                                    for (let i = 0; i < result.rows.length; i++) {
                                                                                        result.rows[i].scoring = {
                                                                                            fiability: 30,
                                                                                            tipo_vialidad: 100,
                                                                                            nombre_vialidad: 0,
                                                                                            codigo_postal: 0,
                                                                                            municipio: 100,
                                                                                            estado: 100,
                                                                                            numero_exterior: 0,
                                                                                            colonia: 100
                                                                                        };
                                                                                        const matchColonia = result.rows[i].colonia.match(new RegExp(direccionParsed.COLONIA, 'i'));
                                                                                        if (matchColonia) {
                                                                                            const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                                                                                            let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                                                                                            if (igualdad > 100) igualdad = 100;
                                                                                            result.rows[i].scoring.colonia += Math.round(igualdad);
                                                                                            result.rows[i].scoring.fiability += Math.round(igualdad) / 20;
                                                                                        }
                                                                                        const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                                                                        if (matchCP) {
                                                                                            result.rows[i].scoring.codigo_postal += 100;
                                                                                            result.rows[i].scoring.fiability += 5;
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