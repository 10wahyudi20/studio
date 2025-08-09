
'use server';

/**
 * @fileOverview A general-purpose personal AI assistant with farm data analysis capabilities.
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

// Define Zod schemas for the application data types to be used in tools
const DuckSchema = z.object({
  cage: z.number(),
  quantity: z.number(),
  deaths: z.number(),
  entryDate: z.string().describe("The entry date of the ducks into the cage, in ISO format."),
  ageMonths: z.number(),
  status: z.enum(['Bebek Bayah', 'Bebek Petelur', 'Bebek Tua', 'Bebek Afkir']),
  cageSize: z.string(),
  cageSystem: z.enum(['baterai', 'umbaran']),
});

const DailyProductionSchema = z.object({
    date: z.string(),
    totalEggs: z.number(),
    productivity: z.number(),
});
const WeeklyProductionSchema = z.object({
    startDate: z.string(),
    endDate: z.string(),
    buyer: z.string(),
    gradeA: z.number(),
    gradeB: z.number(),
    gradeC: z.number(),
    consumption: z.number(),
    totalEggs: z.number(),
    totalValue: z.number(),
});
const MonthlyProductionSchema = z.object({
    month: z.string(),
    gradeA: z.number(),
    gradeB: z.number(),
    gradeC: z.number(),
    consumption: z.number(),
    totalEggs: z.number(),
});
const EggProductionSchema = z.object({
    daily: z.array(DailyProductionSchema),
    weekly: z.array(WeeklyProductionSchema),
    monthly: z.array(MonthlyProductionSchema),
});

const FeedSchema = z.object({
  id: z.number(),
  name: z.string(),
  supplier: z.string(),
  lastUpdated: z.string(),
  stock: z.number().describe("Stok pakan dalam Kg"),
  pricePerBag: z.number(),
  pricePerKg: z.number(),
  schema: z.number().describe("Skema pakan dalam gram per ekor per hari"),
});

const TransactionSchema = z.object({
  id: z.number(),
  date: z.string(),
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  total: z.number(),
  type: z.enum(['debit', 'credit']),
});


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
  // Add farm data to the input
  ducks: z.array(DuckSchema).optional().describe("Current duck inventory data."),
  eggProduction: EggProductionSchema.optional().describe("Egg production data."),
  feed: z.array(FeedSchema).optional().describe("Feed inventory data."),
  finance: z.array(TransactionSchema).optional().describe("Financial transaction data."),
});
export type PersonalAssistantInput = z.infer<typeof PersonalAssistantInputSchema>;

const PersonalAssistantOutputSchema = z.object({
  response: z.string().describe('The AI\'s response.'),
});
export type PersonalAssistantOutput = z.infer<typeof PersonalAssistantOutputSchema>;

// Define Tools for the AI
const getDuckPopulationData = ai.defineTool(
    {
        name: 'getDuckPopulationData',
        description: 'Get data about the current duck population and inventory.',
        inputSchema: z.void(),
        outputSchema: z.array(DuckSchema),
    },
    async () => {
        // This implementation will be overridden in the flow
        return [];
    }
);

const getEggProductionData = ai.defineTool(
    {
        name: 'getEggProductionData',
        description: 'Get data about daily, weekly, and monthly egg production.',
        inputSchema: z.void(),
        outputSchema: EggProductionSchema,
    },
    async () => {
         // This implementation will be overridden in the flow
        return { daily: [], weekly: [], monthly: [] };
    }
);

const getFeedData = ai.defineTool(
    {
        name: 'getFeedData',
        description: 'Get data about feed inventory, suppliers, and prices.',
        inputSchema: z.void(),
        outputSchema: z.array(FeedSchema),
    },
    async () => {
        // This implementation will be overridden in the flow
        return [];
    }
);

const getFinancialData = ai.defineTool(
    {
        name: 'getFinancialData',
        description: 'Get financial data, including income (debit) and expenses (credit).',
        inputSchema: z.void(),
        outputSchema: z.array(TransactionSchema),
    },
    async () => {
        // This implementation will be overridden in the flow
        return [];
    }
);


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
    const keyword = "hallo bebek";
    let userPrompt = input.prompt || "";
    let systemPrompt: string;
    let toolsToUse: any[] = [];
    
    // Check if the keyword is present
    if (userPrompt.toLowerCase().startsWith(keyword)) {
      // Remove keyword from prompt
      userPrompt = userPrompt.substring(keyword.length).trim();
      
      // If the prompt is now empty (user only said the keyword), give a canned response.
      if (!userPrompt && !input.imageDataUri) {
          return { response: "Tentu, apa yang bisa saya bantu dengan peternakan Anda?" };
      }

      systemPrompt = `Anda adalah seorang ahli dan konsultan peternakan bebek yang sangat cerdas dan profesional untuk aplikasi CluckSmart. Peran Anda adalah untuk membantu pengguna mengelola peternakan mereka dengan lebih baik dan bertanggung jawab.

PERATURAN PENTING:
1.  **GUNAKAN ALAT SECARA OTOMATIS**: Jika pertanyaan pengguna berkaitan dengan data spesifik dari aplikasi (populasi, produksi, pakan, atau keuangan), Anda **HARUS** langsung menggunakan alat yang sesuai untuk mendapatkan informasi terbaru sebelum menjawab. **JANGAN PERNAH** meminta izin untuk mengambil data. Langsung ambil dan gunakan datanya.
2.  **JANGAN MENGARANG DATA INTERNAL**: Selalu gunakan data dari alat yang tersedia untuk informasi internal peternakan. Jika alat tidak memberikan informasi, katakan bahwa datanya tidak tersedia di aplikasi.
3.  **BERIKAN SOLUSI & ANALISIS**: Jika pertanyaan bersifat analitis (misalnya, "mengapa produksi saya menurun?" atau "bagaimana cara meningkatkan produksi?"), gunakan alat untuk mengambil data relevan, analisis data tersebut, lalu berikan **SARAN** dan **SOLUSI** yang konkret dan dapat ditindaklanjuti.
4.  **GABUNGKAN PENGETAHUAN EKSTERNAL**: Gunakan pengetahuan umum Anda (seperti informasi dari Google) untuk memberikan wawasan tambahan yang relevan. Contoh topik:
    *   **Pakan Terbaik**: Jelaskan tentang jenis pakan pabrikan vs. pakan buatan sendiri, dan komposisi nutrisi yang baik.
    *   **Kepadatan Kandang**: Berikan rekomendasi jumlah bebek per meter persegi untuk sistem umbaran dan baterai.
    *   **Pemecahan Masalah**: Jika produksi menurun, analisis kemungkinan penyebabnya (usia bebek, pakan, kepadatan, penyakit) berdasarkan data dan berikan solusi.
    *   **Tips Praktis**: Berikan tips tentang cara membuat pakan mixing sendiri, atau cara memilih pakan pabrikan yang baik.
5.  **SELALU PROFESIONAL & BERTANGGUNG JAWAB**: Berikan jawaban yang terstruktur, jelas, dan mudah dipahami. Jadilah mitra yang dapat diandalkan bagi pengguna.
6.  **TANGGAL HARI INI**: ${currentDate}. Gunakan ini jika ada pertanyaan terkait tanggal.`;
      
      // Provide all the available tools
      toolsToUse = [getDuckPopulationData, getEggProductionData, getFeedData, getFinancialData];
      
    } else {
      // Use a general-purpose system prompt
      systemPrompt = `Anda adalah asisten pribadi yang membantu. Anda cerdas, ramah, dan informatif.
Jawab pertanyaan pengguna secara langsung dan jelas.
Tanggal hari ini adalah ${currentDate}.`;
      // No tools are provided for general questions
    }
    
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
    // Add user prompt text only if it's not empty after trimming the keyword.
    if (userPrompt) {
        currentPromptParts.push({ text: userPrompt });
    } else if (input.imageDataUri) {
        // If there's an image but no text, add a default prompt for the model
        currentPromptParts.push({ text: "Terangkan gambar apa ini?" });
    }
    
    if (currentPromptParts.length === 0) {
        return { response: "Maaf, saya tidak menerima pesan apa pun. Silakan coba lagi." };
    }

    const { ducks, eggProduction, feed, finance } = input;

    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      system: systemPrompt,
      history: formattedHistory,
      prompt: currentPromptParts,
      tools: toolsToUse.map(tool => {
        // Re-bind the tool implementation to have access to the current input data
        if (tool.name === 'getDuckPopulationData') {
            return ai.defineTool({ ...tool.info }, async () => ducks || []);
        }
        if (tool.name === 'getEggProductionData') {
            return ai.defineTool({ ...tool.info }, async () => eggProduction || { daily: [], weekly: [], monthly: [] });
        }
        if (tool.name === 'getFeedData') {
            return ai.defineTool({ ...tool.info }, async () => feed || []);
        }
        if (tool.name === 'getFinancialData') {
            return ai.defineTool({ ...tool.info }, async () => finance || []);
        }
        return tool;
      }),
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
