const pgClient = require("../../data/conexion");
const { levenshteinDistance } = require("../funciones");

// Aplicable solo en caso de llevar todos los campos
async function sinCP(direccionParsed) {
    let query = '';
    let values = [];
    let rows = [];
    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
    query = `
        SELECT *,
        lat_y AS y_centro,
        lon_x AS x_centro
        FROM carto_geolocalizador
        WHERE poi like '%' || $1 || '%'
        AND municipio = $2
        AND estado = $3
        AND numero = $5
        AND colonia LIKE '%' || $4 || '%'
        ;
    `;
    values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        result.rows[i].scoring = {
            fiability: 40,
            poi: 0,
            municipio: 100,
            estado: 100,
            numero_exterior: 100,
            colonia: 0,
        };
        const matchNombrePoi = result.rows[i].poi.match(new RegExp(direccionParsed.CALLE, 'i'));
        if (matchNombrePoi) {
            const matchedText = matchNombrePoi[0]; // Obtiene el texto coincidente
            let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
            if (igualdad > 100) igualdad = 100;
            result.rows[i].scoring.poi += Math.round(igualdad);
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
            lat_y AS y_centro,
            lon_x AS x_centro
            FROM carto_geolocalizador
            WHERE poi like '%' || $1 || '%'
            AND estado = $2
            AND numero = $4
            AND colonia LIKE '%' || $3 || '%'
            ;
        `;
        values = [direccionParsed.CALLE, direccionParsed.ESTADO, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
        const result = await pgClient.query(query, values);
        for (let i = 0; i < result.rows.length; i++) {
            result.rows[i].scoring = {
                fiability: 30,
                poi: 0,
                municipio: 0,
                estado: 100,
                numero_exterior: 100,
                colonia: 0
            };
            const matchNombrePoi = result.rows[i].poi.match(new RegExp(direccionParsed.CALLE, 'i'));
            if (matchNombrePoi) {
                const matchedText = matchNombrePoi[0]; // Obtiene el texto coincidente
                let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                if (igualdad > 100) igualdad = 100;
                result.rows[i].scoring.poi += Math.round(igualdad);
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
                lat_y AS y_centro,
                lon_x AS x_centro
                FROM carto_geolocalizador
                WHERE nombre_vialidad like '%' || $1 || '%'
                AND municipio = $2
                AND numero = $4
                AND colonia LIKE '%' || $3 || '%'
                ;
            `;
            values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 30,
                    poi: 0,
                    municipio: 100,
                    estado: 0,
                    numero_exterior: 100,
                    colonia: 0
                };
                const matchNombrePoi = result.rows[i].poi.match(new RegExp(direccionParsed.CALLE, 'i'));
                if (matchNombrePoi) {
                    const matchedText = matchNombrePoi[0]; // Obtiene el texto coincidente
                    let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                    if (igualdad > 100) igualdad = 100;
                    result.rows[i].scoring.poi += Math.round(igualdad);
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
                    lat_y AS y_centro,
                    lon_x AS x_centro
                    FROM carto_geolocalizador
                    WHERE poi like '%' || $1 || '%'
                    AND municipio = $2
                    AND numero = $4
                    AND estado = $3
                    ;
                `;
                values = [direccionParsed.COLONIA, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
                const result = await pgClient.query(query, values);
                for (let i = 0; i < result.rows.length; i++) {
                    result.rows[i].scoring = {
                        fiability: 40,
                        poi: 0,
                        municipio: 100,
                        estado: 100,
                        numero_exterior: 100,
                        colonia: 0
                    };
                    const matchNombrePoi = result.rows[i].poi.match(new RegExp(direccionParsed.COLONIA, 'i'));
                    if (matchNombrePoi) {
                        const matchedText = matchNombrePoi[0]; // Obtiene el texto coincidente
                        let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                        if (igualdad > 100) igualdad = 100;
                        result.rows[i].scoring.poi += Math.round(igualdad);
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
                        lat_y AS y_centro,
                        lon_x AS x_centro
                        FROM carto_geolocalizador
                        WHERE poi like '%' || $1 || '%'
                        AND numero = $3
                        AND estado = $2
                        ;
                    `;
                    values = [direccionParsed.COLONIA, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
                    const result = await pgClient.query(query, values);
                    for (let i = 0; i < result.rows.length; i++) {
                        result.rows[i].scoring = {
                            fiability: 30,
                            poi: 0,
                            municipio: 0,
                            estado: 100,
                            numero_exterior: 100,
                            colonia: 0
                        };
                        const matchNombrePoi = result.rows[i].poi.match(new RegExp(direccionParsed.COLONIA, 'i'));
                        if (matchNombrePoi) {
                            const matchedText = matchNombrePoi[0]; // Obtiene el texto coincidente
                            let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                            if (igualdad > 100) igualdad = 100;
                            result.rows[i].scoring.poi += Math.round(igualdad);
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
                            lat_y AS y_centro,
                            lon_x AS x_centro
                            FROM carto_geolocalizador
                            WHERE poi like '%' || $1 || '%'
                            AND numero = $3
                            AND colonia LIKE '%' || $2 || '%'
                            ;
                        `;
                        values = [direccionParsed.CALLE, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
                        const result = await pgClient.query(query, values);
                        for (let i = 0; i < result.rows.length; i++) {
                            result.rows[i].scoring = {
                                fiability: 20,
                                poi: 0,
                                municipio: 0,
                                estado: 0,
                                numero_exterior: 100,
                                colonia: 0
                            };
                            const matchNombrePoi = result.rows[i].poi.match(new RegExp(direccionParsed.CALLE, 'i'));
                            if (matchNombrePoi) {
                                const matchedText = matchNombrePoi[0]; // Obtiene el texto coincidente
                                let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                                if (igualdad > 100) igualdad = 100;
                                result.rows[i].scoring.poi += Math.round(igualdad);
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
                                lat_y AS y_centro,
                                lon_x AS x_centro
                                FROM carto_geolocalizador
                                WHERE poi like '%' || $1 || '%'
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
                                    poi: 0,
                                    municipio: 100,
                                    estado: 100,
                                    numero_exterior: 0,
                                    colonia: 0
                                };
                                const matchNombrePoi = result.rows[i].poi.match(new RegExp(direccionParsed.CALLE, 'i'));
                                if (matchNombrePoi) {
                                    const matchedText = matchNombrePoi[0]; // Obtiene el texto coincidente
                                    let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                                    if (igualdad > 100) igualdad = 100;
                                    result.rows[i].scoring.poi += Math.round(igualdad);
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
                                    lat_y AS y_centro,
                                    lon_x AS x_centro
                                    FROM carto_geolocalizador
                                    WHERE poi like '%' || $1 || '%'
                                    AND numero = $3
                                    AND municipio = $2
                                    ;
                                `;
                                values = [direccionParsed.COLONIA, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1];
                                const result = await pgClient.query(query, values);
                                for (let i = 0; i < result.rows.length; i++) {
                                    result.rows[i].scoring = {
                                        fiability: 30,
                                        poi: 0,
                                        municipio: 100,
                                        estado: 0,
                                        numero_exterior: 100,
                                        colonia: 0
                                    };
                                    const matchNombrePoi = result.rows[i].poi.match(new RegExp(direccionParsed.COLONIA, 'i'));
                                    if (matchNombrePoi) {
                                        const matchedText = matchNombrePoi[0]; // Obtiene el texto coincidente
                                        let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                                        if (igualdad > 100) igualdad = 100;
                                        result.rows[i].scoring.poi += Math.round(igualdad);
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
                                        lat_y AS y_centro,
                                        lon_x AS x_centro
                                        FROM carto_geolocalizador
                                        WHERE poi like '%' || $1 || '%'
                                        AND municipio = $2
                                        AND colonia LIKE '%' || $3 || '%'
                                        ;
                                    `;
                                    values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.COLONIA];
                                    const result = await pgClient.query(query, values);
                                    for (let i = 0; i < result.rows.length; i++) {
                                        result.rows[i].scoring = {
                                            fiability: 10,
                                            poi: 0,
                                            municipio: 100,
                                            estado: 0,
                                            numero_exterior: 0,
                                            colonia: 0
                                        };
                                        const matchNombrePoi = result.rows[i].poi.match(new RegExp(direccionParsed.CALLE, 'i'));
                                        if (matchNombrePoi) {
                                            const matchedText = matchNombrePoi[0]; // Obtiene el texto coincidente
                                            let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                                            if (igualdad > 100) igualdad = 100;
                                            result.rows[i].scoring.poi += Math.round(igualdad);
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
                                            lat_y AS y_centro,
                                            lon_x AS x_centro
                                            FROM carto_geolocalizador
                                            WHERE poi like '%' || $1 || '%'
                                            AND estado = $2
                                            AND colonia LIKE '%' || $3 || '%'
                                            ;
                                        `;
                                        values = [direccionParsed.CALLE, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                        const result = await pgClient.query(query, values);
                                        for (let i = 0; i < result.rows.length; i++) {
                                            result.rows[i].scoring = {
                                                fiability: 10,
                                                poi: 0,
                                                municipio: 0,
                                                estado: 100,
                                                numero_exterior: 0,
                                                colonia: 0
                                            };
                                            const matchNombrePoi = result.rows[i].poi.match(new RegExp(direccionParsed.CALLE, 'i'));
                                            if (matchNombrePoi) {
                                                const matchedText = matchNombrePoi[0]; // Obtiene el texto coincidente
                                                let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                                                if (igualdad > 100) igualdad = 100;
                                                result.rows[i].scoring.poi += Math.round(igualdad);
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
                                                lat_y AS y_centro,
                                                lon_x AS x_centro
                                                FROM carto_geolocalizador
                                                WHERE poi like '%' || $1 || '%'
                                                AND estado = $2
                                                AND municipio = $3
                                                ;
                                            `;
                                            values = [direccionParsed.COLONIA, direccionParsed.ESTADO, direccionParsed.MUNICIPIO];
                                            const result = await pgClient.query(query, values);
                                            for (let i = 0; i < result.rows.length; i++) {
                                                result.rows[i].scoring = {
                                                    fiability: 20,
                                                    poi: 0,
                                                    municipio: 100,
                                                    estado: 100,
                                                    numero_exterior: 0,
                                                    colonia: 0
                                                };
                                                const matchNombrePoi = result.rows[i].poi.match(new RegExp(direccionParsed.COLONIA, 'i'));
                                                if (matchNombrePoi) {
                                                    const matchedText = matchNombrePoi[0]; // Obtiene el texto coincidente
                                                    let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                                                    if (igualdad > 100) igualdad = 100;
                                                    result.rows[i].scoring.poi += Math.round(igualdad);
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
                                                    lat_y AS y_centro,
                                                    lon_x AS x_centro
                                                    FROM carto_geolocalizador
                                                    WHERE municipio = $1
                                                    AND estado = $2
                                                    AND numero = $4
                                                    AND colonia LIKE '%' || $3 || '%'
                                                    ;
                                                `;
                                                values = [direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
                                                const result = await pgClient.query(query, values);
                                                for (let i = 0; i < result.rows.length; i++) {
                                                    result.rows[i].scoring = {
                                                        fiability: 40,
                                                        poi: 0,
                                                        municipio: 100,
                                                        estado: 100,
                                                        numero_exterior: 100,
                                                        colonia: 0
                                                    };
                                                    let distance=0;
                                                    let maxLength=0;
                                                    try {
                                                        // Calcular la distancia de Levenshtein
                                                        distance = levenshteinDistance(result.rows[i].poi, direccionParsed.CALLE);
                                                        // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                        maxLength = Math.max(result.rows[i].poi.length, direccionParsed.CALLE.length);
                                                    } catch (error) {
                                                        // Calcular la distancia de Levenshtein
                                                        distance = levenshteinDistance(result.rows[i].poi, direccionParsed.COLONIA);
                                                        // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                        maxLength = Math.max(result.rows[i].poi.length, direccionParsed.COLONIA.length);
                                                    }
                                                    const similarity = ((maxLength - distance) / maxLength) * 100;
                                                    if (similarity) {
                                                        result.rows[i].scoring.poi += similarity;
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
                                                        lat_y AS y_centro,
                                                        lon_x AS x_centro
                                                        FROM carto_geolocalizador
                                                        WHERE municipio = $1
                                                        AND numero = $3
                                                        AND colonia LIKE '%' || $2 || '%'
                                                        ;
                                                    `;
                                                    values = [direccionParsed.MUNICIPIO, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
                                                    const result = await pgClient.query(query, values);
                                                    for (let i = 0; i < result.rows.length; i++) {
                                                        result.rows[i].scoring = {
                                                            fiability: 30,
                                                            poi: 0,
                                                            municipio: 100,
                                                            estado: 0,
                                                            numero_exterior: 100,
                                                            colonia: 0
                                                        };
                                                        // Calcular la distancia de Levenshtein
                                                        const distance = levenshteinDistance(result.rows[i].poi, direccionParsed.CALLE);
                                                        // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                        const maxLength = Math.max(result.rows[i].poi.length, direccionParsed.CALLE.length);
                                                        const similarity = ((maxLength - distance) / maxLength) * 100;
                                                        if (similarity) {
                                                            result.rows[i].scoring.poi += similarity;
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
                                                            lat_y AS y_centro,
                                                            lon_x AS x_centro
                                                            FROM carto_geolocalizador
                                                            WHERE estado = $1
                                                            AND numero = $3
                                                            AND colonia LIKE '%' || $2 || '%'
                                                            ;
                                                        `;
                                                        values = [direccionParsed.ESTADO, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
                                                        const result = await pgClient.query(query, values);
                                                        for (let i = 0; i < result.rows.length; i++) {
                                                            result.rows[i].scoring = {
                                                                fiability: 30,
                                                                poi: 0,
                                                                municipio: 0,
                                                                estado: 100,
                                                                numero_exterior: 100,
                                                                colonia: 0
                                                            };
                                                            // Calcular la distancia de Levenshtein
                                                            const distance = levenshteinDistance(result.rows[i].poi, direccionParsed.CALLE);
                                                            // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                            const maxLength = Math.max(result.rows[i].poi.length, direccionParsed.CALLE.length);
                                                            const similarity = ((maxLength - distance) / maxLength) * 100;
                                                            if (similarity) {
                                                                result.rows[i].scoring.poi += similarity;
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
                                                                lat_y AS y_centro,
                                                                lon_x AS x_centro
                                                                FROM carto_geolocalizador
                                                                WHERE estado = $1
                                                                AND numero = $3
                                                                AND municipio = $2
                                                                ;
                                                            `;
                                                            values = [direccionParsed.ESTADO, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1];
                                                            const result = await pgClient.query(query, values);
                                                            for (let i = 0; i < result.rows.length; i++) {
                                                                result.rows[i].scoring = {
                                                                    fiability: 40,
                                                                    poi: 0,
                                                                    municipio: 100,
                                                                    estado: 100,
                                                                    numero_exterior: 100,
                                                                    colonia: 0
                                                                };
                                                                // Calcular la distancia de Levenshtein
                                                                const distance = levenshteinDistance(result.rows[i].poi, direccionParsed.CALLE);
                                                                // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                                const maxLength = Math.max(result.rows[i].poi.length, direccionParsed.CALLE.length);
                                                                const similarity = ((maxLength - distance) / maxLength) * 100;
                                                                if (similarity) {
                                                                    result.rows[i].scoring.poi += similarity;
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
                                                                    lat_y AS y_centro,
                                                                    lon_x AS x_centro
                                                                    FROM carto_geolocalizador
                                                                    WHERE municipio = $1
                                                                    AND estado = $2
                                                                    AND colonia LIKE '%' || $3 || '%'
                                                                    ;
                                                                `;
                                                                values = [direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                                                const result = await pgClient.query(query, values);
                                                                for (let i = 0; i < result.rows.length; i++) {
                                                                    result.rows[i].scoring = {
                                                                        fiability: 20,
                                                                        poi: 0,
                                                                        municipio: 100,
                                                                        estado: 100,
                                                                        numero_exterior: 0,
                                                                        colonia: 0
                                                                    };
                                                                    // Calcular la distancia de Levenshtein
                                                                    const distance = levenshteinDistance(result.rows[i].poi, direccionParsed.CALLE);
                                                                    // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                                    const maxLength = Math.max(result.rows[i].poi.length, direccionParsed.CALLE.length);
                                                                    const similarity = ((maxLength - distance) / maxLength) * 100;
                                                                    if (similarity) {
                                                                        result.rows[i].scoring.poi += similarity;
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
    return rows;
}
module.exports = sinCP;