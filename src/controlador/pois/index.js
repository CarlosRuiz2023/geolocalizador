// index.js

const all = require('./all');
const alone = require('./alone');
const municipioNumeroExterior = require('./municipioNumeroExterior');
const sinCP = require('./sinCP');
const sinColonia = require('./sinColonia');
const sinColoniaCP = require('./sinColoniaCP');
const sinColoniaNumeroExterior = require('./sinColoniaNumeroExterior');
const sinEstado = require('./sinEstado');
const sinMunicipio = require('./sinMunicipio');
const sinNumeroExterior = require('./sinNumeroExterior');
const sinNumeroExteriorCP = require('./sinNumeroExteriorCP');
const sinNumeroExteriorCPColonia = require('./sinNumeroExteriorCPColonia');
const municipioEstado = require('./municipioEstado');

module.exports = {
    all,
    alone,
    sinCP,
    sinColonia,
    sinEstado,
    sinMunicipio,
    sinNumeroExterior,
    sinNumeroExteriorCP,
    sinNumeroExteriorCPColonia,
    sinColoniaCP,
    sinColoniaNumeroExterior,
    municipioNumeroExterior,
    municipioEstado
};
