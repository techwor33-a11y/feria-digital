
import { GoogleGenAI, Type } from "@google/genai";
import { Vendor } from "../types";

// Always use process.env.API_KEY directly for initialization as per guidelines.
const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Mediates a customer claim using Gemini 3 Flash.
 * Uses responseSchema for structured JSON output.
 */
export const processVendorClaim = async (claimText: string, vendorName: string): Promise<{ response: string, category: string }> => {
  try {
    const ai = getAIInstance();
    const prompt = `Un vecino quiere realizar un descargo/reclamo sobre el puesto "${vendorName}". 
    El mensaje del vecino es: "${claimText}".
    
    Actúa como un mediador comunitario empático. 
    1. Responde al vecino de forma conciliadora.
    2. Categoriza el reclamo en una sola palabra (ej: Calidad, Precio, Atención, Higiene).`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            response: { type: Type.STRING, description: "Tu respuesta conciliadora al vecino" },
            category: { type: Type.STRING, description: "Categoría única del reclamo" }
          },
          required: ["response", "category"]
        }
      }
    });

    // Directly access .text property from response.
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Error processing claim:", error);
    return { response: "Gracias por tu descargo, lo hemos registrado.", category: "General" };
  }
};

/**
 * Generates a one-line insight for a vendor.
 */
export const getAIVendorInsight = async (vendor: Vendor): Promise<string> => {
  try {
    const ai = getAIInstance();
    const prompt = `Basado en el feriante '${vendor.name}' que vende '${vendor.category}', genera una recomendación de 1 línea para un vecino.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Un puesto excelente para visitar hoy.";
  } catch (error) {
    console.error("Error getting insight:", error);
    return "Productos frescos y atención vecinal garantizada.";
  }
};

/**
 * Performs reasoning-based search across vendors using Gemini 3 Pro.
 * Matches user query to vendor descriptions and products.
 */
export const getAISmartSearch = async (query: string, vendors: Vendor[]): Promise<{ recommendation: string, matchingVendorIds: string[] }> => {
  try {
    const ai = getAIInstance();
    const context = vendors.map(v => `ID: ${v.id}, Nombre: ${v.name}, Vende: ${v.description}, Productos: ${v.products.map(p => p.name).join(', ')}`).join('\n');
    
    const prompt = `Un vecino busca: "${query}". Analiza este directorio y recomienda los puestos que mejor coincidan: ${context}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Complex matching task requires Pro series
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING, description: "Breve explicación de por qué estos puestos coinciden" },
            ids: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Lista de IDs de los puestos recomendados"
            }
          },
          required: ["explanation", "ids"]
        }
      }
    });

    const text = response.text || "{}";
    const result = JSON.parse(text);
    return { recommendation: result.explanation, matchingVendorIds: result.ids };
  } catch (error) {
    console.error("Error in smart search:", error);
    return { recommendation: "Explora estos puestos del mercado.", matchingVendorIds: [] };
  }
};

/**
 * Generates marketing description and suggested price for a product.
 */
export const generateAIDescription = async (title: string): Promise<{ description: string, suggestedPrice: number }> => {
  try {
    const ai = getAIInstance();
    const prompt = `Genera una descripción vendedora y un precio sugerido para este producto de feria: "${title}".`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            desc: { type: Type.STRING, description: "Descripción atractiva para el cliente" },
            price: { type: Type.NUMBER, description: "Precio estimado sugerido" }
          },
          required: ["desc", "price"]
        }
      }
    });
    const text = response.text || "{}";
    const result = JSON.parse(text);
    return { description: result.desc, suggestedPrice: result.price };
  } catch (error) {
    console.error("Error generating description:", error);
    return { description: "Producto de excelente calidad.", suggestedPrice: 0 };
  }
};

/**
 * Fetches a daily selling tip for vendors.
 */
export const getDailySellerTip = async (category: string): Promise<string> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Proporciona un consejo de ventas rápido (máximo una frase) para un vendedor de ${category} en una feria barrial.`,
    });
    return response.text || "¡Buen día de ventas para hoy!";
  } catch (error) {
    console.error("Error getting seller tip:", error);
    return "¡A vender con todo!";
  }
};
