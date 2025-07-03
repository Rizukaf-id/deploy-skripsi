const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

async function loadModel(modelName) {
    // modelName: e.g. 'mobilenet_80/model.json'
    const modelDir = process.env.MODEL_PATH || '../../../models';
    const modelPath = path.join(__dirname, modelDir, modelName);
    console.log(`Loading model from: ${modelPath}`);
    const modelJson = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
    if (modelJson.format === 'layers-model') {
        const model = await tf.loadLayersModel('file://' + modelPath);
        console.log('Model layers-model berhasil diload:', modelName);
        return model;
    } else if (modelJson.format === 'graph-model') {
        const model = await tf.loadGraphModel('file://' + modelPath);
        console.log('Model graph-model berhasil diload:', modelName);
        return model;
    } else {
        throw new Error('Format model tidak dikenali: ' + modelJson.format);
    }
}

module.exports = loadModel;