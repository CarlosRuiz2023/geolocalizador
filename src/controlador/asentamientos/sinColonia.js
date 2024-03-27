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
        WHERE tipo_asentamiento = $1
        AND nombre_asentamiento like '%' || $2 || '%'
        AND (codigo_postal = '' OR codigo_postal = $3 )
        AND municipio = $4
        AND estado = $5
        AND ((CAST(l_refaddr AS INTEGER) <= $6 AND CAST(l_nrefaddr AS INTEGER) >= $6)
        OR (CAST(r_refaddr AS INTEGER) <= $6 AND CAST(r_nrefaddr AS INTEGER) >= $6))
        ;
    `;
    values = [direccionParsed.TIPOASEN, direccionParsed.NOMASEN, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        result.rows[i].scoring = {
            fiability: 45,
            tipo_asentamiento: 100,
            nombre_asentamiento: 0,
            codigo_postal: 0,
            municipio: 100,
            estado: 100,
            numero_exterior: 100
        };
        const matchNombreAsentamiento = result.rows[i].nombre_asentamiento.match(new RegExp(direccionParsed.NOMASEN, 'i'));
        if (matchNombreAsentamiento) {
            const matchedText = matchNombreAsentamiento[0]; // Obtiene el texto coincidente
            let igualdad = matchedText.length * 100 / result.rows[i].nombre_asentamiento.length;
            if (igualdad > 100) igualdad = 100;
            result.rows[i].scoring.nombre_asentamiento += Math.round(igualdad);
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
            WHERE tipo_asentamiento = $1
            AND nombre_asentamiento like '%' || $2 || '%'
            AND municipio = $3
            AND estado = $4
            AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
            OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
            ;
        `;
        values = [direccionParsed.TIPOASEN, direccionParsed.NOMASEN, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
        const result = await pgClient.query(query, values);
        for (let i = 0; i < result.rows.length; i++) {
            result.rows[i].scoring = {
                fiability: 45,
                tipo_asentamiento: 100,
                nombre_asentamiento: 0,
                codigo_postal: 0,
                municipio: 100,
                estado: 100,
                numero_exterior: 100
            };
            const matchNombreAsentamiento = result.rows[i].nombre_asentamiento.match(new RegExp(direccionParsed.NOMASEN, 'i'));
            if (matchNombreAsentamiento) {
                const matchedText = matchNombreAsentamiento[0]; // Obtiene el texto coincidente
                let igualdad = matchedText.length * 100 / result.rows[i].nombre_asentamiento.length;
                if (igualdad > 100) igualdad = 100;
                result.rows[i].scoring.nombre_asentamiento += Math.round(igualdad);
                result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
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
                WHERE tipo_asentamiento = $1
                AND nombre_asentamiento like '%' || $2 || '%'
                AND (codigo_postal = '' OR codigo_postal = $3 )
                AND estado = $4
                AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
                ;
            `;
            values = [direccionParsed.TIPOASEN, direccionParsed.NOMASEN, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 40,
                    tipo_asentamiento: 100,
                    nombre_asentamiento: 0,
                    codigo_postal: 0,
                    municipio: 0,
                    estado: 100,
                    numero_exterior: 100
                };
                const matchNombreAsentamiento = result.rows[i].nombre_asentamiento.match(new RegExp(direccionParsed.NOMASEN, 'i'));
                if (matchNombreAsentamiento) {
                    const matchedText = matchNombreAsentamiento[0]; // Obtiene el texto coincidente
                    let igualdad = matchedText.length * 100 / result.rows[i].nombre_asentamiento.length;
                    if (igualdad > 100) igualdad = 100;
                    result.rows[i].scoring.nombre_asentamiento += Math.round(igualdad);
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
                    WHERE tipo_asentamiento = $1
                    AND nombre_asentamiento like '%' || $2 || '%'
                    AND (codigo_postal = '' OR codigo_postal = $3 )
                    AND municipio = $4
                    AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                    OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
                    ;
                `;
                values = [direccionParsed.TIPOASEN, direccionParsed.NOMASEN, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1];
                const result = await pgClient.query(query, values);
                for (let i = 0; i < result.rows.length; i++) {
                    result.rows[i].scoring = {
                        fiability: 40,
                        tipo_asentamiento: 100,
                        nombre_asentamiento: 0,
                        codigo_postal: 0,
                        municipio: 100,
                        estado: 0,
                        numero_exterior: 100
                    };
                    const matchNombreAsentamiento = result.rows[i].nombre_asentamiento.match(new RegExp(direccionParsed.NOMASEN, 'i'));
                    if (matchNombreAsentamiento) {
                        const matchedText = matchNombreAsentamiento[0]; // Obtiene el texto coincidente
                        let igualdad = matchedText.length * 100 / result.rows[i].nombre_asentamiento.length;
                        if (igualdad > 100) igualdad = 100;
                        result.rows[i].scoring.nombre_asentamiento += Math.round(igualdad);
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
                        WHERE tipo_asentamiento = $1
                        AND nombre_asentamiento like '%' || $2 || '%'
                        AND municipio = $3
                        AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                        OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                        ;
                    `;
                    values = [direccionParsed.TIPOASEN, direccionParsed.NOMASEN, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1];
                    const result = await pgClient.query(query, values);
                    for (let i = 0; i < result.rows.length; i++) {
                        result.rows[i].scoring = {
                            fiability: 40,
                            tipo_asentamiento: 100,
                            nombre_asentamiento: 0,
                            codigo_postal: 0,
                            municipio: 100,
                            estado: 0,
                            numero_exterior: 100
                        };
                        const matchNombreAsentamiento = result.rows[i].nombre_asentamiento.match(new RegExp(direccionParsed.NOMASEN, 'i'));
                        if (matchNombreAsentamiento) {
                            const matchedText = matchNombreAsentamiento[0]; // Obtiene el texto coincidente
                            let igualdad = matchedText.length * 100 / result.rows[i].nombre_asentamiento.length;
                            if (igualdad > 100) igualdad = 100;
                            result.rows[i].scoring.nombre_asentamiento += Math.round(igualdad);
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
                            WHERE tipo_asentamiento = $1
                            AND nombre_asentamiento like '%' || $2 || '%'
                            AND (codigo_postal = '' OR codigo_postal = $3 )
                            AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                            OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                            ;
                        `;
                        values = [direccionParsed.TIPOASEN, direccionParsed.NOMASEN, direccionParsed.CP, direccionParsed.NUMEXTNUM1];
                        const result = await pgClient.query(query, values);
                        for (let i = 0; i < result.rows.length; i++) {
                            result.rows[i].scoring = {
                                fiability: 35,
                                tipo_asentamiento: 100,
                                nombre_asentamiento: 0,
                                codigo_postal: 0,
                                municipio: 0,
                                estado: 0,
                                numero_exterior: 100
                            };
                            const matchNombreAsentamiento = result.rows[i].nombre_asentamiento.match(new RegExp(direccionParsed.NOMASEN, 'i'));
                            if (matchNombreAsentamiento) {
                                const matchedText = matchNombreAsentamiento[0]; // Obtiene el texto coincidente
                                let igualdad = matchedText.length * 100 / result.rows[i].nombre_asentamiento.length;
                                if (igualdad > 100) igualdad = 100;
                                result.rows[i].scoring.nombre_asentamiento += Math.round(igualdad);
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
                                WHERE tipo_asentamiento = $1
                                AND nombre_asentamiento like '%' || $2 || '%'
                                AND (codigo_postal = '' OR codigo_postal = $3 )
                                AND municipio = $4
                                AND estado = $5
                                ;
                            `;
                            values = [direccionParsed.TIPOASEN, direccionParsed.NOMASEN, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                            const result = await pgClient.query(query, values);
                            for (let i = 0; i < result.rows.length; i++) {
                                result.rows[i].scoring = {
                                    fiability: 40,
                                    tipo_asentamiento: 100,
                                    nombre_asentamiento: 0,
                                    codigo_postal: 0,
                                    municipio: 100,
                                    estado: 100,
                                    numero_exterior: 0
                                };
                                const matchNombreAsentamiento = result.rows[i].nombre_asentamiento.match(new RegExp(direccionParsed.NOMASEN, 'i'));
                                if (matchNombreAsentamiento) {
                                    const matchedText = matchNombreAsentamiento[0]; // Obtiene el texto coincidente
                                    let igualdad = matchedText.length * 100 / result.rows[i].nombre_asentamiento.length;
                                    if (igualdad > 100) igualdad = 100;
                                    result.rows[i].scoring.nombre_asentamiento += Math.round(igualdad);
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
                                    WHERE tipo_asentamiento = $1
                                    AND nombre_asentamiento like '%' || $2 || '%'
                                    AND (codigo_postal = '' OR codigo_postal = $3 )
                                    AND municipio = $4
                                    ;
                                `;
                                values = [direccionParsed.TIPOASEN, direccionParsed.NOMASEN, direccionParsed.CP, direccionParsed.MUNICIPIO];
                                const result = await pgClient.query(query, values);
                                for (let i = 0; i < result.rows.length; i++) {
                                    result.rows[i].scoring = {
                                        fiability: 30,
                                        tipo_asentamiento: 100,
                                        nombre_asentamiento: 0,
                                        codigo_postal: 0,
                                        municipio: 100,
                                        estado: 0,
                                        numero_exterior: 0
                                    };
                                    const matchNombreAsentamiento = result.rows[i].nombre_asentamiento.match(new RegExp(direccionParsed.NOMASEN, 'i'));
                                    if (matchNombreAsentamiento) {
                                        const matchedText = matchNombreAsentamiento[0]; // Obtiene el texto coincidente
                                        let igualdad = matchedText.length * 100 / result.rows[i].nombre_asentamiento.length;
                                        if (igualdad > 100) igualdad = 100;
                                        result.rows[i].scoring.nombre_asentamiento += Math.round(igualdad);
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
                                        WHERE tipo_asentamiento = $1
                                        AND nombre_asentamiento like '%' || $2 || '%'
                                        AND municipio = $3
                                        AND estado = $4
                                        ;
                                    `;
                                    values = [direccionParsed.TIPOASEN, direccionParsed.NOMASEN, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                                    const result = await pgClient.query(query, values);
                                    for (let i = 0; i < result.rows.length; i++) {
                                        result.rows[i].scoring = {
                                            fiability: 30,
                                            tipo_asentamiento: 100,
                                            nombre_asentamiento: 0,
                                            codigo_postal: 0,
                                            municipio: 100,
                                            estado: 100,
                                            numero_exterior: 0
                                        };
                                        const matchNombreAsentamiento = result.rows[i].nombre_asentamiento.match(new RegExp(direccionParsed.NOMASEN, 'i'));
                                        if (matchNombreAsentamiento) {
                                            const matchedText = matchNombreAsentamiento[0]; // Obtiene el texto coincidente
                                            let igualdad = matchedText.length * 100 / result.rows[i].nombre_asentamiento.length;
                                            if (igualdad > 100) igualdad = 100;
                                            result.rows[i].scoring.nombre_asentamiento += Math.round(igualdad);
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
                                            WHERE tipo_asentamiento = $1
                                            AND nombre_asentamiento like '%' || $2 || '%'
                                            AND (codigo_postal = '' OR codigo_postal = $3 )
                                            AND estado = $4
                                            ;
                                        `;
                                        values = [direccionParsed.TIPOASEN, direccionParsed.NOMASEN, direccionParsed.CP, direccionParsed.ESTADO];
                                        const result = await pgClient.query(query, values);
                                        for (let i = 0; i < result.rows.length; i++) {
                                            result.rows[i].scoring = {
                                                fiability: 25,
                                                tipo_asentamiento: 100,
                                                nombre_asentamiento: 0,
                                                codigo_postal: 0,
                                                municipio: 0,
                                                estado: 100,
                                                numero_exterior: 0
                                            };
                                            const matchNombreAsentamiento = result.rows[i].nombre_asentamiento.match(new RegExp(direccionParsed.NOMASEN, 'i'));
                                            if (matchNombreAsentamiento) {
                                                const matchedText = matchNombreAsentamiento[0]; // Obtiene el texto coincidente
                                                let igualdad = matchedText.length * 100 / result.rows[i].nombre_asentamiento.length;
                                                if (igualdad > 100) igualdad = 100;
                                                result.rows[i].scoring.nombre_asentamiento += Math.round(igualdad);
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
                                                WHERE tipo_asentamiento = $1
                                                AND (codigo_postal = '' OR codigo_postal = $2 )
                                                AND municipio = $3
                                                AND estado = $4
                                                AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                                                OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
                                                ;
                                            `;
                                            values = [direccionParsed.TIPOASEN, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
                                            const result = await pgClient.query(query, values);
                                            for (let i = 0; i < result.rows.length; i++) {
                                                result.rows[i].scoring = {
                                                    fiability: 45,
                                                    tipo_asentamiento: 100,
                                                    nombre_asentamiento: 0,
                                                    codigo_postal: 0,
                                                    municipio: 100,
                                                    estado: 100,
                                                    numero_exterior: 100
                                                };
                                                // Calcular la distancia de Levenshtein
                                                const distance = levenshteinDistance(result.rows[i].nombre_asentamiento, direccionParsed.NOMASEN);
                                                // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                const maxLength = Math.max(result.rows[i].nombre_asentamiento.length, direccionParsed.NOMASEN.length);
                                                const similarity = ((maxLength - distance) / maxLength) * 100;
                                                if (similarity) {
                                                    result.rows[i].scoring.nombre_asentamiento += similarity;
                                                    result.rows[i].scoring.fiability += (similarity * 0.5);
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
                                                    WHERE tipo_asentamiento = $1
                                                    AND municipio = $2
                                                    AND estado = $3
                                                    AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                    OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                                                    ;
                                                `;
                                                values = [direccionParsed.TIPOASEN, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
                                                const result = await pgClient.query(query, values);
                                                for (let i = 0; i < result.rows.length; i++) {
                                                    result.rows[i].scoring = {
                                                        fiability: 45,
                                                        tipo_asentamiento: 100,
                                                        nombre_asentamiento: 0,
                                                        codigo_postal: 0,
                                                        municipio: 100,
                                                        estado: 100,
                                                        numero_exterior: 100
                                                    };
                                                    // Calcular la distancia de Levenshtein
                                                    const distance = levenshteinDistance(result.rows[i].nombre_asentamiento, direccionParsed.NOMASEN);
                                                    // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                    const maxLength = Math.max(result.rows[i].nombre_asentamiento.length, direccionParsed.NOMASEN.length);
                                                    const similarity = ((maxLength - distance) / maxLength) * 100;
                                                    if (similarity) {
                                                        result.rows[i].scoring.nombre_asentamiento += similarity;
                                                        result.rows[i].scoring.fiability += (similarity * 0.5);
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
                                                        WHERE tipo_asentamiento = $1
                                                        AND (codigo_postal = '' OR codigo_postal = $2 )
                                                        AND municipio = $3
                                                        AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                        OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                                                        ;
                                                    `;
                                                    values = [direccionParsed.TIPOASEN, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1];
                                                    const result = await pgClient.query(query, values);
                                                    for (let i = 0; i < result.rows.length; i++) {
                                                        result.rows[i].scoring = {
                                                            fiability: 40,
                                                            tipo_asentamiento: 100,
                                                            nombre_asentamiento: 0,
                                                            codigo_postal: 0,
                                                            municipio: 100,
                                                            estado: 0,
                                                            numero_exterior: 100
                                                        };
                                                        // Calcular la distancia de Levenshtein
                                                        const distance = levenshteinDistance(result.rows[i].nombre_asentamiento, direccionParsed.NOMASEN);
                                                        // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                        const maxLength = Math.max(result.rows[i].nombre_asentamiento.length, direccionParsed.NOMASEN.length);
                                                        const similarity = ((maxLength - distance) / maxLength) * 100;
                                                        if (similarity) {
                                                            result.rows[i].scoring.nombre_asentamiento += similarity;
                                                            result.rows[i].scoring.fiability += (similarity * 0.5);
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
                                                            WHERE tipo_asentamiento = $1
                                                            AND (codigo_postal = '' OR codigo_postal = $2 )
                                                            AND estado = $3
                                                            AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                            OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                                                            ;
                                                        `;
                                                        values = [direccionParsed.TIPOASEN, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
                                                        const result = await pgClient.query(query, values);
                                                        for (let i = 0; i < result.rows.length; i++) {
                                                            result.rows[i].scoring = {
                                                                fiability: 40,
                                                                tipo_asentamiento: 100,
                                                                nombre_asentamiento: 0,
                                                                codigo_postal: 0,
                                                                municipio: 0,
                                                                estado: 100,
                                                                numero_exterior: 100
                                                            };
                                                            // Calcular la distancia de Levenshtein
                                                            const distance = levenshteinDistance(result.rows[i].nombre_asentamiento, direccionParsed.NOMASEN);
                                                            // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                            const maxLength = Math.max(result.rows[i].nombre_asentamiento.length, direccionParsed.NOMASEN.length);
                                                            const similarity = ((maxLength - distance) / maxLength) * 100;
                                                            if (similarity) {
                                                                result.rows[i].scoring.nombre_asentamiento += similarity;
                                                                result.rows[i].scoring.fiability += (similarity * 0.5);
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
                                                                CASE
                                                                    WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5))
                                                                    ELSE lat_y
                                                                END AS y_centro,
                                                                CASE
                                                                    WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5))
                                                                    ELSE lon_x
                                                                END AS x_centro
                                                                FROM carto_geolocalizador
                                                                WHERE tipo_asentamiento = $1
                                                                AND (codigo_postal = '' OR codigo_postal = $2 )
                                                                AND municipio = $3
                                                                AND estado = $4
                                                                ;
                                                            `;
                                                            values = [direccionParsed.TIPOASEN, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                                                            const result = await pgClient.query(query, values);
                                                            for (let i = 0; i < result.rows.length; i++) {
                                                                result.rows[i].scoring = {
                                                                    fiability: 30,
                                                                    tipo_asentamiento: 100,
                                                                    nombre_asentamiento: 0,
                                                                    codigo_postal: 0,
                                                                    municipio: 100,
                                                                    estado: 100,
                                                                    numero_exterior: 0
                                                                };
                                                                // Calcular la distancia de Levenshtein
                                                                const distance = levenshteinDistance(result.rows[i].nombre_asentamiento, direccionParsed.NOMASEN);
                                                                // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                                const maxLength = Math.max(result.rows[i].nombre_asentamiento.length, direccionParsed.NOMASEN.length);
                                                                const similarity = ((maxLength - distance) / maxLength) * 100;
                                                                if (similarity) {
                                                                    result.rows[i].scoring.nombre_asentamiento += similarity;
                                                                    result.rows[i].scoring.fiability += (similarity * 0.5);
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
    return rows;
}
module.exports = sinColonia;