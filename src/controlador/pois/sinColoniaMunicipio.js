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
        lat_y AS y_centro,
        lon_x AS x_centro
        FROM carto_geolocalizador
        WHERE unaccent(poi) like '%' || $1 || '%'
        AND codigo_postal = $2 
        AND unaccent(estado) = $3
        AND numero = $4
        ;
    `;
    values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        result.rows[i].scoring = {
            fiability: 40,
            poi: 0,
            codigo_postal: 100,
            estado: 100,
            numero_exterior: 100
        };
        const nombrePoiSinAcentos = quitarAcentos(result.rows[i].poi);
        const matchNombrePoi = nombrePoiSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
        if (matchNombrePoi) {
            const matchedText = matchNombrePoi[0]; // Obtiene el texto coincidente
            let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
            if (igualdad > 100) igualdad = 100;
            result.rows[i].scoring.poi += Math.round(igualdad);
            result.rows[i].scoring.fiability += Math.round(igualdad * 0.6);
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
            WHERE unaccent(poi) like '%' || $1 || '%'
            AND unaccent(estado) = $2
            AND numero = $3
            ;
        `;
        values = [direccionParsed.CALLE, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
        const result = await pgClient.query(query, values);
        for (let i = 0; i < result.rows.length; i++) {
            result.rows[i].scoring = {
                fiability: 30,
                poi: 0,
                codigo_postal: 0,
                estado: 100,
                numero_exterior: 100
            };
            const nombrePoiSinAcentos = quitarAcentos(result.rows[i].poi);
            const matchNombrePoi = nombrePoiSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
            if (matchNombrePoi) {
                const matchedText = matchNombrePoi[0]; // Obtiene el texto coincidente
                let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                if (igualdad > 100) igualdad = 100;
                result.rows[i].scoring.poi += Math.round(igualdad);
                result.rows[i].scoring.fiability += Math.round(igualdad * 0.6);
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
                WHERE unaccent(poi) like '%' || $1 || '%'
                AND codigo_postal = $2 
                AND numero = $3
                ;
            `;
            values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.NUMEXTNUM1];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 30,
                    poi: 0,
                    codigo_postal: 100,
                    estado: 0,
                    numero_exterior: 100
                };
                const nombrePoiSinAcentos = quitarAcentos(result.rows[i].poi);
                const matchNombrePoi = nombrePoiSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                if (matchNombrePoi) {
                    const matchedText = matchNombrePoi[0]; // Obtiene el texto coincidente
                    let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                    if (igualdad > 100) igualdad = 100;
                    result.rows[i].scoring.poi += Math.round(igualdad);
                    result.rows[i].scoring.fiability += Math.round(igualdad * 0.6);
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
                    WHERE unaccent(poi) like '%' || $1 || '%'
                    AND numero = $2
                    ;
                `;
                values = [direccionParsed.CALLE, direccionParsed.NUMEXTNUM1];
                const result = await pgClient.query(query, values);

                for (let i = 0; i < result.rows.length; i++) {
                    result.rows[i].scoring = {
                        fiability: 20,
                        poi: 0,
                        codigo_postal: 0,
                        estado: 0,
                        numero_exterior: 100
                    };
                    const nombrePoiSinAcentos = quitarAcentos(result.rows[i].poi);
                    const matchNombrePoi = nombrePoiSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                    if (matchNombrePoi) {
                        const matchedText = matchNombrePoi[0]; // Obtiene el texto coincidente
                        let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                        if (igualdad > 100) igualdad = 100;
                        result.rows[i].scoring.poi += Math.round(igualdad);
                        result.rows[i].scoring.fiability += Math.round(igualdad * 0.6);
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
                        WHERE unaccent(poi) like '%' || $1 || '%'
                        AND codigo_postal = $2 
                        AND unaccent(estado) = $3
                        ;
                    `;
                    values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.ESTADO];
                    const result = await pgClient.query(query, values);
                    for (let i = 0; i < result.rows.length; i++) {
                        result.rows[i].scoring = {
                            fiability: 20,
                            poi: 0,
                            codigo_postal: 100,
                            estado: 100,
                            numero_exterior: 0
                        };
                        const nombrePoiSinAcentos = quitarAcentos(result.rows[i].poi);
                        const matchNombrePoi = nombrePoiSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                        if (matchNombrePoi) {
                            const matchedText = matchNombrePoi[0]; // Obtiene el texto coincidente
                            let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                            if (igualdad > 100) igualdad = 100;
                            result.rows[i].scoring.poi += Math.round(igualdad);
                            result.rows[i].scoring.fiability += Math.round(igualdad * 0.6);
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
                            WHERE unaccent(poi) like '%' || $1 || '%'
                            AND codigo_postal = $2 
                            ;
                        `;
                        values = [direccionParsed.CALLE, direccionParsed.CP];
                        const result = await pgClient.query(query, values);
                        for (let i = 0; i < result.rows.length; i++) {
                            result.rows[i].scoring = {
                                fiability: 10,
                                poi: 0,
                                codigo_postal: 100,
                                estado: 0,
                                numero_exterior: 0
                            };
                            const nombrePoiSinAcentos = quitarAcentos(result.rows[i].poi);
                            const matchNombrePoi = nombrePoiSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                            if (matchNombrePoi) {
                                const matchedText = matchNombrePoi[0]; // Obtiene el texto coincidente
                                let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                                if (igualdad > 100) igualdad = 100;
                                result.rows[i].scoring.poi += Math.round(igualdad);
                                result.rows[i].scoring.fiability += Math.round(igualdad * 0.6);
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
                                WHERE unaccent(poi) like '%' || $1 || '%'
                                AND unaccent(estado) = $2
                                ;
                            `;
                            values = [direccionParsed.CALLE, direccionParsed.ESTADO];
                            const result = await pgClient.query(query, values);
                            for (let i = 0; i < result.rows.length; i++) {
                                result.rows[i].scoring = {
                                    fiability: 10,
                                    poi: 0,
                                    codigo_postal: 0,
                                    estado: 100,
                                    numero_exterior: 0
                                };
                                const nombrePoiSinAcentos = quitarAcentos(result.rows[i].poi);
                                const matchNombrePoi = nombrePoiSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                                if (matchNombrePoi) {
                                    const matchedText = matchNombrePoi[0]; // Obtiene el texto coincidente
                                    let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                                    if (igualdad > 100) igualdad = 100;
                                    result.rows[i].scoring.poi += Math.round(igualdad);
                                    result.rows[i].scoring.fiability += Math.round(igualdad * 0.6);
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
                                    WHERE codigo_postal = $1
                                    AND unaccent(estado) = $2
                                    AND numero = $3
                                    ;
                                `;
                                values = [direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
                                const result = await pgClient.query(query, values);
                                for (let i = 0; i < result.rows.length; i++) {
                                    result.rows[i].scoring = {
                                        fiability: 40,
                                        poi: 0,
                                        codigo_postal: 100,
                                        estado: 100,
                                        numero_exterior: 100
                                    };
                                    // Calcular la distancia de Levenshtein
                                    const distance = levenshteinDistance(result.rows[i].poi, direccionParsed.CALLE);
                                    // Calcular la similitud como el inverso de la distancia de Levenshtein
                                    const maxLength = Math.max(result.rows[i].poi.length, direccionParsed.CALLE.length);
                                    const similarity = ((maxLength - distance) / maxLength) * 100;
                                    if (similarity) {
                                        result.rows[i].scoring.poi += similarity;
                                        result.rows[i].scoring.fiability += (similarity * 0.6);
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
                                        WHERE unaccent(estado) = $1
                                        AND numero = $2
                                        ;
                                    `;
                                    values = [direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
                                    const result = await pgClient.query(query, values);
                                    for (let i = 0; i < result.rows.length; i++) {
                                        result.rows[i].scoring = {
                                            fiability: 30,
                                            poi: 0,
                                            codigo_postal: 0,
                                            estado: 100,
                                            numero_exterior: 100
                                        };
                                        // Calcular la distancia de Levenshtein
                                        const distance = levenshteinDistance(result.rows[i].poi, direccionParsed.CALLE);
                                        // Calcular la similitud como el inverso de la distancia de Levenshtein
                                        const maxLength = Math.max(result.rows[i].poi.length, direccionParsed.CALLE.length);
                                        const similarity = ((maxLength - distance) / maxLength) * 100;
                                        if (similarity) {
                                            result.rows[i].scoring.poi += similarity;
                                            result.rows[i].scoring.fiability += (similarity * 0.6);
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
                                            WHERE codigo_postal = $1 
                                            AND numero = $2
                                            ;
                                        `;
                                        values = [direccionParsed.CP, direccionParsed.NUMEXTNUM1];
                                        const result = await pgClient.query(query, values);
                                        for (let i = 0; i < result.rows.length; i++) {
                                            result.rows[i].scoring = {
                                                fiability: 30,
                                                poi: 0,
                                                codigo_postal: 100,
                                                estado: 0,
                                                numero_exterior: 100
                                            };
                                            // Calcular la distancia de Levenshtein
                                            const distance = levenshteinDistance(result.rows[i].poi, direccionParsed.CALLE);
                                            // Calcular la similitud como el inverso de la distancia de Levenshtein
                                            const maxLength = Math.max(result.rows[i].poi.length, direccionParsed.CALLE.length);
                                            const similarity = ((maxLength - distance) / maxLength) * 100;
                                            if (similarity) {
                                                result.rows[i].scoring.poi += similarity;
                                                result.rows[i].scoring.fiability += (similarity * 0.6);
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
                                                WHERE codigo_postal = $1
                                                AND unaccent(estado) = $2
                                                ;
                                            `;
                                            values = [direccionParsed.CP, direccionParsed.ESTADO];
                                            const result = await pgClient.query(query, values);
                                            for (let i = 0; i < result.rows.length; i++) {
                                                result.rows[i].scoring = {
                                                    fiability: 20,
                                                    poi: 0,
                                                    codigo_postal: 100,
                                                    estado: 100,
                                                    numero_exterior: 0
                                                };
                                                // Calcular la distancia de Levenshtein
                                                const distance = levenshteinDistance(result.rows[i].poi, direccionParsed.CALLE);
                                                // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                const maxLength = Math.max(result.rows[i].poi.length, direccionParsed.CALLE.length);
                                                const similarity = ((maxLength - distance) / maxLength) * 100;
                                                if (similarity) {
                                                    result.rows[i].scoring.poi += similarity;
                                                    result.rows[i].scoring.fiability += (similarity * 0.6);
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