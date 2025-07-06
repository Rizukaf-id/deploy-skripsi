const postPredictHandler = require('./handler');
const path = require('path');

const routes = [
  {
    method: 'POST',
    path: '/predict',
    handler: postPredictHandler,
    options: {
      payload: {
        allow: 'multipart/form-data',
        multipart: true,
        maxBytes: 10 * 1024 * 1024, // 10MB
      },
    },
  },
  {
    method: 'GET',
    path: '/uploads/{filename}',
    handler: {
      directory: {
        path: path.join(__dirname, '../../uploads'),
        listing: false,
        index: false,
      },
    },
  },
  {
    method: 'GET',
    path: '/assets/{param*}',
    handler: {
      directory: {
        path: path.join(__dirname, '../../assets'),
        listing: false,
        index: false,
      },
    },
  },
  {
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return h.response({
        status: 'success',
        message: 'API Skin Type Detection is running',
        endpoints: {
          predict: 'POST /predict',
          uploads: 'GET /uploads/{filename}',
          assets: 'GET /assets/{filename}'
        }
      });
    },
  },
];

module.exports = routes;