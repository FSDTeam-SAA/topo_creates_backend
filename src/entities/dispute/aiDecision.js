import { GoogleGenerativeAI } from "@google/generative-ai";
import { Dispute } from "./dispute.model.js";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');




// 1. SYSTEM PROMPT (Optimized for JSON enforcement)
const MUSE_GALA_SYSTEM_PROMPT = `
You are the Muse Gala Dispute Resolution AI. You must analyze disputes based on these specific policies:

- FULL REFUND: Granted if item did not arrive, order was canceled by platform/lender, or item arrived unwearable/incorrect and is UNWORN[cite: 39, 40, 42, 43, 50, 52].
- NO REFUND: Strict policy for change of mind, fit/style issues, or notifications sent after 24 hours of delivery[cite: 36, 44, 53, 56, 58].
- INSURANCE PAYOUT ($5 fee paid): Minor damage triggers an automatic $30 lender payout[cite: 84, 114]. Major damage has tiered caps based on RRP[cite: 130].
- NO INSURANCE: Customer is charged lender's fees or replacement value[cite: 7, 102, 132].
- FALLBACK: If descriptions are contradictory or gibberish, set outcome to "Escalated" for senior admin review[cite: 23, 280, 282].

YOU MUST RESPOND ONLY IN JSON FORMAT WITH THESE KEYS:
{
  "verdict": "string",
  "applicable_policy": "string",
  "reasoning": "string",
  "suggested_action": "string",
  "admin_internal_note": "string"
}`;

export const analyzeDisputeController = async (req, res) => {
  try {
    const disputeDoc = await Dispute.findById(req.params.id); 
    if (!disputeDoc) return res.status(404).json({ success: false, message: "Dispute not found" });

    const analysisPayload = {
      issueType: disputeDoc.issueType,
      userDescription: disputeDoc.description,
      escalationDescription: disputeDoc.escalationDescription,
      escalationReason: disputeDoc.escalationReason,
      escalationPriority: disputeDoc.escalationPriority,
      hasInsurance: disputeDoc.insuranceStatus || false
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // Use 1.5-flash or 2.0-flash for high-speed JSON
      systemInstruction: MUSE_GALA_SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json", // This forces the model to output valid JSON
      }
    });

    const prompt = `Analyze this dispute data: ${JSON.stringify(analysisPayload)}`;
    
    const result = await model.generateContent(prompt);
    
    // With responseMimeType: "application/json", response.text() is a clean JSON string
    const aiResponse = JSON.parse(result.response.text());

    return res.status(200).json({
      success: true,
      recommendation: aiResponse
    });

  } catch (error) {
    console.error("AI Analysis Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Analysis failed. Please ensure the AI model is configured for Structured Outputs." 
    });
  }
};