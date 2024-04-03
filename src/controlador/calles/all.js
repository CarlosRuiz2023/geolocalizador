const pgClient = require("../../data/conexion");
const { levenshteinDistance } = require("../funciones");

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
                                                        WHEN $6 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                            CASE 
                                                                WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($6 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                ELSE 0.5
                                                            END
                                                        WHEN $6 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                            CASE 
                                                                WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($6 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                        WHEN $6 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                            CASE 
                                                                WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($6 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                ELSE 0.5
                                                            END
                                                        WHEN $6 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                            CASE 
                                                                WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($6 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                ELSE 0.5
                                                            END
                                                     END)) AS x_centro
        FROM carto_geolocalizador
        WHERE nombre_vialidad like '%' || $1 || '%'
        AND codigo_postal = $2 
        AND municipio = $3
        AND estado = $4
        AND (((CAST(l_refaddr AS INTEGER) <= $6 AND CAST(l_nrefaddr AS INTEGER) >= $6)
        OR (CAST(r_refaddr AS INTEGER) <= $6 AND CAST(r_nrefaddr AS INTEGER) >= $6)) 
        OR ((CAST(l_refaddr AS INTEGER) >= $6 AND CAST(l_nrefaddr AS INTEGER) <= $6)
        OR (CAST(r_refaddr AS INTEGER) >= $6 AND CAST(r_nrefaddr AS INTEGER) <= $6)))
        AND colonia LIKE '%' || $5 || '%'
        ;
    `;
    values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        result.rows[i].scoring = {
            fiability: 40,
            calle: 0,
            codigo_postal: 100,
            municipio: 100,
            estado: 100,
            numero_exterior: 100,
            colonia: 0
        };
        const matchNombreCalle = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.CALLE, 'i'));
        if (matchNombreCalle) {
            const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
            let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
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
            result.rows[i].scoring.fiability += Math.round(igualdad) / 10;
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
                                                            WHEN $5 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                CASE 
                                                                    WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                    ELSE 0.5
                                                                END
                                                            WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                CASE 
                                                                    WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                            WHEN $5 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                CASE 
                                                                    WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                    ELSE 0.5
                                                                END
                                                            WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                CASE 
                                                                    WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                    ELSE 0.5
                                                                END
                                                         END)) AS x_centro
            FROM carto_geolocalizador
            WHERE nombre_vialidad like '%' || $1 || '%'
            AND municipio = $2
            AND estado = $3
            AND (((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
            OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5)) 
            OR ((CAST(l_refaddr AS INTEGER) >= $5 AND CAST(l_nrefaddr AS INTEGER) <= $5)
            OR (CAST(r_refaddr AS INTEGER) >= $5 AND CAST(r_nrefaddr AS INTEGER) <= $5)))
            AND colonia LIKE '%' || $4 || '%'
            ;
        `;
        values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
        const result = await pgClient.query(query, values);
        for (let i = 0; i < result.rows.length; i++) {
            result.rows[i].scoring = {
                fiability: 30,
                calle: 0,
                codigo_postal: 0,
                municipio: 100,
                estado: 100,
                numero_exterior: 100,
                colonia: 0
            };
            const matchNombreCalle = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.CALLE, 'i'));
            if (matchNombreCalle) {
                const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
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
                result.rows[i].scoring.fiability += Math.round(igualdad) / 10;
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
                                                                WHEN $5 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                    CASE 
                                                                        WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                        ELSE 0.5
                                                                    END
                                                                WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                    CASE 
                                                                        WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                WHEN $5 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                    CASE 
                                                                        WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                        ELSE 0.5
                                                                    END
                                                                WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                    CASE 
                                                                        WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                        ELSE 0.5
                                                                    END
                                                             END)) AS x_centro
                FROM carto_geolocalizador
                WHERE nombre_vialidad like '%' || $1 || '%'
                AND codigo_postal = $2 
                AND estado = $3
                AND (((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5)) 
                OR ((CAST(l_refaddr AS INTEGER) >= $5 AND CAST(l_nrefaddr AS INTEGER) <= $5)
                OR (CAST(r_refaddr AS INTEGER) >= $5 AND CAST(r_nrefaddr AS INTEGER) <= $5)))
                AND colonia LIKE '%' || $4 || '%'
                ;
            `;
            values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 30,
                    calle: 0,
                    codigo_postal: 100,
                    municipio: 0,
                    estado: 100,
                    numero_exterior: 100,
                    colonia: 0
                };
                const matchNombreCalle = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.CALLE, 'i'));
                if (matchNombreCalle) {
                    const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                    let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
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
                    result.rows[i].scoring.fiability += Math.round(igualdad) / 10;
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
                                                                    WHEN $5 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                        CASE 
                                                                            WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                            ELSE 0.5
                                                                        END
                                                                    WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                        CASE 
                                                                            WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                    WHEN $5 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                        CASE 
                                                                            WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                            ELSE 0.5
                                                                        END
                                                                    WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                        CASE 
                                                                            WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                            ELSE 0.5
                                                                        END
                                                                 END)) AS x_centro
                    FROM carto_geolocalizador
                    WHERE nombre_vialidad like '%' || $1 || '%'
                    AND codigo_postal = $2 
                    AND municipio = $3
                    AND (((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                    OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5)) 
                    OR ((CAST(l_refaddr AS INTEGER) >= $5 AND CAST(l_nrefaddr AS INTEGER) <= $5)
                    OR (CAST(r_refaddr AS INTEGER) >= $5 AND CAST(r_nrefaddr AS INTEGER) <= $5)))
                    AND colonia LIKE '%' || $4 || '%'
                    ;
                `;
                values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
                const result = await pgClient.query(query, values);
                for (let i = 0; i < result.rows.length; i++) {
                    result.rows[i].scoring = {
                        fiability: 30,
                        calle: 0,
                        codigo_postal: 100,
                        municipio: 100,
                        estado: 0,
                        numero_exterior: 100,
                        colonia: 0
                    };
                    const matchNombreCalle = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.CALLE, 'i'));
                    if (matchNombreCalle) {
                        const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                        let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
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
                        result.rows[i].scoring.fiability += Math.round(igualdad) / 10;
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
                                                                        WHEN $5 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                            CASE 
                                                                                WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                ELSE 0.5
                                                                            END
                                                                        WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                            CASE 
                                                                                WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                        WHEN $5 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                            CASE 
                                                                                WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                ELSE 0.5
                                                                            END
                                                                        WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                            CASE 
                                                                                WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                ELSE 0.5
                                                                            END
                                                                     END)) AS x_centro
                        FROM carto_geolocalizador
                        WHERE nombre_vialidad like '%' || $1 || '%'
                        AND codigo_postal = $2 
                        AND municipio = $3
                        AND (((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                        OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5)) 
                        OR ((CAST(l_refaddr AS INTEGER) >= $5 AND CAST(l_nrefaddr AS INTEGER) <= $5)
                        OR (CAST(r_refaddr AS INTEGER) >= $5 AND CAST(r_nrefaddr AS INTEGER) <= $5)))
                        AND estado = $4
                        ;
                    `;
                    values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
                    const result = await pgClient.query(query, values);
                    for (let i = 0; i < result.rows.length; i++) {
                        result.rows[i].scoring = {
                            fiability: 40,
                            calle: 0,
                            codigo_postal: 100,
                            municipio: 100,
                            estado: 100,
                            numero_exterior: 100,
                            colonia: 0
                        };
                        const matchNombreCalle = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.CALLE, 'i'));
                        if (matchNombreCalle) {
                            const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                            let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
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
                            result.rows[i].scoring.fiability += (similarityColonia * 0.1);
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
                                                                            WHEN $4 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                CASE 
                                                                                    WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                    ELSE 0.5
                                                                                END
                                                                            WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                CASE 
                                                                                    WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                            WHEN $4 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                CASE 
                                                                                    WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                    ELSE 0.5
                                                                                END
                                                                            WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                CASE 
                                                                                    WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                    ELSE 0.5
                                                                                END
                                                                         END)) AS x_centro
                            FROM carto_geolocalizador
                            WHERE nombre_vialidad like '%' || $1 || '%'
                            AND municipio = $2
                            AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                            OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
                            OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
                            OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
                            AND estado = $3
                            ;
                        `;
                        values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
                        const result = await pgClient.query(query, values);

                        for (let i = 0; i < result.rows.length; i++) {
                            result.rows[i].scoring = {
                                fiability: 30,
                                calle: 0,
                                codigo_postal: 0,
                                municipio: 100,
                                estado: 100,
                                numero_exterior: 100,
                                colonia: 0
                            };
                            const matchNombreCalle = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.CALLE, 'i'));
                            if (matchNombreCalle) {
                                const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
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
                                result.rows[i].scoring.fiability += (similarityColonia * 0.1);
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
                                                                                WHEN $4 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                    CASE 
                                                                                        WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                        ELSE 0.5
                                                                                    END
                                                                                WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                    CASE 
                                                                                        WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                                WHEN $4 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                    CASE 
                                                                                        WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                        ELSE 0.5
                                                                                    END
                                                                                WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                    CASE 
                                                                                        WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                        ELSE 0.5
                                                                                    END
                                                                             END)) AS x_centro
                                FROM carto_geolocalizador
                                WHERE nombre_vialidad like '%' || $1 || '%'
                                AND codigo_postal = $2 
                                AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
                                OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
                                OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
                                AND estado = $3
                                ;
                            `;
                            values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
                            const result = await pgClient.query(query, values);

                            for (let i = 0; i < result.rows.length; i++) {
                                result.rows[i].scoring = {
                                    fiability: 30,
                                    calle: 0,
                                    codigo_postal: 100,
                                    municipio: 0,
                                    estado: 100,
                                    numero_exterior: 100,
                                    colonia: 0
                                };
                                const matchNombreCalle = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.CALLE, 'i'));
                                if (matchNombreCalle) {
                                    const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                    let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
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
                                    result.rows[i].scoring.fiability += (similarityColonia * 0.1);
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
                                                                                    WHEN $4 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                        CASE 
                                                                                            WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                            ELSE 0.5
                                                                                        END
                                                                                    WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                        CASE 
                                                                                            WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                                    WHEN $4 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                        CASE 
                                                                                            WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                            ELSE 0.5
                                                                                        END
                                                                                    WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                        CASE 
                                                                                            WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                            ELSE 0.5
                                                                                        END
                                                                                 END)) AS x_centro
                                    FROM carto_geolocalizador
                                    WHERE nombre_vialidad like '%' || $1 || '%'
                                    AND municipio = $2
                                    AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                    OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
                                    OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
                                    OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
                                    AND colonia LIKE '%' || $3 || '%'
                                    ;
                                `;
                                values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
                                const result = await pgClient.query(query, values);

                                for (let i = 0; i < result.rows.length; i++) {
                                    result.rows[i].scoring = {
                                        fiability: 20,
                                        calle: 0,
                                        codigo_postal: 0,
                                        municipio: 100,
                                        estado: 0,
                                        numero_exterior: 100,
                                        colonia: 0
                                    };
                                    const matchNombreCalle = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.CALLE, 'i'));
                                    if (matchNombreCalle) {
                                        const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                        let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
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
                                        result.rows[i].scoring.fiability += Math.round(igualdad) / 10;
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
                                                                                        WHEN $4 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                            CASE 
                                                                                                WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                ELSE 0.5
                                                                                            END
                                                                                        WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                            CASE 
                                                                                                WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                                        WHEN $4 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                            CASE 
                                                                                                WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                ELSE 0.5
                                                                                            END
                                                                                        WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                            CASE 
                                                                                                WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                                ELSE 0.5
                                                                                            END
                                                                                     END)) AS x_centro
                                        FROM carto_geolocalizador
                                        WHERE nombre_vialidad like '%' || $1 || '%'
                                        AND codigo_postal = $2 
                                        AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                        OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
                                        OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
                                        OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
                                        AND colonia LIKE '%' || $3 || '%'
                                        ;
                                    `;
                                    values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
                                    const result = await pgClient.query(query, values);

                                    for (let i = 0; i < result.rows.length; i++) {
                                        result.rows[i].scoring = {
                                            fiability: 20,
                                            calle: 0,
                                            codigo_postal: 100,
                                            municipio: 0,
                                            estado: 0,
                                            numero_exterior: 100,
                                            colonia: 0
                                        };
                                        const matchNombreCalle = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.CALLE, 'i'));
                                        if (matchNombreCalle) {
                                            const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                            let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
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
                                            result.rows[i].scoring.fiability += Math.round(igualdad) / 10;
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
                                            AND codigo_postal = $2 
                                            AND municipio = $3
                                            AND estado = $4
                                            AND colonia LIKE '%' || $5 || '%'
                                            ;
                                        `;
                                        values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                        const result = await pgClient.query(query, values);
                                        for (let i = 0; i < result.rows.length; i++) {
                                            result.rows[i].scoring = {
                                                fiability: 30,
                                                calle: 0,
                                                codigo_postal: 100,
                                                municipio: 100,
                                                estado: 100,
                                                numero_exterior: 0,
                                                colonia: 0
                                            };
                                            const matchNombreCalle = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.CALLE, 'i'));
                                            if (matchNombreCalle) {
                                                const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                                let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
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
                                                result.rows[i].scoring.fiability += Math.round(igualdad) / 10;
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
                                                                                                WHEN $4 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                                    CASE 
                                                                                                        WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                        ELSE 0.5
                                                                                                    END
                                                                                                WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                    CASE 
                                                                                                        WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                                                WHEN $4 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                                    CASE 
                                                                                                        WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                        ELSE 0.5
                                                                                                    END
                                                                                                WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                    CASE 
                                                                                                        WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                                        ELSE 0.5
                                                                                                    END
                                                                                             END)) AS x_centro
                                                FROM carto_geolocalizador
                                                WHERE nombre_vialidad like '%' || $1 || '%'
                                                AND codigo_postal = $2 
                                                AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
                                                OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
                                                OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
                                                AND municipio = $3
                                                ;
                                            `;
                                            values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1];
                                            const result = await pgClient.query(query, values);
                                            for (let i = 0; i < result.rows.length; i++) {
                                                result.rows[i].scoring = {
                                                    fiability: 30,
                                                    calle: 0,
                                                    codigo_postal: 100,
                                                    municipio: 100,
                                                    estado: 0,
                                                    numero_exterior: 100,
                                                    colonia: 0
                                                };
                                                const matchNombreCalle = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.CALLE, 'i'));
                                                if (matchNombreCalle) {
                                                    const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                                    let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
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
                                                    result.rows[i].scoring.fiability += (similarityColonia * 0.1);
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
                                                    AND codigo_postal = $2 
                                                    AND municipio = $3
                                                    AND colonia LIKE '%' || $4 || '%'
                                                    ;
                                                `;
                                                values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.COLONIA];
                                                const result = await pgClient.query(query, values);
                                                for (let i = 0; i < result.rows.length; i++) {
                                                    result.rows[i].scoring = {
                                                        fiability: 20,
                                                        calle: 0,
                                                        codigo_postal: 100,
                                                        municipio: 100,
                                                        estado: 0,
                                                        numero_exterior: 0,
                                                        colonia: 0
                                                    };
                                                    const matchNombreCalle = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.CALLE, 'i'));
                                                    if (matchNombreCalle) {
                                                        const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                                        let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
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
                                                        result.rows[i].scoring.fiability += Math.round(igualdad) / 10;
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
                                                        WHERE nombre_vialidad like '%' || $1 || '%'
                                                        AND municipio = $2
                                                        AND estado = $3
                                                        AND colonia LIKE '%' || $4 || '%'
                                                        ;
                                                    `;
                                                    values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                                    const result = await pgClient.query(query, values);
                                                    for (let i = 0; i < result.rows.length; i++) {
                                                        result.rows[i].scoring = {
                                                            fiability: 20,
                                                            calle: 0,
                                                            codigo_postal: 0,
                                                            municipio: 100,
                                                            estado: 100,
                                                            numero_exterior: 0,
                                                            colonia: 0
                                                        };
                                                        const matchNombreCalle = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.CALLE, 'i'));
                                                        if (matchNombreCalle) {
                                                            const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                                            let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
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
                                                            result.rows[i].scoring.fiability += Math.round(igualdad) / 10;
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
                                                            WHERE nombre_vialidad like '%' || $1 || '%'
                                                            AND codigo_postal = $2 
                                                            AND estado = $3
                                                            AND colonia LIKE '%' || $4|| '%'
                                                            ;
                                                        `;
                                                        values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                                        const result = await pgClient.query(query, values);
                                                        for (let i = 0; i < result.rows.length; i++) {
                                                            result.rows[i].scoring = {
                                                                fiability: 20,
                                                                calle: 0,
                                                                codigo_postal: 100,
                                                                municipio: 0,
                                                                estado: 100,
                                                                numero_exterior: 0,
                                                                colonia: 0
                                                            };
                                                            const matchNombreCalle = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.CALLE, 'i'));
                                                            if (matchNombreCalle) {
                                                                const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                                                let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
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
                                                                result.rows[i].scoring.fiability += Math.round(igualdad) / 10;
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
                                                                AND codigo_postal = $2 
                                                                AND estado = $3
                                                                AND municipio = $4
                                                                ;
                                                            `;
                                                            values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.MUNICIPIO];
                                                            const result = await pgClient.query(query, values);
                                                            for (let i = 0; i < result.rows.length; i++) {
                                                                result.rows[i].scoring = {
                                                                    fiability: 30,
                                                                    calle: 0,
                                                                    codigo_postal: 100,
                                                                    municipio: 100,
                                                                    estado: 100,
                                                                    numero_exterior: 0,
                                                                    colonia: 0
                                                                };
                                                                const matchNombreCalle = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.CALLE, 'i'));
                                                                if (matchNombreCalle) {
                                                                    const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                                                    let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
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
                                                                    result.rows[i].scoring.fiability += (similarityColonia * 0.1);
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
                                                                    AND estado = $2
                                                                    AND municipio = $3
                                                                    ;
                                                                `;
                                                                values = [direccionParsed.CALLE, direccionParsed.ESTADO, direccionParsed.MUNICIPIO];
                                                                const result = await pgClient.query(query, values);
                                                                for (let i = 0; i < result.rows.length; i++) {
                                                                    result.rows[i].scoring = {
                                                                        fiability: 20,
                                                                        calle: 0,
                                                                        codigo_postal: 0,
                                                                        municipio: 100,
                                                                        estado: 100,
                                                                        numero_exterior: 0,
                                                                        colonia: 0
                                                                    };
                                                                    const matchNombreCalle = result.rows[i].nombre_vialidad.match(new RegExp(direccionParsed.CALLE, 'i'));
                                                                    if (matchNombreCalle) {
                                                                        const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                                                        let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
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
                                                                        result.rows[i].scoring.fiability += (similarityColonia * 0.1);
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
                                                                                                                        WHEN $5 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                                                            CASE 
                                                                                                                                WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                                                ELSE 0.5
                                                                                                                            END
                                                                                                                        WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                            CASE 
                                                                                                                                WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                                                                        WHEN $5 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                                                            CASE 
                                                                                                                                WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                                                ELSE 0.5
                                                                                                                            END
                                                                                                                        WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                            CASE 
                                                                                                                                WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                                                                ELSE 0.5
                                                                                                                            END
                                                                                                                     END)) AS x_centro
                                                                        FROM carto_geolocalizador
                                                                        WHERE codigo_postal = $1 
                                                                        AND municipio = $2
                                                                        AND estado = $3
                                                                        AND (((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                                                                        OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5)) 
                                                                        OR ((CAST(l_refaddr AS INTEGER) >= $5 AND CAST(l_nrefaddr AS INTEGER) <= $5)
                                                                        OR (CAST(r_refaddr AS INTEGER) >= $5 AND CAST(r_nrefaddr AS INTEGER) <= $5)))
                                                                        AND colonia LIKE '%' || $4 || '%'
                                                                        ;
                                                                    `;
                                                                    values = [direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
                                                                    const result = await pgClient.query(query, values);
                                                                    for (let i = 0; i < result.rows.length; i++) {
                                                                        result.rows[i].scoring = {
                                                                            fiability: 40,
                                                                            calle: 0,
                                                                            codigo_postal: 100,
                                                                            municipio: 100,
                                                                            estado: 100,
                                                                            numero_exterior: 100,
                                                                            colonia: 0
                                                                        };
                                                                        // Calcular la distancia de Levenshtein
                                                                        const distance = levenshteinDistance(result.rows[i].nombre_vialidad, direccionParsed.CALLE);
                                                                        // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                                        const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.CALLE.length);
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
                                                                            result.rows[i].scoring.fiability += Math.round(igualdad) / 10;
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
                                                                                                                            WHEN $4 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                                                                CASE 
                                                                                                                                    WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                                                    ELSE 0.5
                                                                                                                                END
                                                                                                                            WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                                CASE 
                                                                                                                                    WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                                                                            WHEN $4 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                                                                CASE 
                                                                                                                                    WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                                                    ELSE 0.5
                                                                                                                                END
                                                                                                                            WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                                CASE 
                                                                                                                                    WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                                                                    ELSE 0.5
                                                                                                                                END
                                                                                                                         END)) AS x_centro
                                                                            FROM carto_geolocalizador
                                                                            WHERE municipio = $1
                                                                            AND estado = $2
                                                                            AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                                            OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
                                                                            OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
                                                                            OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
                                                                            AND colonia LIKE '%' || $3 || '%'
                                                                            ;
                                                                        `;
                                                                        values = [direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
                                                                        const result = await pgClient.query(query, values);
                                                                        for (let i = 0; i < result.rows.length; i++) {
                                                                            result.rows[i].scoring = {
                                                                                fiability: 30,
                                                                                calle: 0,
                                                                                codigo_postal: 0,
                                                                                municipio: 100,
                                                                                estado: 100,
                                                                                numero_exterior: 100,
                                                                                colonia: 0
                                                                            };
                                                                            // Calcular la distancia de Levenshtein
                                                                            const distance = levenshteinDistance(result.rows[i].nombre_vialidad, direccionParsed.CALLE);
                                                                            // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                                            const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.CALLE.length);
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
                                                                                result.rows[i].scoring.fiability += Math.round(igualdad) / 10;
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
                                                                                                                                WHEN $4 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                                                                    CASE 
                                                                                                                                        WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                                                        ELSE 0.5
                                                                                                                                    END
                                                                                                                                WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                                    CASE 
                                                                                                                                        WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                                                                                WHEN $4 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                                                                    CASE 
                                                                                                                                        WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                                                        ELSE 0.5
                                                                                                                                    END
                                                                                                                                WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                                    CASE 
                                                                                                                                        WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                                                                        ELSE 0.5
                                                                                                                                    END
                                                                                                                             END)) AS x_centro
                                                                                FROM carto_geolocalizador
                                                                                WHERE codigo_postal = $1 
                                                                                AND municipio = $2
                                                                                AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                                                OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
                                                                                OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
                                                                                OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
                                                                                AND colonia LIKE '%' || $3 || '%'
                                                                                ;
                                                                            `;
                                                                            values = [direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
                                                                            const result = await pgClient.query(query, values);
                                                                            for (let i = 0; i < result.rows.length; i++) {
                                                                                result.rows[i].scoring = {
                                                                                    fiability: 30,
                                                                                    calle: 0,
                                                                                    codigo_postal: 100,
                                                                                    municipio: 100,
                                                                                    estado: 0,
                                                                                    numero_exterior: 100,
                                                                                    colonia: 0
                                                                                };
                                                                                // Calcular la distancia de Levenshtein
                                                                                const distance = levenshteinDistance(result.rows[i].nombre_vialidad, direccionParsed.CALLE);
                                                                                // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                                                const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.CALLE.length);
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
                                                                                    result.rows[i].scoring.fiability += Math.round(igualdad) / 10;
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
                                                                                                                                    WHEN $4 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                                                                        CASE 
                                                                                                                                            WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                                                            ELSE 0.5
                                                                                                                                        END
                                                                                                                                    WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                                        CASE 
                                                                                                                                            WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                                                                                    WHEN $4 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                                                                        CASE 
                                                                                                                                            WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                                                            ELSE 0.5
                                                                                                                                        END
                                                                                                                                    WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                                        CASE 
                                                                                                                                            WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                                                                            ELSE 0.5
                                                                                                                                        END
                                                                                                                                 END)) AS x_centro
                                                                                    FROM carto_geolocalizador
                                                                                    WHERE codigo_postal = $1 
                                                                                    AND estado = $2
                                                                                    AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                                                    OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
                                                                                    OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
                                                                                    OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
                                                                                    AND colonia LIKE '%' || $3 || '%'
                                                                                    ;
                                                                                `;
                                                                                values = [direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
                                                                                const result = await pgClient.query(query, values);
                                                                                for (let i = 0; i < result.rows.length; i++) {
                                                                                    result.rows[i].scoring = {
                                                                                        fiability: 30,
                                                                                        calle: 0,
                                                                                        codigo_postal: 100,
                                                                                        municipio: 0,
                                                                                        estado: 100,
                                                                                        numero_exterior: 100,
                                                                                        colonia: 0
                                                                                    };
                                                                                    // Calcular la distancia de Levenshtein
                                                                                    const distance = levenshteinDistance(result.rows[i].nombre_vialidad, direccionParsed.CALLE);
                                                                                    // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                                                    const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.CALLE.length);
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
                                                                                        result.rows[i].scoring.fiability += Math.round(igualdad) / 10;
                                                                                    }
                                                                                }
                                                                                rows = rows.concat(result.rows);
                                                                                //ANTES
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
                                                                                                                                        WHEN $4 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                                                                            CASE 
                                                                                                                                                WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                                                                ELSE 0.5
                                                                                                                                            END
                                                                                                                                        WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                                            CASE 
                                                                                                                                                WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                                                                                        WHEN $4 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                                                                            CASE 
                                                                                                                                                WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                                                                ELSE 0.5
                                                                                                                                            END
                                                                                                                                        WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                                            CASE 
                                                                                                                                                WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                                                                                ELSE 0.5
                                                                                                                                            END
                                                                                                                                     END)) AS x_centro
                                                                                        FROM carto_geolocalizador
                                                                                        WHERE codigo_postal = $1 
                                                                                        AND estado = $2
                                                                                        AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                                                        OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
                                                                                        OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
                                                                                        OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
                                                                                        AND municipio = $3
                                                                                        ;
                                                                                    `;
                                                                                    values = [direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1];
                                                                                    const result = await pgClient.query(query, values);
                                                                                    for (let i = 0; i < result.rows.length; i++) {
                                                                                        result.rows[i].scoring = {
                                                                                            fiability: 40,
                                                                                            calle: 0,
                                                                                            codigo_postal: 100,
                                                                                            municipio: 100,
                                                                                            estado: 100,
                                                                                            numero_exterior: 100,
                                                                                            colonia: 0
                                                                                        };
                                                                                        // Calcular la distancia de Levenshtein
                                                                                        const distance = levenshteinDistance(result.rows[i].nombre_vialidad, direccionParsed.COLONIA);
                                                                                        // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                                                        const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.COLONIA.length);
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
                                                                                            result.rows[i].scoring.fiability += (similarityColonia * 0.1);
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
                                                                                            WHERE codigo_postal = $1 
                                                                                            AND municipio = $2
                                                                                            AND estado = $3
                                                                                            AND colonia LIKE '%' || $4 || '%'
                                                                                            ;
                                                                                        `;
                                                                                        values = [direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                                                                        const result = await pgClient.query(query, values);
                                                                                        for (let i = 0; i < result.rows.length; i++) {
                                                                                            result.rows[i].scoring = {
                                                                                                fiability: 30,
                                                                                                calle: 0,
                                                                                                codigo_postal: 100,
                                                                                                municipio: 100,
                                                                                                estado: 100,
                                                                                                numero_exterior: 0,
                                                                                                colonia: 0
                                                                                            };
                                                                                            // Calcular la distancia de Levenshtein
                                                                                            const distance = levenshteinDistance(result.rows[i].nombre_vialidad, direccionParsed.CALLE);
                                                                                            // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                                                            const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.CALLE.length);
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
                                                                                                result.rows[i].scoring.fiability += Math.round(igualdad) / 10;
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
    }
    return rows;
}
module.exports = all;