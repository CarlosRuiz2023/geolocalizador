const all = require('./vialidades/all');
const sinCP = require('./vialidades/sinCP');
const sinColonia = require('./vialidades/sinColonia');
const sinEstado = require('./vialidades/sinEstado');
const sinMunicipio = require('./vialidades/sinMunicipio');
const sinNumeroExterior = require('./vialidades/sinNumeroExterior');

// Función para parsear la dirección según la Norma Técnica sobre Domicilios Geográficos
async function scoringMaestro(direccionParsed) {
    let query = '';
    let values = [];
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
        else if (direccionParsed.CP && direccionParsed.NUMEXTNUM1) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND (codigo_postal = '' OR codigo_postal = $3 )
                AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
  			    OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.NUMEXTNUM1];
            const result = await pgClient.query(query, values);
            results = results.concat(result.rows);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 100,
                    tipo_viabilidad: 100,
                    nombre_viabilidad: 100,
                    codigo_postal: 100,
                    numero_exterior: 100
                };
            }
            results = results.concat(result.rows);
        }
        else if (direccionParsed.MUNICIPIO && direccionParsed.ESTADO) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND municipio = $3
                AND estado = $4
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 100,
                    tipo_viabilidad: 100,
                    nombre_viabilidad: 100,
                    municipio: 100,
                    estado: 100
                };
            }
            results = results.concat(result.rows);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND (codigo_postal = '' OR codigo_postal = $3 )
                AND municipio = $4
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 100,
                    tipo_viabilidad: 100,
                    nombre_viabilidad: 100,
                    codigo_postal: 100,
                    municipio: 100
                };
            }
            results = results.concat(result.rows);
        }
        else if (direccionParsed.MUNICIPIO && direccionParsed.NUMEXTNUM1) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND municipio = $3
                AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
  			    OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 100,
                    tipo_viabilidad: 100,
                    nombre_viabilidad: 100,
                    municipio: 100,
                    numero_exterior: 100
                };
            }
            results = results.concat(result.rows);
        }
        else if (direccionParsed.CP && direccionParsed.ESTADO) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND (codigo_postal = '' OR codigo_postal = $3 )
                AND estado = $4
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.ESTADO];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 100,
                    tipo_viabilidad: 100,
                    nombre_viabilidad: 100,
                    codigo_postal: 100,
                    estado: 100,
                };
            }
            results = results.concat(result.rows);
        }
        else if (direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND estado = $3
                AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
  			    OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 100,
                    tipo_viabilidad: 100,
                    nombre_viabilidad: 100,
                    estado: 100,
                    numero_exterior: 100
                };
            }
            results = results.concat(result.rows);
        }
        else if (direccionParsed.COLONIA) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND (colonia = '' OR colonia LIKE '%' || $3 || '%')
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 100,
                    tipo_viabilidad: 100,
                    nombre_viabilidad: 100,
                    colonia: 100
                };
            }
            results = results.concat(result.rows);
        }
        else if (direccionParsed.CP) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND (codigo_postal = '' OR codigo_postal = $3 )
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 100,
                    tipo_viabilidad: 100,
                    nombre_viabilidad: 100,
                    codigo_postal: 100
                };
            }
            results = results.concat(result.rows);
        }
        else if (direccionParsed.MUNICIPIO) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND municipio = $2
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 100,
                    tipo_viabilidad: 100,
                    nombre_viabilidad: 100,
                    municipio: 100
                };
            }
            results = results.concat(result.rows);
        }
        else if (direccionParsed.ESTADO) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND estado = $3
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.ESTADO];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 100,
                    tipo_viabilidad: 100,
                    nombre_viabilidad: 100,
                    estado: 100
                };
            }
            results = results.concat(result.rows);
        }
        else if (direccionParsed.NUMEXTNUM1) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND ((CAST(l_refaddr AS INTEGER) <= $3 AND CAST(l_nrefaddr AS INTEGER) >= $3)
  			    OR (CAST(r_refaddr AS INTEGER) <= $3 AND CAST(r_nrefaddr AS INTEGER) >= $3))
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.NUMEXTNUM1];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 100,
                    tipo_viabilidad: 100,
                    nombre_viabilidad: 100,
                    numero_exterior: 100
                };
            }
            results = results.concat(result.rows);
        }
        else {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 100,
                    tipo_viabilidad: 100,
                    nombre_viabilidad: 100
                };
            }
            results = results.concat(result.rows);
        }
    }
    /* if (direccionParsed.TIPOASEN) {
        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
        query = `
            SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
            FROM carto_geolocalizador
            WHERE tipo_asentamiento = $1
            AND nombre_asentamiento like '%' || $2 || '%'
            AND codigo_postal = $3 
            AND municipio = $4
            AND estado = $5
            AND (CAST(l_refaddr AS INTEGER) <= $6 OR CAST(r_refaddr AS INTEGER) <= $6)
              AND (CAST(l_nrefaddr AS INTEGER) >= $6 OR CAST(r_nrefaddr AS INTEGER) >= $6)
            ;
        `;
        values = [direccionParsed.TIPOASEN, direccionParsed.NOMASEN, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
        const result = await pgClient.query(query, values);
        rows = rows.concat(result.rows);
    } */
    return results;
}
module.exports = scoringMaestro;