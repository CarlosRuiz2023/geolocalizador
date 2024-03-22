const { Client } = require('pg');

// Configuración del cliente PostgreSQL
const pgClient = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'BGW',
    password: 'root',
    port: 5432, // Cambia esto si tu servidor PostgreSQL está en un puerto diferente
});
pgClient.connect();

// Función para parsear la dirección según la Norma Técnica sobre Domicilios Geográficos
async function scoringMaestro(direccionParsed) {
    let query = '';
    let values = [];
    let rows = [];
    if (direccionParsed.TIPOVIAL) {
        //console.log(parseDireccion.CP);
        if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND codigo_postal = $3 
                AND municipio = $4
                AND estado = $5
                AND ((CAST(l_refaddr AS INTEGER) <= $6 AND CAST(l_nrefaddr AS INTEGER) >= $6)
  			    OR (CAST(r_refaddr AS INTEGER) <= $6 AND CAST(r_nrefaddr AS INTEGER) >= $6))
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 100,
                    tipo_viabilidad: 100,
                    nombre_viabilidad: 100,
                    codigo_postal: 100,
                    municipio: 100,
                    estado: 100,
                    numero_exterior: 100
                };
            }
            rows = rows.concat(result.rows);
            if (result.rows.length === 0) {
                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                query = `
                    SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                    FROM carto_geolocalizador
                    WHERE tipo_vialidad = $1
                    AND nombre_vialidad like '%' || $2 || '%'
                    AND municipio = $3
                    AND estado = $4
                    AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                    OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
                    ;
                `;
                values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
                const result = await pgClient.query(query, values);
                for (let i = 0; i < result.rows.length; i++) {
                    result.rows[i].scoring = {
                        fiability: 95,
                        tipo_viabilidad: 100,
                        nombre_viabilidad: 100,
                        codigo_postal: 0,
                        municipio: 100,
                        estado: 100,
                        numero_exterior: 100
                    };
                }
                rows = rows.concat(result.rows);
                if (result.rows.length === 0) {
                    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                    query = `
                        SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                        FROM carto_geolocalizador
                        WHERE tipo_vialidad = $1
                        AND nombre_vialidad like '%' || $2 || '%'
                        AND codigo_postal = $3 
                        AND estado = $4
                        AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                        OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
                        ;
                    `;
                    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
                    const result = await pgClient.query(query, values);
                    for (let i = 0; i < result.rows.length; i++) {
                        result.rows[i].scoring = {
                            fiability: 95,
                            tipo_viabilidad: 100,
                            nombre_viabilidad: 100,
                            codigo_postal: 100,
                            municipio: 0,
                            estado: 100,
                            numero_exterior: 100
                        };
                    }
                    rows = rows.concat(result.rows);
                    if (result.rows.length === 0) {
                        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                        query = `
                            SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                            FROM carto_geolocalizador
                            WHERE tipo_vialidad = $1
                            AND nombre_vialidad like '%' || $2 || '%'
                            AND codigo_postal = $3 
                            AND municipio = $4
                            AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                            OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
                            ;
                        `;
                        values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1];
                        const result = await pgClient.query(query, values);
                        for (let i = 0; i < result.rows.length; i++) {
                            result.rows[i].scoring = {
                                fiability: 95,
                                tipo_viabilidad: 100,
                                nombre_viabilidad: 100,
                                codigo_postal: 100,
                                municipio: 100,
                                estado: 0,
                                numero_exterior: 100
                            };
                        }
                        rows = rows.concat(result.rows);
                        if (result.rows.length === 0) {
                            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                            query = `
                                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                                FROM carto_geolocalizador
                                WHERE tipo_vialidad = $1
                                AND nombre_vialidad like '%' || $2 || '%'
                                AND codigo_postal = $3
                                AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                                ;
                            `;
                            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.NUMEXTNUM1];
                            const result = await pgClient.query(query, values);
                            for (let i = 0; i < result.rows.length; i++) {
                                result.rows[i].scoring = {
                                    fiability: 90,
                                    tipo_viabilidad: 100,
                                    nombre_viabilidad: 100,
                                    codigo_postal: 100,
                                    municipio: 0,
                                    estado: 0,
                                    numero_exterior: 100
                                };
                            }
                            rows = rows.concat(result.rows);
                            if (result.rows.length === 0) {
                                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                query = `
                                    SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                                    FROM carto_geolocalizador
                                    WHERE tipo_vialidad = $1
                                    AND nombre_vialidad like '%' || $2 || '%'
                                    AND municipio = $3
                                    AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                    OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                                    ;
                                `;
                                values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1];
                                const result = await pgClient.query(query, values);
                                for (let i = 0; i < result.rows.length; i++) {
                                    result.rows[i].scoring = {
                                        fiability: 90,
                                        tipo_viabilidad: 100,
                                        nombre_viabilidad: 100,
                                        codigo_postal: 0,
                                        municipio: 100,
                                        estado: 0,
                                        numero_exterior: 100
                                    };
                                }
                                rows = rows.concat(result.rows);
                                if (result.rows.length === 0) {
                                    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                    query = `
                                        SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                                        FROM carto_geolocalizador
                                        WHERE tipo_vialidad = $1
                                        AND nombre_vialidad like '%' || $2 || '%'
                                        AND codigo_postal = $3
                                        AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                        OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                                        ;
                                    `;
                                    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.NUMEXTNUM1];
                                    const result = await pgClient.query(query, values);
                                    for (let i = 0; i < result.rows.length; i++) {
                                        result.rows[i].scoring = {
                                            fiability: 90,
                                            tipo_viabilidad: 100,
                                            nombre_viabilidad: 100,
                                            codigo_postal: 100,
                                            municipio: 0,
                                            estado: 0,
                                            numero_exterior: 100
                                        };
                                    }
                                    rows = rows.concat(result.rows);
                                    if (result.rows.length === 0) {
                                        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                        query = `
                                            SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                                            FROM carto_geolocalizador
                                            WHERE tipo_vialidad = $1
                                            AND nombre_vialidad like '%' || $2 || '%'
                                            AND codigo_postal = $3 
                                            AND municipio = $4
                                            AND estado = $5
                                            ;
                                        `;
                                        values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                                        const result = await pgClient.query(query, values);
                                        for (let i = 0; i < result.rows.length; i++) {
                                            result.rows[i].scoring = {
                                                fiability: 85,
                                                tipo_viabilidad: 100,
                                                nombre_viabilidad: 100,
                                                codigo_postal: 100,
                                                municipio: 100,
                                                estado: 100,
                                                numero_exterior: 0
                                            };
                                        }
                                        rows = rows.concat(result.rows);
                                        if (result.rows.length === 0) {
                                            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                            query = `
                                                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                                                FROM carto_geolocalizador
                                                WHERE tipo_vialidad = $1
                                                AND nombre_vialidad like '%' || $2 || '%'
                                                AND codigo_postal = $3
                                                AND municipio = $4
                                                ;
                                            `;
                                            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO];
                                            const result = await pgClient.query(query, values);
                                            for (let i = 0; i < result.rows.length; i++) {
                                                result.rows[i].scoring = {
                                                    fiability: 80,
                                                    tipo_viabilidad: 100,
                                                    nombre_viabilidad: 100,
                                                    codigo_postal: 100,
                                                    municipio: 100,
                                                    estado: 0,
                                                    numero_exterior: 0
                                                };
                                            }
                                            rows = rows.concat(result.rows);
                                            if (result.rows.length === 0) {
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
                                                        fiability: 80,
                                                        tipo_viabilidad: 100,
                                                        nombre_viabilidad: 100,
                                                        codigo_postal: 0,
                                                        municipio: 100,
                                                        estado: 100,
                                                        numero_exterior: 0
                                                    };
                                                }
                                                rows = rows.concat(result.rows);
                                                if (result.rows.length === 0) {
                                                    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                                    query = `
                                                        SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                                                        FROM carto_geolocalizador
                                                        WHERE tipo_vialidad = $1
                                                        AND nombre_vialidad like '%' || $2 || '%'
                                                        AND codigo_postal = $3
                                                        AND estado = $4
                                                        ;
                                                    `;
                                                    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.ESTADO];
                                                    const result = await pgClient.query(query, values);
                                                    for (let i = 0; i < result.rows.length; i++) {
                                                        result.rows[i].scoring = {
                                                            fiability: 80,
                                                            tipo_viabilidad: 100,
                                                            nombre_viabilidad: 100,
                                                            codigo_postal: 100,
                                                            municipio: 0,
                                                            estado: 100,
                                                            numero_exterior: 0
                                                        };
                                                    }
                                                    rows = rows.concat(result.rows);
                                                    if (result.rows.length === 0) {
                                                        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                                        query = `
                                                            SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                                                            FROM carto_geolocalizador
                                                            WHERE tipo_vialidad = $1
                                                            AND codigo_postal = $2 
                                                            AND municipio = $3
                                                            AND estado = $4
                                                            AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
                                                            OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
                                                            ;
                                                        `;
                                                        values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
                                                        const result = await pgClient.query(query, values);
                                                        for (let i = 0; i < result.rows.length; i++) {
                                                            result.rows[i].scoring = {
                                                                fiability: 50,
                                                                tipo_viabilidad: 100,
                                                                nombre_viabilidad: 0,
                                                                codigo_postal: 100,
                                                                municipio: 100,
                                                                estado: 100,
                                                                numero_exterior: 100
                                                            };
                                                        }
                                                        rows = rows.concat(result.rows);
                                                        if (result.rows.length === 0) {
                                                            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                                            query = `
                                                                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                                                                FROM carto_geolocalizador
                                                                WHERE tipo_vialidad = $1
                                                                AND municipio = $2
                                                                AND estado = $3
                                                                AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                                OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                                                                ;
                                                            `;
                                                            values = [direccionParsed.TIPOVIAL, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
                                                            const result = await pgClient.query(query, values);
                                                            for (let i = 0; i < result.rows.length; i++) {
                                                                result.rows[i].scoring = {
                                                                    fiability: 45,
                                                                    tipo_viabilidad: 100,
                                                                    nombre_viabilidad: 0,
                                                                    codigo_postal: 0,
                                                                    municipio: 100,
                                                                    estado: 100,
                                                                    numero_exterior: 100
                                                                };
                                                            }
                                                            rows = rows.concat(result.rows);
                                                            if (result.rows.length === 0) {
                                                                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                                                query = `
                                                                    SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                                                                    FROM carto_geolocalizador
                                                                    WHERE tipo_vialidad = $1
                                                                    AND codigo_postal = $2
                                                                    AND municipio = $3
                                                                    AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                                    OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                                                                    ;
                                                                `;
                                                                values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1];
                                                                const result = await pgClient.query(query, values);
                                                                for (let i = 0; i < result.rows.length; i++) {
                                                                    result.rows[i].scoring = {
                                                                        fiability: 45,
                                                                        tipo_viabilidad: 100,
                                                                        nombre_viabilidad: 0,
                                                                        codigo_postal: 100,
                                                                        municipio: 100,
                                                                        estado: 0,
                                                                        numero_exterior: 100
                                                                    };
                                                                }
                                                                rows = rows.concat(result.rows);
                                                                if (result.rows.length === 0) {
                                                                    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                                                    query = `
                                                                        SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                                                                        FROM carto_geolocalizador
                                                                        WHERE tipo_vialidad = $1
                                                                        AND codigo_postal = $2
                                                                        AND estado = $3
                                                                        AND ((CAST(l_refaddr AS INTEGER) <= $4 AND CAST(l_nrefaddr AS INTEGER) >= $4)
                                                                        OR (CAST(r_refaddr AS INTEGER) <= $4 AND CAST(r_nrefaddr AS INTEGER) >= $4))
                                                                        ;
                                                                    `;
                                                                    values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
                                                                    const result = await pgClient.query(query, values);
                                                                    for (let i = 0; i < result.rows.length; i++) {
                                                                        result.rows[i].scoring = {
                                                                            fiability: 45,
                                                                            tipo_viabilidad: 100,
                                                                            nombre_viabilidad: 0,
                                                                            codigo_postal: 100,
                                                                            municipio: 0,
                                                                            estado: 100,
                                                                            numero_exterior: 100
                                                                        };
                                                                    }
                                                                    rows = rows.concat(result.rows);
                                                                    if (result.rows.length === 0) {
                                                                        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                                                        query = `
                                                                            SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                                                                            FROM carto_geolocalizador
                                                                            WHERE tipo_vialidad = $1
                                                                            AND codigo_postal = $2
                                                                            AND municipio = $3
                                                                            AND estado = $4
                                                                            ;
                                                                        `;
                                                                        values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                                                                        const result = await pgClient.query(query, values);
                                                                        for (let i = 0; i < result.rows.length; i++) {
                                                                            result.rows[i].scoring = {
                                                                                fiability: 35,
                                                                                tipo_viabilidad: 100,
                                                                                nombre_viabilidad: 0,
                                                                                codigo_postal: 100,
                                                                                municipio: 100,
                                                                                estado: 100,
                                                                                numero_exterior: 0
                                                                            };
                                                                        }
                                                                        rows = rows.concat(result.rows);
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND codigo_postal = $3 
                AND municipio = $4
                AND estado = $5
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 100,
                    tipo_viabilidad: 100,
                    nombre_viabilidad: 100,
                    codigo_postal: 100,
                    municipio: 100,
                    estado: 100
                };
            }
            rows = rows.concat(result.rows);
            if (result.rows.length === 0) {
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
                        fiability: 90,
                        tipo_viabilidad: 100,
                        nombre_viabilidad: 100,
                        codigo_postal: 0,
                        municipio: 100,
                        estado: 100
                    };
                }
                rows = rows.concat(result.rows);
                if (result.rows.length === 0) {
                    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                    query = `
                        SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                        FROM carto_geolocalizador
                        WHERE tipo_vialidad = $1
                        AND nombre_vialidad like '%' || $2 || '%'
                        AND codigo_postal = $3 
                        AND estado = $4
                        ;
                    `;
                    values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.ESTADO];
                    const result = await pgClient.query(query, values);
                    for (let i = 0; i < result.rows.length; i++) {
                        result.rows[i].scoring = {
                            fiability: 90,
                            tipo_viabilidad: 100,
                            nombre_viabilidad: 100,
                            codigo_postal: 100,
                            municipio: 0,
                            estado: 100
                        };
                    }
                    rows = rows.concat(result.rows);
                    if (result.rows.length === 0) {
                        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                        query = `
                            SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                            FROM carto_geolocalizador
                            WHERE tipo_vialidad = $1
                            AND nombre_vialidad like '%' || $2 || '%'
                            AND codigo_postal = $3 
                            AND municipio = $4
                            ;
                        `;
                        values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO];
                        const result = await pgClient.query(query, values);
                        for (let i = 0; i < result.rows.length; i++) {
                            result.rows[i].scoring = {
                                fiability: 90,
                                tipo_viabilidad: 100,
                                nombre_viabilidad: 100,
                                codigo_postal: 100,
                                municipio: 100,
                                estado: 0
                            };
                        }
                        rows = rows.concat(result.rows);
                        if (result.rows.length === 0) {
                            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                            query = `
                                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                                FROM carto_geolocalizador
                                WHERE tipo_vialidad = $1
                                AND nombre_vialidad like '%' || $2 || '%'
                                AND codigo_postal = $3
                                ;
                            `;
                            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP];
                            const result = await pgClient.query(query, values);
                            for (let i = 0; i < result.rows.length; i++) {
                                result.rows[i].scoring = {
                                    fiability: 80,
                                    tipo_viabilidad: 100,
                                    nombre_viabilidad: 100,
                                    codigo_postal: 100,
                                    municipio: 0,
                                    estado: 0
                                };
                            }
                            rows = rows.concat(result.rows);
                            if (result.rows.length === 0) {
                                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                query = `
                                        SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                                        FROM carto_geolocalizador
                                        WHERE tipo_vialidad = $1
                                        AND nombre_vialidad like '%' || $2 || '%'
                                        AND municipio = $3
                                        ;
                                    `;
                                values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO];
                                const result = await pgClient.query(query, values);
                                for (let i = 0; i < result.rows.length; i++) {
                                    result.rows[i].scoring = {
                                        fiability: 80,
                                        tipo_viabilidad: 100,
                                        nombre_viabilidad: 100,
                                        codigo_postal: 0,
                                        municipio: 100,
                                        estado: 0
                                    };
                                }
                                rows = rows.concat(result.rows);
                                if (result.rows.length === 0) {
                                    // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                    query = `
                                                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                                                FROM carto_geolocalizador
                                                WHERE tipo_vialidad = $1
                                                AND codigo_postal = $2 
                                                AND municipio = $3
                                                AND estado = $4
                                                ;
                                            `;
                                    values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                                    const result = await pgClient.query(query, values);
                                    for (let i = 0; i < result.rows.length; i++) {
                                        result.rows[i].scoring = {
                                            fiability: 50,
                                            tipo_viabilidad: 100,
                                            nombre_viabilidad: 0,
                                            codigo_postal: 100,
                                            municipio: 100,
                                            estado: 100
                                        };
                                    }
                                    rows = rows.concat(result.rows);
                                    if (result.rows.length === 0) {
                                        // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                        query = `
                                                    SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                                                    FROM carto_geolocalizador
                                                    WHERE tipo_vialidad = $1
                                                    AND municipio = $2
                                                    AND estado = $3
                                                    ;
                                                `;
                                        values = [direccionParsed.TIPOVIAL, direccionParsed.MUNICIPIO, direccionParsed.ESTADO];
                                        const result = await pgClient.query(query, values);
                                        for (let i = 0; i < result.rows.length; i++) {
                                            result.rows[i].scoring = {
                                                fiability: 40,
                                                tipo_viabilidad: 100,
                                                nombre_viabilidad: 0,
                                                codigo_postal: 0,
                                                municipio: 100,
                                                estado: 100
                                            };
                                        }
                                        rows = rows.concat(result.rows);
                                        if (result.rows.length === 0) {
                                            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                            query = `
                                                        SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                                                        FROM carto_geolocalizador
                                                        WHERE tipo_vialidad = $1
                                                        AND codigo_postal = $2
                                                        AND municipio = $3
                                                        ;
                                                    `;
                                            values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO];
                                            const result = await pgClient.query(query, values);
                                            for (let i = 0; i < result.rows.length; i++) {
                                                result.rows[i].scoring = {
                                                    fiability: 40,
                                                    tipo_viabilidad: 100,
                                                    nombre_viabilidad: 0,
                                                    codigo_postal: 100,
                                                    municipio: 100,
                                                    estado: 0
                                                };
                                            }
                                            rows = rows.concat(result.rows);
                                            if (result.rows.length === 0) {
                                                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                                                query = `
                                                            SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                                                            FROM carto_geolocalizador
                                                            WHERE tipo_vialidad = $1
                                                            AND codigo_postal = $2
                                                            AND estado = $3
                                                            ;
                                                        `;
                                                values = [direccionParsed.TIPOVIAL, direccionParsed.CP, direccionParsed.ESTADO];
                                                const result = await pgClient.query(query, values);
                                                for (let i = 0; i < result.rows.length; i++) {
                                                    result.rows[i].scoring = {
                                                        fiability: 40,
                                                        tipo_viabilidad: 100,
                                                        nombre_viabilidad: 0,
                                                        codigo_postal: 100,
                                                        municipio: 0,
                                                        estado: 100
                                                    };
                                                }
                                                rows = rows.concat(result.rows);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        else if (direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND municipio = $3
                AND estado = $4
                AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
  			    OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 100,
                    tipo_viabilidad: 100,
                    nombre_viabilidad: 100,
                    municipio: 100,
                    estado: 100,
                    numero_exterior: 100
                };
            }
            rows = rows.concat(result.rows);
        }
        else if (direccionParsed.CP && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND codigo_postal = $3 
                AND estado = $4
                AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
  			    OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.ESTADO, direccionParsed.NUMEXTNUM1];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 100,
                    tipo_viabilidad: 100,
                    nombre_viabilidad: 100,
                    codigo_postal: 100,
                    estado: 100,
                    numero_exterior: 100
                };
            }
            rows = rows.concat(result.rows);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.NUMEXTNUM1) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND codigo_postal = $3 
                AND municipio = $4
                AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
  			    OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1];
            const result = await pgClient.query(query, values);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 100,
                    tipo_viabilidad: 100,
                    nombre_viabilidad: 100,
                    codigo_postal: 100,
                    municipio: 100,
                    numero_exterior: 100
                };
            }
            rows = rows.concat(result.rows);
        }
        else if (direccionParsed.CP && direccionParsed.NUMEXTNUM1) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND codigo_postal = $3 
                AND ((CAST(l_refaddr AS INTEGER) <= $5 AND CAST(l_nrefaddr AS INTEGER) >= $5)
  			    OR (CAST(r_refaddr AS INTEGER) <= $5 AND CAST(r_nrefaddr AS INTEGER) >= $5))
                ;
            `;
            values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.NUMEXTNUM1];
            const result = await pgClient.query(query, values);
            rows = rows.concat(result.rows);
            for (let i = 0; i < result.rows.length; i++) {
                result.rows[i].scoring = {
                    fiability: 100,
                    tipo_viabilidad: 100,
                    nombre_viabilidad: 100,
                    codigo_postal: 100,
                    numero_exterior: 100
                };
            }
            rows = rows.concat(result.rows);
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
            rows = rows.concat(result.rows);
        }
        else if (direccionParsed.CP && direccionParsed.MUNICIPIO) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND codigo_postal = $3 
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
            rows = rows.concat(result.rows);
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
            rows = rows.concat(result.rows);
        }
        else if (direccionParsed.CP && direccionParsed.ESTADO) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND codigo_postal = $3 
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
            rows = rows.concat(result.rows);
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
            rows = rows.concat(result.rows);
        }
        else if (direccionParsed.CP) {
            // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
            query = `
                SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                FROM carto_geolocalizador
                WHERE tipo_vialidad = $1
                AND nombre_vialidad like '%' || $2 || '%'
                AND codigo_postal = $3
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
            rows = rows.concat(result.rows);
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
            rows = rows.concat(result.rows);
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
            rows = rows.concat(result.rows);
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
            rows = rows.concat(result.rows);
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
            rows = rows.concat(result.rows);
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
    return rows;
}
module.exports = scoringMaestro;