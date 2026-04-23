import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// @desc    Analyze photo for gender, lighting, and position
// @route   POST /api/ai/analyze-photo
export const analyzePhoto = async (req, res) => {
    try {
        const { imageBase64, mimeType, mode } = req.body;
        if (!imageBase64) {
            return res.status(400).json({ error: 'imageBase64 is required' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType || 'image/jpeg',
            },
        };

        let prompt;
        if (mode === 'gender') {
            prompt = "Look closely at this person's photo. Is this person male or female? Reply with exactly one word: 'male' or 'female'.";
        } else {
            // Detailed analysis mode
            prompt = `You are a professional photo studio AI assistant. Analyze this person's photo and return a JSON object with:
1. "gender": "male" or "female" — look at facial features, hair, clothing
2. "lighting_quality": "good", "dark", or "bright" — assess if lighting is even, too dark, or overexposed
3. "face_position": "centered", "left", "right", "top", or "bottom" — where the face is in the frame

Rules:
- Carefully examine facial features, hair style, clothing to determine gender accurately
- "dark" means shadows dominate, "bright" means washed out / overexposed, "good" means balanced
- Face position helps decide how to crop for centering

Reply ONLY with valid JSON, no other text. Example: {"gender":"female","lighting_quality":"dark","face_position":"top"}`;
        }

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        res.json({ success: true, text });
    } catch (e) {
        console.error('Error in analyzePhoto:', e);
        res.status(500).json({ error: e.message });
    }
};

// @desc    Process/Generate image using Gemini
// @route   POST /api/ai/process-image
export const processImage = async (req, res) => {
    try {
        const { imageBase64, mimeType, prompt } = req.body;
        if (!imageBase64 || !prompt) {
            return res.status(400).json({ error: 'imageBase64 and prompt are required' });
        }

        // Using gemini-3.1-flash-image-preview as per original server.js
        const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-image-preview' });

        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType || 'image/jpeg',
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        
        res.json({ success: true, data: response });
    } catch (e) {
        console.error('Error in processImage:', e);
        res.status(500).json({ error: e.message });
    }
};
