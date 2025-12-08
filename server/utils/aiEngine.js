require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing in .env");
}

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

async function generateDocsForFile({ path, lang, content }) {
  if (!content || content.trim().length === 0) {
    return {
      path,
      lang,
      summary: "File empty or unreadable",
      details: "",
    };
  }

  const prompt = buildPrompt(path, lang, content);

  try {
    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    // The SDK returns structured output: extract text correctly
    const text = result.response?.text || result.text || "No content generated.";

    return {
      path,
      lang,
      summary: `AI-generated documentation for ${path}`,
      details: text.trim(),
    };

  } catch (err) {
    console.error(`❌ Gemini failed for file ${path}:`, err.message);

    return {
      path,
      lang,
      summary: `Error generating documentation`,
      details: `Gemini error: ${err.message}`,
    };
  }
}

function buildPrompt(path, lang, content) {
  return `
You are an expert senior-level engineer writing documentation.

Document the following file:

Path: ${path}
Language: ${lang}

Code:
\`\`\`${lang.toLowerCase()}
${content}
\`\`\`

Write documentation in this structure:

# Purpose
Explain what this file does.

## Architecture Role
Explain where it fits in the project.

## Key Functions / Classes
Summarize the important units with bullet points and descriptions.

## How It Works
Explain logic flow step-by-step.

## Dependencies
Note other files, libraries, frameworks involved.

## Usage Example
Show a realistic example using this module (if applicable).

## Recommended Improvements
Add refactor suggestions, performance notes, or better practices.

Use clean Markdown formatting. In the response don't write like as an senoir level software ... etc.
  `;
}

module.exports = {
  generateDocsForFile,
};
