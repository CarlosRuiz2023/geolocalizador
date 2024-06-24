const {
  parseDireccion,
  capitalizeFirstLetter,
} = require("./src/controlador/funciones");
const scoringMaestro = require("./src/controlador/scoring");

module.exports = async ({ direccion, limit }) => {
  const direccionParsed = parseDireccion(direccion);
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

  return { parse: direccionParsed, results: sortedResults };
};
