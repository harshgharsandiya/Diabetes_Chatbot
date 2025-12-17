const { extractTextFromImage } = require("../services/ocr.service");
const { analyzePrescriptionText } = require("../services/prescription.service");
const Medication = require("../models/Medication");

exports.uploadPrescription = async (req, res) => {
    let savedMeds = [];

    try {
        console.log("POST Prescription API (Tesseract OCR + Groq)");

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        console.log("File received:", req.file.originalname);

        /* =========================
           1️⃣ OCR STEP (TESSERACT)
        ========================== */

        console.log("Running OCR using Tesseract...");
        const extractedText = await extractTextFromImage(req.file.buffer);

        if (!extractedText || extractedText.length < 10) {
            return res.status(422).json({
                message: "Unable to read prescription text clearly.",
                rawText: extractedText,
            });
        }

        console.log("---- OCR TEXT ----");
        console.log(extractedText);

        /* =========================
           2️⃣ AI UNDERSTANDING STEP
        ========================== */

        console.log("Sending OCR text to Groq for analysis...");
        const aiData = await analyzePrescriptionText(extractedText);

        if (!aiData || !aiData.medications || aiData.medications.length === 0) {
            return res.status(422).json({
                message: "No medications detected.",
                rawText: extractedText,
            });
        }

        /* =========================
           3️⃣ SAVE TO DATABASE
        ========================== */

        console.log(`AI found ${aiData.medications.length} medications. Saving...`);

        const savePromises = aiData.medications.map((med) => {
            if (!med.name) return Promise.resolve(null);

            const newMedication = new Medication({
                user: req.user.id,
                name: med.name,
                dosage: med.dosage || "TBD",
                frequency: med.frequency || "As Needed",
                times: med.times || [],
                notes: med.notes || "Auto-generated from prescription scan.",
            });

            return newMedication.save();
        });

        const results = await Promise.all(savePromises);
        savedMeds = results.filter(Boolean);

        /* =========================
           4️⃣ RESPONSE
        ========================== */

        res.status(200).json({
            message: `File processed! ${savedMeds.length} new medications added.`,
            file: req.file.originalname,
            patient: aiData.patientName || null,
            doctor: aiData.doctorName || null,
            rawText: extractedText,
            savedMedications: savedMeds,
        });

    } catch (error) {
        console.error("POST error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
