const pgClient = require("../../data/conexion");
const { levenshteinDistance, quitarAcentos } = require("../funciones");

// Aplicable solo en caso de llevar todos los campos
async function sinColoniaCP(direccionParsed) {
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
        WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
        AND unaccent(municipio) = $2
        AND unaccent(estado) = $3
        AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
        OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
        OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
        OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
        ;
    `;
    values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        result.rows[i].scoring = {
            fiability: 50,
            calle: 0,
            municipio: 100,
            estado: 100,
            numero_exterior: 100
        };
        const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
        const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
        if (matchNombreCalle) {
            const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
            let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
            if (igualdad > 100) igualdad = 100;
            result.rows[i].scoring.calle += Math.round(igualdad);
            result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
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
                                                            WHEN $3 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                CASE 
                                                                    WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($3 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                    ELSE 0.5
                                                                END
                                                            WHEN $3 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                CASE 
                                                                    WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($3 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                            WHEN $3 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                CASE 
                                                                    WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($3 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                    ELSE 0.5
                                                                END
                                                            WHEN $3 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                CASE 
                                                                    WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($3 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                    ELSE 0.5
                                                                END
                                                         END)) AS x_centro
            FROM carto_geolocalizador
            WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
            AND unaccent(estado) = $2
            AND (((CAST(l_refaddr AS INTEGER) <= $3 AND CAST(l_nrefaddr AS INTEGER) >= $3)
            OR (CAST(r_refaddr AS INTEGER) <= $3 AND CAST(r_nrefaddr AS INTEGER) >= $3)) 
            OR ((CAST(l_refaddr AS INTEGER) >= $3 AND CAST(l_nrefaddr AS INTEGER) <= $3)
            OR (CAST(r_refaddr AS INTEGER) >= $3 AND CAST(r_nrefaddr AS INTEGER) <= $3)))
            ;
        `;
        values = [direccionParsed.CALLE, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
        const result = await pgClient.query(query, values);
        for (let i = 0; i < result.rows.length; i++) {
            result.rows[i].scoring = {
                fiability: 35,
                calle: 0,
                municipio: 0,
                estado: 100,
                numero_exterior: 100
            };
            const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
            const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
            if (matchNombreCalle) {
                const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                if (igualdad > 100) igualdad = 100;
                result.rows[i].scoring.calle += Math.round(igualdad);
                result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
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
                                                                WHEN $3 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                    CASE 
                                                                        WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($3 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                        ELSE 0.5
                                                                    END
                                                                WHEN $3 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                    CASE 
                                                                        WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($3 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                WHEN $3 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                    CASE 
                                                                        WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($3 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                        ELSE 0.5
                                                                    END
                                                                WHEN $3 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                    CASE 
                                                                        WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($3 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                        ELSE 0.5
                                                                    END
                                                             END)) AS x_centro
                FROM carto_geolocalizador
                WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
                AND unaccent(municipio) = $2
                AND (((CAST(l_refaddr AS INTEGER) <= $3 AND CAST(l_nrefaddr AS INTEGER) >= $3)
                OR (CAST(r_refaddr AS INTEGER) <= $3 AND CAST(r_nrefaddr AS INTEGER) >= $3)) 
                OR ((CAST(l_refaddr AS INTEGER) >= $3 AND CAST(l_nrefaddr AS INTEGER) <= $3)
                OR (CAST(r_refaddr AS INTEGER) >= $3 AND CAST(r_nrefaddr AS INTEGER) <= $3)))
                ;
            `;
            values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 35,
                    calle: 0,
                    municipio: 100,
                    estado: 0,
                    numero_exterior: 100
                };
                const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                if (matchNombreCalle) {
                    const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                    let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                    if (igualdad > 100) igualdad = 100;
                    result.rows[i].scoring.calle += Math.round(igualdad);
                    result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
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
                    WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
                    AND unaccent(municipio) = $2
                    AND unaccent(estado) = $3
                    ;
                `;
                values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                const result = await pgClient.query(query, values);
                for (let i = 0; i < result.rows.length; i++) {
                    result.rows[i].scoring = {
                        fiability: 30,
                        calle: 0,
                        municipio: 100,
                        estado: 100,
                        numero_exterior: 0
                    };
                    const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                    const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                    if (matchNombreCalle) {
                        const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                        let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                        if (igualdad > 100) igualdad = 100;
                        result.rows[i].scoring.calle += Math.round(igualdad);
                        result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
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
                                                                        WHEN $2 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                            CASE 
                                                                                WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($2 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                ELSE 0.5
                                                                            END
                                                                        WHEN $2 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                            CASE 
                                                                                WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($2 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                        WHEN $2 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                            CASE 
                                                                                WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($2 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                ELSE 0.5
                                                                            END
                                                                        WHEN $2 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                            CASE 
                                                                                WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($2 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                ELSE 0.5
                                                                            END
                                                                     END)) AS x_centro
                        FROM carto_geolocalizador
                        WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
                        AND (((CAST(l_refaddr AS INTEGER) <= $2 AND CAST(l_nrefaddr AS INTEGER) >= $2)
                        OR (CAST(r_refaddr AS INTEGER) <= $2 AND CAST(r_nrefaddr AS INTEGER) >= $2)) 
                        OR ((CAST(l_refaddr AS INTEGER) >= $2 AND CAST(l_nrefaddr AS INTEGER) <= $2)
                        OR (CAST(r_refaddr AS INTEGER) >= $2 AND CAST(r_nrefaddr AS INTEGER) <= $2)))
                        ;
                    `;
                    values = [direccionParsed.CALLE, direccionParsed.NUMEXTNUM1];
                    const result = await pgClient.query(query, values);

                    for (let i = 0; i < result.rows.length; i++) {
                        result.rows[i].scoring = {
                            fiability: 20,
                            calle: 0,
                            municipio: 0,
                            estado: 0,
                            numero_exterior: 100
                        };
                        const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                        const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                        if (matchNombreCalle) {
                            const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                            let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                            if (igualdad > 100) igualdad = 100;
                            result.rows[i].scoring.calle += Math.round(igualdad);
                            result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
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
                            WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
                            AND unaccent(municipio) = $2
                            AND unaccent(estado) = $3
                            ;
                        `;
                        values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                        const result = await pgClient.query(query, values);
                        for (let i = 0; i < result.rows.length; i++) {
                            result.rows[i].scoring = {
                                fiability: 30,
                                calle: 0,
                                municipio: 100,
                                estado: 100,
                                numero_exterior: 0
                            };
                            const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                            const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                            if (matchNombreCalle) {
                                const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                                if (igualdad > 100) igualdad = 100;
                                result.rows[i].scoring.calle += Math.round(igualdad);
                                result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
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
                                WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
                                AND unaccent(municipio) = $2
                                ;
                            `;
                            values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO];
                            const result = await pgClient.query(query, values);
                            for (let i = 0; i < result.rows.length; i++) {
                                result.rows[i].scoring = {
                                    fiability: 15,
                                    calle: 0,
                                    municipio: 100,
                                    estado: 0,
                                    numero_exterior: 0
                                };
                                const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                                if (matchNombreCalle) {
                                    const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                    let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                                    if (igualdad > 100) igualdad = 100;
                                    result.rows[i].scoring.calle += Math.round(igualdad);
                                    result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
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
                                    WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
                                    AND unaccent(estado) = $2
                                    ;
                                `;
                                values = [direccionParsed.CALLE, direccionParsed.ESTADO];
                                const result = await pgClient.query(query, values);
                                for (let i = 0; i < result.rows.length; i++) {
                                    result.rows[i].scoring = {
                                        fiability: 15,
                                        calle: 0,
                                        municipio: 0,
                                        estado: 100,
                                        numero_exterior: 0
                                    };
                                    const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                    const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                                    if (matchNombreCalle) {
                                        const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                        let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                                        if (igualdad > 100) igualdad = 100;
                                        result.rows[i].scoring.calle += Math.round(igualdad);
                                        result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
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
                                                                                        WHEN $3 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                            CASE 
                                                                                                WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($3 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                ELSE 0.5
                                                                                            END
                                                                                        WHEN $3 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                            CASE 
                                                                                                WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($3 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                                        WHEN $3 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                            CASE 
                                                                                                WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($3 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                ELSE 0.5
                                                                                            END
                                                                                        WHEN $3 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                            CASE 
                                                                                                WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($3 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                                ELSE 0.5
                                                                                            END
                                                                                     END)) AS x_centro
                                        FROM carto_geolocalizador
                                        WHERE unaccent(municipio) = $1
                                        AND unaccent(estado) = $2
                                        AND (((CAST(l_refaddr AS INTEGER) <= $3 AND CAST(l_nrefaddr AS INTEGER) >= $3)
                                        OR (CAST(r_refaddr AS INTEGER) <= $3 AND CAST(r_nrefaddr AS INTEGER) >= $3)) 
                                        OR ((CAST(l_refaddr AS INTEGER) >= $3 AND CAST(l_nrefaddr AS INTEGER) <= $3)
                                        OR (CAST(r_refaddr AS INTEGER) >= $3 AND CAST(r_nrefaddr AS INTEGER) <= $3)))
                                        ;
                                    `;
                                    values = [direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
                                    const result = await pgClient.query(query, values);
                                    for (let i = 0; i < result.rows.length; i++) {
                                        result.rows[i].scoring = {
                                            fiability: 50,
                                            calle: 0,
                                            municipio: 100,
                                            estado: 100,
                                            numero_exterior: 100
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
                                                                                            WHEN $3 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                                CASE 
                                                                                                    WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($3 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                    ELSE 0.5
                                                                                                END
                                                                                            WHEN $3 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                CASE 
                                                                                                    WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($3 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                                            WHEN $3 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                                CASE 
                                                                                                    WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($3 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                    ELSE 0.5
                                                                                                END
                                                                                            WHEN $3 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                CASE 
                                                                                                    WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($3 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                                    ELSE 0.5
                                                                                                END
                                                                                         END)) AS x_centro
                                            FROM carto_geolocalizador
                                            WHERE unaccent(municipio) = $1
                                            AND unaccent(estado) = $2
                                            AND (((CAST(l_refaddr AS INTEGER) <= $3 AND CAST(l_nrefaddr AS INTEGER) >= $3)
                                            OR (CAST(r_refaddr AS INTEGER) <= $3 AND CAST(r_nrefaddr AS INTEGER) >= $3)) 
                                            OR ((CAST(l_refaddr AS INTEGER) >= $3 AND CAST(l_nrefaddr AS INTEGER) <= $3)
                                            OR (CAST(r_refaddr AS INTEGER) >= $3 AND CAST(r_nrefaddr AS INTEGER) <= $3)))
                                            ;
                                        `;
                                        values = [direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
                                        const result = await pgClient.query(query, values);
                                        for (let i = 0; i < result.rows.length; i++) {
                                            result.rows[i].scoring = {
                                                fiability: 50,
                                                calle: 0,
                                                municipio: 100,
                                                estado: 100,
                                                numero_exterior: 100
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
                                                                                                WHEN $2 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                                    CASE 
                                                                                                        WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($2 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                        ELSE 0.5
                                                                                                    END
                                                                                                WHEN $2 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                    CASE 
                                                                                                        WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($2 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                                                WHEN $2 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                                    CASE 
                                                                                                        WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($2 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                        ELSE 0.5
                                                                                                    END
                                                                                                WHEN $2 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                    CASE 
                                                                                                        WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($2 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                                        ELSE 0.5
                                                                                                    END
                                                                                             END)) AS x_centro
                                                FROM carto_geolocalizador
                                                WHERE unaccent(municipio) = $1
                                                AND (((CAST(l_refaddr AS INTEGER) <= $2 AND CAST(l_nrefaddr AS INTEGER) >= $2)
                                                OR (CAST(r_refaddr AS INTEGER) <= $2 AND CAST(r_nrefaddr AS INTEGER) >= $2)) 
                                                OR ((CAST(l_refaddr AS INTEGER) >= $2 AND CAST(l_nrefaddr AS INTEGER) <= $2)
                                                OR (CAST(r_refaddr AS INTEGER) >= $2 AND CAST(r_nrefaddr AS INTEGER) <= $2)))
                                                ;
                                            `;
                                            values = [direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1];
                                            const result = await pgClient.query(query, values);
                                            for (let i = 0; i < result.rows.length; i++) {
                                                result.rows[i].scoring = {
                                                    fiability: 35,
                                                    calle: 0,
                                                    municipio: 100,
                                                    estado: 0,
                                                    numero_exterior: 100
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
                                                                                                    WHEN $2 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                                        CASE 
                                                                                                            WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($2 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                            ELSE 0.5
                                                                                                        END
                                                                                                    WHEN $2 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                        CASE 
                                                                                                            WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($2 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                                                    WHEN $2 BETWEEN l_nrefaddr::float AND l_refaddr::float THEN 
                                                                                                        CASE 
                                                                                                            WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($2 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                                            ELSE 0.5
                                                                                                        END
                                                                                                    WHEN $2 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                        CASE 
                                                                                                            WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($2 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                                            ELSE 0.5
                                                                                                        END
                                                                                                 END)) AS x_centro
                                                    FROM carto_geolocalizador
                                                    WHERE unaccent(estado) = $1
                                                    AND (((CAST(l_refaddr AS INTEGER) <= $2 AND CAST(l_nrefaddr AS INTEGER) >= $2)
                                                    OR (CAST(r_refaddr AS INTEGER) <= $2 AND CAST(r_nrefaddr AS INTEGER) >= $2)) 
                                                    OR ((CAST(l_refaddr AS INTEGER) >= $2 AND CAST(l_nrefaddr AS INTEGER) <= $2)
                                                    OR (CAST(r_refaddr AS INTEGER) >= $2 AND CAST(r_nrefaddr AS INTEGER) <= $2)))
                                                    ;
                                                `;
                                                values = [direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
                                                const result = await pgClient.query(query, values);
                                                for (let i = 0; i < result.rows.length; i++) {
                                                    result.rows[i].scoring = {
                                                        fiability: 35,
                                                        calle: 0,
                                                        municipio: 0,
                                                        estado: 100,
                                                        numero_exterior: 100
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
                                                        WHERE unaccent(municipio) = $1
                                                        AND unaccent(estado) = $2
                                                        ;
                                                    `;
                                                    values = [direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                                                    const result = await pgClient.query(query, values);
                                                    for (let i = 0; i < result.rows.length; i++) {
                                                        result.rows[i].scoring = {
                                                            fiability: 30,
                                                            calle: 0,
                                                            municipio: 100,
                                                            estado: 100,
                                                            numero_exterior: 0
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
    return rows;
}
module.exports = sinColoniaCP;