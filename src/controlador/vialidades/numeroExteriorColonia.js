const pgClient = require("../../data/conexion");
const { levenshteinDistance, quitarAcentos } = require("../funciones");

// Aplicable solo en caso de llevar todos los campos
async function numeroExteriorColonia(direccionParsed) {
    let query = '';
    let values = [];
    let rows = [];
    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
    query = `
        SELECT *,
        CASE
            -- Si es una línea, calcula la interpolación
            WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN
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
                                                                      WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($3 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                      ELSE 0.5
                                                                  END
                                                              WHEN $3 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                  CASE 
                                                                      WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($3 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                      ELSE 0.5
                                                                  END
                                                           END))
            -- Si es un punto, extrae directamente las coordenadas
            ELSE ST_Y("SP_GEOMETRY")
        END AS y_centro,
        CASE
            -- Si es una línea, calcula la interpolación
            WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN
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
                                                                      WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($3 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                      ELSE 0.5
                                                                  END
                                                              WHEN $3 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                  CASE 
                                                                      WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($3 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                      ELSE 0.5
                                                                  END
                                                           END))
            -- Si es un punto, extrae directamente las coordenadas
            ELSE ST_X("SP_GEOMETRY")
        END AS x_centro
        FROM carto_geolocalizador
        WHERE unaccent(nombre_vialidad) LIKE '%' || $1 || '%'
        AND unaccent(colonia) LIKE '%' || $2 || '%'
        AND (((CAST(l_refaddr AS INTEGER) <= $3 AND CAST(l_nrefaddr AS INTEGER) >= $3)
        OR (CAST(r_refaddr AS INTEGER) <= $3 AND CAST(r_nrefaddr AS INTEGER) >= $3)) 
        OR ((CAST(l_refaddr AS INTEGER) >= $3 AND CAST(l_nrefaddr AS INTEGER) <= $3)
        OR (CAST(r_refaddr AS INTEGER) >= $3 AND CAST(r_nrefaddr AS INTEGER) <= $3)))
        AND unaccent(tipo_vialidad) = $4
        ;
    `;
    values = [direccionParsed.NOMVIAL, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1, direccionParsed.TIPOVIAL];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        // Inicializar la cadena de resultado
        let resultado = '';
        let tabla = '';

        // Concatenar cada campo si tiene un valor
        if (result.rows[i].tipo_vialidad) resultado += `${result.rows[i].tipo_vialidad} `;
        if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
        resultado += `${direccionParsed.NUMEXTNUM1} `;
        if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
        if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
        if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
        if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

        if (result.rows[i].tipo == 'CALLE') {
            tabla = `carto_calle`;
        }
        else if (result.rows[i].tipo == 'CARRETERA') {
            tabla = `carto_carreteras123`;
        }
        else if (result.rows[i].tipo == 'POI') {
            tabla = `carto_poi`;
        }
        // Asignar el resultado al campo "resultado"
        result.rows[i].resultado = resultado.trim();
        result.rows[i].tipo = `Calle`;
        result.rows[i].id = result.rows[i].id_calle;
        result.rows[i].campo = `Id`;
        result.rows[i].imagen = 'punto';
        result.rows[i].tabla = tabla;
        result.rows[i].scoring = {
            fiability: 40,
            tipo_vialidad: 100,
            nombre_vialidad: 0,
            colonia: 0,
            numero_exterior: 100
        };
        const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
        const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
        if (matchNombreCalle) {
            const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
            let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
            if (igualdad > 100) igualdad = 100;
            result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
            result.rows[i].scoring.fiability += Math.round(igualdad * 0.3);
        }
        const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
        const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
        if (matchColonia) {
            const matchedText = matchColonia[0]; // Obtiene el texto coincidente
            let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
            if (igualdad > 100) igualdad = 100;
            result.rows[i].scoring.colonia += Math.round(igualdad);
            result.rows[i].scoring.fiability += Math.round(igualdad * 0.3);
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
            AND unaccent(colonia) LIKE '%' || $2 || '%'
            AND unaccent(tipo_vialidad) = $3
            ;
        `;
        values = [direccionParsed.NOMVIAL, direccionParsed.COLONIA, direccionParsed.TIPOVIAL];
        const result = await pgClient.query(query, values);
        for (let i = 0; i < result.rows.length; i++) {
            // Inicializar la cadena de resultado
            let resultado = '';
            let tabla = '';
            let imagen = '';

            // Concatenar cada campo si tiene un valor
            if (result.rows[i].tipo_vialidad) resultado += `${result.rows[i].tipo_vialidad} `;
            if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
            resultado += `COL. `;
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
                fiability: 20,
                tipo_vialidad: 100,
                nombre_vialidad: 0,
                colonia: 0,
                numero_exterior: 0
            };
            const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
            const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
            if (matchNombreCalle) {
                const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                if (igualdad > 100) igualdad = 100;
                result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
                result.rows[i].scoring.fiability += Math.round(igualdad * 0.3);
            }
            const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
            const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
            if (matchColonia) {
                const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                if (igualdad > 100) igualdad = 100;
                result.rows[i].scoring.colonia += Math.round(igualdad);
                result.rows[i].scoring.fiability += Math.round(igualdad * 0.3);
            }
        }
        rows = rows.concat(result.rows);
        if (result.rows.length === 0) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,
                CASE
                    -- Si es una línea, calcula la interpolación
                    WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN
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
                                                                              WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($3 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                              ELSE 0.5
                                                                          END
                                                                      WHEN $3 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                          CASE 
                                                                              WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($3 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                              ELSE 0.5
                                                                          END
                                                                   END))
                    -- Si es un punto, extrae directamente las coordenadas
                    ELSE ST_Y("SP_GEOMETRY")
                END AS y_centro,
                CASE
                    -- Si es una línea, calcula la interpolación
                    WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN
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
                                                                              WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($3 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                              ELSE 0.5
                                                                          END
                                                                      WHEN $3 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                          CASE 
                                                                              WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($3 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                              ELSE 0.5
                                                                          END
                                                                   END))
                    -- Si es un punto, extrae directamente las coordenadas
                    ELSE ST_X("SP_GEOMETRY")
                END AS x_centro
                FROM carto_geolocalizador
                WHERE unaccent(nombre_vialidad) LIKE '%' || $1 || '%'
                AND (((CAST(l_refaddr AS INTEGER) <= $3 AND CAST(l_nrefaddr AS INTEGER) >= $3)
                OR (CAST(r_refaddr AS INTEGER) <= $3 AND CAST(r_nrefaddr AS INTEGER) >= $3)) 
                OR ((CAST(l_refaddr AS INTEGER) >= $3 AND CAST(l_nrefaddr AS INTEGER) <= $3)
                OR (CAST(r_refaddr AS INTEGER) >= $3 AND CAST(r_nrefaddr AS INTEGER) <= $3)))
                AND unaccent(tipo_vialidad) = $2
                ;
            `;
            values = [direccionParsed.NOMVIAL, direccionParsed.TIPOVIAL, direccionParsed.NUMEXTNUM1];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                // Inicializar la cadena de resultado
                let resultado = '';
                let tabla = '';

                // Concatenar cada campo si tiene un valor
                if (result.rows[i].tipo_vialidad) resultado += `${result.rows[i].tipo_vialidad} `;
                if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                resultado += `${direccionParsed.NUMEXTNUM1} `;
                if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                if (result.rows[i].tipo == 'CALLE') {
                    tabla = `carto_calle`;
                }
                else if (result.rows[i].tipo == 'CARRETERA') {
                    tabla = `carto_carreteras123`;
                }
                else if (result.rows[i].tipo == 'POI') {
                    tabla = `carto_poi`;
                }
                // Asignar el resultado al campo "resultado"
                result.rows[i].resultado = resultado.trim();
                result.rows[i].tipo = `Calle`;
                result.rows[i].id = result.rows[i].id_calle;
                result.rows[i].campo = `Id`;
                result.rows[i].imagen = 'punto';
                result.rows[i].tabla = tabla;
                result.rows[i].scoring = {
                    fiability: 40,
                    tipo_vialidad: 100,
                    nombre_vialidad: 0,
                    colonia: 0,
                    numero_exterior: 100
                };
                const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                if (matchNombreCalle) {
                    const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                    let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                    if (igualdad > 100) igualdad = 100;
                    result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
                    result.rows[i].scoring.fiability += Math.round(igualdad * 0.3);
                }
                // Calcular la distancia de Levenshtein
                const distanceColonia = levenshteinDistance(quitarAcentos(result.rows[i].colonia), direccionParsed.COLONIA);
                // Calcular la similitud como el inverso de la distancia de Levenshtein
                const maxLengthColonia = Math.max(result.rows[i].colonia.length, direccionParsed.COLONIA.length);
                const similarityColonia = ((maxLengthColonia - distanceColonia) / maxLengthColonia) * 100;
                if (similarityColonia) {
                    result.rows[i].scoring.colonia += similarityColonia;
                    result.rows[i].scoring.fiability += (similarityColonia * 0.3);
                }
            }
            rows = rows.concat(result.rows);
            if (result.rows.length === 0) {
                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                query = `
                    SELECT *,
                    CASE
                        -- Si es una línea, calcula la interpolación
                        WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN
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
                                                                                  WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($3 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                  ELSE 0.5
                                                                              END
                                                                          WHEN $3 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                              CASE 
                                                                                  WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($3 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                                  ELSE 0.5
                                                                              END
                                                                       END))
                        -- Si es un punto, extrae directamente las coordenadas
                        ELSE ST_Y("SP_GEOMETRY")
                    END AS y_centro,
                    CASE
                        -- Si es una línea, calcula la interpolación
                        WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN
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
                                                                                  WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($3 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                  ELSE 0.5
                                                                              END
                                                                          WHEN $3 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                              CASE 
                                                                                  WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($3 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                                  ELSE 0.5
                                                                              END
                                                                       END))
                        -- Si es un punto, extrae directamente las coordenadas
                        ELSE ST_X("SP_GEOMETRY")
                    END AS x_centro
                    FROM carto_geolocalizador
                    WHERE unaccent(colonia) LIKE '%' || $1 || '%'
                    AND (((CAST(l_refaddr AS INTEGER) <= $3 AND CAST(l_nrefaddr AS INTEGER) >= $3)
                    OR (CAST(r_refaddr AS INTEGER) <= $3 AND CAST(r_nrefaddr AS INTEGER) >= $3)) 
                    OR ((CAST(l_refaddr AS INTEGER) >= $3 AND CAST(l_nrefaddr AS INTEGER) <= $3)
                    OR (CAST(r_refaddr AS INTEGER) >= $3 AND CAST(r_nrefaddr AS INTEGER) <= $3)))
                    AND unaccent(tipo_vialidad) = $2
                    ;
                `;
                values = [direccionParsed.COLONIA, direccionParsed.TIPOVIAL, direccionParsed.NUMEXTNUM1];
                const result = await pgClient.query(query, values);
                for (let i = 0; i < result.rows.length; i++) {
                    // Inicializar la cadena de resultado
                    let resultado = '';
                    let tabla = '';

                    // Concatenar cada campo si tiene un valor
                    if (result.rows[i].tipo_vialidad) resultado += `${result.rows[i].tipo_vialidad} `;
                    if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                    resultado += `${direccionParsed.NUMEXTNUM1} `;
                    if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                    if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                    if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                    if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                    if (result.rows[i].tipo == 'CALLE') {
                        tabla = `carto_calle`;
                    }
                    else if (result.rows[i].tipo == 'CARRETERA') {
                        tabla = `carto_carreteras123`;
                    }
                    else if (result.rows[i].tipo == 'POI') {
                        tabla = `carto_poi`;
                    }
                    // Asignar el resultado al campo "resultado"
                    result.rows[i].resultado = resultado.trim();
                    result.rows[i].tipo = `Calle`;
                    result.rows[i].id = result.rows[i].id_calle;
                    result.rows[i].campo = `Id`;
                    result.rows[i].imagen = 'punto';
                    result.rows[i].tabla = tabla;
                    result.rows[i].scoring = {
                        fiability: 40,
                        tipo_vialidad: 100,
                        nombre_vialidad: 0,
                        colonia: 0,
                        numero_exterior: 100
                    };
                    // Calcular la distancia de Levenshtein
                    const distance = levenshteinDistance(quitarAcentos(result.rows[i].nombre_vialidad), direccionParsed.NOMVIAL);
                    // Calcular la similitud como el inverso de la distancia de Levenshtein
                    const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.NOMVIAL.length);
                    const similarity = ((maxLength - distance) / maxLength) * 100;
                    if (similarity) {
                        result.rows[i].scoring.nombre_vialidad += similarity;
                        result.rows[i].scoring.fiability += (similarity * 0.3);
                    }
                    const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
                    const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
                    if (matchColonia) {
                        const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                        let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                        if (igualdad > 100) igualdad = 100;
                        result.rows[i].scoring.colonia += Math.round(igualdad);
                        result.rows[i].scoring.fiability += Math.round(igualdad * 0.3);
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
                        WHERE unaccent(colonia) LIKE '%' || $1 || '%'
                        AND unaccent(tipo_vialidad) = $2
                        ;
                    `;
                    values = [direccionParsed.COLONIA, direccionParsed.TIPOVIAL];
                    const result = await pgClient.query(query, values);
                    for (let i = 0; i < result.rows.length; i++) {
                        // Inicializar la cadena de resultado
                        let resultado = '';
                        let tabla = '';
                        let imagen = '';

                        // Concatenar cada campo si tiene un valor
                        if (result.rows[i].tipo_vialidad) resultado += `${result.rows[i].tipo_vialidad} `;
                        if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                        resultado += `COL. `;
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
                            fiability: 20,
                            tipo_vialidad: 100,
                            nombre_vialidad: 0,
                            colonia: 0,
                            numero_exterior: 0
                        };
                        // Calcular la distancia de Levenshtein
                        const distance = levenshteinDistance(quitarAcentos(result.rows[i].nombre_vialidad), direccionParsed.NOMVIAL);
                        // Calcular la similitud como el inverso de la distancia de Levenshtein
                        const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.NOMVIAL.length);
                        const similarity = ((maxLength - distance) / maxLength) * 100;
                        if (similarity) {
                            result.rows[i].scoring.nombre_vialidad += similarity;
                            result.rows[i].scoring.fiability += (similarity * 0.3);
                        }
                        const coloniaSinAcentos = quitarAcentos(result.rows[i].colonia);
                        const matchColonia = coloniaSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
                        if (matchColonia) {
                            const matchedText = matchColonia[0]; // Obtiene el texto coincidente
                            let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
                            if (igualdad > 100) igualdad = 100;
                            result.rows[i].scoring.colonia += Math.round(igualdad);
                            result.rows[i].scoring.fiability += Math.round(igualdad * 0.3);
                        }
                    }
                    rows = rows.concat(result.rows);
                    if (result.rows.length === 0) {
                        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                        query = `
                            SELECT *,
                            CASE
                                -- Si es una línea, calcula la interpolación
                                WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN
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
                                                                                          WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($2 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                          ELSE 0.5
                                                                                      END
                                                                                  WHEN $2 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                      CASE 
                                                                                          WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($2 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                                          ELSE 0.5
                                                                                      END
                                                                               END))
                                -- Si es un punto, extrae directamente las coordenadas
                                ELSE ST_Y("SP_GEOMETRY")
                            END AS y_centro,
                            CASE
                                -- Si es una línea, calcula la interpolación
                                WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN
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
                                                                                          WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($2 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                          ELSE 0.5
                                                                                      END
                                                                                  WHEN $2 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                      CASE 
                                                                                          WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($2 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                                          ELSE 0.5
                                                                                      END
                                                                               END))
                                -- Si es un punto, extrae directamente las coordenadas
                                ELSE ST_X("SP_GEOMETRY")
                            END AS x_centro
                            FROM carto_geolocalizador
                            WHERE (((CAST(l_refaddr AS INTEGER) <= $2 AND CAST(l_nrefaddr AS INTEGER) >= $2)
                            OR (CAST(r_refaddr AS INTEGER) <= $2 AND CAST(r_nrefaddr AS INTEGER) >= $2)) 
                            OR ((CAST(l_refaddr AS INTEGER) >= $2 AND CAST(l_nrefaddr AS INTEGER) <= $2)
                            OR (CAST(r_refaddr AS INTEGER) >= $2 AND CAST(r_nrefaddr AS INTEGER) <= $2)))
                            AND unaccent(tipo_vialidad) = $1
                            ;
                        `;
                        values = [direccionParsed.TIPOVIAL, direccionParsed.NUMEXTNUM1];
                        const result = await pgClient.query(query, values);
                        for (let i = 0; i < result.rows.length; i++) {
                            // Inicializar la cadena de resultado
                            let resultado = '';
                            let tabla = '';

                            // Concatenar cada campo si tiene un valor
                            if (result.rows[i].tipo_vialidad) resultado += `${result.rows[i].tipo_vialidad} `;
                            if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                            resultado += `${direccionParsed.NUMEXTNUM1} `;
                            if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                            if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                            if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                            if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                            if (result.rows[i].tipo == 'CALLE') {
                                tabla = `carto_calle`;
                            }
                            else if (result.rows[i].tipo == 'CARRETERA') {
                                tabla = `carto_carreteras123`;
                            }
                            else if (result.rows[i].tipo == 'POI') {
                                tabla = `carto_poi`;
                            }
                            // Asignar el resultado al campo "resultado"
                            result.rows[i].resultado = resultado.trim();
                            result.rows[i].tipo = `Calle`;
                            result.rows[i].id = result.rows[i].id_calle;
                            result.rows[i].campo = `Id`;
                            result.rows[i].imagen = 'punto';
                            result.rows[i].tabla = tabla;
                            result.rows[i].scoring = {
                                fiability: 40,
                                tipo_vialidad: 100,
                                nombre_vialidad: 0,
                                colonia: 0,
                                numero_exterior: 100
                            };
                            // Calcular la distancia de Levenshtein
                            const distance = levenshteinDistance(quitarAcentos(result.rows[i].nombre_vialidad), direccionParsed.NOMVIAL);
                            // Calcular la similitud como el inverso de la distancia de Levenshtein
                            const maxLength = Math.max(result.rows[i].nombre_vialidad.length, direccionParsed.NOMVIAL.length);
                            const similarity = ((maxLength - distance) / maxLength) * 100;
                            if (similarity) {
                                result.rows[i].scoring.nombre_vialidad += similarity;
                                result.rows[i].scoring.fiability += (similarity * 0.3);
                            }
                            // Calcular la distancia de Levenshtein
                            const distanceColonia = levenshteinDistance(quitarAcentos(result.rows[i].colonia), direccionParsed.COLONIA);
                            // Calcular la similitud como el inverso de la distancia de Levenshtein
                            const maxLengthColonia = Math.max(result.rows[i].colonia.length, direccionParsed.COLONIA.length);
                            const similarityColonia = ((maxLengthColonia - distanceColonia) / maxLengthColonia) * 100;
                            if (similarityColonia) {
                                result.rows[i].scoring.colonia += similarityColonia;
                                result.rows[i].scoring.fiability += (similarityColonia * 0.3);
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
                                resultado += `COL. `;
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
                                    fiability: 20,
                                    tipo_vialidad: 100,
                                    nombre_vialidad: 0,
                                    colonia: 0,
                                    numero_exterior: 0
                                };
                                const nombreCalleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                                if (matchNombreCalle) {
                                    const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
                                    let igualdad = matchedText.length * 100 / result.rows[i].nombre_vialidad.length;
                                    if (igualdad > 100) igualdad = 100;
                                    result.rows[i].scoring.nombre_vialidad += Math.round(igualdad);
                                    result.rows[i].scoring.fiability += Math.round(igualdad * 0.3);
                                }
                                // Calcular la distancia de Levenshtein
                                const distanceColonia = levenshteinDistance(quitarAcentos(result.rows[i].colonia), direccionParsed.COLONIA);
                                // Calcular la similitud como el inverso de la distancia de Levenshtein
                                const maxLengthColonia = Math.max(result.rows[i].colonia.length, direccionParsed.COLONIA.length);
                                const similarityColonia = ((maxLengthColonia - distanceColonia) / maxLengthColonia) * 100;
                                if (similarityColonia) {
                                    result.rows[i].scoring.colonia += similarityColonia;
                                    result.rows[i].scoring.fiability += (similarityColonia * 0.3);
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
module.exports = numeroExteriorColonia;