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
        lat_y AS y_centro,
        lon_x AS x_centro
        FROM carto_geolocalizador
        WHERE unaccent(poi) like '%' || $1 || '%'
        AND unaccent(municipio) = $2
        AND unaccent(estado) = $3
        AND numero = $4
        ;
    `;
    values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        // Inicializar la cadena de resultado
        let resultado = '';

        // Concatenar cada campo si tiene un valor
        if (result.rows[i].poi) resultado += `${result.rows[i].poi} `;
        resultado += `${direccionParsed.NUMEXTNUM1} `;
        if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
        if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
        if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
        if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

        // Asignar el resultado al campo "resultado"
        result.rows[i].resultado = resultado.trim();
        result.rows[i].tipo = `POI`;
        result.rows[i].id = result.rows[i].id_calle;
        result.rows[i].campo = `Id`;
        result.rows[i].imagen = 'punto';
        result.rows[i].tabla = 'carto_poi';
        result.rows[i].id_estado = 0;
        result.rows[i].id_municipio = 0;
        result.rows[i].id_region = 0;
        result.rows[i].scoring = {
            fiability: 50,
            poi: 0,
            municipio: 100,
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
            result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
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
            AND unaccent(municipio) = $2
            AND unaccent(estado) = $3
            ;
        `;
        values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
        const result = await pgClient.query(query, values);
        for (let i = 0; i < result.rows.length; i++) {
            // Inicializar la cadena de resultado
            let resultado = '';

            // Concatenar cada campo si tiene un valor
            if (result.rows[i].poi) resultado += `${result.rows[i].poi} `;
            if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
            if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
            if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
            if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

            // Asignar el resultado al campo "resultado"
            result.rows[i].resultado = resultado.trim();
            result.rows[i].tipo = `POI`;
            result.rows[i].id = result.rows[i].id_calle;
            result.rows[i].campo = `Id`;
            result.rows[i].imagen = 'punto';
            result.rows[i].tabla = 'carto_poi';
            result.rows[i].id_estado = 0;
            result.rows[i].id_municipio = 0;
            result.rows[i].id_region = 0;
            result.rows[i].scoring = {
                fiability: 30,
                poi: 0,
                municipio: 100,
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
                result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
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
                // Inicializar la cadena de resultado
                let resultado = '';

                // Concatenar cada campo si tiene un valor
                if (result.rows[i].poi) resultado += `${result.rows[i].poi} `;
                resultado += `${direccionParsed.NUMEXTNUM1} `;
                if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                // Asignar el resultado al campo "resultado"
                result.rows[i].resultado = resultado.trim();
                result.rows[i].tipo = `POI`;
                result.rows[i].id = result.rows[i].id_calle;
                result.rows[i].campo = `Id`;
                result.rows[i].imagen = 'punto';
                result.rows[i].tabla = 'carto_poi';
                result.rows[i].id_estado = 0;
                result.rows[i].id_municipio = 0;
                result.rows[i].id_region = 0;
                result.rows[i].scoring = {
                    fiability: 35,
                    poi: 0,
                    municipio: 0,
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
                    result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
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
                    AND unaccent(municipio) = $2
                    AND numero = $3
                    ;
                `;
                values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1];
                const result = await pgClient.query(query, values);
                for (let i = 0; i < result.rows.length; i++) {
                    // Inicializar la cadena de resultado
                    let resultado = '';

                    // Concatenar cada campo si tiene un valor
                    if (result.rows[i].poi) resultado += `${result.rows[i].poi} `;
                    resultado += `${direccionParsed.NUMEXTNUM1} `;
                    if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                    if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                    if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                    if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                    // Asignar el resultado al campo "resultado"
                    result.rows[i].resultado = resultado.trim();
                    result.rows[i].tipo = `POI`;
                    result.rows[i].id = result.rows[i].id_calle;
                    result.rows[i].campo = `Id`;
                    result.rows[i].imagen = 'punto';
                    result.rows[i].tabla = 'carto_poi';
                    result.rows[i].id_estado = 0;
                    result.rows[i].id_municipio = 0;
                    result.rows[i].id_region = 0;
                    result.rows[i].scoring = {
                        fiability: 35,
                        poi: 0,
                        municipio: 100,
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
                        result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
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
                        // Inicializar la cadena de resultado
                        let resultado = '';

                        // Concatenar cada campo si tiene un valor
                        if (result.rows[i].poi) resultado += `${result.rows[i].poi} `;
                        resultado += `${direccionParsed.NUMEXTNUM1} `;
                        if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                        if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                        if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                        if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                        // Asignar el resultado al campo "resultado"
                        result.rows[i].resultado = resultado.trim();
                        result.rows[i].tipo = `POI`;
                        result.rows[i].id = result.rows[i].id_calle;
                        result.rows[i].campo = `Id`;
                        result.rows[i].imagen = 'punto';
                        result.rows[i].tabla = 'carto_poi';
                        result.rows[i].id_estado = 0;
                        result.rows[i].id_municipio = 0;
                        result.rows[i].id_region = 0;
                        result.rows[i].scoring = {
                            fiability: 20,
                            poi: 0,
                            municipio: 0,
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
                            result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
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
                            AND unaccent(municipio) = $2
                            ;
                        `;
                        values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO];
                        const result = await pgClient.query(query, values);
                        for (let i = 0; i < result.rows.length; i++) {
                            // Inicializar la cadena de resultado
                            let resultado = '';

                            // Concatenar cada campo si tiene un valor
                            if (result.rows[i].poi) resultado += `${result.rows[i].poi} `;
                            if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                            if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                            if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                            if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                            // Asignar el resultado al campo "resultado"
                            result.rows[i].resultado = resultado.trim();
                            result.rows[i].tipo = `POI`;
                            result.rows[i].id = result.rows[i].id_calle;
                            result.rows[i].campo = `Id`;
                            result.rows[i].imagen = 'punto';
                            result.rows[i].tabla = 'carto_poi';
                            result.rows[i].id_estado = 0;
                            result.rows[i].id_municipio = 0;
                            result.rows[i].id_region = 0;
                            result.rows[i].scoring = {
                                fiability: 15,
                                poi: 0,
                                municipio: 100,
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
                                result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
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
                                // Inicializar la cadena de resultado
                                let resultado = '';

                                // Concatenar cada campo si tiene un valor
                                if (result.rows[i].poi) resultado += `${result.rows[i].poi} `;
                                if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                                if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                                if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                                if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                                // Asignar el resultado al campo "resultado"
                                result.rows[i].resultado = resultado.trim();
                                result.rows[i].tipo = `POI`;
                                result.rows[i].id = result.rows[i].id_calle;
                                result.rows[i].campo = `Id`;
                                result.rows[i].imagen = 'punto';
                                result.rows[i].tabla = 'carto_poi';
                                result.rows[i].id_estado = 0;
                                result.rows[i].id_municipio = 0;
                                result.rows[i].id_region = 0;
                                result.rows[i].scoring = {
                                    fiability: 15,
                                    poi: 0,
                                    municipio: 0,
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
                                    result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
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
                                    AND unaccent(municipio) = $1
                                    AND unaccent(estado) = $2
                                    ;
                                `;
                                values = [direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                                const result = await pgClient.query(query, values);
                                for (let i = 0; i < result.rows.length; i++) {
                                    // Inicializar la cadena de resultado
                                    let resultado = '';

                                    // Concatenar cada campo si tiene un valor
                                    if (result.rows[i].poi) resultado += `${result.rows[i].poi} `;
                                    if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                                    if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                                    if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                                    if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                                    // Asignar el resultado al campo "resultado"
                                    result.rows[i].resultado = resultado.trim();
                                    result.rows[i].tipo = `POI`;
                                    result.rows[i].id = result.rows[i].id_calle;
                                    result.rows[i].campo = `Id`;
                                    result.rows[i].imagen = 'punto';
                                    result.rows[i].tabla = 'carto_poi';
                                    result.rows[i].id_estado = 0;
                                    result.rows[i].id_municipio = 0;
                                    result.rows[i].id_region = 0;
                                    result.rows[i].scoring = {
                                        fiability: 30,
                                        poi: 0,
                                        municipio: 100,
                                        estado: 100,
                                        numero_exterior: 0
                                    };
                                    // Calcular la distancia de Levenshtein
                                    const distance = levenshteinDistance(quitarAcentos(result.rows[i].poi), direccionParsed.CALLE);
                                    // Calcular la similitud como el inverso de la distancia de Levenshtein
                                    const maxLength = Math.max(result.rows[i].poi.length, direccionParsed.CALLE.length);
                                    const similarity = ((maxLength - distance) / maxLength) * 100;
                                    if (similarity) {
                                        result.rows[i].scoring.poi += similarity;
                                        result.rows[i].scoring.fiability += (similarity * 0.5);
                                    }
                                    if (result.rows[i].numero === direccionParsed.NUMEXTNUM1 && similarity > 80) {
                                        result.rows[i].scoring.numero_exterior += 100;
                                        result.rows[i].scoring.fiability += 20;
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
    return rows;
}
module.exports = sinColoniaCP;