const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const parseDireccion = require('./controlador/funciones');

// Configuración del cliente PostgreSQL
const pgClient = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'BGW',
    password: 'root',
    port: 5432, // Cambia esto si tu servidor PostgreSQL está en un puerto diferente
});
pgClient.connect();


// Creación de la aplicación Express
const app = express();
const port = 3000;

// Middleware para analizar el cuerpo de las solicitudes en formato JSON
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true })); // x-www-form-urlencoded

// Endpoint para geolocalizar una dirección proporcionada por el usuario
app.post('/geolocalizar', async (req, res) => {
    try {
        // Obtener la dirección proporcionada por el usuario desde el cuerpo de la solicitud
        const { direccion } = req.body;

        // Parsear la dirección según la Norma Técnica sobre Domicilios Geográficos
        const direccionParsed = parseDireccion(direccion);
        let query='';
        let values=[];
        let rows=[];
        let scoring=0;
        console.log(direccionParsed);
        if (direccionParsed.TIPOVIAL) {
            if(direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1){
                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                query = `
                    SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                    FROM carto_geolocalizador
                    WHERE tipo_vialidad = $1
                    AND nombre_vialidad like '%' || $2 || '%'
                    AND codigo_postal = $3 
                    AND municipio = $4
                    AND estado = $5
                    AND (CAST(l_refaddr AS INTEGER) <= $6 OR CAST(r_refaddr AS INTEGER) <= $6)
                    AND (CAST(l_nrefaddr AS INTEGER) >= $6 OR CAST(r_nrefaddr AS INTEGER) >= $6)
                    ;
                `;
                values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO,direccionParsed.NUMEXTNUM1];
                const result = await pgClient.query(query, values);
                rows = rows.concat(result.rows);
                scoring=100;
            }
            else if(direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.ESTADO){
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
                rows = rows.concat(result.rows);
                scoring=100;
            }
            else if(direccionParsed.MUNICIPIO && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1){
                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                query = `
                    SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                    FROM carto_geolocalizador
                    WHERE tipo_vialidad = $1
                    AND nombre_vialidad like '%' || $2 || '%'
                    AND municipio = $3
                    AND estado = $4
                    AND (CAST(l_refaddr AS INTEGER) <= $5 OR CAST(r_refaddr AS INTEGER) <= $5)
                    AND (CAST(l_nrefaddr AS INTEGER) >= $5 OR CAST(r_nrefaddr AS INTEGER) >= $5)
                    ;
                `;
                values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO, direccionParsed.ESTADO,direccionParsed.NUMEXTNUM1];
                const result = await pgClient.query(query, values);
                rows = rows.concat(result.rows);
            }
            else if(direccionParsed.CP && direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1){
                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                query = `
                    SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                    FROM carto_geolocalizador
                    WHERE tipo_vialidad = $1
                    AND nombre_vialidad like '%' || $2 || '%'
                    AND codigo_postal = $3 
                    AND estado = $4
                    AND (CAST(l_refaddr AS INTEGER) <= $5 OR CAST(r_refaddr AS INTEGER) <= $5)
                    AND (CAST(l_nrefaddr AS INTEGER) >= $5 OR CAST(r_nrefaddr AS INTEGER) >= $5)
                    ;
                `;
                values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.ESTADO,direccionParsed.NUMEXTNUM1];
                const result = await pgClient.query(query, values);
                rows = rows.concat(result.rows);
            }
            else if(direccionParsed.CP && direccionParsed.MUNICIPIO && direccionParsed.NUMEXTNUM1){
                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                query = `
                    SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                    FROM carto_geolocalizador
                    WHERE tipo_vialidad = $1
                    AND nombre_vialidad like '%' || $2 || '%'
                    AND codigo_postal = $3 
                    AND municipio = $4
                    AND (CAST(l_refaddr AS INTEGER) <= $5 OR CAST(r_refaddr AS INTEGER) <= $5)
                    AND (CAST(l_nrefaddr AS INTEGER) >= $5 OR CAST(r_nrefaddr AS INTEGER) >= $5)
                    ;
                `;
                values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.MUNICIPIO,direccionParsed.NUMEXTNUM1];
                const result = await pgClient.query(query, values);
                rows = rows.concat(result.rows);
            }
            else if(direccionParsed.CP && direccionParsed.NUMEXTNUM1){
                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                query = `
                    SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                    FROM carto_geolocalizador
                    WHERE tipo_vialidad = $1
                    AND nombre_vialidad like '%' || $2 || '%'
                    AND codigo_postal = $3 
                    AND (CAST(l_refaddr AS INTEGER) <= $4 OR CAST(r_refaddr AS INTEGER) <= $4)
                    AND (CAST(l_nrefaddr AS INTEGER) >= $4 OR CAST(r_nrefaddr AS INTEGER) >= $4)
                    ;
                `;
                values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.CP, direccionParsed.NUMEXTNUM1];
                const result = await pgClient.query(query, values);
                rows = rows.concat(result.rows);
            }
            else if(direccionParsed.MUNICIPIO && direccionParsed.ESTADO){
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
                rows = rows.concat(result.rows);
            }
            else if(direccionParsed.CP && direccionParsed.MUNICIPIO){
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
                rows = rows.concat(result.rows);
            }
            else if(direccionParsed.MUNICIPIO && direccionParsed.NUMEXTNUM1){
                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                query = `
                    SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                    FROM carto_geolocalizador
                    WHERE tipo_vialidad = $1
                    AND nombre_vialidad like '%' || $2 || '%'
                    AND municipio = $3
                    AND (CAST(l_refaddr AS INTEGER) <= $4 OR CAST(r_refaddr AS INTEGER) <= $4)
                    AND (CAST(l_nrefaddr AS INTEGER) >= $4 OR CAST(r_nrefaddr AS INTEGER) >= $4)
                    ;
                `;
                values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.MUNICIPIO, direccionParsed.NUMEXTNUM1];
                const result = await pgClient.query(query, values);
                rows = rows.concat(result.rows);
            }
            else if(direccionParsed.CP && direccionParsed.ESTADO){
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
                rows = rows.concat(result.rows);
            }
            else if(direccionParsed.ESTADO && direccionParsed.NUMEXTNUM1){
                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                query = `
                    SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                    FROM carto_geolocalizador
                    WHERE tipo_vialidad = $1
                    AND nombre_vialidad like '%' || $2 || '%'
                    AND estado = $3
                    AND (CAST(l_refaddr AS INTEGER) <= $4 OR CAST(r_refaddr AS INTEGER) <= $4)
                    AND (CAST(l_nrefaddr AS INTEGER) >= $4 OR CAST(r_nrefaddr AS INTEGER) >= $4)
                    ;
                `;
                values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.ESTADO,direccionParsed.NUMEXTNUM1];
                const result = await pgClient.query(query, values);
                rows = rows.concat(result.rows);
            }
            else if(direccionParsed.CP){
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
                rows = rows.concat(result.rows);
            }
            else if(direccionParsed.MUNICIPIO){
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
                rows = rows.concat(result.rows);
            }
            else if(direccionParsed.ESTADO){
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
                rows = rows.concat(result.rows);
            }
            else if(direccionParsed.NUMEXTNUM1){
                // Consultar la base de datos utilizando la función ST_AsGeoJSON para obtener las coordenadas como GeoJSON
                query = `
                    SELECT *,ST_AsText("SP_GEOMETRY") AS coordenadas
                    FROM carto_geolocalizador
                    WHERE tipo_vialidad = $1
                    AND nombre_vialidad like '%' || $2 || '%'
                    AND (CAST(l_refaddr AS INTEGER) <= $3 OR CAST(r_refaddr AS INTEGER) <= $3)
                    AND (CAST(l_nrefaddr AS INTEGER) >= $3 OR CAST(r_nrefaddr AS INTEGER) >= $3)
                    ;
                `;
                values = [direccionParsed.TIPOVIAL, direccionParsed.NOMVIAL, direccionParsed.NUMEXTNUM1];
                const result = await pgClient.query(query, values);
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
                rows = rows.concat(result.rows);
            }
        }
        if (direccionParsed.TIPOASEN) {
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
            values = [direccionParsed.TIPOASEN, direccionParsed.NOMASEN, direccionParsed.CP, direccionParsed.MUNICIPIO, direccionParsed.ESTADO,direccionParsed.NUMEXTNUM1];
            const result = await pgClient.query(query, values);
            rows = rows.concat(result.rows);
        }

        // Devolver las coordenadas encontradas
        if (result.rows.length > 0) {
            res.status(200).json(rows);
        } else {
            res.status(404).json({ error: 'Dirección especificada no encontrada.' });
        }
    } catch (error) {
        // Manejar cualquier error que pueda ocurrir durante el proceso de geolocalización
        console.error('Error al geolocalizar dirección:', error);
        res.status(500).json({ error: 'Error al geolocalizar dirección.' });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor Express escuchando en el puerto ${port}`);
});
