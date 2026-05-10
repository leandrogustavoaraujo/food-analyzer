require('dotenv').config();

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

const upload = multer({
  storage: multer.memoryStorage()
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const path = require('path');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/analyze', upload.single('image'), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma imagem enviada.'
      });
    }

    const imageBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite'
    });

    const prompt = `
Analise esta imagem de comida.

Retorne APENAS um JSON válido.

Formato:
{
  "prato": "nome",
  "calorias_total": 0,
  "proteinas_total": 0,
  "confianca": "alta",
  "itens": [
    {
      "nome": "alimento",
      "quantidade": "100g",
      "calorias": 0,
      "proteinas": 0
    }
  ],
  "observacao": "texto curto"
}
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    console.log(text);

    const cleaned = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const data = JSON.parse(cleaned);

    res.json({
      success: true,
      data
    });

  } catch (error) {

    console.error('ERRO COMPLETO:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});