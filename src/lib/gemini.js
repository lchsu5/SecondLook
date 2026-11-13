import { GoogleGenerativeAI } from "@google/generative-ai";
import { BearClient } from "./bear";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const GeminiClient = {
  async generateSessionSummary(interventions) {
    if (!GEMINI_API_KEY) {
      throw new Error("VITE_GEMINI_API_KEY is missing. Please add it to your .env file.");
    }

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      // Prepare history
      const history = interventions.map(i => ({
          issue: i.issueTitle,
          category: i.category,
          explanation: i.explanation,
          hint: i.hint
      }));

      const promptTemplate = `You are a supportive math tutor. The student has just finished a practice session.
Here is a log of the problems they attempted and the errors they made (if any):

{{INTERVENTIONS_JSON}}

Based ONLY on this history, write a personalized summary of their performance.
1. Highlight what they did well.
2. Gently point out the main areas where they struggled.
3. Give 2-3 specific recommendations for what to practice next.
4. Keep the summary extremely concise (maximum 3 sentences).
5. Address the student directly.

Return your response as a valid JSON object with this structure:
{
  "summary": "The formatted text summary (max 3 sentences)",
  "strengths": ["list of strengths"],
  "areasForImprovement": ["list of areas"],
  "recommendations": ["list of recommendations"]
}`;

      let prompt = promptTemplate.replace(
          "{{INTERVENTIONS_JSON}}",
          JSON.stringify(history, null, 2)
      );

      // Compress with Bear 1 (Token Company)
      console.log("[GeminiClient] Original prompt length:", prompt.length);
      try {
          // We prepend a context instruction so Bear 1 knows what to keep
          const contextInstructions = "Keep the student errors and math context intact.";
          const compressedPrompt = await BearClient.compress(contextInstructions + "\n\n" + prompt);

          if (compressedPrompt && compressedPrompt.length < prompt.length) {
             console.log("[GeminiClient] Compressed prompt length:", compressedPrompt.length);
             prompt = compressedPrompt;
          } else {
             console.log("[GeminiClient] Compression didn't reduce size or failed silently.");
          }
      } catch (e) {
          console.warn("[GeminiClient] Compression failed, using original prompt:", e);
      }

      // Call Gemini
      console.log("[GeminiClient] Calling Gemini 2.5 Flash...");
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log("[GeminiClient] Gemini Response received:", text.slice(0, 100) + "...");

      // Parse JSON
      let cleanedText = text;

      // Remove markdown code blocks if present (just in case)
      if (cleanedText.includes("```json")) {
        cleanedText = cleanedText.split("```json")[1];
        if (cleanedText.includes("```")) {
            cleanedText = cleanedText.split("```")[0];
        }
      } else if (cleanedText.includes("```")) {
         cleanedText = cleanedText.split("```")[1];
         if (cleanedText.includes("```")) {
            cleanedText = cleanedText.split("```")[0];
         }
      }

      cleanedText = cleanedText.trim();

      try {
        return JSON.parse(cleanedText);
      } catch (e) {
         console.error("[GeminiClient] JSON Parse Error:", e, "Raw Text:", text);

         // Last ditch attempt: try to find the first { and last }
         try {
             const firstOpen = text.indexOf('{');
             const lastClose = text.lastIndexOf('}');
             if (firstOpen !== -1 && lastClose !== -1) {
                 const extracted = text.substring(firstOpen, lastClose + 1);
                 return JSON.parse(extracted);
             }
         } catch (e2) {
             console.error("[GeminiClient] Secondary parse failed", e2);
         }

         throw new Error("Failed to parse Gemini response as JSON");
      }

    } catch (error) {
      console.error("Gemini Summary Generation Failed:", error);
      throw error;
    }
  }
};
