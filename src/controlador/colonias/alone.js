const pgClient = require("../../data/conexion");
const { levenshteinDistance, quitarAcentos, recortarTipoAsentamiento, recortarTipoVialidad } = require("../funciones");

// Aplicable solo en caso de omitir todos los campos a excepcion de COLONIA
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
        ST_Y(ST_Centroid("SP_GEOMETRY")) AS y_centro,
        ST_X(ST_Centroid("SP_GEOMETRY")) AS x_centro
        FROM carto_colonia
        WHERE unaccent(colonia) LIKE '%' || $1 || '%'
        ;
    `;
    // Almacenamos en el arreglo values los campos que seran usados en la consulta
    values = [direccionParsed.COLONIA];
    // Guardamos en una constante el resultado obtenido
    const result = await pgClient.query(query, values);
    // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
    for (let i = 0; i < result.rows.length; i++) {
        // Inicializar la cadena de resultado
        let resultado = '';

        // Concatenar cada campo si tiene un valor
        resultado += `COL. `;
        if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
        if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
        if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
        if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

        // Asignar el resultado al campo "resultado"
        result.rows[i].resultado = resultado.trim();
        // Modificamos el tipo por uno controlado para el servicio del Front
        result.rows[i].tipo = `Colonia`;
        // Asignar el id_colonia al campo "id"
        result.rows[i].id = result.rows[i].id_colonia;
        // Asignar el campo por el que se puede identificar el id previo.
        result.rows[i].campo = `id_colonia`;
        // Asignar la imagen final que recibira dicha direccion
        result.rows[i].imagen = 'poligono';
        // Asignar la tabla de donde se obtuvo principalmente dicho registro
        result.rows[i].tabla = 'carto_colonia';
        // Dejamos en 0 cada uno de los ids que conforman la colonia por adaptabilidad con el Front
        result.rows[i].id_estado = 0;
        result.rows[i].id_municipio = 0;
        result.rows[i].id_region = 0;
        // Calificamos el registro recuperado segun los parametros coincididos
        result.rows[i].scoring = {
            fiability: 0,
            colonia: 0
        };
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
            result.rows[i].scoring.fiability += Math.round(igualdad);
        }
    }
    // Añadimos los resultados obtenidos al arreglo rows
    rows = rows.concat(result.rows);
    // Evaluamos que rows este vacio para seguir con la busqueda
    if (result.rows.length === 0) {
        // Construimos la query para comenzar a generar consultas a la BD
        query = `
            SELECT *,
            ST_Y(ST_Centroid("SP_GEOMETRY")) AS y_centro,
            ST_X(ST_Centroid("SP_GEOMETRY")) AS x_centro
            FROM carto_colonia
            WHERE unaccent(colonia) LIKE '%' || $1 || '%'
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

            // Concatenar cada campo si tiene un valor
            resultado += `COL. `;
            if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
            if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
            if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
            if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

            // Asignar el resultado al campo "resultado"
            result.rows[i].resultado = resultado.trim();
            // Modificamos el tipo por uno controlado para el servicio del Front
            result.rows[i].tipo = `Colonia`;
            // Asignar el id_colonia al campo "id"
            result.rows[i].id = result.rows[i].id_colonia;
            // Asignar el campo por el que se puede identificar el id previo.
            result.rows[i].campo = `id_colonia`;
            // Asignar la imagen final que recibira dicha direccion
            result.rows[i].imagen = 'poligono';
            // Asignar la tabla de donde se obtuvo principalmente dicho registro
            result.rows[i].tabla = 'carto_colonia';
            // Dejamos en 0 cada uno de los ids que conforman la colonia por adaptabilidad con el Front
            result.rows[i].id_estado = 0;
            result.rows[i].id_municipio = 0;
            result.rows[i].id_region = 0;
            // Calificamos el registro recuperado segun los parametros coincididos
            result.rows[i].scoring = {
                fiability: 0,
                colonia: 0
            };
            const coloniaSinAcentos = recortarTipoVialidad(recortarTipoAsentamiento(quitarAcentos(result.rows[i].colonia)));
            // Calcular la distancia de Levenshtein
            const distanceColonia = levenshteinDistance(coloniaSinAcentos, recortarTipoVialidad(recortarTipoAsentamiento(direccionParsed.COLONIA)));
            // Calcular la similitud como el inverso de la distancia de Levenshtein
            const maxLengthColonia = Math.max(coloniaSinAcentos.length,recortarTipoVialidad(recortarTipoAsentamiento(direccionParsed.COLONIA)).length);
            // Calculamos la similitud de la colonia segun sus comparativos
            const similarityColonia = ((maxLengthColonia - distanceColonia) / maxLengthColonia) * 100;
            // Validamos que exista similitud alguna
            if (similarityColonia) {
                // Subimos el scoring en colonia
                result.rows[i].scoring.colonia += similarityColonia;
                // Subimos el scoring en fiability
                result.rows[i].scoring.fiability += (similarityColonia);
            }
        }
        // Añadimos los resultados obtenidos al arreglo rows
        rows = rows.concat(result.rows);
    }
    // Retornamos los rows que se obtuvieron hasta el momento
    return rows;
}
module.exports = alone;