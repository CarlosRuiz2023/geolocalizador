const estados = require("../data/estados");
const municipiosEstado = require("../data/municipios.json");
const tiposAsentamiento = require("../data/tipoAsentamiento");
const tiposVialidad = require("../data/tipoVialidad");
const diccionarioAbreviaciones = require("../data/diccionarioAbreviaciones.json");


// Función para parsear la dirección según la Norma Técnica sobre Domicilios Geográficos
function parseDireccion(direccion) {
    const direccionExpandida = expandirAbreviaciones(limpiarBusqueda(direccion.toUpperCase()));
    const componentesDireccion = direccionExpandida.split(' ');
    const direccionParsed = {};
    let estado = '';
    let municipio = '';
    let colonia = '';
    let calle = '';
    let numExterior = '';
    let activo = true;
    let cont = 0;
    let cont2 = 0;

    for (let i = 0; i < componentesDireccion.length; i++) {
        const componente = componentesDireccion[i].trim();

        // Buscar el tipo de vialidad
        const tipoVialidad = obtenerTipoVialidad(componente);
        if (tipoVialidad && !direccionParsed.CALLE && !direccionParsed.TIPOVIAL) {
            direccionParsed.TIPOVIAL = tipoVialidad;
            calle = componente.replace(tipoVialidad, '').trim();
            i++;
            while (i < componentesDireccion.length && !obtenerNumeroExterior(componentesDireccion[i]) && !obtenerCodigoPostal(componentesDireccion[i])) {
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
            while (i < componentesDireccion.length && !obtenerNumeroExterior(componentesDireccion[i]) && !obtenerCodigoPostal(componentesDireccion[i])) {
                calle += ' ' + componentesDireccion[i];
                i++;
            }
            i--;
            direccionParsed.NOMASEN = calle.trim();
            activo = false;
        }

        // Buscar el estado
        if (!estado && (direccionParsed.MUNICIPIO || i === componentesDireccion.length - 1)) {
            estado = obtenerEstado(componente);
            if (estado) {
                direccionParsed.ESTADO = estado;
                activo = false;
            }
        }

        // Buscar el municipio
        if (!municipio) {
            municipio = obtenerMunicipio(componente, componentesDireccion[i + 1]);
            if (municipio) {
                direccionParsed.MUNICIPIO = municipio;
                activo = false;
            }
        }
        if (activo) {
            if (!direccionParsed.CALLE && !direccionParsed.TIPOVIAL && !direccionParsed.TIPOASEN) {
                cont = i;
                direccionParsed.CALLE = componente;
                activo = false;
            } else if (direccionParsed.CALLE && cont === i - 1) {
                cont = i;
                direccionParsed.CALLE += ' ' + componente;
                activo = false;
            }
        }
        if (activo) {
            if (!direccionParsed.COLONIA) {
                cont2 = i;
                direccionParsed.COLONIA = componente;
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
        if(numExtNum.length>=5)return null;
        return `${numExtNum} ${numExtAlf || ''}`.trim();
    } else {
        // Expresión regular para detectar números exteriores como "M14"
        const numeroExteriorRegex = /\b(?:[0-9]+[a-zA-Z]?|[a-zA-Z][0-9]+)\b/;
        const match = componente.match(numeroExteriorRegex);
        if (match) {
            const numExterior = match[0].replace(/[A-Z]$/, '').replace(/^[A-Z]/, '').trim();
            if(numExterior.length>=5)return null;
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
                if(numExterior.length>=5)return null;
                return numExterior;
            }
        }
    }
    const numeroExteriorRegex1 = /^INT\s?\d+$/;
    if (numeroExteriorRegex1.test(componente)) {
        return componente.replace('INT','');
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
function obtenerEstado(componente) {
    for (const estado of estados) {
        if (componente.toUpperCase().includes(estado)) {
            return estado;
        }
    }
    return null;
}
// Función auxiliar para obtener el tipo de asentamiento humano
function obtenerMunicipio(componente, estado) {
    try {
        const municipios = municipiosEstado[estado];
        for (const municipio of municipios) {
            if (componente.toUpperCase().includes(municipio)) {
                if (componente.toUpperCase() === municipio) return municipio;
            }
        }
    } catch (error) {
        return null;
    }
}
// Función para limpiar la búsqueda eliminando caracteres específicos
function limpiarBusqueda(texto) {
    // Elimina caracteres específicos, excepto cuando están precedidos por un espacio y seguidos por una letra y un punto.
    texto = texto.replace(/(?<!\S)[\-|+"#$%&*./;?\[{\~¡¦=¤¥](?=(\s[A-Z]\.))/g, '');
    texto=texto.replace(/,/g, '');
    texto=texto.replace(/Á/g, 'A');
    texto=texto.replace(/É/g, 'E');
    texto=texto.replace(/Í/g, 'I');
    texto=texto.replace(/Ó/g, 'O');
    texto=texto.replace(/Ú/g, 'U');
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
module.exports = { parseDireccion, levenshteinDistance };