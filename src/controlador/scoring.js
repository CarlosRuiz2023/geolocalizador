const { all, sinNumeroExterior, sinCP, sinMunicipio, sinColonia, sinEstado, alone, sinNumeroExteriorCP, sinNumeroExteriorCPColonia, sinColoniaCP, sinColoniaNumeroExterior } = require("./vialidades");
const { all : all1, sinNumeroExterior: sinNumeroExterior1, sinCP:sinCP1, sinMunicipio:sinMunicipio1, sinEstado:sinEstado1, sinColonia:sinColonia1, alone:alone1, sinNumeroExteriorCP:sinNumeroExteriorCP1, sinNumeroExteriorCPColonia:sinNumeroExteriorCPColonia1, sinColoniaCP:sinColoniaCP1, sinColoniaNumeroExterior:sinColoniaNumeroExterior1 } = require("./asentamientos");
const { all : all2, sinNumeroExterior: sinNumeroExterior2, sinCP:sinCP2, sinMunicipio:sinMunicipio2, sinEstado:sinEstado2, sinColonia:sinColonia2, alone:alone2, sinNumeroExteriorCP:sinNumeroExteriorCP2, sinNumeroExteriorCPColonia:sinNumeroExteriorCPColonia2, sinColoniaCP:sinColoniaCP2, sinColoniaNumeroExterior:sinColoniaNumeroExterior2 } = require("./calles");
const { all : all3, sinNumeroExterior: sinNumeroExterior3, sinCP:sinCP3, sinMunicipio:sinMunicipio3, sinEstado:sinEstado3, sinColonia:sinColonia3, alone:alone3, sinNumeroExteriorCP:sinNumeroExteriorCP3, sinNumeroExteriorCPColonia:sinNumeroExteriorCPColonia3, sinColoniaCP:sinColoniaCP3, sinColoniaNumeroExterior:sinColoniaNumeroExterior3 } = require("./pois");
const { all: all4, alone: alone4, sinCP: sinCP4, sinEstado: sinEstado4, sinMunicipio: sinMunicipio4, sinCPEstado: sinCPEstado4 } = require("./colonias");
const { all: all5, alone: alone5, sinEstado: sinEstado5, sinMunicipio: sinMunicipio5 } = require("./cps");

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
        else if (direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.MUNICIPIO) {
            results=await sinColoniaCP(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.CP && direccionParsed.MUNICIPIO) {
            results=await sinColoniaNumeroExterior(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.MUNICIPIO && direccionParsed.COLONIA) {
            results=await sinNumeroExteriorCP(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.MUNICIPIO) {
            results=await sinNumeroExteriorCPColonia(direccionParsed);
        }
        else {
            results=await alone(direccionParsed);
        }
    }
    if(results.length!==0){
        return results;
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
        else if (direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.MUNICIPIO) {
            results=await sinColoniaCP1(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.CP && direccionParsed.MUNICIPIO) {
            results=await sinColoniaNumeroExterior1(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.MUNICIPIO && direccionParsed.COLONIA) {
            results=await sinNumeroExteriorCP1(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.MUNICIPIO) {
            results=await sinNumeroExteriorCPColonia1(direccionParsed);
        }
        else {
            results=await alone1(direccionParsed);
        }
    }
    if(results.length!==0){
        return results;
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
        else if (direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.MUNICIPIO) {
            results=await sinColoniaCP2(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.CP && direccionParsed.MUNICIPIO) {
            results=await sinColoniaNumeroExterior2(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.MUNICIPIO && direccionParsed.COLONIA) {
            results=await sinNumeroExteriorCP2(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.MUNICIPIO) {
            results=await sinNumeroExteriorCPColonia2(direccionParsed);
        }
        else {
            results=await alone2(direccionParsed);
        }
    }
    if(results.length!==0){
        return results;
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
        else if (direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.MUNICIPIO) {
            results=await sinColoniaCP2(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.CP && direccionParsed.MUNICIPIO) {
            results=await sinColoniaNumeroExterior2(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.MUNICIPIO && direccionParsed.COLONIA) {
            results=await sinNumeroExteriorCP3(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.MUNICIPIO) {
            results=await sinNumeroExteriorCPColonia3(direccionParsed);
        }
        else {
            results=await alone3(direccionParsed);
        }
    }
    if(results.length!==0){
        return results;
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
        else if (direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.MUNICIPIO) {
            results=await sinColoniaCP2(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.CP && direccionParsed.MUNICIPIO) {
            results=await sinColoniaNumeroExterior2(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.MUNICIPIO && direccionParsed.COLONIA) {
            results=await sinNumeroExteriorCP3(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.MUNICIPIO) {
            results=await sinNumeroExteriorCPColonia3(direccionParsed);
        }
        else {
            results=await alone3(direccionParsed);
        }
    }
    if(results.length!==0){
        return results;
    }
    if (direccionParsed.COLONIA && !direccionParsed.CALLE) {
        if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO) {
            results=await all4(direccionParsed);
        }
        else if (direccionParsed.MUNICIPIO && direccionParsed.ESTADO) {
            results=await sinCP4(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO) {
            results=await sinEstado4(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.ESTADO) {
            results=await sinMunicipio4(direccionParsed);
        }
        else if (direccionParsed.MUNICIPIO) {
            results=await sinCPEstado4(direccionParsed);
        }
        else {
            results=await alone4(direccionParsed);
        }
    }
    if(results.length!==0){
        return results;
    }
    if (direccionParsed.CP && !direccionParsed.CALLE && !direccionParsed.COLONIA) {
        if (direccionParsed.MUNICIPIO && direccionParsed.ESTADO) {
            results=await all5(direccionParsed);
        }
        else if (direccionParsed.MUNICIPIO) {
            results=await sinEstado5(direccionParsed);
        }
        else if (direccionParsed.ESTADO) {
            results=await sinMunicipio5(direccionParsed);
        }
        else {
            results=await alone5(direccionParsed);
        }
    }
    return results;
}
module.exports = scoringMaestro;