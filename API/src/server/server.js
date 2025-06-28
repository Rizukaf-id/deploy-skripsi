require('dotenv').config();
 
const Hapi = require('@hapi/hapi');
const Path = require('path');
const routes = require('../server/routes');
const loadModel = require('../services/loadModel');
const InputError = require('../exceptions/InputError');
 
(async () => {
    const server = Hapi.server({
        port: process.env.PORT || 3000,
        host: process.env.HOST || '0.0.0.0',
        routes: {
            cors: {
              origin: process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : ['*'],
            },
        },
    });    // Register inert plugin for serving static files
    await server.register(require('@hapi/inert'));

    server.route(routes);
 
    server.ext('onPreResponse', function (request, h) {
        const response = request.response;
 
        if (response instanceof InputError) {
            const newResponse = h.response({
                status: 'fail',
                message: `${response.message} Silakan gunakan foto lain.`
            });
            newResponse.code(response.output.statusCode);
            return newResponse;
        }
 
        if (response.isBoom) {
            const newResponse = h.response({
                status: 'fail',
                message: response.message
            });
            newResponse.code(response.output.statusCode);
            return newResponse;
        }
 
        return h.continue;
    });
 
    await server.start();
    console.log('Server running on %s', server.info.uri);
})();