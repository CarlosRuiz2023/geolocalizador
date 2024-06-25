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

  const level = determineLevel(sortedResults[0].scoring);

  return { parse: direccionParsed,level, results: sortedResults };
};

function determineLevel(scoring) {
  const { tipo_asentamiento = null, tipo_vialidad = null, calle = null, numero_exterior = null, colonia = null, codigo_postal = null, municipio = null, estado = null } = scoring;

  if (calle && numero_exterior && colonia && codigo_postal && municipio && estado) {
      if (tipo_asentamiento) return 'S1';
      if (tipo_vialidad) return 'S2';
      return 'S3';
  }
  if (calle && numero_exterior && colonia && municipio && estado) return 'S4';
  if (calle && colonia && codigo_postal && municipio && estado) return 'S5';
  if (calle && municipio && estado) return 'S6';
  if (colonia && municipio && estado) return 'N1';
  if (colonia && municipio) return 'N2';
  if (colonia && estado) return 'N3';
  if (codigo_postal && municipio && estado) return 'C1';
  if (codigo_postal && municipio) return 'C2';
  if (codigo_postal && estado) return 'C3';
  return 'SD';
}