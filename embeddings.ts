import { HfInference } from "@huggingface/inference";

export interface EmbeddingResponse {
  similarities?: number[];
  error?: string;
}

export interface EmbeddingRequest {
  source_sentence: string;
  sentences: string[];
}

// Initialize the Hugging Face client
const hf = new HfInference(process.env.HF_TOKEN);

export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    // Clean and prepare the text
    const cleanText = text.trim().replace(/\s+/g, ' ');
    
    if (!cleanText) {
      console.error("Empty text provided for embedding");
      return null;
    }

    console.log("Generating embedding for text:", cleanText.substring(0, 100) + "...");

    // Use feature extraction to get embeddings
    const result = await hf.featureExtraction({
      model: "sentence-transformers/all-mpnet-base-v2",
      inputs: cleanText,
    });

    console.log("HF Client Response type:", typeof result, "Array?", Array.isArray(result));
    
    // Handle the response format
    if (Array.isArray(result)) {
      // For sentence transformers, result is usually a 2D array
      if (result.length > 0) {
        // If it's a nested array, take the first row
        if (Array.isArray(result[0])) {
          console.log("Embedding generated successfully, vector length:", result[0].length);
          return result[0] as number[];
        }
        // If it's already a 1D array of numbers
        if (typeof result[0] === 'number') {
          console.log("Embedding generated successfully, vector length:", result.length);
          return result as number[];
        }
      }
    }
    
    console.error("Unexpected embedding response format:", result);
    return null;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}


// REPLACE THIS FUNCTION WITH THE ENHANCED VERSION
// Enhanced function to create rich context for embeddings with detailed AQI data
export function createRichContext(journalEntry: any): string {
  const parts = [];
  
  // Basic content
  if (journalEntry.title) parts.push(`Title: ${journalEntry.title}`);
  if (journalEntry.content) parts.push(`Content: ${journalEntry.content}`);
  
  // Temporal context with season
  const date = new Date(journalEntry.created_at);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const season = getSeason(date);
  const timeOfDay = date.getHours() < 12 ? 'morning' : date.getHours() < 17 ? 'afternoon' : 'evening';
  parts.push(`Date: ${date.toLocaleDateString('id-ID')} (${dayName} ${timeOfDay}, ${season})`);
  
  // Emotional context with correct mood score range (-1 to 1)
  if (journalEntry.mood_score !== null && journalEntry.mood_score !== undefined) {
    const moodScore = journalEntry.mood_score;
    let moodLabel;
    
    if (moodScore >= 0.6) moodLabel = 'sangat positif';
    else if (moodScore >= 0.2) moodLabel = 'positif';
    else if (moodScore >= -0.2) moodLabel = 'netral';
    else if (moodScore >= -0.6) moodLabel = 'negatif';
    else moodLabel = 'sangat negatif';
    
    parts.push(`Mood: ${moodLabel} (${moodScore.toFixed(2)})`);
  }
  
  // Emotion analysis (simplified for efficiency)
  if (journalEntry.emotion_analysis) {
    try {
      const emotions = typeof journalEntry.emotion_analysis === 'string' 
        ? JSON.parse(journalEntry.emotion_analysis) 
        : journalEntry.emotion_analysis;
      
      if (emotions.dominant_emotion) {
        parts.push(`Emotion: ${emotions.dominant_emotion}`);
      }
    } catch (e) {
      console.error("Error parsing emotion analysis:", e);
    }
  }
  
  // Location context
  if (journalEntry.location_name) {
    parts.push(`Location: ${journalEntry.location_name}`);
  }
  
  // Enhanced weather and air quality context with CORRECT field mapping
  if (journalEntry.weather_data) {
    try {
      const weather = typeof journalEntry.weather_data === 'string' 
        ? JSON.parse(journalEntry.weather_data) 
        : journalEntry.weather_data;
      
      const current = weather.current || weather; // Handle both structures
      
      // Basic weather info
      const weatherParts = [];
      if (current.temp_c) weatherParts.push(`${current.temp_c}°C`);
      if (current.condition?.text) weatherParts.push(current.condition.text);
      if (current.humidity) weatherParts.push(`${current.humidity}% humidity`);
      
      if (weatherParts.length > 0) {
        parts.push(`Weather: ${weatherParts.join(', ')}`);
      }

      // Detailed air quality information with CORRECT field names
      if (current.air_quality) {
        const aq = current.air_quality;
        const aqParts = [];
        
        // US EPA AQI (1-6 scale)
        if (aq['us-epa-index']) {
          const epaIndex = aq['us-epa-index'];
          let category = 'Unknown';
          if (epaIndex === 1) category = 'Good';
          else if (epaIndex === 2) category = 'Moderate';
          else if (epaIndex === 3) category = 'Unhealthy for Sensitive Groups';
          else if (epaIndex === 4) category = 'Unhealthy';
          else if (epaIndex === 5) category = 'Very Unhealthy';
          else if (epaIndex === 6) category = 'Hazardous';
          
          aqParts.push(`US-EPA: ${epaIndex} (${category})`);
        }
        
        // Specific pollutants with correct field names
        if (aq.pm2_5) aqParts.push(`PM2.5: ${aq.pm2_5}μg/m³`);
        if (aq.pm10) aqParts.push(`PM10: ${aq.pm10}μg/m³`);
        if (aq.no2) aqParts.push(`NO2: ${aq.no2}μg/m³`);
        if (aq.o3) aqParts.push(`O3: ${aq.o3}μg/m³`);
        
        if (aqParts.length > 0) {
          parts.push(`Air Quality: ${aqParts.join(', ')}`);
        }
      }
    } catch (e) {
      console.error("Error parsing weather data:", e);
    }
  }
  
  return parts.join('\n');
}

// Helper function for season detection
function getSeason(date: Date): string {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

// Function to chunk text into smaller pieces for better embeddings
export function chunkText(text: string, maxChunkSize: number = 500): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence;
    } else {
      currentChunk += (currentChunk.length > 0 ? '. ' : '') + trimmedSentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text]; // Fallback to original text if no chunks
}

// Test function to verify embeddings work
export async function testEmbedding(): Promise<boolean> {
  try {
    const testText = "This is a test sentence for embedding generation.";
    const embedding = await generateEmbedding(testText);
    
    if (embedding && embedding.length > 0) {
      console.log("Embedding test successful! Vector length:", embedding.length);
      return true;
    } else {
      console.log("Embedding test failed!");
      return false;
    }
  } catch (error) {
    console.error("Embedding test error:", error);
    return false;
  }
}