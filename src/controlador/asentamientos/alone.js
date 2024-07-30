const pgClient = require("../../data/conexion");
const { levenshteinDistance, quitarAcentos } = require("../funciones");

// Aplicable solo en caso de omitir todos los campos a excepcion de TIPOASEN y NOMASEN
async function alone(direccionParsed) {
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
            WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN ST_Y(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5))
            ELSE lat_y
        END AS y_centro,
        CASE
            WHEN ST_GeometryType("SP_GEOMETRY") = 'ST_LineString' THEN ST_X(ST_LineInterpolatePoint("SP_GEOMETRY", 0.5))
            ELSE lon_x
        END AS x_centro
        FROM carto_geolocalizador
        WHERE unaccent(tipo_asentamiento) = $1
        AND unaccent(nombre_asentamiento) like '%' || $2 || '%'
        ;
    `;
    // Almacenamos en el arreglo values los campos que seran usados en la consulta
    values = [direccionParsed.TIPOASEN, direccionParsed.NOMASEN];
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
        if (result.rows[i].tipo_asentamiento) resultado += `${result.rows[i].tipo_asentamiento} `;
        if (result.rows[i].nombre_asentamiento) resultado += `${result.rows[i].nombre_asentamiento} `;
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
            tipo_asentamiento: 100,
            nombre_asentamiento: 0
        };
        // Quitamos acentos del nombre_asentamiento recuperado debido a que en la BD se tiene con acentos
        const nombreAsentamientoSinAcentos = quitarAcentos(result.rows[i].nombre_asentamiento);
        // Hacemos match con lo que proporciono el usuario.
        const matchNombreAsentamiento = nombreAsentamientoSinAcentos.match(new RegExp(direccionParsed.NOMASEN, 'i'));
        // Validamos que exista Match
        if (matchNombreAsentamiento) {
            // Obtiene el texto coincidente
            const matchedText = matchNombreAsentamiento[0];
            // Generamos la igualdad que se tienen
            let igualdad = matchedText.length * 100 / nombreAsentamientoSinAcentos.length;
            // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
            if (igualdad > 100) igualdad = 100;
            // Subimos el scoring en nombre_asentamiento
            result.rows[i].scoring.nombre_asentamiento += Math.round(igualdad);
            // Subimos el scoring en fiability
            result.rows[i].scoring.fiability += Math.round(igualdad * 0.7);
        }
    }
    // Añadimos los resultados obtenidos al arreglo rows
    rows = rows.concat(result.rows);
    // Evaluamos que rows este vacio para seguir con la busqueda
    if (result.rows.length === 0) {
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
            WHERE unaccent(tipo_asentamiento) = $1
            ;
        `;
        // Almacenamos en el arreglo values los campos que seran usados en la consulta
        values = [direccionParsed.TIPOASEN];
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
            if (result.rows[i].tipo_asentamiento) resultado += `${result.rows[i].tipo_asentamiento} `;
            if (result.rows[i].nombre_asentamiento) resultado += `${result.rows[i].nombre_asentamiento} `;
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
                tipo_asentamiento: 100,
                nombre_asentamiento: 0
            };
            // Calcular la distancia de Levenshtein
            const distance = levenshteinDistance(quitarAcentos(result.rows[i].nombre_asentamiento), direccionParsed.NOMASEN);
            // Calcular la similitud como el inverso de la distancia de Levenshtein
            const maxLength = Math.max(result.rows[i].nombre_asentamiento.length, direccionParsed.NOMASEN.length);
            // Calculamos la similitud del nombre_asentamiento segun sus comparativos
            const similarity = ((maxLength - distance) / maxLength) * 100;
            // Validamos que exista similitud alguna
            if (similarity) {
                // Subimos el scoring en nombre_asentamiento
                result.rows[i].scoring.nombre_asentamiento += similarity;
                // Subimos el scoring en fiability
                result.rows[i].scoring.fiability += (similarity * 0.7);
            }
        }
        if (result.rows.length !== 0) {
            const resultOrdenado = result.rows.sort((a, b) => {
              // Ordenar por nombre_asentamiento en orden descendente
              if (b.scoring.nombre_asentamiento !== a.scoring.nombre_asentamiento) {
                return b.scoring.nombre_asentamiento - a.scoring.nombre_asentamiento;
              }
            });
          
            // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
            if (resultOrdenado[0].scoring.nombre_asentamiento > 70)rows = rows.concat(result.rows);
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
                WHERE unaccent(nombre_asentamiento) like '%' || $1 || '%'
                ;
            `;
            // Almacenamos en el arreglo values los campos que seran usados en la consulta
            values = [direccionParsed.NOMASEN];
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
                if (result.rows[i].tipo_asentamiento) resultado += `${result.rows[i].tipo_asentamiento} `;
                if (result.rows[i].nombre_asentamiento) resultado += `${result.rows[i].nombre_asentamiento} `;
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
                    fiability: 0,
                    tipo_asentamiento: 0,
                    nombre_asentamiento: 0
                };
                // Quitamos acentos del nombre_asentamiento recuperado debido a que en la BD se tiene con acentos
                const nombreAsentamientoSinAcentos = quitarAcentos(result.rows[i].nombre_asentamiento);
                // Hacemos match con lo que proporciono el usuario.
                const matchNombreAsentamiento = nombreAsentamientoSinAcentos.match(new RegExp(direccionParsed.NOMASEN, 'i'));
                // Validamos que exista Match
                if (matchNombreAsentamiento) {
                    // Obtiene el texto coincidente
                    const matchedText = matchNombreAsentamiento[0];
                    // Generamos la igualdad que se tienen
                    let igualdad = matchedText.length * 100 / nombreAsentamientoSinAcentos.length;
                    // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                    if (igualdad > 100) igualdad = 100;
                    // Subimos el scoring en nombre_asentamiento
                    result.rows[i].scoring.nombre_asentamiento += Math.round(igualdad);
                    // Subimos el scoring en fiability
                    result.rows[i].scoring.fiability += Math.round(igualdad * 0.7);
                }
            }
            // Añadimos los resultados obtenidos al arreglo rows
            if (result.rows.length !== 0) {
                const resultOrdenado = result.rows.sort((a, b) => {
                  // Ordenar por nombre_asentamiento en orden descendente
                  if (b.scoring.nombre_asentamiento !== a.scoring.nombre_asentamiento) {
                    return b.scoring.nombre_asentamiento - a.scoring.nombre_asentamiento;
                  }
                });
              
                // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
                if (resultOrdenado[0].scoring.nombre_asentamiento > 50)rows = rows.concat(result.rows);
              }
            /*if (result.rows.length === 0) {
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
                    WHERE unaccent(nombre_asentamiento) like '%' || $1 || '%'
                    ;
                `;
                // Almacenamos en el arreglo values los campos que seran usados en la consulta
                values = ["_"];
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
                    if (result.rows[i].tipo_asentamiento) resultado += `${result.rows[i].tipo_asentamiento} `;
                    if (result.rows[i].nombre_asentamiento) resultado += `${result.rows[i].nombre_asentamiento} `;
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
                        fiability: 0,
                        tipo_asentamiento: 0,
                        nombre_asentamiento: 0
                    };
                    // Calcular la distancia de Levenshtein
                    const distance = levenshteinDistance(quitarAcentos(result.rows[i].nombre_asentamiento), direccionParsed.NOMASEN);
                    // Calcular la similitud como el inverso de la distancia de Levenshtein
                    const maxLength = Math.max(result.rows[i].nombre_asentamiento.length, direccionParsed.NOMASEN.length);
                    // Calculamos la similitud del nombre_asentamiento segun sus comparativos
                    const similarity = ((maxLength - distance) / maxLength) * 100;
                    // Validamos que exista similitud alguna
                    if (similarity) {
                        // Subimos el scoring en nombre_asentamiento
                        result.rows[i].scoring.nombre_asentamiento += similarity;
                        // Subimos el scoring en fiability
                        result.rows[i].scoring.fiability += (similarity * 0.7);
                    }
                }
                // Añadimos los resultados obtenidos al arreglo rows
                rows = rows.concat(result.rows);
            } */
        }
    }
    // Retornamos los rows que se obtuvieron hasta el momento
    return rows;
}
module.exports = alone;