const { all, sinNumeroExterior, sinCP, sinMunicipio, sinColonia, sinEstado, sinNumeroExteriorColonia, sinColoniaMunicipio, alone } = require("./vialidades");
const { all : all1, sinNumeroExterior: sinNumeroExterior1, sinCP:sinCP1, sinMunicipio:sinMunicipio1, sinColonia:sinColonia1, sinEstado:sinEstado1, sinNumeroExteriorColonia:sinNumeroExteriorColonia1, sinColoniaMunicipio:sinColoniaMunicipio1, alone:alone1 } = require("./asentamientos");
const { all : all2, sinNumeroExterior: sinNumeroExterior2, sinCP:sinCP2, sinMunicipio:sinMunicipio2, sinEstado:sinEstado2, sinColonia:sinColonia2, alone:alone2 } = require("./calles");
const { all : all3, sinNumeroExterior: sinNumeroExterior3, sinCP:sinCP3, sinMunicipio:sinMunicipio3, sinEstado:sinEstado3, sinColonia:sinColonia3, alone:alone3 } = require("./pois");

// Función para parsear la dirección según la Norma Técnica sobre Domicilios Geográficos
async function scoringMaestro(direccionParsed) {
    let results = [];
    let sortedResults = [];
    let maxResults = [];
    let fiability=0;
    if (direccionParsed.TIPOVIAL) {
        if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await all(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.COLONIA) {
            results=await sinNumeroExterior(direccionParsed);
        }
        else if (direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinCP(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinMunicipio(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.NUMEXTNUM1 && direccionParsed.ESTADO) {
            results=await sinColonia(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinEstado(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO ){
            results=await sinNumeroExteriorColonia(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 ) {
            results=await sinColoniaMunicipio(direccionParsed);
        }
        else {
            results=await alone(direccionParsed);
        }
    }
    if(results.length!==0){
        // Ordenar scoring mas alto primero
        sortedResults = results.sort((a, b) => b.scoring.fiability - a.scoring.fiability);
        // Recortar a solo 10 resultados
        sortedResults = sortedResults.slice(0, 5);
        fiability=sortedResults[0].scoring.fiability;
        maxResults = sortedResults;
    }
    if (direccionParsed.TIPOASEN) {
        if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await all1(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.COLONIA) {
            results=await sinNumeroExterior1(direccionParsed);
        }
        else if (direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinCP1(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinMunicipio1(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.NUMEXTNUM1 && direccionParsed.ESTADO) {
            results=await sinColonia1(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinEstado1(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO ){
            results=await sinNumeroExteriorColonia1(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 ) {
            results=await sinColoniaMunicipio1(direccionParsed);
        }
        else {
            results=await alone1(direccionParsed);
        }
    }
    if(results.length!==0){
        // Ordenar scoring mas alto primero
        sortedResults = results.sort((a, b) => b.scoring.fiability - a.scoring.fiability);
        // Recortar a solo 10 resultados
        sortedResults = sortedResults.slice(0, 5);
        if(fiability<sortedResults[0].scoring.fiability){
            fiability=sortedResults[0].scoring.fiability;
            maxResults = sortedResults;
        }
    }
    if (direccionParsed.CALLE) {
        if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await all2(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.COLONIA) {
            results=await sinNumeroExterior2(direccionParsed);
        }
        else if (direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinCP2(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinMunicipio2(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinEstado2(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1) {
            results=await sinColonia2(direccionParsed);
        }
        else {
            results=await alone2(direccionParsed);
        }
    }
    if(results.length!==0){
        // Ordenar scoring mas alto primero
        sortedResults = results.sort((a, b) => b.scoring.fiability - a.scoring.fiability);
        // Recortar a solo 10 resultados
        sortedResults = sortedResults.slice(0, 5);
        if(fiability<sortedResults[0].scoring.fiability){
            fiability=sortedResults[0].scoring.fiability;
            maxResults = sortedResults;
        }
    }
    if (direccionParsed.CALLE) {
        if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await all3(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.COLONIA) {
            results=await sinNumeroExterior3(direccionParsed);
        }
        else if (direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinCP3(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinMunicipio3(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinEstado3(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1) {
            results=await sinColonia3(direccionParsed);
        }
        else {
            results=await alone3(direccionParsed);
        }
    }
    if(results.length!==0){
        // Ordenar scoring mas alto primero
        sortedResults = results.sort((a, b) => b.scoring.fiability - a.scoring.fiability);
        // Recortar a solo 10 resultados
        sortedResults = sortedResults.slice(0, 5);
        if(fiability<sortedResults[0].scoring.fiability){
            fiability=sortedResults[0].scoring.fiability;
            maxResults = sortedResults;
        }
    }
    return maxResults;
}
module.exports = scoringMaestro;