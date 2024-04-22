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
        CASE
            -- Si es una línea, calcula la interpolación
            WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN
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
                                                                      WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($6 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                      ELSE 0.5
                                                                  END
                                                              WHEN $6 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                  CASE 
                                                                      WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($6 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
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
                                                                      WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($6 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                      ELSE 0.5
                                                                  END
                                                              WHEN $6 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                  CASE 
                                                                      WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($6 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                      ELSE 0.5
                                                                  END
                                                           END))
            -- Si es un punto, extrae directamente las coordenadas
            ELSE ST_X("SP_GEOMETRY")
        END AS x_centro
        FROM carto_geolocalizador
        WHERE unaccent(tipo_vialidad) = $1
        AND unaccent(nombre_vialidad) like '%' || $2 || '%'
        AND codigo_postal = $3 
        AND unaccent(municipio) = $4
        AND unaccent(estado) = $5
        AND (((CAST(l_refaddr AS INTEGER) <= $6 AND CAST(l_nrefaddr AS INTEGER) >= $6)
        OR (CAST(r_refaddr AS INTEGER) <= $6 AND CAST(r_nrefaddr AS INTEGER) >= $6)) 
        OR ((CAST(l_refaddr AS INTEGER) >= $6 AND CAST(l_nrefaddr AS INTEGER) <= $6)
        OR (CAST(r_refaddr AS INTEGER) >= $6 AND CAST(r_nrefaddr AS INTEGER) <= $6)))
        AND unaccent(colonia) LIKE '%' || $7 || '%'
        ;
    `;
    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        result.rows[i].scoring = {
            fiability: 40,
            tipo_vialidad: 100,
            nombre_vialidad: 0,
            codigo_postal: 100,
            municipio: 100,
            estado: 100,
            numero_exterior: 100,
            colonia: 0
        };
        const nombreVialidadSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
        const matchNombreVialidad = nombreVialidadSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
        if (matchNombreVialidad) {
            const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
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
                                                                          WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                          ELSE 0.5
                                                                      END
                                                                  WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                      CASE 
                                                                          WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
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
                                                                          WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                          ELSE 0.5
                                                                      END
                                                                  WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                      CASE 
                                                                          WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                          ELSE 0.5
                                                                      END
                                                               END))
                -- Si es un punto, extrae directamente las coordenadas
                ELSE ST_X("SP_GEOMETRY")
            END AS x_centro
            FROM carto_geolocalizador
            WHERE unaccent(tipo_vialidad) = $1
            AND unaccent(nombre_vialidad) like '%' || $2 || '%'
            AND unaccent(municipio) = $3
            AND unaccent(estado) = $4
            AND (((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
            OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5)) 
            OR ((CAST(l_refaddr AS INTEGER) >= $5 AND CAST(l_nrefaddr AS INTEGER) <= $5)
            OR (CAST(r_refaddr AS INTEGER) >= $5 AND CAST(r_nrefaddr AS INTEGER) <= $5)))
            AND unaccent(colonia) LIKE '%' || $6 || '%'
            ;
        `;
        values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
        const result = await pgClient.query(query, values);
        for (let i = 0; i < result.rows.length; i++) {
            result.rows[i].scoring = {
                fiability: 30,
                tipo_vialidad: 100,
                nombre_vialidad: 0,
                codigo_postal: 0,
                municipio: 100,
                estado: 100,
                numero_exterior: 100,
                colonia: 0
            };
            const nombreVialidadSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
            const matchNombreVialidad = nombreVialidadSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
            if (matchNombreVialidad) {
                const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
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
                                                                              WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                              ELSE 0.5
                                                                          END
                                                                      WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                          CASE 
                                                                              WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
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
                                                                              WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                              ELSE 0.5
                                                                          END
                                                                      WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                          CASE 
                                                                              WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                              ELSE 0.5
                                                                          END
                                                                   END))
                    -- Si es un punto, extrae directamente las coordenadas
                    ELSE ST_X("SP_GEOMETRY")
                END AS x_centro
                FROM carto_geolocalizador
                WHERE unaccent(tipo_vialidad) = $1
                AND unaccent(nombre_vialidad) like '%' || $2 || '%'
                AND codigo_postal = $3 
                AND unaccent(estado) = $4
                AND (((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5)) 
                OR ((CAST(l_refaddr AS INTEGER) >= $5 AND CAST(l_nrefaddr AS INTEGER) <= $5)
                OR (CAST(r_refaddr AS INTEGER) >= $5 AND CAST(r_nrefaddr AS INTEGER) <= $5)))
                AND unaccent(colonia) LIKE '%' || $6 || '%'
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 35,
                    tipo_vialidad: 100,
                    nombre_vialidad: 0,
                    codigo_postal: 100,
                    municipio: 0,
                    estado: 100,
                    numero_exterior: 100,
                    colonia: 0
                };
                const nombreVialidadSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                const matchNombreVialidad = nombreVialidadSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                if (matchNombreVialidad) {
                    const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
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
                                                                                  WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                  ELSE 0.5
                                                                              END
                                                                          WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                              CASE 
                                                                                  WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
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
                                                                                  WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                  ELSE 0.5
                                                                              END
                                                                          WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                              CASE 
                                                                                  WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                                  ELSE 0.5
                                                                              END
                                                                       END))
                        -- Si es un punto, extrae directamente las coordenadas
                        ELSE ST_X("SP_GEOMETRY")
                    END AS x_centro
                    FROM carto_geolocalizador
                    WHERE unaccent(tipo_vialidad) = $1
                    AND unaccent(nombre_vialidad) like '%' || $2 || '%'
                    AND codigo_postal = $3 
                    AND unaccent(municipio) = $4
                    AND (((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                    OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5)) 
                    OR ((CAST(l_refaddr AS INTEGER) >= $5 AND CAST(l_nrefaddr AS INTEGER) <= $5)
                    OR (CAST(r_refaddr AS INTEGER) >= $5 AND CAST(r_nrefaddr AS INTEGER) <= $5)))
                    AND unaccent(colonia) LIKE '%' || $6 || '%'
                    ;
                `;
                values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
                const result = await pgClient.query(query, values);
                for (let i = 0; i < result.rows.length; i++) {
                    result.rows[i].scoring = {
                        fiability: 35,
                        tipo_vialidad: 100,
                        nombre_vialidad: 0,
                        codigo_postal: 100,
                        municipio: 100,
                        estado: 0,
                        numero_exterior: 100,
                        colonia: 0
                    };
                    const nombreVialidadSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                    const matchNombreVialidad = nombreVialidadSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                    if (matchNombreVialidad) {
                        const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
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
                                                                                      WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                      ELSE 0.5
                                                                                  END
                                                                              WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                  CASE 
                                                                                      WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
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
                                                                                      WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                      ELSE 0.5
                                                                                  END
                                                                              WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                  CASE 
                                                                                      WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                                      ELSE 0.5
                                                                                  END
                                                                           END))
                            -- Si es un punto, extrae directamente las coordenadas
                            ELSE ST_X("SP_GEOMETRY")
                        END AS x_centro
                        FROM carto_geolocalizador
                        WHERE unaccent(tipo_vialidad) = $1
                        AND unaccent(nombre_vialidad) like '%' || $2 || '%'
                        AND codigo_postal = $3 
                        AND unaccent(municipio) = $4
                        AND (((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                        OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5)) 
                        OR ((CAST(l_refaddr AS INTEGER) >= $5 AND CAST(l_nrefaddr AS INTEGER) <= $5)
                        OR (CAST(r_refaddr AS INTEGER) >= $5 AND CAST(r_nrefaddr AS INTEGER) <= $5)))
                        AND unaccent(estado) = $6
                        ;
                    `;
                    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1, direccionParsed.ESTADO];
                    const result = await pgClient.query(query, values);
                    for (let i = 0; i < result.rows.length; i++) {
                        result.rows[i].scoring = {
                            fiability: 40,
                            tipo_vialidad: 100,
                            nombre_vialidad: 0,
                            codigo_postal: 100,
                            municipio: 100,
                            estado: 100,
                            numero_exterior: 100,
                            colonia: 0
                        };
                        const nombreVialidadSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                        const matchNombreVialidad = nombreVialidadSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                        if (matchNombreVialidad) {
                            const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
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
                                                                                          WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                          ELSE 0.5
                                                                                      END
                                                                                  WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                      CASE 
                                                                                          WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
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
                                                                                          WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                          ELSE 0.5
                                                                                      END
                                                                                  WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                      CASE 
                                                                                          WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                                          ELSE 0.5
                                                                                      END
                                                                               END))
                                -- Si es un punto, extrae directamente las coordenadas
                                ELSE ST_X("SP_GEOMETRY")
                            END AS x_centro
                            FROM carto_geolocalizador
                            WHERE unaccent(tipo_vialidad) = $1
                            AND unaccent(nombre_vialidad) like '%' || $2 || '%'
                            AND unaccent(municipio) = $3
                            AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                            OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
                            OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
                            OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
                            AND unaccent(estado) = $5
                            ;
                        `;
                        values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1, direccionParsed.ESTADO];
                        const result = await pgClient.query(query, values);
                        for (let i = 0; i < result.rows.length; i++) {
                            result.rows[i].scoring = {
                                fiability: 30,
                                tipo_vialidad: 100,
                                nombre_vialidad: 0,
                                codigo_postal: 0,
                                municipio: 100,
                                estado: 100,
                                numero_exterior: 100,
                                colonia: 0
                            };
                            const nombreVialidadSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                            const matchNombreVialidad = nombreVialidadSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                            if (matchNombreVialidad) {
                                const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
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
                                                                                              WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                              ELSE 0.5
                                                                                          END
                                                                                      WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                          CASE 
                                                                                              WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
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
                                                                                              WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                              ELSE 0.5
                                                                                          END
                                                                                      WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                          CASE 
                                                                                              WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                                              ELSE 0.5
                                                                                          END
                                                                                   END))
                                    -- Si es un punto, extrae directamente las coordenadas
                                    ELSE ST_X("SP_GEOMETRY")
                                END AS x_centro
                                FROM carto_geolocalizador
                                WHERE unaccent(tipo_vialidad) = $1
                                AND unaccent(nombre_vialidad) like '%' || $2 || '%'
                                AND codigo_postal = $3 
                                AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
                                OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
                                OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
                                AND unaccent(estado) = $5
                                ;
                            `;
                            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.NUMEXTNUM1, direccionParsed.ESTADO];
                            const result = await pgClient.query(query, values);
                            for (let i = 0; i < result.rows.length; i++) {
                                result.rows[i].scoring = {
                                    fiability: 35,
                                    tipo_vialidad: 100,
                                    nombre_vialidad: 0,
                                    codigo_postal: 100,
                                    municipio: 0,
                                    estado: 100,
                                    numero_exterior: 100,
                                    colonia: 0
                                };
                                const nombreVialidadSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                const matchNombreVialidad = nombreVialidadSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                                if (matchNombreVialidad) {
                                    const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
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
                                                                                                  WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                                  ELSE 0.5
                                                                                              END
                                                                                          WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                              CASE 
                                                                                                  WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
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
                                                                                                  WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                                  ELSE 0.5
                                                                                              END
                                                                                          WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                              CASE 
                                                                                                  WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                                                  ELSE 0.5
                                                                                              END
                                                                                       END))
                                        -- Si es un punto, extrae directamente las coordenadas
                                        ELSE ST_X("SP_GEOMETRY")
                                    END AS x_centro
                                    FROM carto_geolocalizador
                                    WHERE unaccent(tipo_vialidad) = $1
                                    AND unaccent(nombre_vialidad) like '%' || $2 || '%'
                                    AND unaccent(municipio) = $3
                                    AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                    OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
                                    OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
                                    OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
                                    AND unaccent(colonia) LIKE '%' || $5 || '%'
                                    ;
                                `;
                                values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
                                const result = await pgClient.query(query, values);
                                for (let i = 0; i < result.rows.length; i++) {
                                    result.rows[i].scoring = {
                                        fiability: 25,
                                        tipo_vialidad: 100,
                                        nombre_vialidad: 0,
                                        codigo_postal: 0,
                                        municipio: 100,
                                        estado: 0,
                                        numero_exterior: 100,
                                        colonia: 0
                                    };
                                    const nombreVialidadSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                    const matchNombreVialidad = nombreVialidadSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                                    if (matchNombreVialidad) {
                                        const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
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
                                                                                                      WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                                      ELSE 0.5
                                                                                                  END
                                                                                              WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                  CASE 
                                                                                                      WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
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
                                                                                                      WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                                      ELSE 0.5
                                                                                                  END
                                                                                              WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                  CASE 
                                                                                                      WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                                                      ELSE 0.5
                                                                                                  END
                                                                                           END))
                                            -- Si es un punto, extrae directamente las coordenadas
                                            ELSE ST_X("SP_GEOMETRY")
                                        END AS x_centro
                                        FROM carto_geolocalizador
                                        WHERE unaccent(tipo_vialidad) = $1
                                        AND unaccent(nombre_vialidad) like '%' || $2 || '%'
                                        AND codigo_postal = $3 
                                        AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                        OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
                                        OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
                                        OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
                                        AND unaccent(colonia) LIKE '%' || $5 || '%'
                                        ;
                                    `;
                                    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
                                    const result = await pgClient.query(query, values);
                                    for (let i = 0; i < result.rows.length; i++) {
                                        result.rows[i].scoring = {
                                            fiability: 30,
                                            tipo_vialidad: 100,
                                            nombre_vialidad: 0,
                                            codigo_postal: 100,
                                            municipio: 0,
                                            estado: 0,
                                            numero_exterior: 100,
                                            colonia: 0
                                        };
                                        const nombreVialidadSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                        const matchNombreVialidad = nombreVialidadSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                                        if (matchNombreVialidad) {
                                            const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
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
                                            WHERE unaccent(tipo_vialidad) = $1
                                            AND unaccent(nombre_vialidad) like '%' || $2 || '%'
                                            AND codigo_postal = $3 
                                            AND unaccent(municipio) = $4
                                            AND unaccent(estado) = $5
                                            AND unaccent(colonia) LIKE '%' || $6 || '%'
                                            ;
                                        `;
                                        values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                        const result = await pgClient.query(query, values);
                                        for (let i = 0; i < result.rows.length; i++) {
                                            result.rows[i].scoring = {
                                                fiability: 25,
                                                tipo_vialidad: 100,
                                                nombre_vialidad: 0,
                                                codigo_postal: 100,
                                                municipio: 100,
                                                estado: 100,
                                                numero_exterior: 0,
                                                colonia: 0
                                            };
                                            const nombreVialidadSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                            const matchNombreVialidad = nombreVialidadSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                                            if (matchNombreVialidad) {
                                                const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
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
                                                                                                              WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                                              ELSE 0.5
                                                                                                          END
                                                                                                      WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                          CASE 
                                                                                                              WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
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
                                                                                                              WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                                              ELSE 0.5
                                                                                                          END
                                                                                                      WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                          CASE 
                                                                                                              WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                                                              ELSE 0.5
                                                                                                          END
                                                                                                   END))
                                                    -- Si es un punto, extrae directamente las coordenadas
                                                    ELSE ST_X("SP_GEOMETRY")
                                                END AS x_centro
                                                FROM carto_geolocalizador
                                                WHERE unaccent(tipo_vialidad) = $1
                                                AND unaccent(nombre_vialidad) like '%' || $2 || '%'
                                                AND codigo_postal = $3 
                                                AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
                                                OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
                                                OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
                                                AND unaccent(municipio) = $5
                                                ;
                                            `;
                                            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.NUMEXTNUM1, direccionParsed.MUNICIPIO];
                                            const result = await pgClient.query(query, values);
                                            for (let i = 0; i < result.rows.length; i++) {
                                                result.rows[i].scoring = {
                                                    fiability: 35,
                                                    tipo_vialidad: 100,
                                                    nombre_vialidad: 0,
                                                    codigo_postal: 100,
                                                    municipio: 100,
                                                    estado: 0,
                                                    numero_exterior: 100,
                                                    colonia: 0
                                                };
                                                const nombreVialidadSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                                const matchNombreVialidad = nombreVialidadSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                                                if (matchNombreVialidad) {
                                                    const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
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
                                                        WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5))
                                                        ELSE lat_y
                                                    END AS y_centro,
                                                    CASE
                                                        WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5))
                                                        ELSE lon_x
                                                    END AS x_centro
                                                    FROM carto_geolocalizador
                                                    WHERE unaccent(tipo_vialidad) = $1
                                                    AND unaccent(nombre_vialidad) like '%' || $2 || '%'
                                                    AND codigo_postal = $3 
                                                    AND unaccent(municipio) = $4
                                                    AND unaccent(colonia) LIKE '%' || $5 || '%'
                                                    ;
                                                `;
                                                values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.COLONIA];
                                                const result = await pgClient.query(query, values);
                                                for (let i = 0; i < result.rows.length; i++) {
                                                    result.rows[i].scoring = {
                                                        fiability: 20,
                                                        tipo_vialidad: 100,
                                                        nombre_vialidad: 0,
                                                        codigo_postal: 100,
                                                        municipio: 100,
                                                        estado: 0,
                                                        numero_exterior: 0,
                                                        colonia: 0
                                                    };
                                                    const nombreVialidadSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                                    const matchNombreVialidad = nombreVialidadSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                                                    if (matchNombreVialidad) {
                                                        const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
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
                                                        WHERE unaccent(tipo_vialidad) = $1
                                                        AND unaccent(nombre_vialidad) like '%' || $2 || '%'
                                                        AND unaccent(municipio) = $3
                                                        AND unaccent(estado) = $4
                                                        AND unaccent(colonia) LIKE '%' || $5 || '%'
                                                        ;
                                                    `;
                                                    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                                    const result = await pgClient.query(query, values);
                                                    for (let i = 0; i < result.rows.length; i++) {
                                                        result.rows[i].scoring = {
                                                            fiability: 15,
                                                            tipo_vialidad: 100,
                                                            nombre_vialidad: 0,
                                                            codigo_postal: 0,
                                                            municipio: 100,
                                                            estado: 100,
                                                            numero_exterior: 0,
                                                            colonia: 0
                                                        };
                                                        const nombreVialidadSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                                        const matchNombreVialidad = nombreVialidadSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                                                        if (matchNombreVialidad) {
                                                            const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
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
                                                            WHERE unaccent(tipo_vialidad) = $1
                                                            AND unaccent(nombre_vialidad) like '%' || $2 || '%'
                                                            AND codigo_postal = $3 
                                                            AND unaccent(estado) = $4
                                                            AND unaccent(colonia) LIKE '%' || $5 || '%'
                                                            ;
                                                        `;
                                                        values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                                        const result = await pgClient.query(query, values);
                                                        for (let i = 0; i < result.rows.length; i++) {
                                                            result.rows[i].scoring = {
                                                                fiability: 20,
                                                                tipo_vialidad: 100,
                                                                nombre_vialidad: 0,
                                                                codigo_postal: 100,
                                                                municipio: 0,
                                                                estado: 100,
                                                                numero_exterior: 0,
                                                                colonia: 0
                                                            };
                                                            const nombreVialidadSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                                            const matchNombreVialidad = nombreVialidadSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                                                            if (matchNombreVialidad) {
                                                                const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
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
                                                                WHERE unaccent(tipo_vialidad) = $1
                                                                AND unaccent(nombre_vialidad) like '%' || $2 || '%'
                                                                AND codigo_postal = $3 
                                                                AND unaccent(estado) = $4
                                                                AND unaccent(municipio) = $5
                                                                ;
                                                            `;
                                                            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.MUNICIPIO];
                                                            const result = await pgClient.query(query, values);
                                                            for (let i = 0; i < result.rows.length; i++) {
                                                                result.rows[i].scoring = {
                                                                    fiability: 25,
                                                                    tipo_vialidad: 100,
                                                                    nombre_vialidad: 0,
                                                                    codigo_postal: 100,
                                                                    municipio: 100,
                                                                    estado: 100,
                                                                    numero_exterior: 0,
                                                                    colonia: 0
                                                                };
                                                                const nombreVialidadSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                                                const matchNombreVialidad = nombreVialidadSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                                                                if (matchNombreVialidad) {
                                                                    const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
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
                                                                        WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5))
                                                                        ELSE lat_y
                                                                    END AS y_centro,
                                                                    CASE
                                                                        WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5))
                                                                        ELSE lon_x
                                                                    END AS x_centro
                                                                    FROM carto_geolocalizador
                                                                    WHERE unaccent(tipo_vialidad) = $1
                                                                    AND unaccent(colonia) like '%' || $2 || '%'
                                                                    AND unaccent(estado) = $3
                                                                    AND unaccent(municipio) = $4
                                                                    ;
                                                                `;
                                                                values = [direccionParsed.TIPOVIAL, direccionParsed.COLONIA, direccionParsed.ESTADO, direccionParsed.MUNICIPIO];
                                                                const result = await pgClient.query(query, values);
                                                                for (let i = 0; i < result.rows.length; i++) {
                                                                    result.rows[i].scoring = {
                                                                        fiability: 15,
                                                                        tipo_vialidad: 100,
                                                                        nombre_vialidad: 0,
                                                                        codigo_postal: 0,
                                                                        municipio: 100,
                                                                        estado: 100,
                                                                        numero_exterior: 0,
                                                                        colonia: 0
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
                                                                        WHERE unaccent(tipo_vialidad) = $1
                                                                        AND unaccent(nombre_vialidad) like '%' || $2 || '%'
                                                                        AND unaccent(estado) = $3
                                                                        AND unaccent(municipio) = $4
                                                                        ;
                                                                    `;
                                                                    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.ESTADO, direccionParsed.MUNICIPIO];
                                                                    const result = await pgClient.query(query, values);
                                                                    for (let i = 0; i < result.rows.length; i++) {
                                                                        result.rows[i].scoring = {
                                                                            fiability: 15,
                                                                            tipo_vialidad: 100,
                                                                            nombre_vialidad: 0,
                                                                            codigo_postal: 0,
                                                                            municipio: 100,
                                                                            estado: 100,
                                                                            numero_exterior: 0,
                                                                            colonia: 0
                                                                        };
                                                                        const nombreVialidadSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                                                        const matchNombreVialidad = nombreVialidadSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                                                                        if (matchNombreVialidad) {
                                                                            const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
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
                                                                                WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5))
                                                                                ELSE lat_y
                                                                            END AS y_centro,
                                                                            CASE
                                                                                WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5))
                                                                                ELSE lon_x
                                                                            END AS x_centro
                                                                            FROM carto_geolocalizador
                                                                            WHERE unaccent(tipo_vialidad) = $1
                                                                            AND unaccent(municipio) = $2
                                                                            AND unaccent(estado) = $3
                                                                            AND unaccent(colonia) LIKE '%' || $4 || '%'
                                                                            ;
                                                                        `;
                                                                        values = [direccionParsed.TIPOVIAL, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                                                        const result = await pgClient.query(query, values);
                                                                        for (let i = 0; i < result.rows.length; i++) {
                                                                            result.rows[i].scoring = {
                                                                                fiability: 15,
                                                                                tipo_vialidad: 100,
                                                                                nombre_vialidad: 0,
                                                                                codigo_postal: 0,
                                                                                municipio: 100,
                                                                                estado: 100,
                                                                                numero_exterior: 0,
                                                                                colonia: 0
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
                                                                                                                                              WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                                                                              ELSE 0.5
                                                                                                                                          END
                                                                                                                                      WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                                          CASE 
                                                                                                                                              WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
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
                                                                                                                                              WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                                                                              ELSE 0.5
                                                                                                                                          END
                                                                                                                                      WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                                          CASE 
                                                                                                                                              WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                                                                                              ELSE 0.5
                                                                                                                                          END
                                                                                                                                   END))
                                                                                    -- Si es un punto, extrae directamente las coordenadas
                                                                                    ELSE ST_X("SP_GEOMETRY")
                                                                                END AS x_centro
                                                                                FROM carto_geolocalizador
                                                                                WHERE unaccent(tipo_vialidad) = $1
                                                                                AND unaccent(municipio) = $2
                                                                                AND unaccent(estado) = $3
                                                                                AND (((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                                                                                OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5)) 
                                                                                OR ((CAST(l_refaddr AS INTEGER) >= $5 AND CAST(l_nrefaddr AS INTEGER) <= $5)
                                                                                OR (CAST(r_refaddr AS INTEGER) >= $5 AND CAST(r_nrefaddr AS INTEGER) <= $5)))
                                                                                AND unaccent(colonia) LIKE '%' || $4 || '%'
                                                                                ;
                                                                            `;
                                                                            values = [direccionParsed.TIPOVIAL, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA, direccionParsed.NUMEXTNUM1];
                                                                            const result = await pgClient.query(query, values);
                                                                            for (let i = 0; i < result.rows.length; i++) {
                                                                                result.rows[i].scoring = {
                                                                                    fiability: 30,
                                                                                    tipo_vialidad: 100,
                                                                                    nombre_vialidad: 0,
                                                                                    codigo_postal: 0,
                                                                                    municipio: 100,
                                                                                    estado: 100,
                                                                                    numero_exterior: 100,
                                                                                    colonia: 0
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
                                                                                                                                                  WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                                                                                  ELSE 0.5
                                                                                                                                              END
                                                                                                                                          WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                                              CASE 
                                                                                                                                                  WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
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
                                                                                                                                                  WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                                                                                  ELSE 0.5
                                                                                                                                              END
                                                                                                                                          WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                                              CASE 
                                                                                                                                                  WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                                                                                                  ELSE 0.5
                                                                                                                                              END
                                                                                                                                       END))
                                                                                        -- Si es un punto, extrae directamente las coordenadas
                                                                                        ELSE ST_X("SP_GEOMETRY")
                                                                                    END AS x_centro
                                                                                    FROM carto_geolocalizador
                                                                                    WHERE unaccent(tipo_vialidad) = $1
                                                                                    AND codigo_postal = $2 
                                                                                    AND unaccent(municipio) = $3
                                                                                    AND unaccent(estado) = $4
                                                                                    AND (((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                                                                                    OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5)) 
                                                                                    OR ((CAST(l_refaddr AS INTEGER) >= $5 AND CAST(l_nrefaddr AS INTEGER) <= $5)
                                                                                    OR (CAST(r_refaddr AS INTEGER) >= $5 AND CAST(r_nrefaddr AS INTEGER) <= $5)))
                                                                                    AND unaccent(colonia) LIKE '%' || $6 || '%'
                                                                                    ;
                                                                                `;
                                                                                values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
                                                                                const result = await pgClient.query(query, values);
                                                                                for (let i = 0; i < result.rows.length; i++) {
                                                                                    result.rows[i].scoring = {
                                                                                        fiability: 40,
                                                                                        tipo_vialidad: 100,
                                                                                        nombre_vialidad: 0,
                                                                                        codigo_postal: 100,
                                                                                        municipio: 100,
                                                                                        estado: 100,
                                                                                        numero_exterior: 100,
                                                                                        colonia: 0
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
                                                                                                                                                      WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                                                                                      ELSE 0.5
                                                                                                                                                  END
                                                                                                                                              WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                                                  CASE 
                                                                                                                                                      WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
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
                                                                                                                                                      WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                                                                                      ELSE 0.5
                                                                                                                                                  END
                                                                                                                                              WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                                                  CASE 
                                                                                                                                                      WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                                                                                                      ELSE 0.5
                                                                                                                                                  END
                                                                                                                                           END))
                                                                                            -- Si es un punto, extrae directamente las coordenadas
                                                                                            ELSE ST_X("SP_GEOMETRY")
                                                                                        END AS x_centro
                                                                                        FROM carto_geolocalizador
                                                                                        WHERE unaccent(tipo_vialidad) = $1
                                                                                        AND unaccent(municipio) = $2
                                                                                        AND unaccent(estado) = $3
                                                                                        AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                                                        OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
                                                                                        OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
                                                                                        OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
                                                                                        AND unaccent(colonia) LIKE '%' || $5 || '%'
                                                                                        ;
                                                                                    `;
                                                                                    values = [direccionParsed.TIPOVIAL, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
                                                                                    const result = await pgClient.query(query, values);
                                                                                    for (let i = 0; i < result.rows.length; i++) {
                                                                                        result.rows[i].scoring = {
                                                                                            fiability: 30,
                                                                                            tipo_vialidad: 100,
                                                                                            nombre_vialidad: 0,
                                                                                            codigo_postal: 0,
                                                                                            municipio: 100,
                                                                                            estado: 100,
                                                                                            numero_exterior: 100,
                                                                                            colonia: 0
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
                                                                                                                                                          WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                                                                                          ELSE 0.5
                                                                                                                                                      END
                                                                                                                                                  WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                                                      CASE 
                                                                                                                                                          WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
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
                                                                                                                                                          WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                                                                                          ELSE 0.5
                                                                                                                                                      END
                                                                                                                                                  WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                                                      CASE 
                                                                                                                                                          WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                                                                                                          ELSE 0.5
                                                                                                                                                      END
                                                                                                                                               END))
                                                                                                -- Si es un punto, extrae directamente las coordenadas
                                                                                                ELSE ST_X("SP_GEOMETRY")
                                                                                            END AS x_centro
                                                                                            FROM carto_geolocalizador
                                                                                            WHERE unaccent(tipo_vialidad) = $1
                                                                                            AND codigo_postal = $2 
                                                                                            AND unaccent(municipio) = $3
                                                                                            AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                                                            OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
                                                                                            OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
                                                                                            OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
                                                                                            AND unaccent(colonia) LIKE '%' || $5 || '%'
                                                                                            ;
                                                                                        `;
                                                                                        values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
                                                                                        const result = await pgClient.query(query, values);
                                                                                        for (let i = 0; i < result.rows.length; i++) {
                                                                                            result.rows[i].scoring = {
                                                                                                fiability: 35,
                                                                                                tipo_vialidad: 100,
                                                                                                nombre_vialidad: 0,
                                                                                                codigo_postal: 100,
                                                                                                municipio: 100,
                                                                                                estado: 0,
                                                                                                numero_exterior: 100,
                                                                                                colonia: 0
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
                                                                                                                                                              WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                                                                                              ELSE 0.5
                                                                                                                                                          END
                                                                                                                                                      WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                                                          CASE 
                                                                                                                                                              WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
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
                                                                                                                                                              WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_nrefaddr::float) * 100 / (l_refaddr::float - l_nrefaddr::float) / 100
                                                                                                                                                              ELSE 0.5
                                                                                                                                                          END
                                                                                                                                                      WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                                                                                                          CASE 
                                                                                                                                                              WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_nrefaddr::float) * 100 / (r_refaddr::float - r_nrefaddr::float) / 100
                                                                                                                                                              ELSE 0.5
                                                                                                                                                          END
                                                                                                                                                   END))
                                                                                                    -- Si es un punto, extrae directamente las coordenadas
                                                                                                    ELSE ST_X("SP_GEOMETRY")
                                                                                                END AS x_centro
                                                                                                FROM carto_geolocalizador
                                                                                                WHERE unaccent(tipo_vialidad) = $1
                                                                                                AND codigo_postal = $2 
                                                                                                AND unaccent(estado) = $3
                                                                                                AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                                                                OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
                                                                                                OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
                                                                                                OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
                                                                                                AND unaccent(colonia) LIKE '%' || $5 || '%'
                                                                                                ;
                                                                                            `;
                                                                                            values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1, direccionParsed.COLONIA];
                                                                                            const result = await pgClient.query(query, values);
                                                                                            for (let i = 0; i < result.rows.length; i++) {
                                                                                                result.rows[i].scoring = {
                                                                                                    fiability: 35,
                                                                                                    tipo_vialidad: 100,
                                                                                                    nombre_vialidad: 0,
                                                                                                    codigo_postal: 100,
                                                                                                    municipio: 0,
                                                                                                    estado: 100,
                                                                                                    numero_exterior: 100,
                                                                                                    colonia: 0
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
                                                                                                    WHERE unaccent(tipo_vialidad) = $1
                                                                                                    AND codigo_postal = $2 
                                                                                                    AND unaccent(municipio) = $3
                                                                                                    AND unaccent(estado) = $4
                                                                                                    AND unaccent(colonia) LIKE '%' || $5 || '%'
                                                                                                    ;
                                                                                                `;
                                                                                                values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA];
                                                                                                const result = await pgClient.query(query, values);
                                                                                                for (let i = 0; i < result.rows.length; i++) {
                                                                                                    result.rows[i].scoring = {
                                                                                                        fiability: 25,
                                                                                                        tipo_vialidad: 100,
                                                                                                        nombre_vialidad: 0,
                                                                                                        codigo_postal: 100,
                                                                                                        municipio: 100,
                                                                                                        estado: 100,
                                                                                                        numero_exterior: 0,
                                                                                                        colonia: 0
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
                                                                                                        WHERE tipo_vialidad = $1
                                                                                                        AND unaccent(nombre_vialidad) LIKE '%' || $2 || '%'
                                                                                                        AND unaccent(estado) = $3
                                                                                                        ;
                                                                                                    `;
                                                                                                    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.ESTADO];
                                                                                                    const result = await pgClient.query(query, values);
                                                                                                    for (let i = 0; i < result.rows.length; i++) {
                                                                                                        result.rows[i].scoring = {
                                                                                                            fiability: 25,
                                                                                                            tipo_vialidad: 100,
                                                                                                            nombre_vialidad: 0,
                                                                                                            codigo_postal: 0,
                                                                                                            municipio: 0,
                                                                                                            estado: 100,
                                                                                                            numero_exterior: 100,
                                                                                                            colonia: 0
                                                                                                        };
                                                                                                        const nombreVialidadSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                                                                                        const matchNombreVialidad = nombreVialidadSinAcentos.match(new RegExp(direccionParsed.NOMVIAL, 'i'));
                                                                                                        if (matchNombreVialidad) {
                                                                                                            const matchedText = matchNombreVialidad[0]; // Obtiene el texto coincidente
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
                                                                                                    /* if (result.rows.length === 0) {
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
                                                                                                            WHERE unaccent(tipo_vialidad) = $1
                                                                                                            AND unaccent(estado) = $2
                                                                                                            AND unaccent(municipio) = $3
                                                                                                            ;
                                                                                                        `;
                                                                                                        values = [direccionParsed.TIPOVIAL, direccionParsed.ESTADO, direccionParsed.MUNICIPIO];
                                                                                                        const result = await pgClient.query(query, values);
                                                                                                        for (let i = 0; i < result.rows.length; i++) {
                                                                                                            result.rows[i].scoring = {
                                                                                                                fiability: 15,
                                                                                                                tipo_vialidad: 100,
                                                                                                                nombre_vialidad: 0,
                                                                                                                codigo_postal: 0,
                                                                                                                municipio: 100,
                                                                                                                estado: 100,
                                                                                                                numero_exterior: 0,
                                                                                                                colonia: 0
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
                                                                                                            if (result.rows[i].l_refaddr <= direccionParsed.NUMEXTNUM1 && result.rows[i].l_nrefaddr >= direccionParsed.NUMEXTNUM1 && (similarityColonia > 80 || similarity > 80)) {
                                                                                                                result.rows[i].scoring.numero_exterior += 100;
                                                                                                                result.rows[i].scoring.fiability += 15;
                                                                                                            }
                                                                                                            else if (result.rows[i].l_refaddr >= direccionParsed.NUMEXTNUM1 && result.rows[i].l_nrefaddr <= direccionParsed.NUMEXTNUM1 && (similarityColonia > 80 || similarity > 80)) {
                                                                                                                result.rows[i].scoring.numero_exterior += 100;
                                                                                                                result.rows[i].scoring.fiability += 15;
                                                                                                            }
                                                                                                            else if (result.rows[i].r_refaddr <= direccionParsed.NUMEXTNUM1 && result.rows[i].r_nrefaddr >= direccionParsed.NUMEXTNUM1 && (similarityColonia > 80 || similarity > 80)) {
                                                                                                                result.rows[i].scoring.numero_exterior += 100;
                                                                                                                result.rows[i].scoring.fiability += 15;
                                                                                                            }
                                                                                                            else if (result.rows[i].r_refaddr >= direccionParsed.NUMEXTNUM1 && result.rows[i].r_nrefaddr <= direccionParsed.NUMEXTNUM1 && (similarityColonia > 80 || similarity > 80)) {
                                                                                                                result.rows[i].scoring.numero_exterior += 100;
                                                                                                                result.rows[i].scoring.fiability += 15;
                                                                                                            }
                                                                                                            if (result.rows[i].codigo_postal === direccionParsed.CP) {
                                                                                                                result.rows[i].scoring.codigo_postal += 100;
                                                                                                                result.rows[i].scoring.fiability += 10;
                                                                                                            }
                                                                                                        }
                                                                                                        rows = rows.concat(result.rows);
                                                                                                    } */
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
            }
        }
    }
    return rows;
}
module.exports = all;