//const municipiosEstado = require("../data/municipios.json");
const tiposAsentamiento = require("../data/tipoAsentamiento");
const tiposVialidad = require("../data/tipoVialidad");
const diccionarioAbreviaciones = require("../data/diccionarioAbreviaciones.json");
const obtenerEstadosPromise = require("../data/estados");
const obtenerMunicipiosPromise = require("../data/municipios");
// Creamos arreglo de estados vacio.
let estados = [];
// Creamos arreglo de municipios vacio.
let municipiosEstado = [];
// Función para manejar la importación de estados y municipios
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
// Función para parsear la dirección según la Norma Técnica sobre Domicilios Geográficos.
async function parseDireccion(direccion) {
    // Llamamos la función para importar estados y municipios.
    await importaciones();
    // Limpiamos y expandimos abreviaciones de la entrada o lo que recibimos como direccion.
    const direccionExpandida = expandirAbreviaciones(limpiarBusqueda(direccion.toUpperCase()));
    // Una vez limpiada la direccion proporcionada la dividimos por ' ' (espacios).
    let componentesDireccion = direccionExpandida.split(' ');
    // Nos desacemos de aquellos dobles o triples espacios descartandolos.
    componentesDireccion = componentesDireccion.filter(item => item !== '' && item !== 'NULL');
    // Creamos un JSON donde se almacenara el parseo obtenido.
    const direccionParsed = {};
    // Creamos una variable llamada estado.
    let estado = '';
    // Creamos una variable llamada municipio.
    let municipio = '';
    // Creamos una variable llamada calle.
    let calle = '';
    // Creamos un boolean que nos indicara si el componente no ha sido identificado.
    let activo = true;
    // Creamos un boolean que nos indicara si lleva CALLE o no la busqueda.
    let coloniaConCalle = true;
    // Creamos un contador en 0.
    let cont = 0;
    // Creamos un segundo contador en 0.
    let cont2 = 0;
    // Buscar el estado
    estado = obtenerEstado(componentesDireccion);
    // Validamos que se halla recuperado un estado entre sus ultimos componentes.
    if (estado) {
        // Añadimos el estado encontrado al JSON.
        direccionParsed.ESTADO = estado;
    }
    // Hacemos un recorrido entre sus componentes.
    for (let i = 0; i < componentesDireccion.length; i++) {
        // Tomamos un componente del arreglo.
        const componente = componentesDireccion[i].trim();
        // Buscar el tipo de vialidad.
        const tipoVialidad = obtenerTipoVialidad(componente);
        // Validamos que el componente sea de tipo_vialidad.
        if (tipoVialidad && !direccionParsed.CALLE && !direccionParsed.TIPOVIAL && (!direccionParsed.COLONIA && componentesDireccion[i - 1] != 'COLONIA') && !direccionParsed.TIPOASEN) {
            // Añadimos al JSON el tipo_vialidad que es.
            direccionParsed.TIPOVIAL = tipoVialidad;
            // calle = componente.replace(tipoVialidad, '').trim();
            // Seguimos con el siguiente componente
            i++;
            // Creamos ciclo While donde buscaremos el nombre_vialidad que porporciono el usuario.
            while (i < componentesDireccion.length && (!obtenerNumeroExterior(componentesDireccion[i]) || i === 0) && !obtenerCodigoPostal(componentesDireccion[i]) && !obtenerMunicipio(estado, componentesDireccion, i) && componentesDireccion[i] !== "COLONIA" && i !== componentesDireccion.length - (estado ? estado.split(" ").length : 0)) {
                // En caso de pasar las validaciones concatenamos el siguiente componente a la variable calle.
                calle += ' ' + componentesDireccion[i];
                // Aumentamos el iterador.
                i++;
            }
            // Disminuimos 1 al iterador debido a que se ha cortado con exito el nombre_vialidad.
            i--;
            // Añadimos al JSON el nombre_vialidad resultante.
            direccionParsed.NOMVIAL = calle.trim();
            // Cambiamos el estatus de activo a falso debido a que ya se hizo una accion.
            activo = false;
        }
        // Buscamos un numero_exterior.
        const numeroExterior = obtenerNumeroExterior(componente);
        // Validamos que se halla recuperado un numero dentro del componente.
        if (numeroExterior && (direccionParsed.CALLE || direccionParsed.NOMASEN || direccionParsed.NOMVIAL) && !direccionParsed.NUMEXTNUM1) {
            // Validamos que no lleve un mensaje controlado antes de añadir al JSON.
            if (numeroExterior !== 'No se ha especificado un número exterior') {
                // Añadimos al JSON el numero_exterior encontrado.
                direccionParsed.NUMEXTNUM1 = numeroExterior.split(' ')[0];
                // Añadimos al JSON el numero_exterior alfanumerico proporcionado a pesar de que no se usa al menos se parsea.
                direccionParsed.NUMEXTALF1 = numeroExterior.split(' ')[1] || '';
            }
            // Cambiamos el estatus de activo a falso debido a que ya se hizo una accion.
            activo = false;
        }
        // Buscamos el código postal.
        const codigoPostal = obtenerCodigoPostal(componente);
        // Validamos que se halla obtenido un Codigo_Postal dentro del componente.
        if (codigoPostal) {
            // Añadimos al JSON el codigo_postal encontrado.
            direccionParsed.CP = codigoPostal;
            // Cambiamos el estatus de activo a falso debido a que ya se hizo una accion.
            activo = false;
        }
        // Buscar el tipo de asentamiento humano
        const tipoAsentamiento = obtenerTipoAsentamiento(componente);
        // Validamos que se halla encontrado un tipo_asentamiento dentro del componente.
        if (tipoAsentamiento && !direccionParsed.CALLE && !direccionParsed.TIPOASEN && !direccionParsed.TIPOVIAL && (!direccionParsed.COLONIA && componentesDireccion[i - 1] != 'COLONIA')) {
            // Añadimos al JSON el tipo_asentamiento encontrado.
            direccionParsed.TIPOASEN = tipoAsentamiento;
            // calle = componente.replace(tipoAsentamiento, '').trim();
            // Seguimos con el siguiente componente
            i++;
            // Creamos ciclo While donde buscaremos el nombre_asentamiento que porporciono el usuario.
            while (i < componentesDireccion.length && !obtenerNumeroExterior(componentesDireccion[i]) && !obtenerCodigoPostal(componentesDireccion[i]) && !obtenerMunicipio(estado, componentesDireccion, i) && componentesDireccion[i] !== "COLONIA" && i !== componentesDireccion.length - (estado ? estado.split(" ").length : 0)) {
                // En caso de pasar las validaciones concatenamos el siguiente componente a la variable calle.
                calle += ' ' + componentesDireccion[i];
                // Aumentamos el iterador.
                i++;
            }
            // Disminuimos 1 al iterador debido a que se ha cortado con exito el nombre_vialidad.
            i--;
            // Añadimos al JSON el nombre_asentamiento resultante.
            direccionParsed.NOMASEN = calle.trim();
            // Cambiamos el estatus de activo a falso debido a que ya se hizo una accion.
            activo = false;
        }
        // Validamos que no se halla encontrado aun un municipio y q no se hallan hecho acciones por el momento.
        if (!municipio && activo) {
            // Buscar el municipio
            municipio = obtenerMunicipio(estado, componentesDireccion, i);
            // Validamos que se halla obtenido un municipio dentro del componente basandose en el estado.
            if (municipio) {
                // Añadimos al JSON el municipio detectado.
                direccionParsed.MUNICIPIO = municipio;
                // Cambiamos el estatus de activo a falso debido a que ya se hizo una accion.
                activo = false;
            }
        }
        // Validamos que no se halla detectado nada aun y la colonia no este escondida.
        if (activo && coloniaConCalle && (i < componentesDireccion.length - (estado ? estado.split(" ").length : 0))) {
            // Validamos que no lleve CALLE y no es tipo_vialidad ni tipo_asentamiento
            if (!direccionParsed.CALLE && !direccionParsed.TIPOVIAL && !direccionParsed.TIPOASEN) {
                // Validamos si el componente = 'COLONIA'
                if (componente === 'COLONIA') {
                    // De ser asi cambiamos el estatus de la variable coloniaConCalle debido a que ya se encontro donde comienza la COLONIA.
                    coloniaConCalle = false;
                } else {
                    // Validamos que se trate de una calle abreviada.
                    if (componente === 'C' || componente === 'C.') {
                        // Añadimos al JSON el tipo_vialidad detectado.
                        direccionParsed.TIPOVIAL = 'CALLE';
                        // Seguimos con el siguiente componente
                        i++;
                        // Creamos ciclo While donde buscaremos la calle que porporciono el usuario.
                        while (i < componentesDireccion.length && (!obtenerNumeroExterior(componentesDireccion[i]) || i === 1) && !obtenerCodigoPostal(componentesDireccion[i]) && !obtenerMunicipio(estado, componentesDireccion, i) && componentesDireccion[i] !== "COLONIA" && i !== componentesDireccion.length - (estado ? estado.split(" ").length : 0)) {
                            // En caso de pasar las validaciones concatenamos el siguiente componente a la variable calle.
                            calle += ' ' + componentesDireccion[i];
                            // Aumentamos el iterador.
                            i++;
                        }
                        // Disminuimos 1 al iterador debido a que se ha cortado con exito el nombre_vialidad.
                        i--;
                        // Añadimos al JSON el nombre_vialidad detectado.
                        direccionParsed.NOMVIAL = calle.trim();
                        // Cambiamos el estatus de activo a falso debido a que ya se hizo una accion.
                        activo = false;
                    } else {
                        // Si a llegado hasta aqui se trata de una CALLE y se cambiara el contador 1 al valor de la i.
                        cont = i;
                        // Añadimos al JSON la CALLE detectada.
                        direccionParsed.CALLE = componente;
                        // Cambiamos el estatus de activo a falso debido a que ya se hizo una accion.
                        activo = false;
                    }
                }
                // Si ya se detecto un pedazo de la calle y el contador 1 apunta al componente que acaba de pasar concatenamos toda la calle.
            } else if (direccionParsed.CALLE && cont === i - 1 && direccionParsed.CALLE !== ' ' && componente !== 'COLONIA') {
                // Cambiamos el  valor del contador 1 a el valor de itreracion actual.
                cont = i;
                // Añadimos al JSON la concatenacion de aquellos componentes que hacen la calle proporcionada.
                direccionParsed.CALLE += ' ' + componente;
                // Cambiamos el estatus de activo a falso debido a que ya se hizo una accion.
                activo = false;
            }
        }
        // Validamos que no se halla encontrada nada para este componente mediante el boolean activo
        if (activo && !direccionParsed.MUNICIPIO && (!obtenerNumeroExterior(componentesDireccion[i]) || i === 1 || componentesDireccion[i + 1] === 'DE') && !obtenerCodigoPostal(componente) && !obtenerMunicipio(estado, componentesDireccion, i) && i !== componentesDireccion.length - (estado ? estado.split(" ").length : 0)) {
            // Validamos que la COLONIA no halla sido detectada aun.
            if (!direccionParsed.COLONIA) {
                // Cambiamos el valor del contador 2 al valor de iteracion actual.
                cont2 = i;
                // Validamos que sea diferente de COLONIA, A, B, C, D debido a que el usuario aveces pone ' ' entre el numero_exterior y la colonia ejemplo '219 A'
                if (componente !== 'COLONIA' && componente !== 'A' && componente !== 'B' && componente !== 'C' && componente !== 'D' && componente !== 'E' && componente !== 'F') {
                    // Añadimos al JSON la colonia detectada.
                    direccionParsed.COLONIA = componente;
                }
                // Validamos que ya se halla detectado el comienzo de la colonia y que sea su continuacion mediante el contador 2
            } else if (direccionParsed.COLONIA && cont2 === i - 1) {
                // Cambiamos el valor del contador 2 al valor de iteracion actual.
                cont2 = i;
                // Añadimos añ JSON la concatenacion de la colonia proporcionada por el usuario.
                direccionParsed.COLONIA += ' ' + componente;
            }
        }
        // Cambiamos el estatus de activo a true debido a que se ha llegado al final de las detecciones y se comenzara una nueva accion.
        activo = true;
    }
    // Validamos que no se halla detectado una CALLE
    if (!direccionParsed.CALLE) {
        // Validamos que el JSON tenga un nombre_asentamiento 
        if (direccionParsed.NOMASEN) {
            // Asignamos como CALLE el nombre_asentamiento detectado para una busqueda mas profunda.
            direccionParsed.CALLE = direccionParsed.NOMASEN
        }
        // Validamos que el JSON tenga un nombre_vialidad
        else if (direccionParsed.NOMVIAL) {
            // Asignamos como CALLE el nombre_vialidad detectada para una busqueda mas profunda.
            direccionParsed.CALLE = direccionParsed.NOMVIAL
        }
    }
    //if (direccionParsed.COLONIA) direccionParsed.COLONIA = direccionParsed.COLONIA.replace("  ", " ").trim();
    //if (direccionParsed.CALLE) direccionParsed.CALLE = direccionParsed.CALLE.replace("  ", " ").trim();
    //if (direccionParsed.NOMVIAL) direccionParsed.NOMVIAL = direccionParsed.NOMVIAL.replace("  ", " ").trim();
    //if (direccionParsed.NOMASEN) direccionParsed.NOMASEN = direccionParsed.NOMASEN.replace("  ", " ").trim();

    // Regresamos el JSON con cada propiedad encontrada
    return direccionParsed;
}
// Función auxiliar para obtener el tipo de vialidad
function obtenerTipoVialidad(componente) {
    // Recorremos el arreglo de tiposVialidad
    for (const tipoVialidad of tiposVialidad) {
        // Validamos que el componente coincida con algun tipo_vialidad
        if (componente.toUpperCase().startsWith(tipoVialidad)) {
            // Regresamos el tipoVialidad encontrado.
            return tipoVialidad;
        }
    }
    // Si no se encontro coincidenacia alguna regresamos nulo.
    return null;
}
// Función auxiliar para obtener el número exterior
function obtenerNumeroExterior(componente) {
    // Expresión regular para detectar números exteriores como "123A"
    const numeroExteriorRegex = /\b(?!(\d{5})$)(\d+)\s*([A-Z])?\b/;
    // Quitamos '-' del componente en caso de que lo porte.
    componente = componente.replace("-", "");
    // Hacemos match entre el componente y la expresion regular.
    const match = componente.match(numeroExteriorRegex);
    // Validamos que halla match.
    if (match) {
        // Tomamos algunos de los datos obtenidos del match.
        const [numCompleto, , numExtNum, numExtAlf] = match;
        // Si se trata de un numero de 5 cifras regresamos un nulo.
        if (numExtNum.length > 4) return null;
        // Regresamos el numero_exterior junto con su letra alfanumerica detactada.
        return `${numExtNum} ${numExtAlf || ''}`.trim();
    }
    // Expresión regular para detectar números exteriores como "M14"
    const numeroExteriorRegex1 = /\b(?:[0-9]+[a-zA-Z]?|[a-zA-Z][0-9]+)\b/;
    // Hacemos match entre el componente y la expresion regular.
    const match1 = componente.match(numeroExteriorRegex1);
    // Validamos que halla match.
    if (match1) {
        // Tomamos el numero_exterior detectado del match.
        const numExterior = match1[0].replace(/[A-Z]$/, '').replace(/^[A-Z]/, '').trim();
        // Validamos que no se trate de un codigo_postal
        if (numExterior.length >= 5) return null;
        // En caso de llegar hasta aqui regresamos el numero encontrado.
        return numExterior;
    }
    // Expresión regular para detectar números exteriores como "E9I303"
    const numeroExteriorRegex2 = /\b(?:[a-zA-Z]*\d+[a-zA-Z]*(\d{3,}))\b/;
    // Hacemos match entre el componente y la expresion regular.
    const match2 = componente.match(numeroExteriorRegex2);
    // Validamos que halla match.
    if (match2) {
        // Tomamos el numero_exterior detectado del match.
        const numExterior = match2[1].trim();
        // Validamos que no se trate de un codigo_postal
        if (numExterior.length >= 5) return null;
        // En caso de llegar hasta aqui regresamos el numero encontrado.
        return numExterior;
    }
    // Numero Interior
    // Generamos al expresion regular que detactara que estan tratando de dar un numero interior (INT)
    const numeroExteriorRegex3 = /^INT\s?\d+$/;
    // Validamos que pasa el test
    if (numeroExteriorRegex3.test(componente)) {
        // Regresamos el componente desapareciendo el INT de el
        return componente.replace('INT', '');
    }
    // Numero Interior.
    // Generamos al expresion regular que detactara que estan tratando de dar un numero interior (INT.)
    const numeroExteriorRegex4 = /^INT.\s?\d+$/;
    // Validamos que pasa el test
    if (numeroExteriorRegex4.test(componente)) {
        // Regresamos el componente desapareciendo el INT. de el
        return componente.replace('INT.', '');
    }
    // Sin numero
    // Validamos que el componente diga sin numero abreviado 'S/N'
    if (componente === "S/N") {
        // Regresamos un mensaje controlado con la leyenda de "No se ha especificado un número exterior"
        return "No se ha especificado un número exterior";
    }
    // Regresamos un nulo debido a que no hizo matvh el componente con ninguno de los casos considerados.
    return null;
}
// Función auxiliar para obtener el tipo de asentamiento humano
function obtenerTipoAsentamiento(componente) {
    // Recorremos el arreglo de tiposAsentamiento
    for (const tipoAsentamiento of tiposAsentamiento) {
        // Validamos que el componente coincida con algun tipo_asentamiento
        if (componente.toUpperCase() === tipoAsentamiento) {
            // Regresamos el tipoAsentamiento encontrado.
            return tipoAsentamiento;
        }
    }
    // Si no se encontro coincidenacia alguna regresamos nulo.
    return null;
}
// Función auxiliar para obtener el código postal
function obtenerCodigoPostal(componente) {
    // Expresión regular para detectar 5 numeros consecutivos
    const codigoPostalRegex = /\b\d{5}\b/;
    // Hacemos match entre el componente y la expresion regular.
    const match = componente.match(codigoPostalRegex);
    // Validamos que halla match.
    if (match) {
        // Regresamos el codigo_postal detectado
        return match[0];
    }
    // Si no se encontro coincidenacia alguna regresamos nulo.
    return null;
}
// Función auxiliar para obtener el estado de un arreglo de direcciones
function obtenerEstado(componentesDireccion) {
    // Declaramos una variable para el estado y sus posibles casos.
    let estadoEncontrado = '';
    // Buscamos el estado entre sus ultimos componentes.
    estadoEncontrado = componentesDireccion[componentesDireccion.length - 1];
    // Recorremos los estados
    for (const estado of estados) {
        // Validamos que el estadoEncontrado sea igual a alguno de los estados
        if (estadoEncontrado === estado) {
            // Regresamos el estado encontrado.
            return estado;
        }
    }
    // Buscamos el estado entre sus ultimos componentes.
    estadoEncontrado = componentesDireccion[componentesDireccion.length - 2] + ' ' + componentesDireccion[componentesDireccion.length - 1];
    // Recorremos los estados
    for (const estado of estados) {
        // Validamos que el estadoEncontrado sea igual a alguno de los estados
        if (estadoEncontrado === estado) {
            // Regresamos el estado encontrado.
            return estado;
        }
    }
    // Buscamos el estado entre sus ultimos componentes.
    estadoEncontrado = componentesDireccion[componentesDireccion.length - 3] + ' ' + componentesDireccion[componentesDireccion.length - 2] + ' ' + componentesDireccion[componentesDireccion.length - 1];
    // Recorremos los estados
    for (const estado of estados) {
        // Validamos que el estadoEncontrado sea igual a alguno de los estados
        if (estadoEncontrado === estado) {
            // Regresamos el estado encontrado.
            return estado;
        }
    }
    // Buscamos el estado entre sus ultimos componentes.
    estadoEncontrado = componentesDireccion[componentesDireccion.length - 4] + ' ' + componentesDireccion[componentesDireccion.length - 3] + ' ' + componentesDireccion[componentesDireccion.length - 2] + ' ' + componentesDireccion[componentesDireccion.length - 1];
    // Recorremos los estados
    for (const estado of estados) {
        // Validamos que el estadoEncontrado sea igual a alguno de los estados
        if (estadoEncontrado === estado) {
            // Regresamos el estado encontrado.
            return estado;
        }
    }
    // Buscamos el estado entre sus ultimos componentes.
    estadoEncontrado = componentesDireccion[componentesDireccion.length - 5] + ' ' + componentesDireccion[componentesDireccion.length - 4] + ' ' + componentesDireccion[componentesDireccion.length - 3] + ' ' + componentesDireccion[componentesDireccion.length - 2] + ' ' + componentesDireccion[componentesDireccion.length - 1];
    // Recorremos los estados
    for (const estado of estados) {
        // Validamos que el estadoEncontrado sea igual a alguno de los estados
        if (estadoEncontrado === estado) {
            // Regresamos el estado encontrado.
            return estado;
        }
    }
    // Buscamos el estado entre sus ultimos componentes.
    estadoEncontrado = componentesDireccion[componentesDireccion.length - 6] + ' ' + componentesDireccion[componentesDireccion.length - 5] + ' ' + componentesDireccion[componentesDireccion.length - 4] + ' ' + componentesDireccion[componentesDireccion.length - 3] + ' ' + componentesDireccion[componentesDireccion.length - 2] + ' ' + componentesDireccion[componentesDireccion.length - 1];
    // Recorremos los estados
    for (const estado of estados) {
        // Validamos que el estadoEncontrado sea igual a alguno de los estados
        if (estadoEncontrado === estado) {
            // Regresamos el estado encontrado.
            return estado;
        }
    }
    // Si no se encontro coincidenacia alguna regresamos nulo.
    return null;
}
// Función auxiliar para obtener el municipio segun el estado proporcionado.
function obtenerMunicipio(estado, componentesDireccion, i) {
    try {
        // Validamos que se halla detectado un estado previamente.
        if (estado) {
            // Obtenemos los municipios de ese estado
            const municipios = municipiosEstado[estado];
            // Dividimos el estado segun los ' ' que tenga.
            const parseo = estado.split(' ');
            // Creamos variable que contendra el tamaño del estado detectado.
            let count = parseo.length;
            // Recorremos cada uno de los municipios de ese estado.
            for (const municipio of municipios) {
                // Verificar si el municipio contiene el componente actual
                if (municipio.includes(componentesDireccion[i])) {
                    // Si coincide exactamente con el municipio, lo devolvemos
                    if (municipio === componentesDireccion[i]) {
                        // Validamos que se encuentre dicho municipio a un lado del estado.
                        if (i === componentesDireccion.length - (count + 1)) return municipio;
                        // De no estar a un lado regresamos nulo.
                        return null;
                    }
                    // Variable para almacenar el municipio
                    let municipioConcat = componentesDireccion[i];
                    // Iterador j con valor de i.
                    let j = i;
                    // Aumentamos el iterador j
                    j++;
                    // Creamos ciclo While para concatenar el municipio proporcionado.
                    while (j < (componentesDireccion.length - count)) {
                        // Concatenacion del municipio sin tocar el estado en el ciclo.
                        municipioConcat += ' ' + componentesDireccion[j];
                        // Aumento del iterador j.
                        j++;
                    }
                    // Validacion de municipioConcat con uno de los municipios del estado.
                    if (municipio === municipioConcat) {
                        // Parseamos el municipioConcat segun sus ' '
                        const parseo = municipioConcat.split(' ');
                        // Validamos que el municipio detectado se encuentre junto a el estado.
                        if (i === componentesDireccion.length - parseo.length - count) return municipio;
                        // De no estar a un lado regresamos nulo.
                        return null;
                    }
                }
            }
            // Si no se encontró un municipio, devolvemos null
            return null;
        } else {
            // Hacemos un recorrido entre los estados.
            for (const estado of estados) {
                // Obtenemos los municipios de ese estado
                const municipios = municipiosEstado[estado];
                // Recorremos cada uno de los municipios de ese estado.
                for (const municipio of municipios) {
                    // Verificar si el municipio contiene el componente actual
                    if (municipio.includes(componentesDireccion[i])) {
                        // Si coincide exactamente con el municipio, lo devolvemos
                        if (municipio === componentesDireccion[i]) {
                            // Validamos que se encuentre dicho municipio a un lado del estado.
                            if (i === componentesDireccion.length - 1) return municipio;
                            // De no estar a un lado regresamos nulo.
                            return null;
                        }
                        // Variable para almacenar el municipio
                        let municipioConcat = componentesDireccion[i];
                        // Iterador j con valor de i.
                        let j = i;
                        // Aumentamos el iterador j
                        j++;
                        // Creamos ciclo While para concatenar el municipio proporcionado.
                        while (j < (componentesDireccion.length - 1)) {
                            // Concatenacion del municipio.
                            municipioConcat += ' ' + componentesDireccion[j];
                            // Aumento del iterador j.
                            j++;
                        }
                        // Validacion de municipioConcat con uno de los municipios del estado.
                        if (municipio === municipioConcat) {
                            // Parseamos el municipioConcat segun sus ' '
                            const parseo = municipioConcat.split(' ');
                            // Validamos que el municipio detectado se encuentre al final.
                            if (i === componentesDireccion.length - parseo.length) return municipio;
                            // De no estar al final regresamos nulo.
                            return null;
                        }
                    }
                }
            }
            // Si no se encontró un municipio, devolvemos null
            return null;
        }
    } catch (error) {
        // Regresamos un nulo en caso de que algo falle.
        return null;
    }
}
// Función para limpiar la búsqueda eliminando caracteres específicos
function limpiarBusqueda(texto) {
    // Elimina caracteres específicos, excepto cuando están precedidos por un espacio y seguidos por una letra y un punto.
    texto = texto.replace(/(?<!\S)[\-|+"#$%&*./;?\[{\~¡¦=¤¥](?=(\s[A-Z]\.))/g, '');
    // Eliminacion de ','
    texto = texto.replace(/,/g, '');
    // Cambio de Ñ a N
    texto = texto.replace(/Ñ/g, 'N');
    // Eliminacion de acentos en Á
    texto = texto.replace(/Á/g, 'A');
    // Eliminacion de acentos en É
    texto = texto.replace(/É/g, 'E');
    // Eliminacion de acentos en Í
    texto = texto.replace(/Í/g, 'I');
    // Eliminacion de acentos en Ó
    texto = texto.replace(/Ó/g, 'O');
    // Eliminacion de acentos en Ú
    texto = texto.replace(/Ú/g, 'U');
    // Eliminar paréntesis izquierdos "("
    texto = texto.replace(/\(/g, '');
    // Eliminar paréntesis derechos ")"
    texto = texto.replace(/\)/g, '');
    // Regresamos el texto limpiado.
    return texto.trim();
}
// Función para expandir abreviaciones de una dirección
function expandirAbreviaciones(direccion) {
    // Hacemos un recorrido para cada una de las abreviaciones guardadas
    for (const abreviacion in diccionarioAbreviaciones) {
        // Generamos la siguiente expresion regular
        const regex = new RegExp(`\\b${abreviacion}(?:\\.\\s*|\\b)`, 'gi');
        // Reemplazamos de la direccion proporcionada aquellas coincidencias con la abreviacion actual.
        direccion = direccion.replace(regex, diccionarioAbreviaciones[abreviacion]);
    }
    // Regresamos la direccion con las abreviaciones exparsidas
    return direccion;
}
// Función para determinar la similitud de 2 strings. 
function levenshteinDistance(str1, str2) {
    // Creamos una constante del largo de la primera cadena.
    const len1 = str1.length;
    // Creamos una constante del largo de la segunda cadena.
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
// Funcion auxiliar para erradicar acentos de alguna cadena.
function quitarAcentos(texto) {
    // Eliminar Ñs
    texto = texto.replace(/Ñ/g, 'N');
    // Eliminar paréntesis izquierdos "("
    texto = texto.replace(/\(/g, '');
    // Eliminar paréntesis derechos ")"
    texto = texto.replace(/\)/g, '');
    // Eliminacion de acentos
    texto = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // Regresamos el texto final.
    return texto;
}
// Funcion auxiliar para capitalizar alguna cadena.
function capitalizeFirstLetter(str) {
    // Capitaliza la primera letra de cada palabra
    str = str.toLowerCase().replace(/^(.)|\s+(.)/g, function ($1) {
        return $1.toUpperCase();
    });
    // Reemplaza todas las ocurrencias de "Ii" por "II"
    str = str.replace('Ii ', 'II ');
    // Reemplaza todas las ocurrencias de "Iii" por "III"
    str = str.replace('Iii ', 'III ');
    // Reemplaza todas las ocurrencias de "Iv" por "IV"
    str = str.replace('Iv ', 'IV ');
    // Reemplaza todas las ocurrencias de "Vi" por "VI"
    str = str.replace('Vi ', 'VI ');
    // Reemplaza todas las ocurrencias de "Vii" por "VII"
    str = str.replace('Vii ', 'VII ');
    // Reemplaza todas las ocurrencias de "Viii" por "VIII"
    str = str.replace('Viii ', 'VIII ');
    // Reemplaza todas las ocurrencias de "Ix" por "IX"
    str = str.replace('Ix ', 'IX ');
    // Reemplaza todas las ocurrencias de "Xi" por "XI"
    str = str.replace('Xi ', 'XI ');
    // Reemplaza todas las ocurrencias de "Xii" por "XII"
    str = str.replace('Xii ', 'XII ');
    // Reemplaza todas las ocurrencias de "Xiii" por "XIII"
    str = str.replace('Xiii ', 'XIII ');
    // Reemplaza todas las ocurrencias de "Xiv" por "XIV"
    str = str.replace('Xiv ', 'XIV ');
    // Reemplaza todas las ocurrencias de "Xv" por "XV"
    str = str.replace('Xv ', 'XV ');
    // Reemplaza todas las ocurrencias de "Xvi" por "XVI"
    str = str.replace('Xvi ', 'XVI ');
    // Reemplaza todas las ocurrencias de "Xvii" por "XVII"
    str = str.replace('Xvii ', 'XVII ');
    // Reemplaza todas las ocurrencias de "Xviii" por "XVIII"
    str = str.replace('Xviii ', 'XVIII ');
    // Reemplaza todas las ocurrencias de "Xix" por "XIX"
    str = str.replace('Xix ', 'XIX ');
    // Reemplaza todas las ocurrencias de "Xxi" por "XXI"
    str = str.replace('Xx ', 'XX ');
    // Reemplaza todas las ocurrencias de "Xxi" por "XXI"
    str = str.replace('Xxi ', 'XXI ');
    // Reemplaza todas las ocurrencias de "Xxi" por "XXI"
    str = str.replace('Xxi ', 'XXI ');
    // Reemplaza todas las ocurrencias de "Xxiii" por "XXIII"
    str = str.replace('Xxiii ', 'XXIII ');
    // Regresamos la cadena capitalizada con la primer letra en Mayuscula.
    return str;
}

function recortarTipoVialidad(cadena) {
    for (const tipo of tiposVialidad) {
        if (cadena.startsWith(tipo)) {
            return cadena.slice(tipo.length).trim();
        }
    }
    return cadena;
}

function recortarTipoAsentamiento(cadena) {
    for (const tipo of tiposAsentamiento) {
        if (cadena.startsWith(tipo)) {
            return cadena.slice(tipo.length).trim();
        }
    }
    return cadena;
}


module.exports = { parseDireccion, levenshteinDistance, quitarAcentos, capitalizeFirstLetter, recortarTipoAsentamiento, recortarTipoVialidad };