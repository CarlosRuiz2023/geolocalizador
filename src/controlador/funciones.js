const estados = require("../data/estados");
const municipiosEstado = require("../data/municipios.json");
const tiposAsentamiento = require("../data/tipoAsentamiento");
const tiposVialidad = require("../data/tipoVialidad");
const diccionarioAbreviaciones = require("../data/diccionarioAbreviaciones.json");


// Función para parsear la dirección según la Norma Técnica sobre Domicilios Geográficos
function parseDireccion(direccion) {
    // Limpieza de datos
    const direccionExpandida = expandirAbreviaciones(limpiarBusqueda(eliminarCaracteres(direccion.toUpperCase())));
    // Dividir la dirección en sus componentes
    const componentesDireccion = direccionExpandida.split(',');

    // Crear un objeto para almacenar los componentes parseados
    const direccionParsed = {};
    let estado = '';
    let activo=true;

    // Iterar sobre los componentes de la dirección
    for (let i = componentesDireccion.length - 1; i >= 0; i--) {
        const componente = componentesDireccion[i].trim();
        // Buscar el tipo de vialidad
        const tipoVialidad = obtenerTipoVialidad(componente);
        if (tipoVialidad) {
            activo=false;
            direccionParsed.TIPOVIAL = tipoVialidad;
            direccionParsed.NOMVIAL = componente.replace(tipoVialidad, '').trim();
        }
        // Buscar el número exterior
        const numeroExterior = obtenerNumeroExterior(componente);
        if (numeroExterior) {
            const [numExtNum, numExtAlf] = numeroExterior.split(' ');
            if(activo) direccionParsed.NUMEXTNUM1 = numExtNum;
            if(activo) direccionParsed.NUMEXTALF1 = numExtAlf;
            activo=false;
        }
        // Buscar el tipo de asentamiento humano
        const tipoAsentamiento = obtenerTipoAsentamiento(componente);
        if (tipoAsentamiento) {
            activo=false;
            direccionParsed.TIPOASEN = tipoAsentamiento;
            direccionParsed.NOMASEN = componente.replace(tipoAsentamiento, '').trim();
        }
        // Buscar el código postal
        const codigoPostal = obtenerCodigoPostal(componente);
        if (codigoPostal) {
            activo=false;
            direccionParsed.CP = codigoPostal;
        }
        // Buscar el estado
        if (!estado) {
            estado = obtenerEstado(componente);
            if (estado) {
                activo=false;
                direccionParsed.ESTADO = estado;
            }
        }
        // Buscar el municipio
        if (estado) {
            const municipio = obtenerMunicipio(componente, estado);
            if (municipio) {
                activo=false;
                direccionParsed.MUNICIPIO = municipio;
            }
        }
        if(direccionParsed.COLONIA){
            activo=false;
            direccionParsed.CALLE = componente;
        }
        if(activo){
            direccionParsed.COLONIA = componente;
        }
        activo=true;
        // Buscar el nombre de la localidad, municipio/delegación, estado/distrito federal
        // Implementa la lógica para detectar estos componentes según tus necesidades
        // ...
    }

    // Retornar la dirección parseada en el formato requerido
    return direccionParsed;
}

// Función auxiliar para obtener el tipo de vialidad
function obtenerTipoVialidad(componente) {
    for (const tipoVialidad of tiposVialidad) {
        if (componente.toUpperCase().includes(tipoVialidad)) {
            return tipoVialidad;
        }
    }
    return null;
}

// Función auxiliar para obtener el número exterior
function obtenerNumeroExterior(componente) {
    const numeroExteriorRegex = /\b(?!(\d{5})$)(\d+)\s*([A-Z])?\b/;
    const match = componente.match(numeroExteriorRegex);
    if (match) {
        const [numCompleto, , numExtNum, numExtAlf] = match;
        return `${numExtNum} ${numExtAlf || ''}`.trim();
    }
    return null;
}
// Función auxiliar para obtener el tipo de asentamiento humano
function obtenerTipoAsentamiento(componente) {
    for (const tipoAsentamiento of tiposAsentamiento) {
        if (componente.toUpperCase().includes(`${tipoAsentamiento} `)) {
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
    const municipios = municipiosEstado[estado];
    for (const municipio of municipios) {
        if (componente.toUpperCase().includes(municipio)) {
            if(componente.toUpperCase()===municipio)return municipio;
        }
    }
    return null;
}
// Función para limpiar la búsqueda eliminando caracteres específicos
function limpiarBusqueda(texto) {
    return texto.replace(/[-|+"#$%&*./;?\[{\~¡¦=¤¥]/g, ''); // Elimina los caracteres específicos
}
// Función para expandir abreviaciones de tipos de vialidad en una dirección
function expandirAbreviaciones(direccion) {
    // Expande las abreviaciones en la dirección
    for (const abreviacion in diccionarioAbreviaciones) {
        const regex = new RegExp(`\\b${abreviacion}\\b`, 'gi');
        direccion = direccion.replace(regex, diccionarioAbreviaciones[abreviacion]);
    }
    return direccion;
}
// Función para eliminar ciertos caracteres ilegibles seguidos de un . ejemplo J. 
function eliminarCaracteres(direccion) {
    const regex = /\b[A-Z]\.\s/g;
    return direccion.replace(regex, '');
}
// Función auxiliar para formatear la dirección parseada según la Norma Técnica
function formatearDireccionParsed(direccionParsed) {
    const componentes = [];
    if (direccionParsed.TIPOVIAL && direccionParsed.NOMVIAL) {
        componentes.push(`${direccionParsed.TIPOVIAL} ${direccionParsed.NOMVIAL}`);
    }
    if (direccionParsed.NUMEXTNUM1 || direccionParsed.NUMEXTALF1) {
        const numeroExterior = `${direccionParsed.NUMEXTNUM1 || ''} ${direccionParsed.NUMEXTALF1 || ''}`.trim();
        componentes.push(numeroExterior);
    }
    if (direccionParsed.TIPOASEN && direccionParsed.NOMASEN) {
        componentes.push(`${direccionParsed.TIPOASEN} ${direccionParsed.NOMASEN}`);
    }
    if (direccionParsed.CP) {
        componentes.push(direccionParsed.CP);
    }
    if (direccionParsed.COLONIA) {
        componentes.push(direccionParsed.COLONIA);
    }
    if (direccionParsed.MUNICIPIO) {
        componentes.push(direccionParsed.MUNICIPIO);
    }
    if (direccionParsed.ESTADO) {
        componentes.push(direccionParsed.ESTADO);
    }
    // Agrega aquí la lógica para incluir otros componentes según la Norma Técnica

    return componentes.join(', ');
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
module.exports = {parseDireccion,levenshteinDistance};