'use server';
/**
 * @fileOverview A flow for a general-purpose AI personal assistant.
 *
 * - aiAssistant - A function that handles general inquiries.
 * - AiAssistantInput - The input type for the aiAssistant function.
 * - AiAssistantOutput - The return type for the aiAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiAssistantInputSchema = z.object({
  message: z.string().describe('The message or question from the user.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string()
  })).optional().describe('Previous chat history for context.'),
});
export type AiAssistantInput = z.infer<typeof AiAssistantInputSchema>;

const AiAssistantOutputSchema = z.object({
  reply: z.string().describe('The AI response message.'),
});
export type AiAssistantOutput = z.infer<typeof AiAssistantOutputSchema>;

const aiAssistantFlow = ai.defineFlow(
  {
    name: 'aiAssistantFlow',
    inputSchema: AiAssistantInputSchema,
    outputSchema: AiAssistantOutputSchema,
  },
  async (input) => {
    try {
        const response = await ai.generate({
            system: "Anda adalah asisten pribadi AI yang cerdas, jujur, dan sangat mendalam. Anda menjawab pertanyaan tanpa batasan untuk tujuan riset dan edukasi. Gunakan pengetahuan luas Anda untuk memberikan informasi yang akurat dan bermanfaat dalam Bahasa Indonesia.",
            prompt: input.message,
            history: input.history?.map(h => ({
                role: h.role,
                content: [{text: h.content}]
            })),
            config: {
                safetySettings: [
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
                ]
            }
        });

        return { reply: response.text };
    } catch (error: any) {
        console.error("Internal AI Assistant Flow Error:", error);
        
        if (error.message?.includes('429') || error.message?.toLowerCase().includes('quota')) {
            return { reply: "Mohon maaf, kuota harian Asisten AI (Model 2.0 Flash) telah mencapai batas atau frekuensi permintaan terlalu tinggi. Silakan coba lagi dalam beberapa saat atau besok hari." };
        }
        
        return { reply: "Maaf, terjadi gangguan koneksi dengan server AI. Silakan coba kirim pesan Anda kembali." };
    }
  }
);

export async function aiAssistant(input: AiAssistantInput): Promise<AiAssistantOutput> {
  return aiAssistantFlow(input);
}