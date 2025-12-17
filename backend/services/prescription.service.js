const { generateSingleResponse } = require("./ai.service");

const analyzePrescriptionText = async (ocrText) => {
    const prompt = `
You are a medical assistant.

Extract prescription details from the text below.

RULES:
- Do NOT guess unreadable text
- Correct obvious spelling mistakes (e.g. Metfornin → Metformin)
- Translate medical abbreviations (bid, tid, ac, pc)
- Return ONLY valid JSON (no markdown)

TEXT:
${ocrText}

JSON FORMAT:
{
  "patientName": "string or null",
  "doctorName": "string or null",
  "medications": [
    {
      "name": "string",
      "dosage": "string or null",
      "frequency": "Once Daily | Twice Daily | Three Times Daily | As Needed",
      "times": ["HH:mm"],
      "notes": "string"
    }
  ]
}
`;

    const aiResponse = await generateSingleResponse(prompt);

    return JSON.parse(
        aiResponse.replace(/```json|```/g, "").trim()
    );
};

module.exports = { analyzePrescriptionText };
