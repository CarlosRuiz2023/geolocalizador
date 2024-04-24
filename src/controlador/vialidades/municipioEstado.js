const pgClient = require("../../data/conexion");
const { levenshteinDistance, quitarAcentos } = require("../funciones");

// Aplicable solo en caso de llevar todos los campos
async function municipioEstado(direccionParsed) {
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
        WHERE unaccent(nombre_vialidad) LIKE '%' || $1 || '%'
        AND unaccent(municipio) = $2
        AND unaccent(estado) = $3
        AND unaccent(tipo_vialidad) = $4
        ;
    `;
    values = [direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.TIPOVIAL];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        // Inicializar la cadena de resultado
        let resultado = '';
        let tabla = '';
        let imagen = '';

        // Concatenar cada campo si tiene un valor
        if (result.rows[i].tipo_vialidad) resultado += `${result.rows[i].tipo_vialidad} `;
        if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
        if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
        if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
        if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
        if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

        if (result.rows[i].tipo == 'CALLE') {
            tabla = `carto_calle`;
            imagen = `linea`;
        }
        else if (result.rows[i].tipo == 'CARRETERA') {
            tabla = `carto_carreteras123`;
            imagen = `linea`;
        }
        else if (result.rows[i].tipo == 'POI') {
            tabla = `carto_poi`;
            imagen = `punto`;
        }
        // Asignar el resultado al campo "resultado"
        result.rows[i].resultado = resultado.trim();
        result.rows[i].tipo = `Calle`;
        result.rows[i].id = result.rows[i].id_calle;
        result.rows[i].campo = `Id`;
        result.rows[i].imagen = imagen;
        result.rows[i].tabla = tabla;
        result.rows[i].scoring = {
            fiability: 50,
            tipo_vialidad: 100,
            nombre_vialidad: 0,
            municipio: 100,
            estado: 100
        };
        const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
        const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
        if (matchNombreCalle) {
            const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
            let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
            if (igualdad > 100) igualdad = 100;
            result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
            result.rows[i].scoring.fiability += Math.round(igualdad * 0.5);
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
            WHERE unaccent(nombre_vialidad) LIKE '%' || $1 || '%'
            AND unaccent(municipio) = $2
            AND unaccent(tipo_vialidad) = $3
            ;
        `;
        values = [direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO, direccionParsed.TIPOVIAL];
        const result = await pgClient.query(query, values);
        for (let i = 0; i < result.rows.length; i++) {
            // Inicializar la cadena de resultado
            let resultado = '';
            let tabla = '';
            let imagen = '';

            // Concatenar cada campo si tiene un valor
            if (result.rows[i].tipo_vialidad) resultado += `${result.rows[i].tipo_vialidad} `;
            if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
            if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
            if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
            if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
            if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

            if (result.rows[i].tipo == 'CALLE') {
                tabla = `carto_calle`;
                imagen = `linea`;
            }
            else if (result.rows[i].tipo == 'CARRETERA') {
                tabla = `carto_carreteras123`;
                imagen = `linea`;
            }
            else if (result.rows[i].tipo == 'POI') {
                tabla = `carto_poi`;
                imagen = `punto`;
            }
            // Asignar el resultado al campo "resultado"
            result.rows[i].resultado = resultado.trim();
            result.rows[i].tipo = `Calle`;
            result.rows[i].id = result.rows[i].id_calle;
            result.rows[i].campo = `Id`;
            result.rows[i].imagen = imagen;
            result.rows[i].tabla = tabla;
            result.rows[i].scoring = {
                fiability: 30,
                tipo_vialidad: 100,
                nombre_vialidad: 0,
                municipio: 100,
                estado: 0
            };
            const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
            const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
            if (matchNombreCalle) {
                const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                if (igualdad > 100) igualdad = 100;
                result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
                result.rows[i].scoring.fiability += Math.round(igualdad * 0.5);
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
                WHERE unaccent(nombre_vialidad) LIKE '%' || $1 || '%'
                AND unaccent(estado) = $3
                AND unaccent(tipo_vialidad) = $2
                ;
            `;
            values = [direccionParsed.NOMVIAL, direccionParsed.TIPOVIAL, direccionParsed.ESTADO];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                // Inicializar la cadena de resultado
                let resultado = '';
                let tabla = '';
                let imagen = '';

                // Concatenar cada campo si tiene un valor
                if (result.rows[i].tipo_vialidad) resultado += `${result.rows[i].tipo_vialidad} `;
                if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                if (result.rows[i].tipo == 'CALLE') {
                    tabla = `carto_calle`;
                    imagen = `linea`;
                }
                else if (result.rows[i].tipo == 'CARRETERA') {
                    tabla = `carto_carreteras123`;
                    imagen = `linea`;
                }
                else if (result.rows[i].tipo == 'POI') {
                    tabla = `carto_poi`;
                    imagen = `punto`;
                }
                // Asignar el resultado al campo "resultado"
                result.rows[i].resultado = resultado.trim();
                result.rows[i].tipo = `Calle`;
                result.rows[i].id = result.rows[i].id_calle;
                result.rows[i].campo = `Id`;
                result.rows[i].imagen = imagen;
                result.rows[i].tabla = tabla;
                result.rows[i].scoring = {
                    fiability: 30,
                    tipo_vialidad: 100,
                    nombre_vialidad: 0,
                    municipio: 0,
                    estado: 100
                };
                const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                if (matchNombreCalle) {
                    const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                    let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                    if (igualdad > 100) igualdad = 100;
                    result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
                    result.rows[i].scoring.fiability += Math.round(igualdad * 0.5);
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
                    AND unaccent(estado) = $3
                    AND unaccent(tipo_vialidad) = $2
                    ;
                `;
                values = [direccionParsed.MUNICIPIO, direccionParsed.TIPOVIAL, direccionParsed.ESTADO];
                const result = await pgClient.query(query, values);
                for (let i = 0; i < result.rows.length; i++) {
                    // Inicializar la cadena de resultado
                    let resultado = '';
                    let tabla = '';
                    let imagen = '';

                    // Concatenar cada campo si tiene un valor
                    if (result.rows[i].tipo_vialidad) resultado += `${result.rows[i].tipo_vialidad} `;
                    if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                    if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                    if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                    if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                    if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                    if (result.rows[i].tipo == 'CALLE') {
                        tabla = `carto_calle`;
                        imagen = `linea`;
                    }
                    else if (result.rows[i].tipo == 'CARRETERA') {
                        tabla = `carto_carreteras123`;
                        imagen = `linea`;
                    }
                    else if (result.rows[i].tipo == 'POI') {
                        tabla = `carto_poi`;
                        imagen = `punto`;
                    }
                    // Asignar el resultado al campo "resultado"
                    result.rows[i].resultado = resultado.trim();
                    result.rows[i].tipo = `Calle`;
                    result.rows[i].id = result.rows[i].id_calle;
                    result.rows[i].campo = `Id`;
                    result.rows[i].imagen = imagen;
                    result.rows[i].tabla = tabla;
                    result.rows[i].scoring = {
                        fiability: 50,
                        tipo_vialidad: 100,
                        nombre_vialidad: 0,
                        municipio: 100,
                        estado: 100
                    };
                    // Calcular la distancia de Levenshtein
                    const distance = levenshteinDistance(quitarAcentos(result.rows[i].nombre_vialidad), direccionParsed.NOMVIAL);
                    // Calcular la similitud como el inverso de la distancia de Levenshtein
                    const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.NOMVIAL.length);
                    const similarity = ((maxLength - distance) / maxLength) * 100;
                    if (similarity) {
                        result.rows[i].scoring.nombre_vialidad += similarity;
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
                        AND unaccent(tipo_vialidad) = $2
                        ;
                    `;
                    values = [direccionParsed.MUNICIPIO, direccionParsed.TIPOVIAL];
                    const result = await pgClient.query(query, values);
                    for (let i = 0; i < result.rows.length; i++) {
                        // Inicializar la cadena de resultado
                        let resultado = '';
                        let tabla = '';
                        let imagen = '';

                        // Concatenar cada campo si tiene un valor
                        if (result.rows[i].tipo_vialidad) resultado += `${result.rows[i].tipo_vialidad} `;
                        if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                        if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                        if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                        if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                        if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                        if (result.rows[i].tipo == 'CALLE') {
                            tabla = `carto_calle`;
                            imagen = `linea`;
                        }
                        else if (result.rows[i].tipo == 'CARRETERA') {
                            tabla = `carto_carreteras123`;
                            imagen = `linea`;
                        }
                        else if (result.rows[i].tipo == 'POI') {
                            tabla = `carto_poi`;
                            imagen = `punto`;
                        }
                        // Asignar el resultado al campo "resultado"
                        result.rows[i].resultado = resultado.trim();
                        result.rows[i].tipo = `Calle`;
                        result.rows[i].id = result.rows[i].id_calle;
                        result.rows[i].campo = `Id`;
                        result.rows[i].imagen = imagen;
                        result.rows[i].tabla = tabla;
                        result.rows[i].scoring = {
                            fiability: 30,
                            tipo_vialidad: 100,
                            nombre_vialidad: 0,
                            municipio: 100,
                            estado: 0
                        };
                        // Calcular la distancia de Levenshtein
                        const distance = levenshteinDistance(quitarAcentos(result.rows[i].nombre_vialidad), direccionParsed.NOMVIAL);
                        // Calcular la similitud como el inverso de la distancia de Levenshtein
                        const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.NOMVIAL.length);
                        const similarity = ((maxLength - distance) / maxLength) * 100;
                        if (similarity) {
                            result.rows[i].scoring.nombre_vialidad += similarity;
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
                            WHERE unaccent(estado) = $1
                            AND unaccent(tipo_vialidad) = $2
                            ;
                        `;
                        values = [direccionParsed.ESTADO, direccionParsed.TIPOVIAL];
                        const result = await pgClient.query(query, values);
                        for (let i = 0; i < result.rows.length; i++) {
                            // Inicializar la cadena de resultado
                            let resultado = '';
                            let tabla = '';
                            let imagen = '';

                            // Concatenar cada campo si tiene un valor
                            if (result.rows[i].tipo_vialidad) resultado += `${result.rows[i].tipo_vialidad} `;
                            if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                            if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                            if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                            if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                            if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                            if (result.rows[i].tipo == 'CALLE') {
                                tabla = `carto_calle`;
                                imagen = `linea`;
                            }
                            else if (result.rows[i].tipo == 'CARRETERA') {
                                tabla = `carto_carreteras123`;
                                imagen = `linea`;
                            }
                            else if (result.rows[i].tipo == 'POI') {
                                tabla = `carto_poi`;
                                imagen = `punto`;
                            }
                            // Asignar el resultado al campo "resultado"
                            result.rows[i].resultado = resultado.trim();
                            result.rows[i].tipo = `Calle`;
                            result.rows[i].id = result.rows[i].id_calle;
                            result.rows[i].campo = `Id`;
                            result.rows[i].imagen = imagen;
                            result.rows[i].tabla = tabla;
                            result.rows[i].scoring = {
                                fiability: 30,
                                tipo_vialidad: 100,
                                nombre_vialidad: 0,
                                municipio: 0,
                                estado: 100
                            };
                            // Calcular la distancia de Levenshtein
                            const distance = levenshteinDistance(quitarAcentos(result.rows[i].nombre_vialidad), direccionParsed.NOMVIAL);
                            // Calcular la similitud como el inverso de la distancia de Levenshtein
                            const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.NOMVIAL.length);
                            const similarity = ((maxLength - distance) / maxLength) * 100;
                            if (similarity) {
                                result.rows[i].scoring.nombre_vialidad += similarity;
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
                                WHERE unaccent(nombre_vialidad) LIKE '%' || $1 || '%'
                                AND unaccent(tipo_vialidad) = $2
                                ;
                            `;
                            values = [direccionParsed.NOMVIAL, direccionParsed.TIPOVIAL];
                            const result = await pgClient.query(query, values);
                            for (let i = 0; i < result.rows.length; i++) {
                                // Inicializar la cadena de resultado
                                let resultado = '';
                                let tabla = '';
                                let imagen = '';

                                // Concatenar cada campo si tiene un valor
                                if (result.rows[i].tipo_vialidad) resultado += `${result.rows[i].tipo_vialidad} `;
                                if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                                if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                                if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                                if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                                if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                                if (result.rows[i].tipo == 'CALLE') {
                                    tabla = `carto_calle`;
                                    imagen = `linea`;
                                }
                                else if (result.rows[i].tipo == 'CARRETERA') {
                                    tabla = `carto_carreteras123`;
                                    imagen = `linea`;
                                }
                                else if (result.rows[i].tipo == 'POI') {
                                    tabla = `carto_poi`;
                                    imagen = `punto`;
                                }
                                // Asignar el resultado al campo "resultado"
                                result.rows[i].resultado = resultado.trim();
                                result.rows[i].tipo = `Calle`;
                                result.rows[i].id = result.rows[i].id_calle;
                                result.rows[i].campo = `Id`;
                                result.rows[i].imagen = imagen;
                                result.rows[i].tabla = tabla;
                                result.rows[i].scoring = {
                                    fiability: 10,
                                    tipo_vialidad: 100,
                                    nombre_vialidad: 0,
                                    municipio: 0,
                                    estado: 0
                                };
                                const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                                if (matchNombreCalle) {
                                    const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                    let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                                    if (igualdad > 100) igualdad = 100;
                                    result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
                                    result.rows[i].scoring.fiability += Math.round(igualdad * 0.5);
                                }
                            }
                            rows = rows.concat(result.rows);
                        }
                    }
                }
            }
        }
    }
    return rows;
}
module.exports = municipioEstado;