
'use server';

/**
 * @fileOverview A general-purpose personal AI assistant.
 *
 * - personalAssistant - Handles conversational AI interactions.
 * - PersonalAssistantInput - The input type for the personalAssistant function.
 * - PersonalAssistantOutput - The return type for the personalAssistant function.
 * - Message - The type for a single message in the conversation history.
 */

import {ai} from '@/ai/genkit';
import {Part, Role} from 'genkit/model';
import {z} from 'genkit';
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// Define the structure for a single message in the history
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
  imageUrl: z.string().optional().describe("A URL of an image associated with the message, if any. Can be a data URI."),
});
export type Message = z.infer<typeof MessageSchema>;


const PersonalAssistantInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history.'),
  prompt: z.string().describe('The user\'s latest prompt.'),
  imageDataUri: z.string().optional().describe(
    "An optional image provided by the user, as a data URI."
  ),
});
export type PersonalAssistantInput = z.infer<typeof PersonalAssistantInputSchema>;

const PersonalAssistantOutputSchema = z.object({
  response: z.string().describe('The AI\'s response.'),
});
export type PersonalAssistantOutput = z.infer<typeof PersonalAssistantOutputSchema>;


export async function personalAssistant(input: PersonalAssistantInput): Promise<PersonalAssistantOutput> {
  // Pass all data directly to the flow. The flow will handle logic.
  return personalAssistantFlow(input);
}

const personalAssistantFlow = ai.defineFlow(
  {
    name: 'personalAssistantFlow',
    inputSchema: PersonalAssistantInputSchema,
    outputSchema: PersonalAssistantOutputSchema,
  },
  async (input) => {
    
    const currentDate = format(new Date(), "eeee, dd MMMM yyyy", { locale: idLocale });
    
    // If there's no text prompt and no image, give a canned response.
    if (!input.prompt && !input.imageDataUri) {
        return { response: "Tentu, apa yang bisa saya bantu?" };
    }

    const systemPrompt = `Anda adalah asisten pribadi AI yang sangat cerdas, profesional, serba tahu, dan dapat diandalkan, dengan jangkauan pengetahuan seluas Google. Peran utama Anda adalah membantu pengguna dengan berbagai macam tugas dan pertanyaan.

**ATURAN UTAMA ANDA:**

1.  **JAWAB SEMUA PERTANYAAN**: Tanggapi semua pertanyaan pengguna dengan kemampuan terbaik Anda, baik itu pertanyaan umum, pengetahuan, saran, analisis, atau percakapan santai. Jadilah teman bicara yang cerdas dan informatif.
2.  **MANFAATKAN PENGETAHUAN LUAS**: Gunakan pengetahuan umum Anda yang luas untuk memberikan jawaban yang akurat, wawasan mendalam, dan informasi tambahan yang relevan.
3.  **BERPIKIR KREATIF**: Bantu pengguna dengan tugas-tugas kreatif seperti menulis email, membuat cerita, merancang ide, atau memecahkan masalah.
4.  **TANGGAPI GAMBAR**: Jika pengguna memberikan gambar, analisis gambar tersebut dan jawab pertanyaan yang berkaitan dengannya, atau berikan deskripsi jika tidak ada pertanyaan spesifik.
5.  **SELALU PROFESIONAL & BERTANGGUNG JAWAB**: Berikan jawaban yang terstruktur, jelas, dan mudah dipahami. Jadilah mitra yang dapat diandalkan bagi pengguna.
6.  **TANGGAL HARI INI**: ${currentDate}. Gunakan ini jika ada pertanyaan terkait tanggal.`;
      
    // Format previous messages for the model
    const formattedHistory: {role: Role; content: Part[]}[] = input.history.map((msg: Message) => ({
      role: msg.role as Role,
      content: [
          ...(msg.imageUrl ? [{media: {url: msg.imageUrl}}] : []),
          {text: msg.content}
      ],
    }));

    // Construct the current prompt with optional image
    const currentPromptParts: Part[] = [];
    if (input.imageDataUri) {
        currentPromptParts.push({ media: { url: input.imageDataUri } });
    }
    // Add user prompt text.
    currentPromptParts.push({ text: input.prompt || "Terangkan gambar apa ini?" });
    
    if (currentPromptParts.length === 0) {
        return { response: "Maaf, saya tidak menerima pesan apa pun. Silakan coba lagi." };
    }

    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      system: systemPrompt,
      history: formattedHistory,
      prompt: currentPromptParts,
      tools: [], // No tools are needed for a general-purpose assistant
      config: {
        safetySettings: [
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      },
    });

    return {response: response.text ?? ""};
  }
);
