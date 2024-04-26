const { all: all_Vialidad, sinNumeroExterior : sinNumeroExterior_Vialidad, sinCP : sinCP_Vialidad, sinMunicipio : sinMunicipio_Vialidad, sinColonia : sinColonia_Vialidad, sinEstado : sinEstado_Vialidad, alone : alone_Vialidad, sinNumeroExteriorCP : sinNumeroExteriorCP_Vialidad, sinColoniaCP : sinColoniaCP_Vialidad, sinColoniaNumeroExterior : sinColoniaNumeroExterior_Vialidad, municipioNumeroExterior: municipioNumeroExterior_Vialidad, municipioEstado: municipioEstado_Vialidad, numeroExterior:numeroExterior_Vialidad, numeroExteriorColonia:numeroExteriorColonia_Vialidad } = require("./vialidades");
const { all : all_Asentamiento, sinNumeroExterior: sinNumeroExterior_Asentamiento, sinCP:sinCP_Asentamiento, sinMunicipio:sinMunicipio_Asentamiento, sinEstado:sinEstado_Asentamiento, sinColonia:sinColonia_Asentamiento, alone:alone_Asentamiento, sinNumeroExteriorCP:sinNumeroExteriorCP_Asentamiento, sinColoniaCP:sinColoniaCP_Asentamiento, sinColoniaNumeroExterior:sinColoniaNumeroExterior_Asentamiento, municipioNumeroExterior: municipioNumeroExterior_Asentamiento, municipioEstado: municipioEstado_Asentamiento, numeroExterior:numeroExterior_Asentamiento, numeroExteriorColonia:numeroExteriorColonia_Asentamiento } = require("./asentamientos");
const { all : all_Calle, sinNumeroExterior: sinNumeroExterior_Calle, sinCP:sinCP_Calle, sinMunicipio:sinMunicipio_Calle, sinEstado:sinEstado_Calle, sinColonia:sinColonia_Calle, alone:alone_Calle, sinNumeroExteriorCP:sinNumeroExteriorCP_Calle, sinColoniaCP:sinColoniaCP_Calle, sinColoniaNumeroExterior:sinColoniaNumeroExterior_Calle, municipioNumeroExterior: municipioNumeroExterior_Calle, municipioEstado: municipioEstado_Calle, numeroExterior:numeroExterior_Calle, numeroExteriorColonia:numeroExteriorColonia_Calle } = require("./calles");
const { all : all_Poi, sinNumeroExterior: sinNumeroExterior_Poi, sinCP:sinCP_Poi, sinMunicipio:sinMunicipio_Poi, sinEstado:sinEstado_Poi, sinColonia:sinColonia_Poi, alone:alone_Poi, sinNumeroExteriorCP:sinNumeroExteriorCP_Poi, sinColoniaCP:sinColoniaCP_Poi, sinColoniaNumeroExterior:sinColoniaNumeroExterior_Poi, municipioNumeroExterior: municipioNumeroExterior_Poi, municipioEstado: municipioEstado_Poi, numeroExterior:numeroExterior_Poi, numeroExteriorColonia:numeroExteriorColonia_Poi } = require("./pois");
const { all: all_Colonia, alone: alone_Colonia, sinCP: sinCP_Colonia, sinEstado: sinEstado_Colonia, sinMunicipio: sinMunicipio_Colonia, sinCPEstado: sinCPEstado_Colonia } = require("./colonias");
const { all: all_CP, alone: alone_CP, sinEstado: sinEstado_CP, sinMunicipio: sinMunicipio_CP } = require("./cps");

// Función para parsear la dirección según la Norma Técnica sobre Domicilios Geográficos
async function scoringMaestro(direccionParsed) {
    let results = [];
    let sortedResults = [];
    if (direccionParsed.TIPOVIAL) {
        if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await all_Vialidad(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.COLONIA) {
            results=await sinNumeroExterior_Vialidad(direccionParsed);
        }
        else if (direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinCP_Vialidad(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinMunicipio_Vialidad(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.NUMEXTNUM1 && direccionParsed.ESTADO) {
            results=await sinColonia_Vialidad(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinEstado_Vialidad(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.MUNICIPIO) {
            results=await sinColoniaCP_Vialidad(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.CP && direccionParsed.MUNICIPIO) {
            results=await sinColoniaNumeroExterior_Vialidad(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.MUNICIPIO && direccionParsed.COLONIA) {
            results=await sinNumeroExteriorCP_Vialidad(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.MUNICIPIO) {
            results=await municipioEstado_Vialidad(direccionParsed);
        }
        else if (direccionParsed.COLONIA && direccionParsed.NUMEXTNUM1) {
            results=await numeroExteriorColonia_Vialidad(direccionParsed);
        }
        else if (direccionParsed.MUNICIPIO && direccionParsed.NUMEXTNUM1) {
            results=await municipioNumeroExterior_Vialidad(direccionParsed);
        }
        else if (ireccionParsed.NUMEXTNUM1) {
            results=await numeroExterior_Vialidad(direccionParsed);
        }
        else {
            results=await alone_Vialidad(direccionParsed);
        }
    }
    if(results.length!==0){
        return results;
    }
    if (direccionParsed.TIPOASEN) {
        if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await all_Asentamiento(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.COLONIA) {
            results=await sinNumeroExterior_Asentamiento(direccionParsed);
        }
        else if (direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinCP_Asentamiento(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinMunicipio_Asentamiento(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.NUMEXTNUM1 && direccionParsed.ESTADO) {
            results=await sinColonia_Asentamiento(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinEstado_Asentamiento(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.MUNICIPIO) {
            results=await sinColoniaCP_Asentamiento(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.CP && direccionParsed.MUNICIPIO) {
            results=await sinColoniaNumeroExterior_Asentamiento(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.MUNICIPIO && direccionParsed.COLONIA) {
            results=await sinNumeroExteriorCP_Asentamiento(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.MUNICIPIO) {
            results=await municipioEstado_Asentamiento(direccionParsed);
        }
        else if (direccionParsed.COLONIA && direccionParsed.NUMEXTNUM1) {
            results=await numeroExteriorColonia_Asentamiento(direccionParsed);
        }
        else if (direccionParsed.MUNICIPIO && direccionParsed.NUMEXTNUM1) {
            results=await municipioNumeroExterior_Asentamiento(direccionParsed);
        }
        else if (direccionParsed.NUMEXTNUM1) {
            results=await numeroExterior_Asentamiento(direccionParsed);
        }
        else {
            results=await alone_Asentamiento(direccionParsed);
        }
    }
    if(results.length!==0){
        return results;
    }
    if (direccionParsed.CALLE) {
        if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await all_Poi(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.COLONIA) {
            results=await sinNumeroExterior_Poi(direccionParsed);
        }
        else if (direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinCP_Poi(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinMunicipio_Poi(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinEstado_Poi(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1) {
            results=await sinColonia_Poi(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.MUNICIPIO) {
            results=await sinColoniaCP_Poi(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.CP && direccionParsed.MUNICIPIO) {
            results=await sinColoniaNumeroExterior_Poi(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.MUNICIPIO && direccionParsed.COLONIA) {
            results=await sinNumeroExteriorCP_Poi(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.MUNICIPIO) {
            results=await municipioEstado_Poi(direccionParsed);
        }
        else if (direccionParsed.COLONIA && direccionParsed.NUMEXTNUM1) {
            results=await numeroExteriorColonia_Poi(direccionParsed);
        }
        else if (direccionParsed.MUNICIPIO && direccionParsed.NUMEXTNUM1) {
            results=await municipioNumeroExterior_Poi(direccionParsed);
        }
        else if (direccionParsed.NUMEXTNUM1) {
            results=await numeroExterior_Poi(direccionParsed);
        }
        else {
            results=await alone_Poi(direccionParsed);
        }
        // Ordenar scoring mas alto primero
        sortedResults = results.sort((a, b) => b.scoring.fiability - a.scoring.fiability);
    }
    if(results.length!==0 && sortedResults[0].scoring.fiability>80){
        return results;
    }
    if (direccionParsed.CALLE) {
        if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await all_Calle(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.COLONIA) {
            results=await sinNumeroExterior_Calle(direccionParsed);
        }
        else if (direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinCP_Calle(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinMunicipio_Calle(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.NUMEXTNUM1 && direccionParsed.COLONIA) {
            results=await sinEstado_Calle(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1) {
            results=await sinColonia_Calle(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1 && direccionParsed.MUNICIPIO) {
            results=await sinColoniaCP_Calle(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.CP && direccionParsed.MUNICIPIO) {
            results=await sinColoniaNumeroExterior_Calle(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.MUNICIPIO && direccionParsed.COLONIA) {
            results=await sinNumeroExteriorCP_Calle(direccionParsed);
        }
        else if (direccionParsed.ESTADO && direccionParsed.MUNICIPIO) {
            results=await municipioEstado_Calle(direccionParsed);
        }
        else if (direccionParsed.COLONIA && direccionParsed.NUMEXTNUM1) {
            results=await numeroExteriorColonia_Calle(direccionParsed);
        }
        else if (direccionParsed.MUNICIPIO && direccionParsed.NUMEXTNUM1) {
            results=await municipioNumeroExterior_Calle(direccionParsed);
        }
        else if (direccionParsed.NUMEXTNUM1) {
            results=await numeroExterior_Calle(direccionParsed);
        }
        else {
            results=await alone_Calle(direccionParsed);
        }
    }
    if(results.length!==0){
        return results;
    }
    if (direccionParsed.COLONIA && !direccionParsed.CALLE) {
        if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO) {
            results=await all_Colonia(direccionParsed);
        }
        else if (direccionParsed.MUNICIPIO && direccionParsed.ESTADO) {
            results=await sinCP_Colonia(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO) {
            results=await sinEstado_Colonia(direccionParsed);
        }
        else if (direccionParsed.CP && direccionParsed.ESTADO) {
            results=await sinMunicipio_Colonia(direccionParsed);
        }
        else if (direccionParsed.MUNICIPIO) {
            results=await sinCPEstado_Colonia(direccionParsed);
        }
        else {
            results=await alone_Colonia(direccionParsed);
        }
    }
    if(results.length!==0){
        return results;
    }
    if (direccionParsed.CP && !direccionParsed.CALLE && !direccionParsed.COLONIA) {
        if (direccionParsed.MUNICIPIO && direccionParsed.ESTADO) {
            results=await all_CP(direccionParsed);
        }
        else if (direccionParsed.MUNICIPIO) {
            results=await sinEstado_CP(direccionParsed);
        }
        else if (direccionParsed.ESTADO) {
            results=await sinMunicipio_CP(direccionParsed);
        }
        else {
            results=await alone_CP(direccionParsed);
        }
    }
    return results;
}
module.exports = scoringMaestro;