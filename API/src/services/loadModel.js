const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

async function loadModel(modelName) {
    try {
        // modelName: e.g. 'mobilenet_80/model.json'
        const modelDir = process.env.MODEL_PATH || '../../../models';
        const modelPath = path.resolve(__dirname, modelDir, modelName);
        
        console.log(`🔄 Loading model from: ${modelPath}`);
        
        // Check if model file exists
        if (!fs.existsSync(modelPath)) {
            throw new Error(`Model file not found: ${modelPath}`);
        }
        
        // Read model JSON to determine format
        const modelJson = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
        
        let model;
        if (modelJson.format === 'layers-model') {
            model = await tf.loadLayersModel('file://' + modelPath);
            console.log('✅ Model layers-model berhasil diload:', modelName);
        } else if (modelJson.format === 'graph-model') {
            model = await tf.loadGraphModel('file://' + modelPath);
            console.log('✅ Model graph-model berhasil diload:', modelName);
        } else {
            // Try to load as layers model by default
            model = await tf.loadLayersModel('file://' + modelPath);
            console.log('✅ Model berhasil diload (default layers-model):', modelName);
        }
        
        return model;
        
    } catch (error) {
        console.error('❌ Error loading model:', error.message);
        console.error('   Model name:', modelName);
        console.error('   Full path:', path.resolve(__dirname, process.env.MODEL_PATH || '../../../tfjs_models', modelName));
        throw error;
    }
}

module.exports = loadModel;