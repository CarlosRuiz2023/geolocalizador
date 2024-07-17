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

  let level = 'SD';

  if(sortedResults.length!=0){
    level = determineLevel(sortedResults[0].scoring);
  }

  return { parse: direccionParsed,level, results: sortedResults };
};

// FUNCION QUE DETERMINA EL NIVEL AL QUE SE BUSCO MEDIANTE LOS ATRIBUTOS QUE CONFORMAN EL SCORING.
function determineLevel(result) {
  const { nombre_asentamiento=0, nombre_vialidad=0, calle=0, poi=0, numero_exterior=0, colonia=0, codigo_postal=0, municipio=0, estado=0} = result;

  if (calle!=0 || poi!=0 || nombre_asentamiento!=0 || nombre_vialidad!=0){
    if(municipio ===100 || estado ===100){
      if(numero_exterior!=0){
        if(colonia !=0 || codigo_postal ===100){
          return 'S1';
        }else{
          return 'S3';
        }
      }
      if(colonia !=0){
        return 'S4';
      }
      if(codigo_postal ===100){
        return 'S5';
      }
      return 'S6';
    }
  }
  if (colonia>0){
    if(municipio ===100 || estado ===100){
      return 'N1'
    };
  };
  if (codigo_postal===100){
    if(municipio ===100 || estado ===100){
      return 'C1'
    };
  }
  return 'SD';
}