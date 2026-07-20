import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, GenerateVideosOperation } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Setup JSON body parsing with a large limit to accommodate base64 images and videos
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initializer for Google Gen AI SDK
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ==========================================
// API ROUTES FOR GEMINI INTELLIGENCE & CREATIVE TOOLS
// ==========================================

// 1. Clinical Chat & Grounding Endpoint
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history, mode } = req.body;
    const ai = getAiClient();

    // Setup contents array with history
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      });
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    // Determine tool config based on grounding mode
    let tools: any[] | undefined = undefined;
    if (mode === "maps") {
      tools = [{ googleMaps: {} }];
    } else if (mode === "search") {
      tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: mode === "pro" ? "gemini-3.1-pro-preview" : "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: `You are Dr. Julian Sterling, lead formulation scientist at ProViva Clinic.
ProViva Clinic specializes in highly advanced, natural, organic herbal supplements:
1. HepaViva Herbal Tablets (Liver) - Pure Support for Your Body's Ultimate Filter. Contains Milk Thistle, NAC, Artichoke.
2. NephroViva Herbal Tablets (Kidney) - Premium Care for Your Renal Wellness.
3. ProViva Herbal Tablets (Prostate) - Prioritize Your Vitality and Comfort Naturally.
4. VivaDio (Heart) - Nourish Your Heart, Protect Your Future.
5. VivaLax Natural Tablets (Digestion) - Gentle Relief. Natural Balance.
6. Viva Nego Tablets (Pain Relief) - Reclaim Your Day from Body Aches and Pain.
7. VIVA Plus Tablets (Detox) - The Ultimate Daily Triple-Action Defense.

Answer queries with extreme scientific depth, therapeutic warmth, and clear structure.
If Maps mode is enabled, provide exact location suggestions, clinics, or organic stores.
If Search mode is enabled, ground your insights in recent clinical findings or organic research.`,
        tools,
      },
    });

    const text = response.text || "";
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata || null;

    res.json({ text, groundingMetadata });
  } catch (error: any) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: error.message || "An error occurred in Chat API" });
  }
});

// 2. Generate Image Endpoint (Supports gemini-3.1-flash-image-preview & gemini-3-pro-image-preview)
app.post("/api/gemini/generate-image", async (req, res) => {
  try {
    const { prompt, quality, aspectRatio, imageSize } = req.body;
    const ai = getAiClient();

    // gemini-3-pro-image-preview is used for high-quality, gemini-3.1-flash-image-preview or gemini-3.1-flash-lite-image for standard
    const model = quality === "high" ? "gemini-3-pro-image-preview" : "gemini-3.1-flash-image-preview";

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || "1:1",
          imageSize: imageSize || "1K", // 1K, 2K, or 4K
        },
      },
    });

    // Extract the generated image from parts
    let base64Image = "";
    const candidates = response.candidates;
    if (candidates && candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!base64Image) {
      throw new Error("No image was returned by the GenAI model.");
    }

    res.json({ imageUrl: base64Image });
  } catch (error: any) {
    console.error("Image generation error:", error);
    res.status(500).json({ error: error.message || "An error occurred during image generation" });
  }
});

// 3. Edit Image Endpoint (Using gemini-3.1-flash-image-preview)
app.post("/api/gemini/edit-image", async (req, res) => {
  try {
    const { image, prompt } = req.body; // image is a base64 data URL
    const ai = getAiClient();

    if (!image) {
      return res.status(400).json({ error: "No image provided for editing" });
    }

    // Extract raw base64 data and mimeType
    const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches || matches.length < 3) {
      return res.status(400).json({ error: "Invalid image format" });
    }
    const mimeType = matches[1];
    const base64Data = matches[2];

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    let base64Image = "";
    const candidates = response.candidates;
    if (candidates && candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!base64Image) {
      throw new Error("No edited image was returned by the GenAI model.");
    }

    res.json({ imageUrl: base64Image });
  } catch (error: any) {
    console.error("Image editing error:", error);
    res.status(500).json({ error: error.message || "An error occurred during image editing" });
  }
});

// 4. Generate Video Start (veo-3.1-fast-generate-preview)
app.post("/api/gemini/generate-video", async (req, res) => {
  try {
    const { prompt, image, aspectRatio } = req.body;
    const ai = getAiClient();

    let imagePayload: any = undefined;
    if (image) {
      const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches && matches.length >= 3) {
        imagePayload = {
          imageBytes: matches[2],
          mimeType: matches[1],
        };
      }
    }

    // Call veo-3.1-fast-generate-preview as requested
    const operation = await ai.models.generateVideos({
      model: "veo-3.1-fast-generate-preview",
      prompt: prompt || "Therapeutic animation of clinical compounds flowing gracefully",
      image: imagePayload,
      config: {
        numberOfVideos: 1,
        resolution: "720p",
        aspectRatio: aspectRatio || "16:9",
      },
    });

    res.json({ operationName: operation.name });
  } catch (error: any) {
    console.error("Video generation start error:", error);
    res.status(500).json({ error: error.message || "An error occurred starting video generation" });
  }
});

// 5. Poll Video Status
app.post("/api/gemini/video-status", async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: "Missing operationName parameter" });
    }
    const ai = getAiClient();

    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });
    res.json({ done: updated.done, error: updated.error });
  } catch (error: any) {
    console.error("Video polling error:", error);
    res.status(500).json({ error: error.message || "An error occurred polling video status" });
  }
});

// 6. Download Video Stream
app.post("/api/gemini/video-download", async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: "Missing operationName parameter" });
    }
    const ai = getAiClient();
    const apiKey = process.env.GEMINI_API_KEY;

    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });
    if (!updated.done) {
      return res.status(400).json({ error: "Video generation is not completed yet" });
    }

    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ error: "Video uri not found in completed operation" });
    }

    const videoRes = await fetch(uri, {
      headers: { "x-goog-api-key": apiKey || "" },
    });

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", "attachment; filename=therapeutic-video.mp4");

    const reader = videoRes.body?.getReader();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } else {
      throw new Error("Could not read video response body stream");
    }
  } catch (error: any) {
    console.error("Video downloading error:", error);
    res.status(500).json({ error: error.message || "An error occurred downloading video" });
  }
});

// ==========================================
// VITE OR STATIC FILE SERVING
// ==========================================

async function setupApp() {
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
    console.log(`[Full-Stack Server] running on http://localhost:${PORT}`);
  });
}

setupApp();
