const postPredictHandler = require('../server/handler');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
 
const routes = [
  {
    path: '/predict',
    method: 'POST',
    handler: postPredictHandler,
    options: {
      payload: {
        allow: 'multipart/form-data',
        multipart: true
      }
    }
  },
  {
    path: '/recommendations',
    method: 'GET',
    handler: (request, h) => {
      try {
        const recommendationsPath = path.join(__dirname, '../recommendations.json');
        const recommendations = JSON.parse(fs.readFileSync(recommendationsPath, 'utf-8'));
        return h.response(recommendations).code(200);
      } catch (error) {
        console.error('Error reading recommendations:', error);
        return h.response({ 
          status: 'error',
          message: 'Could not retrieve recommendations'
        }).code(500);
      }
    }
  },
  {
    path: '/products',
    method: 'GET',
    handler: (request, h) => {
      try {
        const productsPath = path.join(__dirname, '../products.json');
        const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
        return h.response(products).code(200);
      } catch (error) {
        console.error('Error reading products:', error);
        return h.response({ 
          status: 'error',
          message: 'Could not retrieve products'
        }).code(500);
      }
    }
  },
  {
    path: '/assets/{param*}',
    method: 'GET',
    handler: {
      directory: {
        path: path.join(__dirname, '../../assets'),
        redirectToSlash: true,
        index: false
      }
    }
  },
  {
    path: '/uploads/{param*}',
    method: 'GET',
    handler: {
      directory: {
        path: path.join(__dirname, '../../', process.env.UPLOAD_PATH || 'uploads'),
        redirectToSlash: true,
        index: false
      }
    }
  }
]
 
module.exports = routes;