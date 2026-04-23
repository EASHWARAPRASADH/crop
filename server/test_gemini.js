import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyAOqIThF3L8PfIn-Q3EF6mutOuOcUKNHi4');

async function test() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });
        const result = await model.generateContent("hello");
        const response = await result.response;
        console.log(JSON.stringify(response, null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
