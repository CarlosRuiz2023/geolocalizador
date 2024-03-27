const { all, sinNumeroExterior, sinCP, sinMunicipio, sinColonia, sinEstado, sinNumeroExteriorColonia, sinColoniaMunicipio, alone } = require("./vialidades");
const { all : all1, sinNumeroExterior: sinNumeroExterior1, sinCP:sinCP1, sinMunicipio:sinMunicipio1, sinColonia:sinColonia1, sinEstado:sinEstado1, sinNumeroExteriorColonia:sinNumeroExteriorColonia1, sinColoniaMunicipio:sinColoniaMunicipio1, alone:alone1 } = require("./asentamientos");
const { all : all2, sinNumeroExterior: sinNumeroExterior2, sinCP:sinCP2, sinMunicipio:sinMunicipio2, sinColonia:sinColonia2, sinEstado:sinEstado2, sinNumeroExteriorColonia:sinNumeroExteriorColonia2, sinColoniaMunicipio:sinColoniaMunicipio2, alone:alone2 } = require("./calles");

// Función para parsear la dirección según la Norma Técnica sobre Domicilios Geográficos
async function scoringMaestro(direccionParsed) {
    let results = [];
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
    if (results.length===0 && direccionParsed.TIPOASEN) {
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
    if (results.length===0 && direccionParsed.COLONIA) {
        if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await all2(direccionParsed);
        }
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
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.NUMEXTNUM1 && direccionParsed.ESTADO) {
            results=await sinColonia2(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinEstado2(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO ){
            results=await sinNumeroExteriorColonia2(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 ) {
            results=await sinColoniaMunicipio2(direccionParsed);
        }
        else {
            results=await alone2(direccionParsed);
        }
    }
    return results;
}
module.exports = scoringMaestro;