const pgClient = require("../../data/conexion");

// Aplicable solo en caso de llevar todos los campos
async function all(direccionParsed) {
  // Declaramos un valor nulo para la query de tipo String
  let query = "";
  // Generamos un arreglo para los valores que suplantaran "$X" en la query
  let values = [];
  // Generamos un arreglo para guardar los resultados obtenidos de la BD
  let rows = [];
  // Construimos la query para comenzar a generar consultas a la BD
  query = `
        SELECT *,
        ST_Y(ST_Centroid("SP_GEOMETRY")) AS y_centro,
        ST_X(ST_Centroid("SP_GEOMETRY")) AS x_centro
        FROM carto_municipio
        WHERE upper(unaccent(municipio)) = $1
        ;
    `;
  // Almacenamos en el arreglo values los campos que seran usados en la consulta
  values = [direccionParsed.MUNICIPIO];
  // Guardamos en una constante el resultado obtenido
  const result = await pgClient.query(query, values);
  // Creamos ciclo for el cual recorrera cada uno de los resultados obtenidos
  for (let i = 0; i < result.rows.length; i++) {
    // Inicializar la cadena de resultado
    let resultado = "";

    // Concatenar cada campo si tiene un valor
    resultado += `MUN. `;
    if (result.rows[i].municipio) resultado += `${result.rows[i].municipio} `;
    if (result.rows[i].estado) resultado += `${result.rows[i].estado} `;

    // Asignar el resultado al campo "resultado"
    result.rows[i].resultado = resultado.trim();
    // Modificamos el tipo por uno controlado para el servicio del Front
    result.rows[i].tipo = `Municipio`;
    // Asignar el id_codigo_postal al campo "id"
    result.rows[i].id = result.rows[i].id_municipio;
    // Asignar el campo por el que se puede identificar el id previo.
    result.rows[i].campo = `id_municipio`;
    // Asignar la imagen final que recibira dicha direccion
    result.rows[i].imagen = "poligono";
    // Asignar la tabla de donde se obtuvo principalmente dicho registro
    result.rows[i].tabla = "carto_municipio";
    // Dejamos en 0 cada uno de los ids que conforman el codigo_postal por adaptabilidad con el Front
    result.rows[i].id_estado = 0;
    //result.rows[i].id_municipio = 0;
    // Calificamos el registro recuperado segun los parametros coincididosresult.rows[i].id_region = 0;
    result.rows[i].scoring = {
      fiability: 50,
      municipio: 100,
      estado: 0,
    };
  }
  // Añadimos los resultados obtenidos al arreglo rows
  rows = rows.concat(result.rows);
  // Retornamos los rows que se obtuvieron hasta el momento
  return rows;
}
module.exports = all;
