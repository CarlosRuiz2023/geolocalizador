const pgClient = require("../../data/conexion");

// Aplicable solo en caso de llevar todos los campos
async function sinEstado(direccionParsed) {
    let query = '';
    let values = [];
    let rows = [];
    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
    query = `
        SELECT *,
        ST_Y(ST_Centroid("SP_GEOMETRY")) AS x_centro,
        ST_X(ST_Centroid("SP_GEOMETRY")) AS y_centro
        FROM carto_codigo_postal
        WHERE codigo_postal = $1
        AND unaccent(municipio) = $2
        ;
    `;
    values = [direccionParsed.CP, direccionParsed.MUNICIPIO];
    const result = await pgClient.query(query, values);
    for (let i = 0; i < result.rows.length; i++) {
        // Inicializar la cadena de resultado
        let resultado = '';

        // Concatenar cada campo si tiene un valor
        resultado += `CP. `;
        if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
        if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
        if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

        // Asignar el resultado al campo "resultado"
        result.rows[i].resultado = resultado.trim();
        result.rows[i].tipo = `Codigo Postal`;
        result.rows[i].id = result.rows[i].id_codigo_postal;
        result.rows[i].campo = `id_codigo_postal`;
        result.rows[i].imagen = 'poligono';
        result.rows[i].tabla = 'carto_codigo_postal';
        result.rows[i].id_estado = 0;
        result.rows[i].id_municipio = 0;
        result.rows[i].id_region = 0;
        result.rows[i].scoring = {
            fiability: 100,
            codigo_postal: 100,
            municipio: 100
        };
    }
    rows = rows.concat(result.rows);
    if (result.rows.length === 0) {
        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
        query = `
            SELECT *,
            ST_Y(ST_Centroid("SP_GEOMETRY")) AS x_centro,
            ST_X(ST_Centroid("SP_GEOMETRY")) AS y_centro
            FROM carto_codigo_postal
            WHERE codigo_postal = $1
            ;
        `;
        values = [direccionParsed.CP];
        const result = await pgClient.query(query, values);
        for (let i = 0; i < result.rows.length; i++) {
            // Inicializar la cadena de resultado
            let resultado = '';

            // Concatenar cada campo si tiene un valor
            resultado += `CP. `;
            if (result.rows[i].codigo_postal) resultado += `${result.rows[i].codigo_postal} `;
            if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
            if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

            // Asignar el resultado al campo "resultado"
            result.rows[i].resultado = resultado.trim();
            result.rows[i].tipo = `Codigo Postal`;
            result.rows[i].id = result.rows[i].id_codigo_postal;
            result.rows[i].campo = `id_codigo_postal`;
            result.rows[i].imagen = 'poligono';
            result.rows[i].tabla = 'carto_codigo_postal';
            result.rows[i].id_estado = 0;
            result.rows[i].id_municipio = 0;
            result.rows[i].id_region = 0; result.rows[i].scoring = {
                fiability: 50,
                codigo_postal: 100,
                municipio: 0
            };
        }
        rows = rows.concat(result.rows);
    }
    return rows;
}
module.exports = sinEstado;