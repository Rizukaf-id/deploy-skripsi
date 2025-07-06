const fs = require('fs');
const path = require('path');
require('dotenv').config();

function getRecommendationBySkinType(label) {
    const recommendationsPath = path.join(__dirname, '../recommendations.json');
    const productsPath = path.join(__dirname, '../products.json');
    
    const recommendations = JSON.parse(fs.readFileSync(recommendationsPath, 'utf-8'));
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    
    const skinTypeData = recommendations[label];
    if (!skinTypeData) return null;
    
    // Get product details based on recommendation IDs
    const productList = skinTypeData.recommendation.map(productId => products[productId]).filter(Boolean);
    
    return {
        prediction: skinTypeData.prediction,
        recommendation: productList
    };
}

module.exports = getRecommendationBySkinType;