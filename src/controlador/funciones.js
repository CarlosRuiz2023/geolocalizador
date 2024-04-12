//const municipiosEstado = require("../data/municipios.json");
const tiposAsentamiento = require("../data/tipoAsentamiento");
const tiposVialidad = require("../data/tipoVialidad");
const diccionarioAbreviaciones = require("../data/diccionarioAbreviaciones.json");
const obtenerEstadosPromise = require("../data/estados1");
const obtenerMunicipiosPromise = require("../data/municipios1");

let estados = [];
let municipiosEstado;
// Función para manejar la importación de estados
async function importaciones() {
    try {
        // Espera a que se resuelva la promesa que obtiene los estados
        estados = await obtenerEstadosPromise;
        // Espera a que se resuelva la promesa que obtiene los municipios
        municipiosEstado = await obtenerMunicipiosPromise;
    } catch (error) {
        // Maneja cualquier error que ocurra
        console.error('Error al importar los estados:', error);
    }
}

// Llamas a la función para importar los estados y municipios
importaciones();

// Función para parsear la dirección según la Norma Técnica sobre Domicilios Geográficos
function parseDireccion(direccion) {
    let direccionExpandida = expandirAbreviaciones(limpiarBusqueda(direccion.toUpperCase()));
    const componentesDireccion = direccionExpandida.trim().split(' ');
    const direccionParsed = {};
    let estado = '';
    let municipio = '';
    let colonia = '';
    let calle = '';
    let numExterior = '';
    let activo = true;
    let coloniaEscondida = true;
    let cont = 0;
    let cont2 = 0;

    // Buscar el estado
    estado = obtenerEstado(componentesDireccion);
    if (estado) {
        direccionParsed.ESTADO = estado;
    }
    for (let i = 0; i < componentesDireccion.length; i++) {
        const componente = componentesDireccion[i].trim();

        // Buscar el tipo de vialidad
        const tipoVialidad = obtenerTipoVialidad(componente);
        if (tipoVialidad && !direccionParsed.CALLE && !direccionParsed.TIPOVIAL) {
            direccionParsed.TIPOVIAL = tipoVialidad;
            calle = componente.replace(tipoVialidad, '').trim();
            i++;
            while (i < componentesDireccion.length && (!obtenerNumeroExterior(componentesDireccion[i]) || i === 1) && !obtenerCodigoPostal(componentesDireccion[i]) && !obtenerMunicipio(estado, componentesDireccion, i)) {
                calle += ' ' + componentesDireccion[i];
                i++;
            }
            i--;
            direccionParsed.NOMVIAL = calle.trim();
            activo = false;
        }

        // Buscar el número exterior
        const numeroExterior = obtenerNumeroExterior(componente);
        if (numeroExterior && (direccionParsed.CALLE || direccionParsed.NOMASEN || direccionParsed.NOMVIAL) && !direccionParsed.NUMEXTNUM1) {
            if (numeroExterior !== 'No se ha especificado un número exterior') {
                direccionParsed.NUMEXTNUM1 = numeroExterior.split(' ')[0];
                direccionParsed.NUMEXTALF1 = numeroExterior.split(' ')[1] || '';
            }
            activo = false;
        }

        // Buscar el código postal
        const codigoPostal = obtenerCodigoPostal(componente);
        if (codigoPostal) {
            direccionParsed.CP = codigoPostal;
            activo = false;
        }

        // Buscar el tipo de asentamiento humano
        const tipoAsentamiento = obtenerTipoAsentamiento(componente);
        if (tipoAsentamiento && !direccionParsed.CALLE && !direccionParsed.TIPOASEN && !direccionParsed.TIPOVIAL) {
            direccionParsed.TIPOASEN = tipoAsentamiento;
            calle = componente.replace(tipoAsentamiento, '').trim();
            i++;
            while (i < componentesDireccion.length && !obtenerNumeroExterior(componentesDireccion[i]) && !obtenerCodigoPostal(componentesDireccion[i]) && !obtenerMunicipio(estado, componentesDireccion, i)) {
                calle += ' ' + componentesDireccion[i];
                i++;
            }
            i--;
            direccionParsed.NOMASEN = calle.trim();
            activo = false;
        }

        // Buscar el municipio
        if (!municipio && activo) {
            municipio = obtenerMunicipio(estado, componentesDireccion, i);
            if (municipio) {
                direccionParsed.MUNICIPIO = municipio;
                activo = false;
            }
        }

        if (activo && coloniaEscondida) {
            if (!direccionParsed.CALLE && !direccionParsed.TIPOVIAL && !direccionParsed.TIPOASEN) {
                if (componente === 'COLONIA') {
                    direccionParsed.CALLE = '_';
                    coloniaEscondida = false;
                } else {
                    if (componente === 'C' || componente === 'C.') {
                        direccionParsed.TIPOVIAL = 'CALLE';
                        i++;
                        while (i < componentesDireccion.length && (!obtenerNumeroExterior(componentesDireccion[i]) || i === 1) && !obtenerCodigoPostal(componentesDireccion[i]) && !obtenerMunicipio(estado, componentesDireccion, i)) {
                            calle += ' ' + componentesDireccion[i];
                            i++;
                        }
                        direccionParsed.NOMVIAL = calle.trim();
                        activo = false;
                    } else {
                        cont = i;
                        direccionParsed.CALLE = componente;
                        activo = false;
                    }
                }
            } else if (direccionParsed.CALLE && cont === i - 1 && direccionParsed.CALLE !== ' ' && componente !== 'COLONIA') {
                cont = i;
                direccionParsed.CALLE += ' ' + componente;
                activo = false;
            }
        }
        if (activo && !direccionParsed.MUNICIPIO && !obtenerNumeroExterior(componente)) {
            if (!direccionParsed.COLONIA) {
                cont2 = i;
                if (componente !== 'COLONIA' && componente !== 'A' && componente !== 'B' && componente !== 'C' && componente !== 'D' && componente !== 'E' && componente !== 'F') {
                    direccionParsed.COLONIA = componente;
                }
            } else if (direccionParsed.COLONIA && cont2 === i - 1) {
                cont2 = i;
                direccionParsed.COLONIA += ' ' + componente;
            }
        }
        activo = true;
    }
    if (!direccionParsed.CALLE) {
        if (direccionParsed.NOMASEN) {
            direccionParsed.CALLE = direccionParsed.NOMASEN
        }
        else {
            direccionParsed.CALLE = direccionParsed.NOMVIAL
        }
    }
    if (direccionParsed.COLONIA) direccionParsed.COLONIA = direccionParsed.COLONIA.replace("  ", " ");
    if (direccionParsed.CALLE) direccionParsed.CALLE = direccionParsed.CALLE.replace("  ", " ");
    if (direccionParsed.NOMVIAL) direccionParsed.NOMVIAL = direccionParsed.NOMVIAL.replace("  ", " ");
    if (direccionParsed.NOMASEN) direccionParsed.NOMASEN = direccionParsed.NOMASEN.replace("  ", " ");

    return direccionParsed;
}

// Función auxiliar para obtener el tipo de vialidad
function obtenerTipoVialidad(componente) {
    for (const tipoVialidad of tiposVialidad) {
        if (componente.toUpperCase().startsWith(tipoVialidad)) {
            return tipoVialidad;
        }
    }
    return null;
}

// Función auxiliar para obtener el número exterior
function obtenerNumeroExterior(componente) {
    // Expresión regular para detectar números exteriores como "123A"
    const numeroExteriorRegex = /\b(?!(\d{5})$)(\d+)\s*([A-Z])?\b/;
    const match = componente.match(numeroExteriorRegex);
    if (match) {
        const [numCompleto, , numExtNum, numExtAlf] = match;
        if (numExtNum.length >= 5) return null;
        return `${numExtNum} ${numExtAlf || ''}`.trim();
    } else {
        // Expresión regular para detectar números exteriores como "M14"
        const numeroExteriorRegex = /\b(?:[0-9]+[a-zA-Z]?|[a-zA-Z][0-9]+)\b/;
        const match = componente.match(numeroExteriorRegex);
        if (match) {
            const numExterior = match[0].replace(/[A-Z]$/, '').replace(/^[A-Z]/, '').trim();
            if (numExterior.length >= 5) return null;
            return numExterior;
        } else if (componente === "S/N") {
            return "No se ha especificado un número exterior";
        } else {
            // Expresión regular para detectar números exteriores como "E9I303"
            const numeroExteriorRegex = /\b(?:[a-zA-Z]*\d+[a-zA-Z]*(\d{3,}))\b/;
            const match = componente.match(numeroExteriorRegex);
            if (match) {
                // Obtenemos el último grupo de dígitos consecutivos de 3 o más caracteres
                const numExterior = match[1].trim();
                if (numExterior.length >= 5) return null;
                return numExterior;
            }
        }
    }
    const numeroExteriorRegex1 = /^INT\s?\d+$/;
    if (numeroExteriorRegex1.test(componente)) {
        return componente.replace('INT', '');
    }
    return null;
}
// Función auxiliar para obtener el tipo de asentamiento humano
function obtenerTipoAsentamiento(componente) {
    for (const tipoAsentamiento of tiposAsentamiento) {
        if (componente.toUpperCase() === tipoAsentamiento) {
            return tipoAsentamiento;
        }
    }
    return null;
}
// Función auxiliar para obtener el código postal
function obtenerCodigoPostal(componente) {
    const codigoPostalRegex = /\b\d{5}\b/;
    const match = componente.match(codigoPostalRegex);
    if (match) {
        return match[0];
    }
    return null;
}
// Función auxiliar para obtener el tipo de asentamiento humano
function obtenerEstado(componentesDireccion) {
    let estadoEncontrado = '';
    estadoEncontrado = componentesDireccion[componentesDireccion.length - 1];
    for (const estado of estados) {
        if (estadoEncontrado === estado) {
            return estado;
        }
    }
    estadoEncontrado = componentesDireccion[componentesDireccion.length - 2] + ' ' + componentesDireccion[componentesDireccion.length - 1];
    for (const estado of estados) {
        if (estadoEncontrado === estado) {
            return estado;
        }
    }
    estadoEncontrado = componentesDireccion[componentesDireccion.length - 3] + ' ' + componentesDireccion[componentesDireccion.length - 2] + ' ' + componentesDireccion[componentesDireccion.length - 1];
    for (const estado of estados) {
        if (estadoEncontrado === estado) {
            return estado;
        }
    }
    estadoEncontrado = componentesDireccion[componentesDireccion.length - 4] + ' ' + componentesDireccion[componentesDireccion.length - 3] + ' ' + componentesDireccion[componentesDireccion.length - 2] + ' ' + componentesDireccion[componentesDireccion.length - 1];
    for (const estado of estados) {
        if (estadoEncontrado === estado) {
            return estado;
        }
    }
    estadoEncontrado = componentesDireccion[componentesDireccion.length - 5] + ' ' + componentesDireccion[componentesDireccion.length - 4] + ' ' + componentesDireccion[componentesDireccion.length - 3] + ' ' + componentesDireccion[componentesDireccion.length - 2] + ' ' + componentesDireccion[componentesDireccion.length - 1];
    for (const estado of estados) {
        if (estadoEncontrado === estado) {
            return estado;
        }
    }
    estadoEncontrado = componentesDireccion[componentesDireccion.length - 6] + ' ' + componentesDireccion[componentesDireccion.length - 5] + ' ' + componentesDireccion[componentesDireccion.length - 4] + ' ' + componentesDireccion[componentesDireccion.length - 3] + ' ' + componentesDireccion[componentesDireccion.length - 2] + ' ' + componentesDireccion[componentesDireccion.length - 1];
    for (const estado of estados) {
        if (estadoEncontrado === estado) {
            return estado;
        }
    }
    return null;
}
// Función auxiliar para obtener el tipo de asentamiento humano
function obtenerMunicipio(estado, componentesDireccion, i) {
    try {
        if (estado) {
            const municipios = municipiosEstado[estado];
            const parseo = estado.split(' ');
            let count = parseo.length;
            // if(estado==='GUANAJUATO')count++;
            for (const municipio of municipios) {
                // Verificar si el municipio contiene el componente actual
                if (municipio.includes(componentesDireccion[i])) {
                    // Si coincide exactamente con el municipio, lo devolvemos
                    if (municipio === componentesDireccion[i]) {
                        if (i === componentesDireccion.length - (count + 1)) return municipio;
                        return null;
                    }
                    let municipioConcat = componentesDireccion[i]; // Variable para almacenar la calle si es necesario
                    let j = i;
                    j++;
                    while (j < (componentesDireccion.length - count)) {
                        municipioConcat += ' ' + componentesDireccion[j];
                        j++;
                    }
                    if (municipio === municipioConcat) {
                        const parseo = municipioConcat.split(' ');
                        if (i === componentesDireccion.length - parseo.length - count) return municipio;
                        return null;
                    }
                }
            }
            return null; // Si no se encontró un municipio, devolvemos null
        } else {
            for (const estado of estados) {
                const municipios = municipiosEstado[estado];
                // if(estado==='GUANAJUATO')count++;
                for (const municipio of municipios) {
                    // Verificar si el municipio contiene el componente actual
                    if (municipio.includes(componentesDireccion[i])) {
                        // Si coincide exactamente con el municipio, lo devolvemos
                        if (municipio === componentesDireccion[i]) {
                            if (i === componentesDireccion.length - 1) return municipio;
                            return null;
                        }
                        let municipioConcat = componentesDireccion[i]; // Variable para almacenar la calle si es necesario
                        let j = i;
                        j++;
                        while (j < (componentesDireccion.length - 1)) {
                            municipioConcat += ' ' + componentesDireccion[j];
                            j++;
                        }
                        if (municipio === municipioConcat) {
                            const parseo = municipioConcat.split(' ');
                            if (i === componentesDireccion.length - parseo.length) return municipio;
                            return null;
                        }
                    }
                }
            }
            return null; // Si no se encontró un municipio, devolvemos null
        }
    } catch (error) {
        //console.log(error);
        return null;
    }
}

// Función para limpiar la búsqueda eliminando caracteres específicos
function limpiarBusqueda(texto) {
    // Elimina caracteres específicos, excepto cuando están precedidos por un espacio y seguidos por una letra y un punto.
    texto = texto.replace(/(?<!\S)[\-|+"#$%&*./;?\[{\~¡¦=¤¥](?=(\s[A-Z]\.))/g, '');
    texto = texto.replace(/,/g, '');
    texto = texto.replace(/Ñ/g, 'N');
    texto = texto.replace(/Á/g, 'A');
    texto = texto.replace(/É/g, 'E');
    texto = texto.replace(/Í/g, 'I');
    texto = texto.replace(/Ó/g, 'O');
    texto = texto.replace(/Ú/g, 'U');
    return texto.trim();
}
// Función para expandir abreviaciones de tipos de vialidad en una dirección
function expandirAbreviaciones(direccion) {
    // Expande las abreviaciones en la dirección
    for (const abreviacion in diccionarioAbreviaciones) {
        const regex = new RegExp(`\\b${abreviacion}(?:\\.\\s*|\\b)`, 'gi');
        direccion = direccion.replace(regex, diccionarioAbreviaciones[abreviacion]);
    }
    return direccion;
}
// Función para eliminar ciertos caracteres ilegibles seguidos de un . ejemplo J. 
function eliminarCaracteres(direccion) {
    const regex = /\b[A-Z]\.\s/g;
    return direccion.replace(regex, '');
}
function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;

    // Crear matriz de distancias
    const distances = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));

    // Inicializar primera fila y columna
    for (let i = 0; i <= len1; i++) {
        distances[i][0] = i;
    }
    for (let j = 0; j <= len2; j++) {
        distances[0][j] = j;
    }

    // Calcular distancias
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            distances[i][j] = Math.min(
                distances[i - 1][j] + 1, // Eliminación
                distances[i][j - 1] + 1, // Inserción
                distances[i - 1][j - 1] + cost // Sustitución
            );
        }
    }

    // La distancia de edición entre las cadenas es el valor en la esquina inferior derecha de la matriz
    return distances[len1][len2];
}
function quitarAcentos(texto) {
    texto = texto.replace(/Ñ/g, 'N');
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
module.exports = { parseDireccion, levenshteinDistance, quitarAcentos };