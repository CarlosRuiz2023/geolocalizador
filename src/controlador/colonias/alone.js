const pgClient = require("../../data/conexion");
const { levenshteinDistance, quitarAcentos } = require("../funciones");

// Aplicable solo en caso de llevar todos los campos
async function alone(direccionParsed) {
    let query = '';
    let values = [];
    let rows = [];
    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
    query = `
        SELECT *,
        ST_Y(ST_Centroid("SP_GEOMETRY")) AS x_centro,
        ST_X(ST_Centroid("SP_GEOMETRY")) AS y_centro
        FROM carto_colonia
        WHERE unaccent(colonia) LIKE '%' || $1 || '%'
        ;
    `;
    values = [direccionParsed.COLONIA];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        // Inicializar la cadena de resultado
        let resultado = '';

        // Concatenar cada campo si tiene un valor
        if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
        if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
        if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
        if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

        // Asignar el resultado al campo "resultado"
        result.rows[i].resultado = resultado.trim();
        result.rows[i].tipo = `Colonia`;
        result.rows[i].id = result.rows[i].id_colonia;
        result.rows[i].campo = `Id`;
        result.rows[i].imagen = 'poligono';
        result.rows[i].tabla = 'carto_colonia';
        result.rows[i].scoring = {
            fiability: 0,
            colonia: 0
        };
        const nombreCalleSinAcentos = quitarAcentos(result.rows[i].colonia);
        const matchNombreCalle = nombreCalleSinAcentos.match(new RegExp(direccionParsed.COLONIA, 'i'));
        if (matchNombreCalle) {
            const matchedText = matchNombreCalle[0]; // Obtiene el texto coincidente
            let igualdad = matchedText.length * 100 / result.rows[i].colonia.length;
            if (igualdad > 100) igualdad = 100;
            result.rows[i].scoring.colonia += Math.round(igualdad);
            result.rows[i].scoring.fiability += Math.round(igualdad);
        }
    }
    rows = rows.concat(result.rows);
    if (result.rows.length === 0) {
        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
        query = `
            SELECT *,
            ST_Y(ST_Centroid("SP_GEOMETRY")) AS x_centro,
            ST_X(ST_Centroid("SP_GEOMETRY")) AS y_centro
            FROM carto_colonia
            WHERE unaccent(colonia) LIKE '%' || $1 || '%'
            ;
        `;
        values = ["_"];
        const result = await pgClient.query(query, values);
        for (let i = 0; i < result.rows.length; i++) {
            // Inicializar la cadena de resultado
            let resultado = '';

            // Concatenar cada campo si tiene un valor
            if (result.rows[i].colonia) resultado += `${result.rows[i].colonia} `;
            if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
            if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
            if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

            // Asignar el resultado al campo "resultado"
            result.rows[i].resultado = resultado.trim();
            result.rows[i].tipo = `Colonia`;
            result.rows[i].id = result.rows[i].id_colonia;
            result.rows[i].campo = `Id`;
            result.rows[i].imagen = 'poligono';
            result.rows[i].tabla = 'carto_colonia';
            result.rows[i].scoring = {
                fiability: 0,
                colonia: 0
            };
            // Calcular la distancia de Levenshtein
            const distanceColonia = levenshteinDistance(quitarAcentos(result.rows[i].colonia), direccionParsed.COLONIA);
            // Calcular la similitud como el inverso de la distancia de Levenshtein
            const maxLengthColonia = Math.max(result.rows[i].colonia.length, direccionParsed.COLONIA.length);
            const similarityColonia = ((maxLengthColonia - distanceColonia) / maxLengthColonia) * 100;
            if (similarityColonia) {
                result.rows[i].scoring.colonia += similarityColonia;
                result.rows[i].scoring.fiability += (similarityColonia);
            }
        }
        rows = rows.concat(result.rows);
    }
    return rows;
}
module.exports = alone;