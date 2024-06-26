// index.js

const all = require('./all');
const alone = require('./alone');
const municipioEstado = require('./municipioEstado');
const municipioNumeroExterior = require('./municipioNumeroExterior');
const numeroExterior = require('./numeroExterior');
const numeroExteriorColonia = require('./numeroExteriorColonia');
const sinCP = require('./sinCP');
const sinColonia = require('./sinColonia');
const sinColoniaCP = require('./sinColoniaCP');
const sinColoniaNumeroExterior = require('./sinColoniaNumeroExterior');
const sinEstado = require('./sinEstado');
const sinMunicipio = require('./sinMunicipio');
const sinNumeroExterior = require('./sinNumeroExterior');
const sinNumeroExteriorCP = require('./sinNumeroExteriorCP');

module.exports = {
    all,
    alone,
    sinCP,
    sinColonia,
    sinEstado,
    sinMunicipio,
    sinNumeroExterior,
    sinNumeroExteriorCP,
    sinColoniaCP,
    sinColoniaNumeroExterior,
    municipioNumeroExterior,
    municipioEstado,
    numeroExterior,
    numeroExteriorColonia
};
