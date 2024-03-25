const pgClient = require("../../data/conexion");

async function sinNumeroExterior(direccionParsed) {
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
        AND (colonia = '' OR colonia LIKE '%' || $6 || '%')
        ;
    `;
    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        result.rows[i].scoring = {
            fiability: 34,
            tipo_vialidad: 100,
            nombre_vialidad: 0,
            codigo_postal: 0,
            municipio: 100,
            estado: 100,
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
            result.rows[i].scoring.fiability += Math.round(igualdad) / 12.6;
        }
        const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
        if (matchCP) {
            result.rows[i].scoring.codigo_postal += 100;
            result.rows[i].scoring.fiability += 8;
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
                fiability: 34,
                tipo_vialidad: 100,
                nombre_vialidad: 0,
                codigo_postal: 0,
                municipio: 100,
                estado: 100,
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
                result.rows[i].scoring.fiability += Math.round(igualdad) / 12.6;
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
                    fiability: 26,
                    tipo_vialidad: 100,
                    nombre_vialidad: 0,
                    codigo_postal: 0,
                    municipio: 0,
                    estado: 100,
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
                    result.rows[i].scoring.fiability += Math.round(igualdad) / 12.6;
                }
                const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                if (matchCP) {
                    result.rows[i].scoring.codigo_postal += 100;
                    result.rows[i].scoring.fiability += 8;
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
                        fiability: 26,
                        tipo_vialidad: 100,
                        nombre_vialidad: 0,
                        codigo_postal: 0,
                        municipio: 100,
                        estado: 0,
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
                        result.rows[i].scoring.fiability += Math.round(igualdad) / 12.6;
                    }
                    const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                    if (matchCP) {
                        result.rows[i].scoring.codigo_postal += 100;
                        result.rows[i].scoring.fiability += 8;
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
                        AND estado = $6
                        ;
                    `;
                    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                    const result = await pgClient.query(query, values);
                    for (let i = 0; i < result.rows.length; i++) {
                        result.rows[i].scoring = {
                            fiability: 34,
                            tipo_vialidad: 100,
                            nombre_vialidad: 0,
                            codigo_postal: 0,
                            municipio: 100,
                            estado: 100,
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
                            result.rows[i].scoring.fiability += 8;
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
                                fiability: 34,
                                tipo_vialidad: 100,
                                nombre_vialidad: 0,
                                codigo_postal: 0,
                                municipio: 100,
                                estado: 100,
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
                                    fiability: 26,
                                    tipo_vialidad: 100,
                                    nombre_vialidad: 0,
                                    codigo_postal: 0,
                                    municipio: 0,
                                    estado: 100,
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
                                    result.rows[i].scoring.fiability += 8;
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
                                    AND (colonia = '' OR colonia LIKE '%' || $4 || '%')
                                    ;
                                `;
                                values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO, direccionParsed.COLONIA];
                                const result = await pgClient.query(query, values);
                                for (let i = 0; i < result.rows.length; i++) {
                                    result.rows[i].scoring = {
                                        fiability: 26,
                                        tipo_vialidad: 100,
                                        nombre_vialidad: 0,
                                        codigo_postal: 0,
                                        municipio: 100,
                                        estado: 0,
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
                                        result.rows[i].scoring.fiability += Math.round(igualdad) / 12.6;
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
                                        AND (colonia = '' OR colonia LIKE '%' || $4 || '%')
                                        ;
                                    `;
                                    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.COLONIA];
                                    const result = await pgClient.query(query, values);
                                    for (let i = 0; i < result.rows.length; i++) {
                                        result.rows[i].scoring = {
                                            fiability: 76,
                                            tipo_viabilidad: 100,
                                            nombre_viabilidad: 100,
                                            codigo_postal: 0,
                                            municipio: 0,
                                            estado: 0,
                                            colonia: 100
                                        };
                                        const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                        if (matchCP) {
                                            result.rows[i].scoring.codigo_postal += 100;
                                            result.rows[i].scoring.fiability += 8;
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
                                            ;
                                        `;
                                        values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO];
                                        const result = await pgClient.query(query, values);
                                        for (let i = 0; i < result.rows.length; i++) {
                                            result.rows[i].scoring = {
                                                fiability: 76,
                                                tipo_viabilidad: 100,
                                                nombre_viabilidad: 100,
                                                codigo_postal: 0,
                                                municipio: 100,
                                                estado: 0,
                                                colonia: 0
                                            };
                                            const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                            if (matchCP) {
                                                result.rows[i].scoring.codigo_postal += 100;
                                                result.rows[i].scoring.fiability += 8;
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
                                                AND (colonia = '' OR colonia LIKE '%' || $5 || '%')
                                                ;
                                            `;
                                            values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                            const result = await pgClient.query(query, values);
                                            for (let i = 0; i < result.rows.length; i++) {
                                                result.rows[i].scoring = {
                                                    fiability: 42,
                                                    tipo_viabilidad: 100,
                                                    nombre_viabilidad: 0,
                                                    codigo_postal: 0,
                                                    municipio: 100,
                                                    estado: 100,
                                                    colonia: 100
                                                };
                                                const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                                if (matchCP) {
                                                    result.rows[i].scoring.codigo_postal += 100;
                                                    result.rows[i].scoring.fiability += 8;
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
                                                    AND (colonia = '' OR colonia LIKE '%' || $4 || '%')
                                                    ;
                                                `;
                                                values = [direccionParsed.TIPOVIAL, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                                const result = await pgClient.query(query, values);
                                                for (let i = 0; i < result.rows.length; i++) {
                                                    result.rows[i].scoring = {
                                                        fiability: 42,
                                                        tipo_viabilidad: 100,
                                                        nombre_viabilidad: 0,
                                                        codigo_postal: 0,
                                                        municipio: 100,
                                                        estado: 100,
                                                        colonia: 100
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
                                                        AND (colonia = '' OR colonia LIKE '%' || $4 || '%')
                                                        ;
                                                    `;
                                                    values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.COLONIA];
                                                    const result = await pgClient.query(query, values);
                                                    for (let i = 0; i < result.rows.length; i++) {
                                                        result.rows[i].scoring = {
                                                            fiability: 34,
                                                            tipo_viabilidad: 100,
                                                            nombre_viabilidad: 0,
                                                            codigo_postal: 0,
                                                            municipio: 100,
                                                            estado: 0,
                                                            colonia: 100
                                                        };
                                                        const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                                        if (matchCP) {
                                                            result.rows[i].scoring.codigo_postal += 100;
                                                            result.rows[i].scoring.fiability += 8;
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
                                                            AND estado = $3
                                                            AND (colonia = '' OR colonia LIKE '%' || $4 || '%')
                                                            ;
                                                        `;
                                                        values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                                        const result = await pgClient.query(query, values);
                                                        for (let i = 0; i < result.rows.length; i++) {
                                                            result.rows[i].scoring = {
                                                                fiability: 34,
                                                                tipo_viabilidad: 100,
                                                                nombre_viabilidad: 0,
                                                                codigo_postal: 0,
                                                                municipio: 0,
                                                                estado: 100,
                                                                colonia: 100
                                                            };
                                                            const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                                            if (matchCP) {
                                                                result.rows[i].scoring.codigo_postal += 100;
                                                                result.rows[i].scoring.fiability += 8;
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
                                                                AND municipio = $4
                                                                ;
                                                            `;
                                                            values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.MUNICIPIO];
                                                            const result = await pgClient.query(query, values);
                                                            for (let i = 0; i < result.rows.length; i++) {
                                                                result.rows[i].scoring = {
                                                                    fiability: 34,
                                                                    tipo_viabilidad: 100,
                                                                    nombre_viabilidad: 0,
                                                                    codigo_postal: 0,
                                                                    municipio: 100,
                                                                    estado: 100,
                                                                    colonia: 0
                                                                };
                                                                const matchCP = result.rows[i].codigo_postal === direccionParsed.CP;
                                                                if (matchCP) {
                                                                    result.rows[i].scoring.codigo_postal += 100;
                                                                    result.rows[i].scoring.fiability += 8;
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
module.exports = sinNumeroExterior;