const TTC_API_KEY = import.meta.env.VITE_TTC_API_KEY;
const API_URL = "https://api.thetokencompany.com/v1/compress";

export const BearClient = {
  async compress(text) {
    if (!TTC_API_KEY) {
      console.warn("VITE_TTC_API_KEY is missing. Skipping compression.");
      return text;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${TTC_API_KEY}`
        },
        body: JSON.stringify({
          model: "bear-1",
          input: text
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Bear 1 API Error Body: ${errorBody}`);
        throw new Error(`Bear 1 API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.output || text;
    } catch (error) {
      console.error("Bear 1 Compression Failed:", error);
      // Fallback: return original text if compression fails
      return text;
    }
  }
};
