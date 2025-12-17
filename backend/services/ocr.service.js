const Tesseract = require("tesseract.js");
const sharp = require("sharp");

/**
 * Preprocess image to improve OCR accuracy
 */
const preprocessImage = async (imageBuffer) => {
    return sharp(imageBuffer)
        .grayscale()
        .normalize()
        .threshold(180)
        .toBuffer();
};

/**
 * Extract text using Tesseract OCR
 */
const extractTextFromImage = async (imageBuffer) => {
    try {
        const processedImage = await preprocessImage(imageBuffer);

        const {
            data: { text },
        } = await Tesseract.recognize(processedImage, "eng", {
            logger: (m) => console.log("OCR:", m.status),
        });

        return text.trim();
    } catch (error) {
        console.error("Tesseract OCR error:", error);
        throw new Error("OCR failed");
    }
};

module.exports = { extractTextFromImage };
