import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

// Load env variables
import dotenv from "dotenv";
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  let aiClient: GoogleGenAI | null = null;

  function getAiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it in Settings > Secrets.");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });
    }
    return aiClient;
  }

  // API endpoint for Gemini Intelligence
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { prompt, context, useHighThinking } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const client = getAiClient();
      
      const systemInstruction = `You are "Frame Cut Studio AI Intelligence", a brilliant studio management and enterprise resource planning (ERP) expert for Frame Cut Studio, a premier wedding video editing house.
Your audience consists of System Admins (like Satish Tiwari), Video Editors (like Vansh), and Wedding Studio clients (like Wedding By KK).
You have access to real-time workspace context about projects, editors, studios, finances, and calendar events.
Use this context to answer user questions, analyze team productivity, evaluate financial health, draft client emails, optimize editing queues, and troubleshoot wedding video project timelines.
Always give elegant, professional, and clear answers. Keep answers structured using Markdown (bullet points, tables, bold highlights).
If no context is provided, politely ask the user what they would like to analyze.

Real-Time Studio Database Context:
${JSON.stringify(context || {}, null, 2)}`;

      const modelName = useHighThinking ? "gemini-3.1-pro-preview" : "gemini-3.5-flash";

      const config: any = {
        systemInstruction,
      };

      if (useHighThinking) {
        config.thinkingConfig = {
          thinkingLevel: ThinkingLevel.HIGH,
        };
      }

      let response;
      let finalModel = modelName;
      let finalHighThinking = useHighThinking;
      let fallbackOccurred = false;

      try {
        response = await client.models.generateContent({
          model: modelName,
          contents: prompt,
          config,
        });
      } catch (firstError: any) {
        console.warn(`Primary model ${modelName} failed, attempting fallback...`, firstError.message || firstError);
        
        // Check if the error is related to quota or 3.1 pro availability
        if (useHighThinking && modelName === "gemini-3.1-pro-preview") {
          fallbackOccurred = true;
          try {
            finalModel = "gemini-2.5-pro";
            console.log("Attempting fallback to gemini-2.5-pro...");
            
            // Setup fallback config for gemini-2.5-pro with thinking budget
            const fallbackConfig: any = {
              systemInstruction,
              thinkingConfig: {
                thinkingBudget: 2048,
              }
            };
            
            response = await client.models.generateContent({
              model: "gemini-2.5-pro",
              contents: prompt,
              config: fallbackConfig,
            });
          } catch (secondError: any) {
            console.warn("Fallback to gemini-2.5-pro failed. Falling back to gemini-3.5-flash standard mode...", secondError.message || secondError);
            
            finalModel = "gemini-3.5-flash";
            finalHighThinking = false;
            
            response = await client.models.generateContent({
              model: "gemini-3.5-flash",
              contents: prompt,
              config: { systemInstruction },
            });
          }
        } else {
          // If 3.5 flash itself failed or it's not a 3.1 pro thinking error, rethrow
          throw firstError;
        }
      }

      let responseText = response.text || "";
      if (fallbackOccurred && finalModel !== "gemini-3.1-pro-preview") {
        responseText += `\n\n*(Note: Automatic fallback to **${finalModel}** occurred due to your current Gemini API Key quota restrictions for the preview model.)*`;
      }

      res.json({
        text: responseText,
        model: finalModel,
        useHighThinking: finalHighThinking,
        quotaLimited: fallbackOccurred,
      });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      const isQuotaError = error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED") || error.status === "RESOURCE_EXHAUSTED" || error.code === 429;
      res.status(isQuotaError ? 429 : 500).json({
        error: error.message || "An error occurred while generating content from Gemini API.",
        quotaLimited: isQuotaError
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development or static server for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
