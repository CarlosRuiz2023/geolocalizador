const pgClient = require("../../data/conexion");
const { levenshteinDistance, quitarAcentos } = require("../funciones");

// Aplicable solo en caso de llevar todos los campos
async function sinNumeroExterior(direccionParsed) {
    let query = '';
    let values = [];
    let rows = [];
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
        AND codigo_postal = $2 
        AND unaccent(municipio) = $3
        AND unaccent(estado) = $4
        AND unaccent(colonia) LIKE '%' || $5 || '%'
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
            colonia: 0
        };
        const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
        const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
        if (matchNombreCalle) {
            const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
            let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
            if (igualdad > 100) igualdad = 100;
            result.rows[i].scoring.calle += Math.round(igualdad);
            result.rows[i].scoring.fiability += Math.round(igualdad * 0.6);
        }
        const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
        const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
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
            WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
            AND unaccent(municipio) = $2
            AND unaccent(estado) = $3
            AND unaccent(colonia) LIKE '%' || $4 || '%'
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
                colonia: 0
            };
            const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
            const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
            if (matchNombreCalle) {
                const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                if (igualdad > 100) igualdad = 100;
                result.rows[i].scoring.calle += Math.round(igualdad);
                result.rows[i].scoring.fiability += Math.round(igualdad * 0.6);
            }
            const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
            const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
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
                WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
                AND codigo_postal = $2 
                AND unaccent(estado) = $3
                AND unaccent(colonia) LIKE '%' || $4 || '%'
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
                    colonia: 0
                };
                const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                if (matchNombreCalle) {
                    const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                    let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                    if (igualdad > 100) igualdad = 100;
                    result.rows[i].scoring.calle += Math.round(igualdad);
                    result.rows[i].scoring.fiability += Math.round(igualdad * 0.6);
                }
                const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
                const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
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
                    WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
                    AND codigo_postal = $2 
                    AND unaccent(municipio) = $3
                    AND unaccent(colonia) LIKE '%' || $4 || '%'
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
                        colonia: 0
                    };
                    const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                    const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                    if (matchNombreCalle) {
                        const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                        let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                        if (igualdad > 100) igualdad = 100;
                        result.rows[i].scoring.calle += Math.round(igualdad);
                        result.rows[i].scoring.fiability += Math.round(igualdad * 0.6);
                    }
                    const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
                    const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
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
                        WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
                        AND codigo_postal = $2 
                        AND unaccent(municipio) = $3
                        AND unaccent(estado) = $4
                        ;
                    `;
                    values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                    const result = await pgClient.query(query, values);
                    for (let i = 0; i < result.rows.length; i++) {
                        result.rows[i].scoring = {
                            fiability: 30,
                            calle: 0,
                            codigo_postal: 100,
                            municipio: 100,
                            estado: 100,
                            colonia: 0
                        };
                        const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                        const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                        if (matchNombreCalle) {
                            const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                            let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                            if (igualdad > 100) igualdad = 100;
                            result.rows[i].scoring.calle += Math.round(igualdad);
                            result.rows[i].scoring.fiability += Math.round(igualdad * 0.6);
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
                            WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
                            AND unaccent(municipio) = $2
                            AND unaccent(estado) = $3
                            ;
                        `;
                        values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                        const result = await pgClient.query(query, values);

                        for (let i = 0; i < result.rows.length; i++) {
                            result.rows[i].scoring = {
                                fiability: 20,
                                calle: 0,
                                codigo_postal: 0,
                                municipio: 100,
                                estado: 100,
                                colonia: 0
                            };
                            const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                            const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                            if (matchNombreCalle) {
                                const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                                if (igualdad > 100) igualdad = 100;
                                result.rows[i].scoring.calle += Math.round(igualdad);
                                result.rows[i].scoring.fiability += Math.round(igualdad * 0.6);
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
                                WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
                                AND codigo_postal = $2
                                AND unaccent(estado) = $3
                                ;
                            `;
                            values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.ESTADO];
                            const result = await pgClient.query(query, values);
                            for (let i = 0; i < result.rows.length; i++) {
                                result.rows[i].scoring = {
                                    fiability: 20,
                                    calle: 0,
                                    codigo_postal: 100,
                                    municipio: 0,
                                    estado: 100,
                                    colonia: 0
                                };
                                const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                                if (matchNombreCalle) {
                                    const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                    let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                                    if (igualdad > 100) igualdad = 100;
                                    result.rows[i].scoring.calle += Math.round(igualdad);
                                    result.rows[i].scoring.fiability += Math.round(igualdad * 0.6);
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
                                    WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
                                    AND unaccent(municipio) = $2
                                    AND unaccent(colonia) LIKE '%' || $3 || '%'
                                    ;
                                `;
                                values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.COLONIA];
                                const result = await pgClient.query(query, values);
                                for (let i = 0; i < result.rows.length; i++) {
                                    result.rows[i].scoring = {
                                        fiability: 10,
                                        calle: 0,
                                        codigo_postal: 0,
                                        municipio: 100,
                                        estado: 0,
                                        colonia: 0
                                    };
                                    const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                    const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                                    if (matchNombreCalle) {
                                        const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                        let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                                        if (igualdad > 100) igualdad = 100;
                                        result.rows[i].scoring.calle += Math.round(igualdad);
                                        result.rows[i].scoring.fiability += Math.round(igualdad * 0.6);
                                    }
                                    const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
                                    const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
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
                                        WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
                                        AND codigo_postal = $2
                                        AND unaccent(colonia) LIKE '%' || $3 || '%'
                                        ;
                                    `;
                                    values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.COLONIA];
                                    const result = await pgClient.query(query, values);
                                    for (let i = 0; i < result.rows.length; i++) {
                                        result.rows[i].scoring = {
                                            fiability: 10,
                                            calle: 0,
                                            codigo_postal: 100,
                                            municipio: 0,
                                            estado: 0,
                                            colonia: 0
                                        };
                                        const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                        const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                                        if (matchNombreCalle) {
                                            const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                            let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                                            if (igualdad > 100) igualdad = 100;
                                            result.rows[i].scoring.calle += Math.round(igualdad);
                                            result.rows[i].scoring.fiability += Math.round(igualdad * 0.6);
                                        }
                                        const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
                                        const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
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
                                            WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
                                            AND codigo_postal = $2
                                            AND unaccent(municipio) = $3
                                            ;
                                        `;
                                        values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.MUNICIPIO];
                                        const result = await pgClient.query(query, values);
                                        for (let i = 0; i < result.rows.length; i++) {
                                            result.rows[i].scoring = {
                                                fiability: 20,
                                                calle: 0,
                                                codigo_postal: 100,
                                                municipio: 100,
                                                estado: 0,
                                                colonia: 0
                                            };
                                            const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                            const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                                            if (matchNombreCalle) {
                                                const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                                let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                                                if (igualdad > 100) igualdad = 100;
                                                result.rows[i].scoring.calle += Math.round(igualdad);
                                                result.rows[i].scoring.fiability += Math.round(igualdad * 0.6);
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
                                                AND unaccent(municipio) = $2
                                                AND unaccent(estado) = $3
                                                AND unaccent(colonia) LIKE '%' || $4 || '%'
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
                                                    colonia: 0
                                                };
                                                // Calcular la distancia de Levenshtein
                                                const distance = levenshteinDistance(result.rows[i].nombre_vialidad, direccionParsed.CALLE);
                                                // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.CALLE.length);
                                                const similarity = ((maxLength - distance) / maxLength) * 100;
                                                if (similarity) {
                                                    result.rows[i].scoring.calle += similarity;
                                                    result.rows[i].scoring.fiability += (similarity * 0.6);
                                                }
                                                const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
                                                const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
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
                                                    WHERE unaccent(colonia) like '%' || $1 || '%'
                                                    AND unaccent(estado) = $2
                                                    AND unaccent(municipio) = $3
                                                    ;
                                                `;
                                                values = [direccionParsed.COLONIA, direccionParsed.ESTADO, direccionParsed.MUNICIPIO];
                                                const result = await pgClient.query(query, values);
                                                for (let i = 0; i < result.rows.length; i++) {
                                                    result.rows[i].scoring = {
                                                        fiability: 20,
                                                        calle: 0,
                                                        codigo_postal: 0,
                                                        municipio: 100,
                                                        estado: 100,
                                                        colonia: 0
                                                    };
                                                    // Calcular la distancia de Levenshtein
                                                    const distance = levenshteinDistance(result.rows[i].nombre_vialidad, direccionParsed.CALLE);
                                                    // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                    const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.CALLE.length);
                                                    const similarity = ((maxLength - distance) / maxLength) * 100;
                                                    if (similarity) {
                                                        result.rows[i].scoring.calle += similarity;
                                                        result.rows[i].scoring.fiability += (similarity * 0.6);
                                                    }
                                                    const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
                                                    const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
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
                                                            fiability: 30,
                                                            calle: 0,
                                                            codigo_postal: 100,
                                                            municipio: 100,
                                                            estado: 100,
                                                            colonia: 0
                                                        };
                                                        // Calcular la distancia de Levenshtein
                                                        const distance = levenshteinDistance(result.rows[i].nombre_vialidad, direccionParsed.CALLE);
                                                        // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                        const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.CALLE.length);
                                                        const similarity = ((maxLength - distance) / maxLength) * 100;
                                                        if (similarity) {
                                                            result.rows[i].scoring.calle += similarity;
                                                            result.rows[i].scoring.fiability += (similarity * 0.6);
                                                        }
                                                        const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
                                                        const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
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
                                                            WHERE unaccent(municipio) = $1
                                                            AND unaccent(estado) = $2
                                                            AND unaccent(colonia) LIKE '%' || $3 || '%'
                                                            ;
                                                        `;
                                                        values = [direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                                        const result = await pgClient.query(query, values);
                                                        for (let i = 0; i < result.rows.length; i++) {
                                                            result.rows[i].scoring = {
                                                                fiability: 20,
                                                                calle: 0,
                                                                codigo_postal: 0,
                                                                municipio: 100,
                                                                estado: 100,
                                                                colonia: 0
                                                            };
                                                            // Calcular la distancia de Levenshtein
                                                            const distance = levenshteinDistance(result.rows[i].nombre_vialidad, direccionParsed.CALLE);
                                                            // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                            const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.CALLE.length);
                                                            const similarity = ((maxLength - distance) / maxLength) * 100;
                                                            if (similarity) {
                                                                result.rows[i].scoring.calle += similarity;
                                                                result.rows[i].scoring.fiability += (similarity * 0.6);
                                                            }
                                                            const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
                                                            const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
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
                                                                WHERE codigo_postal = $1 
                                                                AND unaccent(municipio) = $2
                                                                AND unaccent(colonia) LIKE '%' || $3 || '%'
                                                                ;
                                                            `;
                                                            values = [direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.COLONIA];
                                                            const result = await pgClient.query(query, values);
                                                            for (let i = 0; i < result.rows.length; i++) {
                                                                result.rows[i].scoring = {
                                                                    fiability: 20,
                                                                    calle: 0,
                                                                    codigo_postal: 100,
                                                                    municipio: 100,
                                                                    estado: 0,
                                                                    colonia: 0
                                                                };
                                                                // Calcular la distancia de Levenshtein
                                                                const distance = levenshteinDistance(result.rows[i].nombre_vialidad, direccionParsed.CALLE);
                                                                // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                                const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.CALLE.length);
                                                                const similarity = ((maxLength - distance) / maxLength) * 100;
                                                                if (similarity) {
                                                                    result.rows[i].scoring.calle += similarity;
                                                                    result.rows[i].scoring.fiability += (similarity * 0.6);
                                                                }
                                                                const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
                                                                const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
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
                                                                    WHERE codigo_postal = $1 
                                                                    AND unaccent(estado) = $2
                                                                    AND unaccent(colonia) LIKE '%' || $3 || '%'
                                                                    ;
                                                                `;
                                                                values = [direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                                                const result = await pgClient.query(query, values);
                                                                for (let i = 0; i < result.rows.length; i++) {
                                                                    result.rows[i].scoring = {
                                                                        fiability: 20,
                                                                        calle: 0,
                                                                        codigo_postal: 100,
                                                                        municipio: 0,
                                                                        estado: 100,
                                                                        colonia: 0
                                                                    };
                                                                    // Calcular la distancia de Levenshtein
                                                                    const distance = levenshteinDistance(result.rows[i].nombre_vialidad, direccionParsed.CALLE);
                                                                    // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                                    const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.CALLE.length);
                                                                    const similarity = ((maxLength - distance) / maxLength) * 100;
                                                                    if (similarity) {
                                                                        result.rows[i].scoring.calle += similarity;
                                                                        result.rows[i].scoring.fiability += (similarity * 0.6);
                                                                    }
                                                                    const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
                                                                    const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
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
                                                                        WHERE unaccent(estado) = $1
                                                                        AND unaccent(municipio) = $2
                                                                        ;
                                                                    `;
                                                                    values = [direccionParsed.ESTADO,direccionParsed.MUNICIPIO];
                                                                    const result = await pgClient.query(query, values);
                                                                    for (let i = 0; i < result.rows.length; i++) {
                                                                        result.rows[i].scoring = {
                                                                            fiability: 20,
                                                                            calle: 0,
                                                                            codigo_postal: 0,
                                                                            municipio: 100,
                                                                            estado: 100,
                                                                            colonia: 0
                                                                        };
                                                                        // Calcular la distancia de Levenshtein
                                                                        const distance = levenshteinDistance(result.rows[i].nombre_vialidad, direccionParsed.CALLE);
                                                                        // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                                        const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.CALLE.length);
                                                                        const similarity = ((maxLength - distance) / maxLength) * 100;
                                                                        if (similarity) {
                                                                            result.rows[i].scoring.calle += similarity;
                                                                            result.rows[i].scoring.fiability += (similarity * 0.6);
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
                                                                            AND unaccent(estado) = $2
                                                                            AND unaccent(municipio) = $3
                                                                            ;
                                                                        `;
                                                                        values = [direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.MUNICIPIO];
                                                                        const result = await pgClient.query(query, values);
                                                                        for (let i = 0; i < result.rows.length; i++) {
                                                                            result.rows[i].scoring = {
                                                                                fiability: 30,
                                                                                calle: 0,
                                                                                codigo_postal: 100,
                                                                                municipio: 100,
                                                                                estado: 100,
                                                                                colonia: 0
                                                                            };
                                                                            // Calcular la distancia de Levenshtein
                                                                            const distance = levenshteinDistance(result.rows[i].nombre_vialidad, direccionParsed.CALLE);
                                                                            // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                                            const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.CALLE.length);
                                                                            const similarity = ((maxLength - distance) / maxLength) * 100;
                                                                            if (similarity) {
                                                                                result.rows[i].scoring.calle += similarity;
                                                                                result.rows[i].scoring.fiability += (similarity * 0.6);
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
module.exports = sinNumeroExterior;