const pgClient = require("../../data/conexion");
const { levenshteinDistance, quitarAcentos, recortarTipoAsentamiento, recortarTipoVialidad  } = require("../funciones");

// Aplicable solo en caso de llevar todos los campos a excepcion de COLONIA
async function sinColonia(direccionParsed) {
    // Declaramos un valor nulo para la query de tipo String
    let query = '';
    // Generamos un arreglo para los valores que suplantaran "$X" en la query
    let values = [];
    // Generamos un arreglo para guardar los resultados obtenidos de la BD
    let rows = [];
    // Construimos la query para comenzar a generar consultas a la BD
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
                                                                      WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                      ELSE 0.5
                                                                  END
                                                              WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                  CASE 
                                                                      WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                      WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($5 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                      ELSE 0.5
                                                                  END
                                                              WHEN $5 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                  CASE 
                                                                      WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($5 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                      ELSE 0.5
                                                                  END
                                                           END))
            -- Si es un punto, extrae directamente las coordenadas
            ELSE ST_X("SP_GEOMETRY")
        END AS x_centro
        FROM carto_geolocalizador
        WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
        AND codigo_postal = $2 
        AND unaccent(municipio) = $3
        AND unaccent(estado) = $4
        AND (((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
        OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5)) 
        OR ((CAST(l_refaddr AS INTEGER) >= $5 AND CAST(l_nrefaddr AS INTEGER) <= $5)
        OR (CAST(r_refaddr AS INTEGER) >= $5 AND CAST(r_nrefaddr AS INTEGER) <= $5)))
        ;
    `;
    // Almacenamos en el arreglo values los campos que seran usados en la consulta
    values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
    // Guardamos en una constante el resultado obtenido
    const result = await pgClient.query(query, values);
    // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
    for (let i = 0; i < result.rows.length; i++) {
        // Inicializar la cadena de resultado
        let resultado = '';
        // Inicializamos la variable tabla
        let tabla = '';

        // Concatenar cada campo si tiene un valor
        if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
        resultado += `${direccionParsed.NUMEXTNUM1} `;
        if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
        if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
        if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
        if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

        // Segun el tipo que regreso definimos la tabla de donde se obtuvo
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
        // Modificamos el tipo por uno controlado para el servicio del Front
        result.rows[i].tipo = `Calle`;
        // Asignar el id_calle al campo "id"
        result.rows[i].id = result.rows[i].id_calle;
        // Asignar el campo por el que se puede identificar el id previo.
        result.rows[i].campo = `Id`;
        // Asignar la imagen final que recibira dicha direccion
        result.rows[i].imagen = 'punto';
        // Asignar la tabla de donde se obtuvo principalmente dicho registro
        result.rows[i].tabla = tabla;
        // Calificamos el registro recuperado segun los parametros coincididos
        result.rows[i].scoring = {
            fiability: 50,
            calle: 0,
            codigo_postal: 100,
            municipio: 100,
            estado: 100,
            numero_exterior: 100
        };
        // Quitamos acentos del nombre_vialidad recuperado debido a que en la BD se tiene con acentos
        const calleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
        // Hacemos match con lo que proporciono el usuario.
        const matchNombreCalle = calleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
        // Validamos que exista Match
        if (matchNombreCalle) {
            // Obtiene el texto coincidente
            const matchedText = matchNombreCalle[0];
            // Generamos la igualdad que se tienen
            let igualdad = matchedText.length * 100 / calleSinAcentos.length;
            // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
            if (igualdad > 100) igualdad = 100;
            // Subimos el scoring en calle
            result.rows[i].scoring.calle += Math.round(igualdad);
            // Subimos el scoring en fiability
            result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
        }
    }
    if (result.rows.length !== 0) {
        const resultOrdenado = result.rows.sort((a, b) => {
          // Ordenar por calle en orden descendente
          if (b.scoring.calle !== a.scoring.calle) {
            return b.scoring.calle - a.scoring.calle;
          }
        });
      
        // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
        if (resultOrdenado[0].scoring.calle > 70 )rows = rows.concat(result.rows);
      }else{
        // Construimos la query para comenzar a generar consultas a la BD
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
                                                                          WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                          ELSE 0.5
                                                                      END
                                                                  WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                      CASE 
                                                                          WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                          WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                          ELSE 0.5
                                                                      END
                                                                  WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                      CASE 
                                                                          WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                          ELSE 0.5
                                                                      END
                                                               END))
                -- Si es un punto, extrae directamente las coordenadas
                ELSE ST_X("SP_GEOMETRY")
            END AS x_centro
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
        // Almacenamos en el arreglo values los campos que seran usados en la consulta
        values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
        // Guardamos en una constante el resultado obtenido
        const result = await pgClient.query(query, values);
        // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
        for (let i = 0; i < result.rows.length; i++) {
            // Inicializar la cadena de resultado
            let resultado = '';
            // Inicializamos la variable tabla
            let tabla = '';

            // Concatenar cada campo si tiene un valor
            if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
            resultado += `${direccionParsed.NUMEXTNUM1} `;
            if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
            if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
            if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
            if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

            // Segun el tipo que regreso definimos la tabla de donde se obtuvo
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
            // Modificamos el tipo por uno controlado para el servicio del Front
            result.rows[i].tipo = `Calle`;
            // Asignar el id_calle al campo "id"
            result.rows[i].id = result.rows[i].id_calle;
            // Asignar el campo por el que se puede identificar el id previo.
            result.rows[i].campo = `Id`;
            // Asignar la imagen final que recibira dicha direccion
            result.rows[i].imagen = 'punto';
            // Asignar la tabla de donde se obtuvo principalmente dicho registro
            result.rows[i].tabla = tabla;
            // Calificamos el registro recuperado segun los parametros coincididos
            result.rows[i].scoring = {
                fiability: 40,
                calle: 0,
                codigo_postal: 0,
                municipio: 100,
                estado: 100,
                numero_exterior: 100
            };
            // Quitamos acentos del nombre_vialidad recuperado debido a que en la BD se tiene con acentos
            const calleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
            // Hacemos match con lo que proporciono el usuario.
            const matchNombreCalle = calleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
            // Validamos que exista Match
            if (matchNombreCalle) {
                // Obtiene el texto coincidente
                const matchedText = matchNombreCalle[0];
                // Generamos la igualdad que se tienen
                let igualdad = matchedText.length * 100 / calleSinAcentos.length;
                // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                if (igualdad > 100) igualdad = 100;
                // Subimos el scoring en calle
                result.rows[i].scoring.calle += Math.round(igualdad);
                // Subimos el scoring en fiability
                result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
            }
        }
        if (result.rows.length !== 0) {
            const resultOrdenado = result.rows.sort((a, b) => {
              // Ordenar por calle en orden descendente
              if (b.scoring.calle !== a.scoring.calle) {
                return b.scoring.calle - a.scoring.calle;
              }
            });
          
            // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
            if (resultOrdenado[0].scoring.calle > 70 )rows = rows.concat(result.rows);
          }else{
            // Construimos la query para comenzar a generar consultas a la BD
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
                                                                              WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                              ELSE 0.5
                                                                          END
                                                                      WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                          CASE 
                                                                              WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                              WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                              ELSE 0.5
                                                                          END
                                                                      WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                          CASE 
                                                                              WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                              ELSE 0.5
                                                                          END
                                                                   END))
                    -- Si es un punto, extrae directamente las coordenadas
                    ELSE ST_X("SP_GEOMETRY")
                END AS x_centro
                FROM carto_geolocalizador
                WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
                AND codigo_postal = $2 
                AND unaccent(estado) = $3
                AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
                OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
                OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
                ;
            `;
            // Almacenamos en el arreglo values los campos que seran usados en la consulta
            values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
            // Guardamos en una constante el resultado obtenido
            const result = await pgClient.query(query, values);
            // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
            for (let i = 0; i < result.rows.length; i++) {
                // Inicializar la cadena de resultado
                let resultado = '';
                // Inicializamos la variable tabla
                let tabla = '';

                // Concatenar cada campo si tiene un valor
                if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                resultado += `${direccionParsed.NUMEXTNUM1} `;
                if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                // Segun el tipo que regreso definimos la tabla de donde se obtuvo
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
                // Modificamos el tipo por uno controlado para el servicio del Front
                result.rows[i].tipo = `Calle`;
                // Asignar el id_calle al campo "id"
                result.rows[i].id = result.rows[i].id_calle;
                // Asignar el campo por el que se puede identificar el id previo.
                result.rows[i].campo = `Id`;
                // Asignar la imagen final que recibira dicha direccion
                result.rows[i].imagen = 'punto';
                // Asignar la tabla de donde se obtuvo principalmente dicho registro
                result.rows[i].tabla = tabla;
                // Calificamos el registro recuperado segun los parametros coincididos
                result.rows[i].scoring = {
                    fiability: 40,
                    calle: 0,
                    codigo_postal: 100,
                    municipio: 0,
                    estado: 100,
                    numero_exterior: 100
                };
                // Quitamos acentos del nombre_vialidad recuperado debido a que en la BD se tiene con acentos
                const calleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                // Hacemos match con lo que proporciono el usuario.
                const matchNombreCalle = calleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                // Validamos que exista Match
                if (matchNombreCalle) {
                    // Obtiene el texto coincidente
                    const matchedText = matchNombreCalle[0];
                    // Generamos la igualdad que se tienen
                    let igualdad = matchedText.length * 100 / calleSinAcentos.length;
                    // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                    if (igualdad > 100) igualdad = 100;
                    // Subimos el scoring en calle
                    result.rows[i].scoring.calle += Math.round(igualdad);
                    // Subimos el scoring en fiability
                    result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                }
            }
            if (result.rows.length !== 0) {
                const resultOrdenado = result.rows.sort((a, b) => {
                  // Ordenar por calle en orden descendente
                  if (b.scoring.calle !== a.scoring.calle) {
                    return b.scoring.calle - a.scoring.calle;
                  }
                });
              
                // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
                if (resultOrdenado[0].scoring.calle > 70 )rows = rows.concat(result.rows);
              }else{
                // Construimos la query para comenzar a generar consultas a la BD
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
                                                                                  WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                  ELSE 0.5
                                                                              END
                                                                          WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                              CASE 
                                                                                  WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
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
                                                                                  WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($4 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
                                                                                  ELSE 0.5
                                                                              END
                                                                          WHEN $4 BETWEEN r_nrefaddr::float AND r_refaddr::float THEN 
                                                                              CASE 
                                                                                  WHEN r_refaddr::float - r_nrefaddr::float != 0 THEN ($4 - r_refaddr::float) * 100 / (r_nrefaddr::float - r_refaddr::float) / 100
                                                                                  ELSE 0.5
                                                                              END
                                                                       END))
                        -- Si es un punto, extrae directamente las coordenadas
                        ELSE ST_X("SP_GEOMETRY")
                    END AS x_centro
                    FROM carto_geolocalizador
                    WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
                    AND codigo_postal = $2 
                    AND unaccent(municipio) = $3
                    AND (((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                    OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4)) 
                    OR ((CAST(l_refaddr AS INTEGER) >= $4 AND CAST(l_nrefaddr AS INTEGER) <= $4)
                    OR (CAST(r_refaddr AS INTEGER) >= $4 AND CAST(r_nrefaddr AS INTEGER) <= $4)))
                    ;
                `;
                // Almacenamos en el arreglo values los campos que seran usados en la consulta
                values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1];
                // Guardamos en una constante el resultado obtenido
                const result = await pgClient.query(query, values);
                // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
                for (let i = 0; i < result.rows.length; i++) {
                    // Inicializar la cadena de resultado
                    let resultado = '';
                    // Inicializamos la variable tabla
                    let tabla = '';

                    // Concatenar cada campo si tiene un valor
                    if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                    resultado += `${direccionParsed.NUMEXTNUM1} `;
                    if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                    if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                    if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                    if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                    // Segun el tipo que regreso definimos la tabla de donde se obtuvo
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
                    // Modificamos el tipo por uno controlado para el servicio del Front
                    result.rows[i].tipo = `Calle`;
                    // Asignar el id_calle al campo "id"
                    result.rows[i].id = result.rows[i].id_calle;
                    // Asignar el campo por el que se puede identificar el id previo.
                    result.rows[i].campo = `Id`;
                    // Asignar la imagen final que recibira dicha direccion
                    result.rows[i].imagen = 'punto';
                    // Asignar la tabla de donde se obtuvo principalmente dicho registro
                    result.rows[i].tabla = tabla;
                    // Calificamos el registro recuperado segun los parametros coincididos
                    result.rows[i].scoring = {
                        fiability: 40,
                        calle: 0,
                        codigo_postal: 100,
                        municipio: 100,
                        estado: 0,
                        numero_exterior: 100
                    };
                    // Quitamos acentos del nombre_vialidad recuperado debido a que en la BD se tiene con acentos
                    const calleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                    // Hacemos match con lo que proporciono el usuario.
                    const matchNombreCalle = calleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                    // Validamos que exista Match
                    if (matchNombreCalle) {
                        // Obtiene el texto coincidente
                        const matchedText = matchNombreCalle[0];
                        // Generamos la igualdad que se tienen
                        let igualdad = matchedText.length * 100 / calleSinAcentos.length;
                        // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                        if (igualdad > 100) igualdad = 100;
                        // Subimos el scoring en calle
                        result.rows[i].scoring.calle += Math.round(igualdad);
                        // Subimos el scoring en fiability
                        result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                    }
                }
                if (result.rows.length !== 0) {
                    const resultOrdenado = result.rows.sort((a, b) => {
                      // Ordenar por calle en orden descendente
                      if (b.scoring.calle !== a.scoring.calle) {
                        return b.scoring.calle - a.scoring.calle;
                      }
                    });
                  
                    // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
                    if (resultOrdenado[0].scoring.calle > 70 )rows = rows.concat(result.rows);
                  }else{
                    // Construimos la query para comenzar a generar consultas a la BD
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
                        AND codigo_postal = $4
                        ;
                    `;
                    // Almacenamos en el arreglo values los campos que seran usados en la consulta
                    values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.CP];
                    // Guardamos en una constante el resultado obtenido
                    const result = await pgClient.query(query, values);
                    // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
                    for (let i = 0; i < result.rows.length; i++) {
                        // Inicializar la cadena de resultado
                        let resultado = '';
                        // Inicializamos la variable tabla
                        let tabla = '';
                        // Inicializamos la variable imagen
                        let imagen = '';

                        // Concatenar cada campo si tiene un valor
                        if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                        resultado += `COL. `;
                        if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                        if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                        if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                        if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                        // Segun el tipo que regreso definimos la tabla de donde se obtuvo
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
                        // Modificamos el tipo por uno controlado para el servicio del Front
                        result.rows[i].tipo = `Calle`;
                        // Asignar el id_calle al campo "id"
                        result.rows[i].id = result.rows[i].id_calle;
                        // Asignar el campo por el que se puede identificar el id previo.
                        result.rows[i].campo = `Id`;
                        // Asignar la imagen final que recibira dicha direccion
                        result.rows[i].imagen = imagen;
                        // Asignar la tabla de donde se obtuvo principalmente dicho registro
                        result.rows[i].tabla = tabla;
                        // Calificamos el registro recuperado segun los parametros coincididos
                        result.rows[i].scoring = {
                            fiability: 30,
                            calle: 0,
                            codigo_postal: 100,
                            municipio: 100,
                            estado: 100,
                            numero_exterior: 0
                        };
                        // Quitamos acentos del nombre_vialidad recuperado debido a que en la BD se tiene con acentos
                        const calleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                        // Hacemos match con lo que proporciono el usuario.
                        const matchNombreCalle = calleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                        // Validamos que exista Match
                        if (matchNombreCalle) {
                            // Obtiene el texto coincidente
                            const matchedText = matchNombreCalle[0];
                            // Generamos la igualdad que se tienen
                            let igualdad = matchedText.length * 100 / calleSinAcentos.length;
                            // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                            if (igualdad > 100) igualdad = 100;
                            // Subimos el scoring en calle
                            result.rows[i].scoring.calle += Math.round(igualdad);
                            // Subimos el scoring en fiability
                            result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                        }
                    }
                    if (result.rows.length !== 0) {
                        const resultOrdenado = result.rows.sort((a, b) => {
                          // Ordenar por calle en orden descendente
                          if (b.scoring.calle !== a.scoring.calle) {
                            return b.scoring.calle - a.scoring.calle;
                          }
                        });
                      
                        // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
                        if (resultOrdenado[0].scoring.calle > 70 )rows = rows.concat(result.rows);
                      }else{
                        // Construimos la query para comenzar a generar consultas a la BD
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
                        // Almacenamos en el arreglo values los campos que seran usados en la consulta
                        values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                        // Guardamos en una constante el resultado obtenido
                        const result = await pgClient.query(query, values);
                        // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
                        for (let i = 0; i < result.rows.length; i++) {
                            // Inicializar la cadena de resultado
                            let resultado = '';
                            // Inicializamos la variable tabla
                            let tabla = '';
                            // Inicializamos la variable imagen
                            let imagen = '';

                            // Concatenar cada campo si tiene un valor
                            if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                            resultado += `COL. `;
                            if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                            if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                            if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                            if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                            // Segun el tipo que regreso definimos la tabla de donde se obtuvo
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
                            // Modificamos el tipo por uno controlado para el servicio del Front
                            result.rows[i].tipo = `Calle`;
                            // Asignar el id_calle al campo "id"
                            result.rows[i].id = result.rows[i].id_calle;
                            // Asignar el campo por el que se puede identificar el id previo.
                            result.rows[i].campo = `Id`;
                            // Asignar la imagen final que recibira dicha direccion
                            result.rows[i].imagen = imagen;
                            // Asignar la tabla de donde se obtuvo principalmente dicho registro
                            result.rows[i].tabla = tabla;
                            // Calificamos el registro recuperado segun los parametros coincididos
                            result.rows[i].scoring = {
                                fiability: 20,
                                calle: 0,
                                codigo_postal: 0,
                                municipio: 100,
                                estado: 100,
                                numero_exterior: 0
                            };
                            // Quitamos acentos del nombre_vialidad recuperado debido a que en la BD se tiene con acentos
                            const calleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                            // Hacemos match con lo que proporciono el usuario.
                            const matchNombreCalle = calleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                            // Validamos que exista Match
                            if (matchNombreCalle) {
                                // Obtiene el texto coincidente
                                const matchedText = matchNombreCalle[0];
                                // Generamos la igualdad que se tienen
                                let igualdad = matchedText.length * 100 / calleSinAcentos.length;
                                // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                                if (igualdad > 100) igualdad = 100;
                                // Subimos el scoring en calle
                                result.rows[i].scoring.calle += Math.round(igualdad);
                                // Subimos el scoring en fiability
                                result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                            }
                        }
                        if (result.rows.length !== 0) {
                            const resultOrdenado = result.rows.sort((a, b) => {
                              // Ordenar por calle en orden descendente
                              if (b.scoring.calle !== a.scoring.calle) {
                                return b.scoring.calle - a.scoring.calle;
                              }
                            });
                          
                            // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
                            if (resultOrdenado[0].scoring.calle > 70 )rows = rows.concat(result.rows);
                          }else{
                            // Construimos la query para comenzar a generar consultas a la BD
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
                                                                                              WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($3 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
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
                                                                                              WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($3 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
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
                                WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
                                AND unaccent(municipio) = $2
                                AND (((CAST(l_refaddr AS INTEGER) <= $3 AND CAST(l_nrefaddr AS INTEGER) >= $3)
                                OR (CAST(r_refaddr AS INTEGER) <= $3 AND CAST(r_nrefaddr AS INTEGER) >= $3)) 
                                OR ((CAST(l_refaddr AS INTEGER) >= $3 AND CAST(l_nrefaddr AS INTEGER) <= $3)
                                OR (CAST(r_refaddr AS INTEGER) >= $3 AND CAST(r_nrefaddr AS INTEGER) <= $3)))
                                ;
                            `;
                            // Almacenamos en el arreglo values los campos que seran usados en la consulta
                            values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1];
                            // Guardamos en una constante el resultado obtenido
                            const result = await pgClient.query(query, values);

                            // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
                            for (let i = 0; i < result.rows.length; i++) {
                                // Inicializar la cadena de resultado
                                let resultado = '';
                                // Inicializamos la variable tabla
                                let tabla = '';

                                // Concatenar cada campo si tiene un valor
                                if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                                resultado += `${direccionParsed.NUMEXTNUM1} `;
                                if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                                if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                                if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                                if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                                // Segun el tipo que regreso definimos la tabla de donde se obtuvo
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
                                // Modificamos el tipo por uno controlado para el servicio del Front
                                result.rows[i].tipo = `Calle`;
                                // Asignar el id_calle al campo "id"
                                result.rows[i].id = result.rows[i].id_calle;
                                // Asignar el campo por el que se puede identificar el id previo.
                                result.rows[i].campo = `Id`;
                                // Asignar la imagen final que recibira dicha direccion
                                result.rows[i].imagen = 'punto';
                                // Asignar la tabla de donde se obtuvo principalmente dicho registro
                                result.rows[i].tabla = tabla;
                                // Calificamos el registro recuperado segun los parametros coincididos
                                result.rows[i].scoring = {
                                    fiability: 30,
                                    calle: 0,
                                    codigo_postal: 0,
                                    municipio: 100,
                                    estado: 0,
                                    numero_exterior: 100
                                };
                                // Quitamos acentos del nombre_vialidad recuperado debido a que en la BD se tiene con acentos
                                const calleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                // Hacemos match con lo que proporciono el usuario.
                                const matchNombreCalle = calleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                                // Validamos que exista Match
                                if (matchNombreCalle) {
                                    // Obtiene el texto coincidente
                                    const matchedText = matchNombreCalle[0];
                                    // Generamos la igualdad que se tienen
                                    let igualdad = matchedText.length * 100 / calleSinAcentos.length;
                                    // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                                    if (igualdad > 100) igualdad = 100;
                                    // Subimos el scoring en calle
                                    result.rows[i].scoring.calle += Math.round(igualdad);
                                    // Subimos el scoring en fiability
                                    result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                                }
                            }
                            if (result.rows.length !== 0) {
                                const resultOrdenado = result.rows.sort((a, b) => {
                                  // Ordenar por calle en orden descendente
                                  if (b.scoring.calle !== a.scoring.calle) {
                                    return b.scoring.calle - a.scoring.calle;
                                  }
                                });
                              
                                // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
                                if (resultOrdenado[0].scoring.calle > 70 )rows = rows.concat(result.rows);
                              }else{
                                // Construimos la query para comenzar a generar consultas a la BD
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
                                                                                                  WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($3 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
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
                                                                                                  WHEN l_refaddr::float - l_nrefaddr::float != 0 THEN ($3 - l_refaddr::float) * 100 / (l_nrefaddr::float - l_refaddr::float) / 100
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
                                    WHERE unaccent(nombre_vialidad) like '%' || $1 || '%'
                                    AND codigo_postal = $2 
                                    AND (((CAST(l_refaddr AS INTEGER) <= $3 AND CAST(l_nrefaddr AS INTEGER) >= $3)
                                    OR (CAST(r_refaddr AS INTEGER) <= $3 AND CAST(r_nrefaddr AS INTEGER) >= $3)) 
                                    OR ((CAST(l_refaddr AS INTEGER) >= $3 AND CAST(l_nrefaddr AS INTEGER) <= $3)
                                    OR (CAST(r_refaddr AS INTEGER) >= $3 AND CAST(r_nrefaddr AS INTEGER) <= $3)))
                                    ;
                                `;
                                // Almacenamos en el arreglo values los campos que seran usados en la consulta
                                values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.NUMEXTNUM1];
                                // Guardamos en una constante el resultado obtenido
                                const result = await pgClient.query(query, values);

                                // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
                                for (let i = 0; i < result.rows.length; i++) {
                                    // Inicializar la cadena de resultado
                                    let resultado = '';
                                    // Inicializamos la variable tabla
                                    let tabla = '';

                                    // Concatenar cada campo si tiene un valor
                                    if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                                    resultado += `${direccionParsed.NUMEXTNUM1} `;
                                    if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                                    if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                                    if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                                    if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                                    // Segun el tipo que regreso definimos la tabla de donde se obtuvo
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
                                    // Modificamos el tipo por uno controlado para el servicio del Front
                                    result.rows[i].tipo = `Calle`;
                                    // Asignar el id_calle al campo "id"
                                    result.rows[i].id = result.rows[i].id_calle;
                                    // Asignar el campo por el que se puede identificar el id previo.
                                    result.rows[i].campo = `Id`;
                                    // Asignar la imagen final que recibira dicha direccion
                                    result.rows[i].imagen = 'punto';
                                    // Asignar la tabla de donde se obtuvo principalmente dicho registro
                                    result.rows[i].tabla = tabla;
                                    // Calificamos el registro recuperado segun los parametros coincididos
                                    result.rows[i].scoring = {
                                        fiability: 30,
                                        calle: 0,
                                        codigo_postal: 100,
                                        municipio: 0,
                                        estado: 0,
                                        numero_exterior: 100
                                    };
                                    // Quitamos acentos del nombre_vialidad recuperado debido a que en la BD se tiene con acentos
                                    const calleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                    // Hacemos match con lo que proporciono el usuario.
                                    const matchNombreCalle = calleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                                    // Validamos que exista Match
                                    if (matchNombreCalle) {
                                        // Obtiene el texto coincidente
                                        const matchedText = matchNombreCalle[0];
                                        // Generamos la igualdad que se tienen
                                        let igualdad = matchedText.length * 100 / calleSinAcentos.length;
                                        // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                                        if (igualdad > 100) igualdad = 100;
                                        // Subimos el scoring en calle
                                        result.rows[i].scoring.calle += Math.round(igualdad);
                                        // Subimos el scoring en fiability
                                        result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                                    }
                                }
                                if (result.rows.length !== 0) {
                                    const resultOrdenado = result.rows.sort((a, b) => {
                                      // Ordenar por calle en orden descendente
                                      if (b.scoring.calle !== a.scoring.calle) {
                                        return b.scoring.calle - a.scoring.calle;
                                      }
                                    });
                                  
                                    // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
                                    if (resultOrdenado[0].scoring.calle > 70 )rows = rows.concat(result.rows);
                                  }else{
                                    // Construimos la query para comenzar a generar consultas a la BD
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
                                    // Almacenamos en el arreglo values los campos que seran usados en la consulta
                                    values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                                    // Guardamos en una constante el resultado obtenido
                                    const result = await pgClient.query(query, values);
                                    // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
                                    for (let i = 0; i < result.rows.length; i++) {
                                        // Inicializar la cadena de resultado
                                        let resultado = '';
                                        // Inicializamos la variable tabla
                                        let tabla = '';
                                        // Inicializamos la variable imagen
                                        let imagen = '';

                                        // Concatenar cada campo si tiene un valor
                                        if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                                        resultado += `COL. `;
                                        if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                                        if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                                        if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                                        if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                                        // Segun el tipo que regreso definimos la tabla de donde se obtuvo
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
                                        // Modificamos el tipo por uno controlado para el servicio del Front
                                        result.rows[i].tipo = `Calle`;
                                        // Asignar el id_calle al campo "id"
                                        result.rows[i].id = result.rows[i].id_calle;
                                        // Asignar el campo por el que se puede identificar el id previo.
                                        result.rows[i].campo = `Id`;
                                        // Asignar la imagen final que recibira dicha direccion
                                        result.rows[i].imagen = imagen;
                                        // Asignar la tabla de donde se obtuvo principalmente dicho registro
                                        result.rows[i].tabla = tabla;
                                        // Calificamos el registro recuperado segun los parametros coincididos
                                        result.rows[i].scoring = {
                                            fiability: 30,
                                            calle: 0,
                                            codigo_postal: 100,
                                            municipio: 100,
                                            estado: 100,
                                            numero_exterior: 0
                                        };
                                        // Quitamos acentos del nombre_vialidad recuperado debido a que en la BD se tiene con acentos
                                        const calleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                        // Hacemos match con lo que proporciono el usuario.
                                        const matchNombreCalle = calleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                                        // Validamos que exista Match
                                        if (matchNombreCalle) {
                                            // Obtiene el texto coincidente
                                            const matchedText = matchNombreCalle[0];
                                            // Generamos la igualdad que se tienen
                                            let igualdad = matchedText.length * 100 / calleSinAcentos.length;
                                            // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                                            if (igualdad > 100) igualdad = 100;
                                            // Subimos el scoring en calle
                                            result.rows[i].scoring.calle += Math.round(igualdad);
                                            // Subimos el scoring en fiability
                                            result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                                        }
                                    }
                                    if (result.rows.length !== 0) {
                                        const resultOrdenado = result.rows.sort((a, b) => {
                                          // Ordenar por calle en orden descendente
                                          if (b.scoring.calle !== a.scoring.calle) {
                                            return b.scoring.calle - a.scoring.calle;
                                          }
                                        });
                                      
                                        // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
                                        if (resultOrdenado[0].scoring.calle > 70 )rows = rows.concat(result.rows);
                                      }else{
                                        // Construimos la query para comenzar a generar consultas a la BD
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
                                        // Almacenamos en el arreglo values los campos que seran usados en la consulta
                                        values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.MUNICIPIO];
                                        // Guardamos en una constante el resultado obtenido
                                        const result = await pgClient.query(query, values);
                                        // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
                                        for (let i = 0; i < result.rows.length; i++) {
                                            // Inicializar la cadena de resultado
                                            let resultado = '';
                                            // Inicializamos la variable tabla
                                            let tabla = '';
                                            // Inicializamos la variable imagen
                                            let imagen = '';

                                            // Concatenar cada campo si tiene un valor
                                            if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                                            resultado += `COL. `;
                                            if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                                            if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                                            if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                                            if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                                            // Segun el tipo que regreso definimos la tabla de donde se obtuvo
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
                                            // Modificamos el tipo por uno controlado para el servicio del Front
                                            result.rows[i].tipo = `Calle`;
                                            // Asignar el id_calle al campo "id"
                                            result.rows[i].id = result.rows[i].id_calle;
                                            // Asignar el campo por el que se puede identificar el id previo.
                                            result.rows[i].campo = `Id`;
                                            // Asignar la imagen final que recibira dicha direccion
                                            result.rows[i].imagen = imagen;
                                            // Asignar la tabla de donde se obtuvo principalmente dicho registro
                                            result.rows[i].tabla = tabla;
                                            // Calificamos el registro recuperado segun los parametros coincididos
                                            result.rows[i].scoring = {
                                                fiability: 20,
                                                calle: 0,
                                                codigo_postal: 100,
                                                municipio: 100,
                                                estado: 0,
                                                numero_exterior: 0
                                            };
                                            // Quitamos acentos del nombre_vialidad recuperado debido a que en la BD se tiene con acentos
                                            const calleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                            // Hacemos match con lo que proporciono el usuario.
                                            const matchNombreCalle = calleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                                            // Validamos que exista Match
                                            if (matchNombreCalle) {
                                                // Obtiene el texto coincidente
                                                const matchedText = matchNombreCalle[0];
                                                // Generamos la igualdad que se tienen
                                                let igualdad = matchedText.length * 100 / calleSinAcentos.length;
                                                // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                                                if (igualdad > 100) igualdad = 100;
                                                // Subimos el scoring en calle
                                                result.rows[i].scoring.calle += Math.round(igualdad);
                                                // Subimos el scoring en fiability
                                                result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                                            }
                                        }
                                        if (result.rows.length !== 0) {
                                            const resultOrdenado = result.rows.sort((a, b) => {
                                              // Ordenar por calle en orden descendente
                                              if (b.scoring.calle !== a.scoring.calle) {
                                                return b.scoring.calle - a.scoring.calle;
                                              }
                                            });
                                          
                                            // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
                                            if (resultOrdenado[0].scoring.calle > 70 )rows = rows.concat(result.rows);
                                          }else{
                                            // Construimos la query para comenzar a generar consultas a la BD
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
                                            // Almacenamos en el arreglo values los campos que seran usados en la consulta
                                            values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                                            // Guardamos en una constante el resultado obtenido
                                            const result = await pgClient.query(query, values);
                                            // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
                                            for (let i = 0; i < result.rows.length; i++) {
                                                // Inicializar la cadena de resultado
                                                let resultado = '';
                                                // Inicializamos la variable tabla
                                                let tabla = '';
                                                // Inicializamos la variable imagen
                                                let imagen = '';

                                                // Concatenar cada campo si tiene un valor
                                                if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                                                resultado += `COL. `;
                                                if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                                                if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                                                if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                                                if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                                                // Segun el tipo que regreso definimos la tabla de donde se obtuvo
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
                                                // Modificamos el tipo por uno controlado para el servicio del Front
                                                result.rows[i].tipo = `Calle`;
                                                // Asignar el id_calle al campo "id"
                                                result.rows[i].id = result.rows[i].id_calle;
                                                // Asignar el campo por el que se puede identificar el id previo.
                                                result.rows[i].campo = `Id`;
                                                // Asignar la imagen final que recibira dicha direccion
                                                result.rows[i].imagen = imagen;
                                                // Asignar la tabla de donde se obtuvo principalmente dicho registro
                                                result.rows[i].tabla = tabla;
                                                // Calificamos el registro recuperado segun los parametros coincididos
                                                result.rows[i].scoring = {
                                                    fiability: 20,
                                                    calle: 0,
                                                    codigo_postal: 0,
                                                    municipio: 100,
                                                    estado: 100,
                                                    numero_exterior: 0
                                                };
                                                // Quitamos acentos del nombre_vialidad recuperado debido a que en la BD se tiene con acentos
                                                const calleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                                // Hacemos match con lo que proporciono el usuario.
                                                const matchNombreCalle = calleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                                                // Validamos que exista Match
                                                if (matchNombreCalle) {
                                                    // Obtiene el texto coincidente
                                                    const matchedText = matchNombreCalle[0];
                                                    // Generamos la igualdad que se tienen
                                                    let igualdad = matchedText.length * 100 / calleSinAcentos.length;
                                                    // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                                                    if (igualdad > 100) igualdad = 100;
                                                    // Subimos el scoring en calle
                                                    result.rows[i].scoring.calle += Math.round(igualdad);
                                                    // Subimos el scoring en fiability
                                                    result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                                                }
                                            }
                                            if (result.rows.length !== 0) {
                                                const resultOrdenado = result.rows.sort((a, b) => {
                                                  // Ordenar por calle en orden descendente
                                                  if (b.scoring.calle !== a.scoring.calle) {
                                                    return b.scoring.calle - a.scoring.calle;
                                                  }
                                                });
                                              
                                                // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
                                                if (resultOrdenado[0].scoring.calle > 70 )rows = rows.concat(result.rows);
                                              }else{
                                                // Construimos la query para comenzar a generar consultas a la BD
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
                                                // Almacenamos en el arreglo values los campos que seran usados en la consulta
                                                values = [direccionParsed.CALLE, direccionParsed.CP, direccionParsed.ESTADO];
                                                // Guardamos en una constante el resultado obtenido
                                                const result = await pgClient.query(query, values);
                                                // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
                                                for (let i = 0; i < result.rows.length; i++) {
                                                    // Inicializar la cadena de resultado
                                                    let resultado = '';
                                                    // Inicializamos la variable tabla
                                                    let tabla = '';
                                                    // Inicializamos la variable imagen
                                                    let imagen = '';

                                                    // Concatenar cada campo si tiene un valor
                                                    if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                                                    resultado += `COL. `;
                                                    if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                                                    if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                                                    if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                                                    if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                                                    // Segun el tipo que regreso definimos la tabla de donde se obtuvo
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
                                                    // Modificamos el tipo por uno controlado para el servicio del Front
                                                    result.rows[i].tipo = `Calle`;
                                                    // Asignar el id_calle al campo "id"
                                                    result.rows[i].id = result.rows[i].id_calle;
                                                    // Asignar el campo por el que se puede identificar el id previo.
                                                    result.rows[i].campo = `Id`;
                                                    // Asignar la imagen final que recibira dicha direccion
                                                    result.rows[i].imagen = imagen;
                                                    // Asignar la tabla de donde se obtuvo principalmente dicho registro
                                                    result.rows[i].tabla = tabla;
                                                    // Calificamos el registro recuperado segun los parametros coincididos
                                                    result.rows[i].scoring = {
                                                        fiability: 20,
                                                        calle: 0,
                                                        codigo_postal: 100,
                                                        municipio: 0,
                                                        estado: 100,
                                                        numero_exterior: 0
                                                    };
                                                    // Quitamos acentos del nombre_vialidad recuperado debido a que en la BD se tiene con acentos
                                                    const calleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                                    // Hacemos match con lo que proporciono el usuario.
                                                    const matchNombreCalle = calleSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                                                    // Validamos que exista Match
                                                    if (matchNombreCalle) {
                                                        // Obtiene el texto coincidente
                                                        const matchedText = matchNombreCalle[0];
                                                        // Generamos la igualdad que se tienen
                                                        let igualdad = matchedText.length * 100 / calleSinAcentos.length;
                                                        // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                                                        if (igualdad > 100) igualdad = 100;
                                                        // Subimos el scoring en calle
                                                        result.rows[i].scoring.calle += Math.round(igualdad);
                                                        // Subimos el scoring en fiability
                                                        result.rows[i].scoring.fiability += Math.round(igualdad) / 2;
                                                    }
                                                }
                                                if (result.rows.length !== 0) {
                                                    const resultOrdenado = result.rows.sort((a, b) => {
                                                      // Ordenar por calle en orden descendente
                                                      if (b.scoring.calle !== a.scoring.calle) {
                                                        return b.scoring.calle - a.scoring.calle;
                                                      }
                                                    });
                                                  
                                                    // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
                                                    if (resultOrdenado[0].scoring.calle > 70 )rows = rows.concat(result.rows);
                                                  }else{
                                                    // Construimos la query para comenzar a generar consultas a la BD
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
                                                    // Almacenamos en el arreglo values los campos que seran usados en la consulta
                                                    values = [direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                                                    // Guardamos en una constante el resultado obtenido
                                                    const result = await pgClient.query(query, values);
                                                    // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
                                                    for (let i = 0; i < result.rows.length; i++) {
                                                        // Inicializar la cadena de resultado
                                                        let resultado = '';
                                                        // Inicializamos la variable tabla
                                                        let tabla = '';
                                                        // Inicializamos la variable imagen
                                                        let imagen = '';

                                                        // Segun el tipo que regreso definimos la tabla de donde se obtuvo
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
                                                        // Modificamos el tipo por uno controlado para el servicio del Front
                                                        result.rows[i].tipo = `Calle`;
                                                        // Asignar el id_calle al campo "id"
                                                        result.rows[i].id = result.rows[i].id_calle;
                                                        // Asignar el campo por el que se puede identificar el id previo.
                                                        result.rows[i].campo = `Id`;
                                                        // Asignar la imagen final que recibira dicha direccion
                                                        result.rows[i].imagen = imagen;
                                                        // Asignar la tabla de donde se obtuvo principalmente dicho registro
                                                        result.rows[i].tabla = tabla;
                                                        // Calificamos el registro recuperado segun los parametros coincididos
                                                        result.rows[i].scoring = {
                                                            fiability: 20,
                                                            calle: 0,
                                                            codigo_postal: 0,
                                                            municipio: 100,
                                                            estado: 100,
                                                            numero_exterior: 0
                                                        };
                                                        const calleSinAcentos = quitarAcentos(result.rows[i].nombre_vialidad);
                                                        // Calcular la distancia de Levenshtein
                                                        const distance = levenshteinDistance(calleSinAcentos, direccionParsed.CALLE);
                                                        // Calcular la similitud como el inverso de la distancia de Levenshtein
                                                        const maxLength = Math.max(calleSinAcentos.length, direccionParsed.CALLE.length);
                                                        // Calculamos la similitud del nombre_vialidad segun sus comparativos
                                                        const similarity = ((maxLength - distance) / maxLength) * 100;
                                                        // Validamos que exista similitud alguna
                                                        if (similarity) {
                                                            // Subimos el scoring en calle
                                                            result.rows[i].scoring.calle += similarity;
                                                            // Subimos el scoring en fiability
                                                            result.rows[i].scoring.fiability += (similarity * 0.5);
                                                        }
                                                        if (result.rows[i].l_refaddr <= direccionParsed.NUMEXTNUM1 && result.rows[i].l_nrefaddr >= direccionParsed.NUMEXTNUM1 && similarity > 80) {
                                                            result.rows[i].scoring.numero_exterior += 100;
                                                            result.rows[i].scoring.fiability += 10;
                                                            // Asignar la imagen final que recibira dicha direccion
                                                            result.rows[i].imagen = 'punto';
                                                        }
                                                        else if (result.rows[i].l_refaddr >= direccionParsed.NUMEXTNUM1 && result.rows[i].l_nrefaddr <= direccionParsed.NUMEXTNUM1 && similarity > 80) {
                                                            result.rows[i].scoring.numero_exterior += 100;
                                                            result.rows[i].scoring.fiability += 10;
                                                            // Asignar la imagen final que recibira dicha direccion
                                                            result.rows[i].imagen = 'punto';
                                                        }
                                                        else if (result.rows[i].r_refaddr <= direccionParsed.NUMEXTNUM1 && result.rows[i].r_nrefaddr >= direccionParsed.NUMEXTNUM1 && similarity > 80) {
                                                            result.rows[i].scoring.numero_exterior += 100;
                                                            result.rows[i].scoring.fiability += 10;
                                                            // Asignar la imagen final que recibira dicha direccion
                                                            result.rows[i].imagen = 'punto';
                                                        }
                                                        else if (result.rows[i].r_refaddr >= direccionParsed.NUMEXTNUM1 && result.rows[i].r_nrefaddr <= direccionParsed.NUMEXTNUM1 && similarity > 80) {
                                                            result.rows[i].scoring.numero_exterior += 100;
                                                            result.rows[i].scoring.fiability += 10;
                                                            // Asignar la imagen final que recibira dicha direccion
                                                            result.rows[i].imagen = 'punto';
                                                        }
                                                        if (result.rows[i].codigo_postal === direccionParsed.CP) {
                                                            result.rows[i].scoring.codigo_postal += 100;
                                                            result.rows[i].scoring.fiability += 10;
                                                        }
                                                        // Concatenar cada campo si tiene un valor
                                                        if (result.rows[i].nombre_vialidad) resultado += `${result.rows[i].nombre_vialidad} `;
                                                        if (result.rows[i].imagen === 'punto') resultado += `${direccionParsed.NUMEXTNUM1} `;
                                                        else resultado += `COL. `;
                                                        if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                                                        if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                                                        if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                                                        if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;
                                                        // Asignar el resultado al campo "resultado"
                                                        result.rows[i].resultado = resultado.trim();
                                                    }
                                                    // Añadimos los resultados obtenidos al arreglo rows
                                                    if (result.rows.length !== 0) {
                                                        const resultOrdenado = result.rows.sort((a, b) => {
                                                          // Ordenar por calle en orden descendente
                                                          if (b.scoring.calle !== a.scoring.calle) {
                                                            return b.scoring.calle - a.scoring.calle;
                                                          }
                                                        });
                                                      
                                                        // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
                                                        if (resultOrdenado[0].scoring.calle > 50 )rows = rows.concat(result.rows);
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
    // Retornamos los rows que se obtuvieron hasta el momento
    return rows;
}
module.exports = sinColonia;