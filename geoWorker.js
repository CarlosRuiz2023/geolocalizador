const {
  parseDireccion,
  capitalizeFirstLetter,
} = require("./src/controlador/funciones");
const scoringMaestro = require("./src/controlador/scoring");

module.exports = async ({ direccion, limit }) => {
  const direccionParsed = await parseDireccion(direccion);
  const results = await scoringMaestro(direccionParsed);
  let sortedResults = results.sort(
    (a, b) => b.scoring.fiability - a.scoring.fiability
  );

  let resultadosUnicos = {};
  if (!results[0]?.scoring.numero_exterior) {
    sortedResults = sortedResults.filter((result) => {
      if (!resultadosUnicos[result.resultado]) {
        resultadosUnicos[result.resultado] = true;
        return true;
      }
      return false;
    });
  }

  sortedResults.forEach((result) => {
    if (result.hasOwnProperty("resultado")) {
      result["resultado"] = capitalizeFirstLetter(result["resultado"]);
    }
  });

  sortedResults = sortedResults.slice(0, limit);

  const level = determineLevel(sortedResults[0]);

  return { parse: direccionParsed,level, results: sortedResults };
};

// FUNCION QUE DETERMINA EL NIVEL AL QUE SE BUSCO MEDIANTE LOS ATRIBUTOS QUE CONFORMAN EL SCORING.
function determineLevel(result) {
  const { poi, scoring } = result;
  const { tipo_asentamiento, tipo_vialidad, calle, colonia, codigo_postal} = scoring;

  if (tipo_asentamiento) return 'S1';
  if (tipo_vialidad) return 'S2';
  if (poi!=='') return 'S4';
  if (calle) return 'S3';
  if (colonia) return 'N1';
  if (codigo_postal) return 'C1';
  return 'SD';
}