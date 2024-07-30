const pgClient = require("../../data/conexion");
const { levenshteinDistance, quitarAcentos, recortarTipoAsentamiento, recortarTipoVialidad } = require("../funciones");

// Aplicable solo en caso de llevar todos los campos a excepcion del CP y NUMEXTNUM1
async function sinNumeroExteriorCP(direccionParsed) {
    // Declaramos un valor nulo para la query de tipo String
    let query = '';
    // Generamos un arreglo para los valores que suplantaran "$X" en la query
    let values = [];
    // Generamos un arreglo para guardar los resultados obtenidos de la BD
    let rows = [];
    // Construimos la query para comenzar a generar consultas a la BD
    query = `
        SELECT *,
        lat_y AS y_centro,
        lon_x AS x_centro
        FROM carto_geolocalizador
        WHERE unaccent(poi) like '%' || $1 || '%'
        AND unaccent(municipio) = $2
        AND unaccent(estado) = $3
        AND unaccent(colonia) LIKE '%' || $4 || '%'
        ;
    `;
    // Almacenamos en el arreglo values los campos que seran usados en la consulta
    values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA];
    // Guardamos en una constante el resultado obtenido
    const result = await pgClient.query(query, values);
    // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
    for (let i = 0; i < result.rows.length; i++) {
        // Inicializar la cadena de resultado
        let resultado = '';

        // Concatenar cada campo si tiene un valor
        if (result.rows[i].poi) resultado += `${result.rows[i].poi} `;
        resultado += `COL. `;
        if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
        if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
        if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
        if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

        // Asignar el resultado al campo "resultado"
        result.rows[i].resultado = resultado.trim();
        // Modificamos el tipo por uno controlado para el servicio del Front
        result.rows[i].tipo = `POI`;
        // Asignar el id_calle al campo "id"
        result.rows[i].id = result.rows[i].id_calle;
        // Asignar el campo por el que se puede identificar el id previo.
        result.rows[i].campo = `Id`;
        // Asignar la imagen final que recibira dicha direccion
        result.rows[i].imagen = 'punto';
        // Asignar la tabla de donde se obtuvo principalmente dicho registro
        result.rows[i].tabla = 'carto_poi';
        // Dejamos en 0 cada uno de los ids que conforman el poi por adaptabilidad con el Front
        result.rows[i].id_estado = 0;
        result.rows[i].id_municipio = 0;
        result.rows[i].id_region = 0;
        // Calificamos el registro recuperado segun los parametros coincididos
        result.rows[i].scoring = {
            fiability: 20,
            poi: 0,
            municipio: 100,
            estado: 100,
            colonia: 0
        };
        // Quitamos acentos del poi recuperado debido a que en la BD se tiene con acentos
        const nombrePoiSinAcentos = quitarAcentos(result.rows[i].poi);
        // Hacemos match con lo que proporciono el usuario.
        const matchNombrePoi = nombrePoiSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
        // Validamos que exista Match
        if (matchNombrePoi) {
            // Obtiene el texto coincidente
            const matchedText = matchNombrePoi[0];
            // Generamos la igualdad que se tienen
            let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
            // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
            if (igualdad > 100) igualdad = 100;
            // Subimos el scoring en poi
            result.rows[i].scoring.poi += Math.round(igualdad);
            // Subimos el scoring en fiability
            result.rows[i].scoring.fiability += Math.round(igualdad * 0.4);
        }
        // Quitamos acentos de la colonia recuperada debido a que en la BD se tiene con acentos
        const coloniaSinAcentos = recortarTipoVialidad(recortarTipoAsentamiento(quitarAcentos(result.rows[i].colonia)));
        // Hacemos match con lo que proporciono el usuario.
        const matchColonia = coloniaSinAcentos.match(new RegExp(recortarTipoVialidad(recortarTipoAsentamiento(direccionParsed.COLONIA)), 'i'));
        // Validamos que exista Match
        if (matchColonia) {
            // Obtiene el texto coincidente
            const matchedText = matchColonia[0];
            // Generamos la igualdad que se tienen
            let igualdad = matchedText.length * 100 / coloniaSinAcentos.length;
            // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
            if (igualdad > 100) igualdad = 100;
            // Subimos el scoring en colonia
            result.rows[i].scoring.colonia += Math.round(igualdad);
            // Subimos el scoring en fiability
            result.rows[i].scoring.fiability += Math.round(igualdad * 0.4);
        }
    }
    if (result.rows.length !== 0) {
        const resultOrdenado = result.rows.sort((a, b) => {
          // Ordenar por poi en orden descendente
          if (b.scoring.poi !== a.scoring.poi) {
            return b.scoring.poi - a.scoring.poi;
          }
      
          // Si las calles son iguales, ordenar por colonia en orden descendente
          return b.scoring.colonia - a.scoring.colonia;
        });
      
        // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
        if (
          resultOrdenado[0].scoring.colonia > 70 &&
          resultOrdenado[0].scoring.poi > 70
        ) {
          rows = rows.concat(result.rows);
        }
      }else{
        // Construimos la query para comenzar a generar consultas a la BD
        query = `
            SELECT *,
            lat_y AS y_centro,
            lon_x AS x_centro
            FROM carto_geolocalizador
            WHERE unaccent(poi) like '%' || $1 || '%'
            AND unaccent(estado) = $2
            AND unaccent(colonia) LIKE '%' || $3 || '%'
            ;
        `;
        // Almacenamos en el arreglo values los campos que seran usados en la consulta
        values = [direccionParsed.CALLE, direccionParsed.ESTADO, direccionParsed.COLONIA];
        // Guardamos en una constante el resultado obtenido
        const result = await pgClient.query(query, values);
        // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
        for (let i = 0; i < result.rows.length; i++) {
            // Inicializar la cadena de resultado
            let resultado = '';

            // Concatenar cada campo si tiene un valor
            if (result.rows[i].poi) resultado += `${result.rows[i].poi} `;
            resultado += `COL. `;
            if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
            if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
            if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
            if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

            // Asignar el resultado al campo "resultado"
            result.rows[i].resultado = resultado.trim();
            // Modificamos el tipo por uno controlado para el servicio del Front
            result.rows[i].tipo = `POI`;
            // Asignar el id_calle al campo "id"
            result.rows[i].id = result.rows[i].id_calle;
            // Asignar el campo por el que se puede identificar el id previo.
            result.rows[i].campo = `Id`;
            // Asignar la imagen final que recibira dicha direccion
            result.rows[i].imagen = 'punto';
            // Asignar la tabla de donde se obtuvo principalmente dicho registro
            result.rows[i].tabla = 'carto_poi';
            // Dejamos en 0 cada uno de los ids que conforman el poi por adaptabilidad con el Front
            result.rows[i].id_estado = 0;
            result.rows[i].id_municipio = 0;
            result.rows[i].id_region = 0;
            // Calificamos el registro recuperado segun los parametros coincididos
            result.rows[i].scoring = {
                fiability: 10,
                poi: 0,
                municipio: 0,
                estado: 100,
                colonia: 0
            };
            // Quitamos acentos del poi recuperado debido a que en la BD se tiene con acentos
            const nombrePoiSinAcentos = quitarAcentos(result.rows[i].poi);
            // Hacemos match con lo que proporciono el usuario.
            const matchNombrePoi = nombrePoiSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
            // Validamos que exista Match
            if (matchNombrePoi) {
                // Obtiene el texto coincidente
                const matchedText = matchNombrePoi[0];
                // Generamos la igualdad que se tienen
                let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                if (igualdad > 100) igualdad = 100;
                // Subimos el scoring en poi
                result.rows[i].scoring.poi += Math.round(igualdad);
                // Subimos el scoring en fiability
                result.rows[i].scoring.fiability += Math.round(igualdad * 0.4);
            }
            // Quitamos acentos de la colonia recuperada debido a que en la BD se tiene con acentos
            const coloniaSinAcentos = recortarTipoVialidad(recortarTipoAsentamiento(quitarAcentos(result.rows[i].colonia)));
            // Hacemos match con lo que proporciono el usuario.
            const matchColonia = coloniaSinAcentos.match(new RegExp(recortarTipoVialidad(recortarTipoAsentamiento(direccionParsed.COLONIA)), 'i'));
            // Validamos que exista Match
            if (matchColonia) {
                // Obtiene el texto coincidente
                const matchedText = matchColonia[0];
                // Generamos la igualdad que se tienen
                let igualdad = matchedText.length * 100 / coloniaSinAcentos.length;
                // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                if (igualdad > 100) igualdad = 100;
                // Subimos el scoring en colonia
                result.rows[i].scoring.colonia += Math.round(igualdad);
                // Subimos el scoring en fiability
                result.rows[i].scoring.fiability += Math.round(igualdad * 0.4);
            }
        }
        if (result.rows.length !== 0) {
            const resultOrdenado = result.rows.sort((a, b) => {
              // Ordenar por poi en orden descendente
              if (b.scoring.poi !== a.scoring.poi) {
                return b.scoring.poi - a.scoring.poi;
              }
          
              // Si las calles son iguales, ordenar por colonia en orden descendente
              return b.scoring.colonia - a.scoring.colonia;
            });
          
            // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
            if (
              resultOrdenado[0].scoring.colonia > 70 &&
              resultOrdenado[0].scoring.poi > 70
            ) {
              rows = rows.concat(result.rows);
            }
          }else{
            // Construimos la query para comenzar a generar consultas a la BD
            query = `
                SELECT *,
                lat_y AS y_centro,
                lon_x AS x_centro
                FROM carto_geolocalizador
                WHERE unaccent(poi) like '%' || $1 || '%'
                AND unaccent(municipio) = $2
                AND unaccent(colonia) LIKE '%' || $3 || '%'
                ;
            `;
            // Almacenamos en el arreglo values los campos que seran usados en la consulta
            values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.COLONIA];
            // Guardamos en una constante el resultado obtenido
            const result = await pgClient.query(query, values);
            // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
            for (let i = 0; i < result.rows.length; i++) {
                // Inicializar la cadena de resultado
                let resultado = '';

                // Concatenar cada campo si tiene un valor
                if (result.rows[i].poi) resultado += `${result.rows[i].poi} `;
                resultado += `COL. `;
                if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                // Asignar el resultado al campo "resultado"
                result.rows[i].resultado = resultado.trim();
                // Modificamos el tipo por uno controlado para el servicio del Front
                result.rows[i].tipo = `POI`;
                // Asignar el id_calle al campo "id"
                result.rows[i].id = result.rows[i].id_calle;
                // Asignar el campo por el que se puede identificar el id previo.
                result.rows[i].campo = `Id`;
                // Asignar la imagen final que recibira dicha direccion
                result.rows[i].imagen = 'punto';
                // Asignar la tabla de donde se obtuvo principalmente dicho registro
                result.rows[i].tabla = 'carto_poi';
                // Dejamos en 0 cada uno de los ids que conforman el poi por adaptabilidad con el Front
                result.rows[i].id_estado = 0;
                result.rows[i].id_municipio = 0;
                result.rows[i].id_region = 0;
                // Calificamos el registro recuperado segun los parametros coincididos
                result.rows[i].scoring = {
                    fiability: 10,
                    poi: 0,
                    municipio: 100,
                    estado: 0,
                    colonia: 0
                };
                // Quitamos acentos del poi recuperado debido a que en la BD se tiene con acentos
                const nombrePoiSinAcentos = quitarAcentos(result.rows[i].poi);
                // Hacemos match con lo que proporciono el usuario.
                const matchNombrePoi = nombrePoiSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                // Validamos que exista Match
                if (matchNombrePoi) {
                    // Obtiene el texto coincidente
                    const matchedText = matchNombrePoi[0];
                    // Generamos la igualdad que se tienen
                    let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                    // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                    if (igualdad > 100) igualdad = 100;
                    // Subimos el scoring en poi
                    result.rows[i].scoring.poi += Math.round(igualdad);
                    // Subimos el scoring en fiability
                    result.rows[i].scoring.fiability += Math.round(igualdad * 0.4);
                }
                // Quitamos acentos de la colonia recuperada debido a que en la BD se tiene con acentos
                const coloniaSinAcentos = recortarTipoVialidad(recortarTipoAsentamiento(quitarAcentos(result.rows[i].colonia)));
                // Hacemos match con lo que proporciono el usuario.
                const matchColonia = coloniaSinAcentos.match(new RegExp(recortarTipoVialidad(recortarTipoAsentamiento(direccionParsed.COLONIA)), 'i'));
                // Validamos que exista Match
                if (matchColonia) {
                    // Obtiene el texto coincidente
                    const matchedText = matchColonia[0];
                    // Generamos la igualdad que se tienen
                    let igualdad = matchedText.length * 100 / coloniaSinAcentos.length;
                    // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                    if (igualdad > 100) igualdad = 100;
                    // Subimos el scoring en colonia
                    result.rows[i].scoring.colonia += Math.round(igualdad);
                    // Subimos el scoring en fiability
                    result.rows[i].scoring.fiability += Math.round(igualdad * 0.4);
                }
            }
            if (result.rows.length !== 0) {
                const resultOrdenado = result.rows.sort((a, b) => {
                  // Ordenar por poi en orden descendente
                  if (b.scoring.poi !== a.scoring.poi) {
                    return b.scoring.poi - a.scoring.poi;
                  }
              
                  // Si las calles son iguales, ordenar por colonia en orden descendente
                  return b.scoring.colonia - a.scoring.colonia;
                });
              
                // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
                if (
                  resultOrdenado[0].scoring.colonia > 70 &&
                  resultOrdenado[0].scoring.poi > 70
                ) {
                  rows = rows.concat(result.rows);
                }
              }else{
                // Construimos la query para comenzar a generar consultas a la BD
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
                // Almacenamos en el arreglo values los campos que seran usados en la consulta
                values = [direccionParsed.CALLE, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                // Guardamos en una constante el resultado obtenido
                const result = await pgClient.query(query, values);
                // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
                for (let i = 0; i < result.rows.length; i++) {
                    // Inicializar la cadena de resultado
                    let resultado = '';

                    // Concatenar cada campo si tiene un valor
                    if (result.rows[i].poi) resultado += `${result.rows[i].poi} `;
                    resultado += `COL. `;
                    if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                    if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                    if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                    if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                    // Asignar el resultado al campo "resultado"
                    result.rows[i].resultado = resultado.trim();
                    // Modificamos el tipo por uno controlado para el servicio del Front
                    result.rows[i].tipo = `POI`;
                    // Asignar el id_calle al campo "id"
                    result.rows[i].id = result.rows[i].id_calle;
                    // Asignar el campo por el que se puede identificar el id previo.
                    result.rows[i].campo = `Id`;
                    // Asignar la imagen final que recibira dicha direccion
                    result.rows[i].imagen = 'punto';
                    // Asignar la tabla de donde se obtuvo principalmente dicho registro
                    result.rows[i].tabla = 'carto_poi';
                    // Dejamos en 0 cada uno de los ids que conforman el poi por adaptabilidad con el Front
                    result.rows[i].id_estado = 0;
                    result.rows[i].id_municipio = 0;
                    result.rows[i].id_region = 0;
                    // Calificamos el registro recuperado segun los parametros coincididos
                    result.rows[i].scoring = {
                        fiability: 20,
                        poi: 0,
                        municipio: 100,
                        estado: 100,
                        colonia: 0
                    };
                    // Quitamos acentos del poi recuperado debido a que en la BD se tiene con acentos
                    const nombrePoiSinAcentos = quitarAcentos(result.rows[i].poi);
                    // Hacemos match con lo que proporciono el usuario.
                    const matchNombrePoi = nombrePoiSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                    // Validamos que exista Match
                    if (matchNombrePoi) {
                        // Obtiene el texto coincidente
                        const matchedText = matchNombrePoi[0];
                        // Generamos la igualdad que se tienen
                        let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                        // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                        if (igualdad > 100) igualdad = 100;
                        // Subimos el scoring en poi
                        result.rows[i].scoring.poi += Math.round(igualdad);
                        // Subimos el scoring en fiability
                        result.rows[i].scoring.fiability += Math.round(igualdad * 0.4);
                    }
                    const coloniaSinAcentos = recortarTipoVialidad(recortarTipoAsentamiento(quitarAcentos(result.rows[i].colonia)));
                    // Calcular la distancia de Levenshtein
                    const distanceColonia = levenshteinDistance(coloniaSinAcentos,recortarTipoVialidad(recortarTipoAsentamiento( direccionParsed.COLONIA)));
                    // Calcular la similitud como el inverso de la distancia de Levenshtein
                    const maxLengthColonia = Math.max(coloniaSinAcentos.length, recortarTipoVialidad(recortarTipoAsentamiento(direccionParsed.COLONIA)).length);
                    // Calculamos la similitud de la colonia segun sus comparativos
                    const similarityColonia = ((maxLengthColonia - distanceColonia) / maxLengthColonia) * 100;
                    // Validamos que exista similitud alguna
                    if (similarityColonia) {
                        // Subimos el scoring en colonia
                        result.rows[i].scoring.colonia += similarityColonia;
                        // Subimos el scoring en fiability
                        result.rows[i].scoring.fiability += (similarityColonia * 0.4);
                    }
                }
                if (result.rows.length !== 0) {
                    const resultOrdenado = result.rows.sort((a, b) => {
                      // Ordenar por poi en orden descendente
                      if (b.scoring.poi !== a.scoring.poi) {
                        return b.scoring.poi - a.scoring.poi;
                      }
                  
                      // Si las calles son iguales, ordenar por colonia en orden descendente
                      return b.scoring.colonia - a.scoring.colonia;
                    });
                  
                    // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
                    if (
                      resultOrdenado[0].scoring.colonia > 70 &&
                      resultOrdenado[0].scoring.poi > 70
                    ) {
                      rows = rows.concat(result.rows);
                    }
                  }else{
                    // Construimos la query para comenzar a generar consultas a la BD
                    query = `
                        SELECT *,
                        lat_y AS y_centro,
                        lon_x AS x_centro
                        FROM carto_geolocalizador
                        WHERE unaccent(poi) like '%' || $1 || '%'
                        AND unaccent(estado) = $2
                        ;
                    `;
                    // Almacenamos en el arreglo values los campos que seran usados en la consulta
                    values = [direccionParsed.CALLE, direccionParsed.ESTADO];
                    // Guardamos en una constante el resultado obtenido
                    const result = await pgClient.query(query, values);
                    // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
                    for (let i = 0; i < result.rows.length; i++) {
                        // Inicializar la cadena de resultado
                        let resultado = '';

                        // Concatenar cada campo si tiene un valor
                        if (result.rows[i].poi) resultado += `${result.rows[i].poi} `;
                        resultado += `COL. `;
                        if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                        if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                        if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                        if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                        // Asignar el resultado al campo "resultado"
                        result.rows[i].resultado = resultado.trim();
                        // Modificamos el tipo por uno controlado para el servicio del Front
                        result.rows[i].tipo = `POI`;
                        // Asignar el id_calle al campo "id"
                        result.rows[i].id = result.rows[i].id_calle;
                        // Asignar el campo por el que se puede identificar el id previo.
                        result.rows[i].campo = `Id`;
                        // Asignar la imagen final que recibira dicha direccion
                        result.rows[i].imagen = 'punto';
                        // Asignar la tabla de donde se obtuvo principalmente dicho registro
                        result.rows[i].tabla = 'carto_poi';
                        // Dejamos en 0 cada uno de los ids que conforman el poi por adaptabilidad con el Front
                        result.rows[i].id_estado = 0;
                        result.rows[i].id_municipio = 0;
                        result.rows[i].id_region = 0;
                        // Calificamos el registro recuperado segun los parametros coincididos
                        result.rows[i].scoring = {
                            fiability: 10,
                            poi: 0,
                            municipio: 0,
                            estado: 100,
                            colonia: 0
                        };
                        // Quitamos acentos del poi recuperado debido a que en la BD se tiene con acentos
                        const nombrePoiSinAcentos = quitarAcentos(result.rows[i].poi);
                        // Hacemos match con lo que proporciono el usuario.
                        const matchNombrePoi = nombrePoiSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                        // Validamos que exista Match
                        if (matchNombrePoi) {
                            // Obtiene el texto coincidente
                            const matchedText = matchNombrePoi[0];
                            // Generamos la igualdad que se tienen
                            let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                            // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                            if (igualdad > 100) igualdad = 100;
                            // Subimos el scoring en poi
                            result.rows[i].scoring.poi += Math.round(igualdad);
                            // Subimos el scoring en fiability
                            result.rows[i].scoring.fiability += Math.round(igualdad * 0.4);
                        }
                        const coloniaSinAcentos = recortarTipoVialidad(recortarTipoAsentamiento(quitarAcentos(result.rows[i].colonia)));
                        // Calcular la distancia de Levenshtein
                        const distanceColonia = levenshteinDistance(coloniaSinAcentos,recortarTipoVialidad(recortarTipoAsentamiento( direccionParsed.COLONIA)));
                        // Calcular la similitud como el inverso de la distancia de Levenshtein
                        const maxLengthColonia = Math.max(coloniaSinAcentos.length, recortarTipoVialidad(recortarTipoAsentamiento(direccionParsed.COLONIA)).length);
                        // Calculamos la similitud de la colonia segun sus comparativos
                        const similarityColonia = ((maxLengthColonia - distanceColonia) / maxLengthColonia) * 100;
                        // Validamos que exista similitud alguna
                        if (similarityColonia) {
                            // Subimos el scoring en colonia
                            result.rows[i].scoring.colonia += similarityColonia;
                            // Subimos el scoring en fiability
                            result.rows[i].scoring.fiability += (similarityColonia * 0.4);
                        }
                    }
                    if (result.rows.length !== 0) {
                        const resultOrdenado = result.rows.sort((a, b) => {
                          // Ordenar por poi en orden descendente
                          if (b.scoring.poi !== a.scoring.poi) {
                            return b.scoring.poi - a.scoring.poi;
                          }
                      
                          // Si las calles son iguales, ordenar por colonia en orden descendente
                          return b.scoring.colonia - a.scoring.colonia;
                        });
                      
                        // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
                        if (
                          resultOrdenado[0].scoring.colonia > 70 &&
                          resultOrdenado[0].scoring.poi > 70
                        ) {
                          rows = rows.concat(result.rows);
                        }
                      }else{
                        // Construimos la query para comenzar a generar consultas a la BD
                        query = `
                            SELECT *,
                            lat_y AS y_centro,
                            lon_x AS x_centro
                            FROM carto_geolocalizador
                            WHERE unaccent(poi) like '%' || $1 || '%'
                            AND unaccent(colonia) LIKE '%' || $2 || '%'
                            ;
                        `;
                        // Almacenamos en el arreglo values los campos que seran usados en la consulta
                        values = [direccionParsed.CALLE, direccionParsed.COLONIA];
                        // Guardamos en una constante el resultado obtenido
                        const result = await pgClient.query(query, values);
                        // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
                        for (let i = 0; i < result.rows.length; i++) {
                            // Inicializar la cadena de resultado
                            let resultado = '';

                            // Concatenar cada campo si tiene un valor
                            if (result.rows[i].poi) resultado += `${result.rows[i].poi} `;
                            resultado += `COL. `;
                            if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                            if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                            if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                            if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                            // Asignar el resultado al campo "resultado"
                            result.rows[i].resultado = resultado.trim();
                            // Modificamos el tipo por uno controlado para el servicio del Front
                            result.rows[i].tipo = `POI`;
                            // Asignar el id_calle al campo "id"
                            result.rows[i].id = result.rows[i].id_calle;
                            // Asignar el campo por el que se puede identificar el id previo.
                            result.rows[i].campo = `Id`;
                            // Asignar la imagen final que recibira dicha direccion
                            result.rows[i].imagen = 'punto';
                            // Asignar la tabla de donde se obtuvo principalmente dicho registro
                            result.rows[i].tabla = 'carto_poi';
                            // Dejamos en 0 cada uno de los ids que conforman el poi por adaptabilidad con el Front
                            result.rows[i].id_estado = 0;
                            result.rows[i].id_municipio = 0;
                            result.rows[i].id_region = 0;
                            // Calificamos el registro recuperado segun los parametros coincididos
                            result.rows[i].scoring = {
                                fiability: 0,
                                poi: 0,
                                municipio: 0,
                                estado: 0,
                                colonia: 0
                            };
                            // Quitamos acentos del poi recuperado debido a que en la BD se tiene con acentos
                            const nombrePoiSinAcentos = quitarAcentos(result.rows[i].poi);
                            // Hacemos match con lo que proporciono el usuario.
                            const matchNombrePoi = nombrePoiSinAcentos.match(new RegExp(direccionParsed.CALLE, 'i'));
                            // Validamos que exista Match
                            if (matchNombrePoi) {
                                // Obtiene el texto coincidente
                                const matchedText = matchNombrePoi[0];
                                // Generamos la igualdad que se tienen
                                let igualdad = matchedText.length * 100 / result.rows[i].poi.length;
                                // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                                if (igualdad > 100) igualdad = 100;
                                // Subimos el scoring en poi
                                result.rows[i].scoring.poi += Math.round(igualdad);
                                // Subimos el scoring en fiability
                                result.rows[i].scoring.fiability += Math.round(igualdad * 0.4);
                            }
                            // Quitamos acentos de la colonia recuperada debido a que en la BD se tiene con acentos
                            const coloniaSinAcentos = recortarTipoVialidad(recortarTipoAsentamiento(quitarAcentos(result.rows[i].colonia)));
                            // Hacemos match con lo que proporciono el usuario.
                            const matchColonia = coloniaSinAcentos.match(new RegExp(recortarTipoVialidad(recortarTipoAsentamiento(direccionParsed.COLONIA)), 'i'));
                            // Validamos que exista Match
                            if (matchColonia) {
                                // Obtiene el texto coincidente
                                const matchedText = matchColonia[0];
                                // Generamos la igualdad que se tienen
                                let igualdad = matchedText.length * 100 / coloniaSinAcentos.length;
                                // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                                if (igualdad > 100) igualdad = 100;
                                // Subimos el scoring en colonia
                                result.rows[i].scoring.colonia += Math.round(igualdad);
                                // Subimos el scoring en fiability
                                result.rows[i].scoring.fiability += Math.round(igualdad * 0.4);
                            }
                        }
                        if (result.rows.length !== 0) {
                            const resultOrdenado = result.rows.sort((a, b) => {
                              // Ordenar por poi en orden descendente
                              if (b.scoring.poi !== a.scoring.poi) {
                                return b.scoring.poi - a.scoring.poi;
                              }
                          
                              // Si las calles son iguales, ordenar por colonia en orden descendente
                              return b.scoring.colonia - a.scoring.colonia;
                            });
                          
                            // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
                            if (
                              resultOrdenado[0].scoring.colonia > 70 &&
                              resultOrdenado[0].scoring.poi > 70
                            ) {
                              rows = rows.concat(result.rows);
                            }
                          }else{
                            // Construimos la query para comenzar a generar consultas a la BD
                            query = `
                                SELECT *,
                                lat_y AS y_centro,
                                lon_x AS x_centro
                                FROM carto_geolocalizador
                                WHERE unaccent(municipio) = $1
                                AND unaccent(estado) = $2
                                AND unaccent(colonia) LIKE '%' || $3 || '%'
                                ;
                            `;
                            // Almacenamos en el arreglo values los campos que seran usados en la consulta
                            values = [direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.COLONIA];
                            // Guardamos en una constante el resultado obtenido
                            const result = await pgClient.query(query, values);
                            // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
                            for (let i = 0; i < result.rows.length; i++) {
                                // Inicializar la cadena de resultado
                                let resultado = '';

                                // Concatenar cada campo si tiene un valor
                                if (result.rows[i].poi) resultado += `${result.rows[i].poi} `;
                                resultado += `COL. `;
                                if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                                if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                                if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                                if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                                // Asignar el resultado al campo "resultado"
                                result.rows[i].resultado = resultado.trim();
                                // Modificamos el tipo por uno controlado para el servicio del Front
                                result.rows[i].tipo = `POI`;
                                // Asignar el id_calle al campo "id"
                                result.rows[i].id = result.rows[i].id_calle;
                                // Asignar el campo por el que se puede identificar el id previo.
                                result.rows[i].campo = `Id`;
                                // Asignar la imagen final que recibira dicha direccion
                                result.rows[i].imagen = 'punto';
                                // Asignar la tabla de donde se obtuvo principalmente dicho registro
                                result.rows[i].tabla = 'carto_poi';
                                // Dejamos en 0 cada uno de los ids que conforman el poi por adaptabilidad con el Front
                                result.rows[i].id_estado = 0;
                                result.rows[i].id_municipio = 0;
                                result.rows[i].id_region = 0;
                                // Calificamos el registro recuperado segun los parametros coincididos
                                result.rows[i].scoring = {
                                    fiability: 20,
                                    poi: 0,
                                    municipio: 100,
                                    estado: 100,
                                    colonia: 0
                                };
                                // Calcular la distancia de Levenshtein
                                const distance = levenshteinDistance(quitarAcentos(result.rows[i].poi), direccionParsed.CALLE);
                                // Calcular la similitud como el inverso de la distancia de Levenshtein
                                const maxLength = Math.max(result.rows[i].poi.length, direccionParsed.CALLE.length);
                                // Calculamos la similitud del poi segun sus comparativos
                                const similarity = ((maxLength - distance) / maxLength) * 100;
                                // Validamos que exista similitud alguna
                                if (similarity) {
                                    // Subimos el scoring en poi
                                    result.rows[i].scoring.poi += similarity;
                                    // Subimos el scoring en fiability
                                    result.rows[i].scoring.fiability += (similarity * 0.4);
                                }
                                // Quitamos acentos de la colonia recuperada debido a que en la BD se tiene con acentos
                                const coloniaSinAcentos = recortarTipoVialidad(recortarTipoAsentamiento(quitarAcentos(result.rows[i].colonia)));
                                // Hacemos match con lo que proporciono el usuario.
                                const matchColonia = coloniaSinAcentos.match(new RegExp(recortarTipoVialidad(recortarTipoAsentamiento(direccionParsed.COLONIA)), 'i'));
                                // Validamos que exista Match
                                if (matchColonia) {
                                    // Obtiene el texto coincidente
                                    const matchedText = matchColonia[0];
                                    // Generamos la igualdad que se tienen
                                    let igualdad = matchedText.length * 100 / coloniaSinAcentos.length;
                                    // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                                    if (igualdad > 100) igualdad = 100;
                                    // Subimos el scoring en colonia
                                    result.rows[i].scoring.colonia += Math.round(igualdad);
                                    // Subimos el scoring en fiability
                                    result.rows[i].scoring.fiability += Math.round(igualdad * 0.4);
                                }
                            }
                            if (result.rows.length !== 0) {
                                const resultOrdenado = result.rows.sort((a, b) => {
                                  // Ordenar por poi en orden descendente
                                  if (b.scoring.poi !== a.scoring.poi) {
                                    return b.scoring.poi - a.scoring.poi;
                                  }
                              
                                  // Si las calles son iguales, ordenar por colonia en orden descendente
                                  return b.scoring.colonia - a.scoring.colonia;
                                });
                              
                                // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
                                if (
                                  resultOrdenado[0].scoring.colonia > 70 &&
                                  resultOrdenado[0].scoring.poi > 70
                                ) {
                                  rows = rows.concat(result.rows);
                                }
                              }else{
                                // Construimos la query para comenzar a generar consultas a la BD
                                query = `
                                    SELECT *,
                                    lat_y AS y_centro,
                                    lon_x AS x_centro
                                    FROM carto_geolocalizador
                                    WHERE unaccent(municipio) = $1
                                    AND unaccent(colonia) LIKE '%' || $2 || '%'
                                    ;
                                `;
                                // Almacenamos en el arreglo values los campos que seran usados en la consulta
                                values = [direccionParsed.MUNICIPIO, direccionParsed.COLONIA];
                                // Guardamos en una constante el resultado obtenido
                                const result = await pgClient.query(query, values);
                                // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
                                for (let i = 0; i < result.rows.length; i++) {
                                    // Inicializar la cadena de resultado
                                    let resultado = '';

                                    // Concatenar cada campo si tiene un valor
                                    if (result.rows[i].poi) resultado += `${result.rows[i].poi} `;
                                    resultado += `COL. `;
                                    if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                                    if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                                    if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                                    if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                                    // Asignar el resultado al campo "resultado"
                                    result.rows[i].resultado = resultado.trim();
                                    // Modificamos el tipo por uno controlado para el servicio del Front
                                    result.rows[i].tipo = `POI`;
                                    // Asignar el id_calle al campo "id"
                                    result.rows[i].id = result.rows[i].id_calle;
                                    // Asignar el campo por el que se puede identificar el id previo.
                                    result.rows[i].campo = `Id`;
                                    // Asignar la imagen final que recibira dicha direccion
                                    result.rows[i].imagen = 'punto';
                                    // Asignar la tabla de donde se obtuvo principalmente dicho registro
                                    result.rows[i].tabla = 'carto_poi';
                                    // Dejamos en 0 cada uno de los ids que conforman el poi por adaptabilidad con el Front
                                    result.rows[i].id_estado = 0;
                                    result.rows[i].id_municipio = 0;
                                    result.rows[i].id_region = 0;
                                    // Calificamos el registro recuperado segun los parametros coincididos
                                    result.rows[i].scoring = {
                                        fiability: 10,
                                        poi: 0,
                                        municipio: 100,
                                        estado: 0,
                                        colonia: 0
                                    };
                                    // Calcular la distancia de Levenshtein
                                    const distance = levenshteinDistance(quitarAcentos(result.rows[i].poi), direccionParsed.CALLE);
                                    // Calcular la similitud como el inverso de la distancia de Levenshtein
                                    const maxLength = Math.max(result.rows[i].poi.length, direccionParsed.CALLE.length);
                                    // Calculamos la similitud del poi segun sus comparativos
                                    const similarity = ((maxLength - distance) / maxLength) * 100;
                                    // Validamos que exista similitud alguna
                                    if (similarity) {
                                        // Subimos el scoring en poi
                                        result.rows[i].scoring.poi += similarity;
                                        // Subimos el scoring en fiability
                                        result.rows[i].scoring.fiability += (similarity * 0.4);
                                    }
                                    // Quitamos acentos de la colonia recuperada debido a que en la BD se tiene con acentos
                                    const coloniaSinAcentos = recortarTipoVialidad(recortarTipoAsentamiento(quitarAcentos(result.rows[i].colonia)));
                                    // Hacemos match con lo que proporciono el usuario.
                                    const matchColonia = coloniaSinAcentos.match(new RegExp(recortarTipoVialidad(recortarTipoAsentamiento(direccionParsed.COLONIA)), 'i'));
                                    // Validamos que exista Match
                                    if (matchColonia) {
                                        // Obtiene el texto coincidente
                                        const matchedText = matchColonia[0];
                                        // Generamos la igualdad que se tienen
                                        let igualdad = matchedText.length * 100 / coloniaSinAcentos.length;
                                        // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                                        if (igualdad > 100) igualdad = 100;
                                        // Subimos el scoring en colonia
                                        result.rows[i].scoring.colonia += Math.round(igualdad);
                                        // Subimos el scoring en fiability
                                        result.rows[i].scoring.fiability += Math.round(igualdad * 0.4);
                                    }
                                }
                                if (result.rows.length !== 0) {
                                    const resultOrdenado = result.rows.sort((a, b) => {
                                      // Ordenar por poi en orden descendente
                                      if (b.scoring.poi !== a.scoring.poi) {
                                        return b.scoring.poi - a.scoring.poi;
                                      }
                                  
                                      // Si las calles son iguales, ordenar por colonia en orden descendente
                                      return b.scoring.colonia - a.scoring.colonia;
                                    });
                                  
                                    // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
                                    if (
                                      resultOrdenado[0].scoring.colonia > 70 &&
                                      resultOrdenado[0].scoring.poi > 70
                                    ) {
                                      rows = rows.concat(result.rows);
                                    }
                                  }else{
                                    // Construimos la query para comenzar a generar consultas a la BD
                                    query = `
                                        SELECT *,
                                        lat_y AS y_centro,
                                        lon_x AS x_centro
                                        FROM carto_geolocalizador
                                        WHERE unaccent(estado) = $1
                                        AND unaccent(colonia) LIKE '%' || $2 || '%'
                                        ;
                                    `;
                                    // Almacenamos en el arreglo values los campos que seran usados en la consulta
                                    values = [direccionParsed.ESTADO, direccionParsed.COLONIA];
                                    // Guardamos en una constante el resultado obtenido
                                    const result = await pgClient.query(query, values);
                                    // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
                                    for (let i = 0; i < result.rows.length; i++) {
                                        // Inicializar la cadena de resultado
                                        let resultado = '';

                                        // Concatenar cada campo si tiene un valor
                                        if (result.rows[i].poi) resultado += `${result.rows[i].poi} `;
                                        resultado += `COL. `;
                                        if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                                        if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                                        if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                                        if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                                        // Asignar el resultado al campo "resultado"
                                        result.rows[i].resultado = resultado.trim();
                                        // Modificamos el tipo por uno controlado para el servicio del Front
                                        result.rows[i].tipo = `POI`;
                                        // Asignar el id_calle al campo "id"
                                        result.rows[i].id = result.rows[i].id_calle;
                                        // Asignar el campo por el que se puede identificar el id previo.
                                        result.rows[i].campo = `Id`;
                                        // Asignar la imagen final que recibira dicha direccion
                                        result.rows[i].imagen = 'punto';
                                        // Asignar la tabla de donde se obtuvo principalmente dicho registro
                                        result.rows[i].tabla = 'carto_poi';
                                        // Dejamos en 0 cada uno de los ids que conforman el poi por adaptabilidad con el Front
                                        result.rows[i].id_estado = 0;
                                        result.rows[i].id_municipio = 0;
                                        result.rows[i].id_region = 0;
                                        // Calificamos el registro recuperado segun los parametros coincididos
                                        result.rows[i].scoring = {
                                            fiability: 10,
                                            poi: 0,
                                            municipio: 0,
                                            estado: 100,
                                            colonia: 0
                                        };
                                        // Calcular la distancia de Levenshtein
                                        const distance = levenshteinDistance(quitarAcentos(result.rows[i].poi), direccionParsed.CALLE);
                                        // Calcular la similitud como el inverso de la distancia de Levenshtein
                                        const maxLength = Math.max(result.rows[i].poi.length, direccionParsed.CALLE.length);
                                        // Calculamos la similitud del poi segun sus comparativos
                                        const similarity = ((maxLength - distance) / maxLength) * 100;
                                        // Validamos que exista similitud alguna
                                        if (similarity) {
                                            // Subimos el scoring en poi
                                            result.rows[i].scoring.poi += similarity;
                                            // Subimos el scoring en fiability
                                            result.rows[i].scoring.fiability += (similarity * 0.4);
                                        }
                                        // Quitamos acentos de la colonia recuperada debido a que en la BD se tiene con acentos
                                        const coloniaSinAcentos = recortarTipoVialidad(recortarTipoAsentamiento(quitarAcentos(result.rows[i].colonia)));
                                        // Hacemos match con lo que proporciono el usuario.
                                        const matchColonia = coloniaSinAcentos.match(new RegExp(recortarTipoVialidad(recortarTipoAsentamiento(direccionParsed.COLONIA)), 'i'));
                                        // Validamos que exista Match
                                        if (matchColonia) {
                                            // Obtiene el texto coincidente
                                            const matchedText = matchColonia[0];
                                            // Generamos la igualdad que se tienen
                                            let igualdad = matchedText.length * 100 / coloniaSinAcentos.length;
                                            // Hacemos que la igualdad no pueda ser mayor a 100 y afecte el scoring
                                            if (igualdad > 100) igualdad = 100;
                                            // Subimos el scoring en colonia
                                            result.rows[i].scoring.colonia += Math.round(igualdad);
                                            // Subimos el scoring en fiability
                                            result.rows[i].scoring.fiability += Math.round(igualdad * 0.4);
                                        }
                                    }
                                    if (result.rows.length !== 0) {
                                        const resultOrdenado = result.rows.sort((a, b) => {
                                          // Ordenar por poi en orden descendente
                                          if (b.scoring.poi !== a.scoring.poi) {
                                            return b.scoring.poi - a.scoring.poi;
                                          }
                                      
                                          // Si las calles son iguales, ordenar por colonia en orden descendente
                                          return b.scoring.colonia - a.scoring.colonia;
                                        });
                                      
                                        // Añadimos los resultados obtenidos al arreglo rows si el puntaje de la calle es mayor a 70
                                        if (
                                          resultOrdenado[0].scoring.colonia > 50 &&
                                          resultOrdenado[0].scoring.poi > 50
                                        ) {
                                          rows = rows.concat(result.rows);
                                        }
                                      }
                                    // Evaluamos que rows este vacio para seguir con la busqueda
                                    /* if (result.rows.length === 0) {
                                        // Construimos la query para comenzar a generar consultas a la BD
                                        query = `
                                            SELECT *,
                                            lat_y AS y_centro,
                                            lon_x AS x_centro
                                            FROM carto_geolocalizador
                                            WHERE unaccent(estado) = $1
                                            AND unaccent(municipio) = $2
                                            ;
                                        `;
                                        // Almacenamos en el arreglo values los campos que seran usados en la consulta
                                        values = [direccionParsed.ESTADO, direccionParsed.MUNICIPIO];
                                        // Guardamos en una constante el resultado obtenido
                                        const result = await pgClient.query(query, values);
                                        // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
                                        for (let i = 0; i < result.rows.length; i++) {
                                            // Inicializar la cadena de resultado
                                            let resultado = '';

                                            // Concatenar cada campo si tiene un valor
                                            if (result.rows[i].poi) resultado += `${result.rows[i].poi} `;
                                            resultado += `COL. `;
                                            if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
                                            if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
                                            if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
                                            if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

                                            // Asignar el resultado al campo "resultado"
                                            result.rows[i].resultado = resultado.trim();
                                            // Modificamos el tipo por uno controlado para el servicio del Front
                                            result.rows[i].tipo = `POI`;
                                            // Asignar el id_calle al campo "id"
                                            result.rows[i].id = result.rows[i].id_calle;
                                            // Asignar el campo por el que se puede identificar el id previo.
                                            result.rows[i].campo = `Id`;
                                            // Asignar la imagen final que recibira dicha direccion
                                            result.rows[i].imagen = 'punto';
                                            // Asignar la tabla de donde se obtuvo principalmente dicho registro
                                            result.rows[i].tabla = 'carto_poi';
                                            // Dejamos en 0 cada uno de los ids que conforman el poi por adaptabilidad con el Front
                                            result.rows[i].id_estado = 0;
                                            result.rows[i].id_municipio = 0;
                                            result.rows[i].id_region = 0;
                                            // Calificamos el registro recuperado segun los parametros coincididos
                                            result.rows[i].scoring = {
                                                fiability: 20,
                                                poi: 0,
                                                municipio: 100,
                                                estado: 100,
                                                colonia: 0
                                            };
                                            // Calcular la distancia de Levenshtein
                                            const distance = levenshteinDistance(quitarAcentos(result.rows[i].poi), direccionParsed.CALLE);
                                            // Calcular la similitud como el inverso de la distancia de Levenshtein
                                            const maxLength = Math.max(result.rows[i].poi.length, direccionParsed.CALLE.length);
                                            // Calculamos la similitud del poi segun sus comparativos
                                            const similarity = ((maxLength - distance) / maxLength) * 100;
                                            // Validamos que exista similitud alguna
                                            if (similarity) {
                                                // Subimos el scoring en poi
                                                result.rows[i].scoring.poi += similarity;
                                                // Subimos el scoring en fiability
                                                result.rows[i].scoring.fiability += (similarity * 0.4);
                                            }
                                            const coloniaSinAcentos = recortarTipoVialidad(recortarTipoAsentamiento(quitarAcentos(result.rows[i].colonia)));
                                            // Calcular la distancia de Levenshtein
                                            const distanceColonia = levenshteinDistance(coloniaSinAcentos,recortarTipoVialidad(recortarTipoAsentamiento( direccionParsed.COLONIA)));
                                            // Calcular la similitud como el inverso de la distancia de Levenshtein
                                            const maxLengthColonia = Math.max(coloniaSinAcentos.length, recortarTipoVialidad(recortarTipoAsentamiento(direccionParsed.COLONIA)).length);
                                            // Calculamos la similitud de la colonia segun sus comparativos
                                            const similarityColonia = ((maxLengthColonia - distanceColonia) / maxLengthColonia) * 100;
                                            // Validamos que exista similitud alguna
                                            if (similarityColonia) {
                                                // Subimos el scoring en colonia
                                                result.rows[i].scoring.colonia += similarityColonia;
                                                // Subimos el scoring en fiability
                                                result.rows[i].scoring.fiability += (similarityColonia * 0.4);
                                            }
                                        }
                                        // Añadimos los resultados obtenidos al arreglo rows
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
    // Retornamos los rows que se obtuvieron hasta el momento
    return rows;
}
module.exports = sinNumeroExteriorCP;