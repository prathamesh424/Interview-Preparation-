
import { 
  Question,
  GenerateQuestionsParams,
  QuestionFeedback,
  CheckAnswerParams,
  CheatSheetData, // Added
  GenerateCheatSheetParams, // Added
  LearningPace ,// Added
  QuestionType, // Import QuestionType
  QuestionDifficulty // Import QuestionDifficulty
} from "@/types";
import { apiKeyService } from './apiKeyService';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import  GroqClient, { Groq }  from 'groq-sdk';

// --- Constants for Parsing ---
// Regex to find markdown code blocks like ```javascript ... ```
// Captures: 1=language (optional), 2=code content
const CODE_BLOCK_REGEX = /```(\w+)?\s*\n([\s\S]*?)\n```/;

// --- Configuration for Gemini API ---
// You might want to customize safety settings
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const generationConfig = {
  temperature: 0.9, // Example: Adjust creativity (0.0 to 1.0)
  topK: 1,         // Example: Consider top K tokens
  topP: 1,         // Example: Consider tokens with cumulative probability P
  // maxOutputTokens: 2048, // Example: Limit output length
};

export const graqService = {

  async getGroqClient(): Promise<GroqClient | null> {
    const { key, error } = await apiKeyService.getApiKey();
    if (error || !key) {
        console.error("Failed to get API key:", error || "Key not found");
        return null;
    }
    return new GroqClient({
      apiKey: key,
      dangerouslyAllowBrowser: true, 
    });
},

  async generateQuestions(params: GenerateQuestionsParams): Promise<Question[]> {
    const groq = await this.getGroqClient();
    if (!groq) {
        console.warn("Groq API key not found or failed to retrieve.");
        if (this.isDevelopment()) {
            console.warn("Returning mock questions because API key is missing/failed.");
            return this.generateMockQuestions(params);
        }
        throw new Error("Groq API key not configured.");
    }

    try {
        const selectedModel = this.getSelectedModel();  
        const difficultiesString = params.difficulties.join(', ');
        const typesString = params.types.join(', ');
        const prompt = `
            Based on the following content:
            --- CONTENT START ---
            ${params.content}
            --- CONTENT END ---

            Generate exactly ${params.count || 3} unique interview questions covering the topics in the content.

            Requirements:
            1. Difficulty levels should be from: ${difficultiesString}. Try to include a mix if multiple are specified.
            2. Question types should be from: ${typesString}. Try to include a mix if multiple are specified.
            3. For each question, determine the most appropriate single difficulty level from the list provided (${difficultiesString}).
            4. For each question, determine the most appropriate single type from the list provided (${typesString}).
            5. Ensure the questions are relevant to the provided content.
            6. Do NOT include the answer in the question itself.
            7. Very Important: Respond ONLY with a valid JSON array of objects. Each object must have the following structure:
               {
                 "question": "The full text of the generated question, including code blocks if necessary",
                 "type": "The type of the question (must be one of: ${typesString})",
                 "difficulty": "The difficulty of the question (must be one of: ${difficultiesString})"
               }
            8. Do not include any explanatory text before or after the JSON array. Just the array itself, starting with [ and ending with ].
            9. If a question requires a code snippet (e.g., for 'Find the Error' or 'Code Writing'), include it within the 'question' string using standard markdown code blocks (e.g., \`\`\`javascript ... \`\`\`).
        `;

        const response = await groq.chat.completions.create({
            model: selectedModel,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });

        const responseText = response.choices?.[0]?.message?.content || "";

        console.log("Raw Groq response for questions:", responseText);

        // The parsing logic below remains unchanged
        let rawGeneratedQuestions: any[] = [];
        let jsonStringToParse = responseText.trim();

        const jsonBlockMatch = jsonStringToParse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch && jsonBlockMatch[1]) {
            jsonStringToParse = jsonBlockMatch[1].trim();
        } else {
            const genericBlockMatch = jsonStringToParse.match(/```\s*([\s\S]*?)\s*```/);
            if (genericBlockMatch && genericBlockMatch[1]) {
                jsonStringToParse = genericBlockMatch[1].trim();
            }
        }

        try {
            rawGeneratedQuestions = JSON.parse(jsonStringToParse);
        } catch (parseError) {
            console.error("Failed to parse Groq response as JSON:", parseError);
            throw new Error("Failed to parse response from AI. The response was not valid JSON.");
        }

        if (!Array.isArray(rawGeneratedQuestions)) {
            throw new Error("AI response was not in the expected array format.");
        }

        const questions: Question[] = rawGeneratedQuestions.map((q: any, index: number) => {
            if (!q || typeof q.question !== 'string' || !q.type || !q.difficulty) return null;

            let questionText = q.question;
            let codeSnippet: string | undefined = undefined;
            let codeLanguage: string | undefined = undefined;
            const CODE_BLOCK_REGEX = /```(\w+)?\s*\n([\s\S]*?)\n```/;
            const match = q.question.match(CODE_BLOCK_REGEX);
            if (match) {
                codeLanguage = match[1] || undefined;
                codeSnippet = match[2].trim();
                questionText = q.question.replace(CODE_BLOCK_REGEX, '').trim();
                if (!questionText) {
                    switch (q.type) {
                        case 'Find the Error in Code': questionText = "Find and fix the error in the code snippet below:"; break;
                        case 'Code Writing': questionText = "Analyze the following code snippet:"; break;
                        default: questionText = "Consider the code snippet below:"; break;
                    }
                }
            }

            const isValidType = params.types.includes(q.type as QuestionType);
            const isValidDifficulty = params.difficulties.includes(q.difficulty as QuestionDifficulty);
            if (!isValidType || !isValidDifficulty) return null;

            return {
                id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                questionText,
                codeSnippet,
                codeLanguage,
                type: q.type as QuestionType,
                difficulty: q.difficulty as QuestionDifficulty,
                createdAt: new Date(),
            };
        }).filter((q): q is Question => q !== null);

        if (questions.length === 0 && rawGeneratedQuestions.length > 0) {
            throw new Error("AI generated questions, but they failed validation or parsing.");
        }

        if (questions.length === 0) {
            throw new Error("AI did not generate any valid questions.");
        }

        return questions;

    } catch (error: any) {
        console.error("Error in generateQuestions calling Groq API:", error);
        if (this.isDevelopment()) {
            return this.generateMockQuestions(params);
        }
        throw new Error(`Failed to generate questions. AI service communication failed. ${error.message || 'Unknown AI error'}`);
    }
  } ,
  
async checkAnswer(params: CheckAnswerParams): Promise<QuestionFeedback> {
  const apiKey = await apiKeyService.getApiKey();
  const selectedModel = this.getSelectedModel();  

    if (!apiKey) {
        console.warn("Groq API key not found or failed to retrieve for checking answer.");
        if (this.isDevelopment()) {
            console.warn("Returning mock feedback because API key is missing or failed to load.");
            return this.generateMockFeedback(params);
        }
        throw new Error("Groq API key not configured.");
    }

    try {
        const groq = new Groq({ apiKey: apiKey.key , dangerouslyAllowBrowser: true});

        const prompt = `
You are an expert evaluating an answer to an interview question.

Question Details:
- Question: "${params.question}"
- Expected Type: ${params.questionType}
- Expected Difficulty: ${params.difficulty}

User's Answer:
--- ANSWER START ---
${params.userAnswer}
--- ANSWER END ---

Evaluation Task:
1. Assess the user's answer based on the question's type and difficulty.
2. Identify specific points the user answered correctly.
3. Identify specific points the user missed or got wrong.
4. Provide a concise, ideal answer ONLY IF the user's answer is significantly lacking or incorrect (e.g., score below 6/10).
5. Offer brief, actionable suggestions for improvement if applicable.
6. Assign a score from 0 (completely wrong) to 10 (perfect).

Very Important: Respond ONLY with a valid JSON object with the following structure:
{
  "correct": ["Point 1 correct", "Point 2 correct"],
  "missed": ["Point 1 missed", "Point 2 missed"],
  "correctAnswer": "The ideal answer text (optional, only if score < 6)",
  "suggestions": "Actionable suggestions text (optional)",
  "score": numerical_score_from_0_to_10
}
- "correct" and "missed" should be arrays of strings.
- "correctAnswer" and "suggestions" should be strings OR null/undefined if not applicable.
- "score" must be a number between 0 and 10.
- Do not include any explanatory text before or after the JSON object. Just the object itself.
- Do not use markdown formatting (like \`\`\`) within the JSON string values.
`;

        console.log("Sending prompt to Groq for answer check:", prompt);

        const result = await groq.chat.completions.create({
            model: selectedModel ? selectedModel : 'llama-3.3-70b-versatile',
            messages: [{ role: "user", content: prompt }],
        });

        const responseText = result.choices?.[0]?.message?.content ?? "";

        console.log("Raw Groq response for answer check:", responseText);

        let feedback: Partial<QuestionFeedback> = {};

        try {
            const cleanText = responseText.replace(/^```json\s*|```$/g, "").trim();
            feedback = JSON.parse(cleanText);
        } catch (parseError) {
            console.error("Failed to parse Groq feedback response as JSON:", parseError);
            console.error("Raw response was:", responseText);
            throw new Error("Failed to parse feedback from AI. The response was not valid JSON.");
        }

        if (typeof feedback !== "object" || feedback === null) {
            throw new Error("AI feedback response was not a valid object.");
        }

        const finalFeedback: QuestionFeedback = {
            correct: Array.isArray(feedback.correct) ? feedback.correct.filter(s => typeof s === "string") : [],
            missed: Array.isArray(feedback.missed) ? feedback.missed.filter(s => typeof s === "string") : [],
            correctAnswer: typeof feedback.correctAnswer === "string" ? feedback.correctAnswer : undefined,
            suggestions: typeof feedback.suggestions === "string" ? feedback.suggestions : undefined,
            score: typeof feedback.score === "number" && feedback.score >= 0 && feedback.score <= 10 ? feedback.score : 0,
        };

        return finalFeedback;

    } catch (error: any) {
        console.error("Error in checkAnswer calling Groq API:", error);
        if (this.isDevelopment()) {
            console.warn("Returning mock feedback due to API error");
            return this.generateMockFeedback(params);
        }
        throw new Error(`Failed to check answer: ${error.message || "Unknown AI error"}`);
    }
  },


async generateCheatSheet(params: GenerateCheatSheetParams): Promise<CheatSheetData> {
  console.log("Generating cheat sheet with params:", params);

  const apiKey = await apiKeyService.getApiKey();
  if (!apiKey) {
    console.warn("Groq API key not found or failed to retrieve for generating cheat sheet.");
    if (process.env.NODE_ENV !== "production") {
      console.warn("Returning mock cheat sheet due to missing API key.");
      return this.generateMockCheatSheet(params);
    }
    throw new Error("Groq API key is not configured.");
  }

  try {
    const groq = new Groq({ apiKey: apiKey.key , dangerouslyAllowBrowser: true});
    const selectedModel = this.getSelectedModel();

    const prompt = `
You are a productivity and study optimization assistant. Generate a cheat sheet for the topic: "${params.topic}".

Cheat Sheet Guidelines:
- The cheat sheet should be structured to cover the topic over ${params.days} days.
- The student's learning pace is "${params.pace}" (e.g., beginner, intermediate, fast-learner).
- Break the content into daily sections or bullet points.
- Emphasize key concepts, formulas, shortcuts, or essential information.
- Make it concise, practical, and easy to review.
- Output the cheat sheet as a JSON object with the following structure:

{
  "title": "Cheat Sheet Title",
  "days": [
    {
      "day": 1,
      "summary": "Short description of content covered",
      "bullets": ["Point 1", "Point 2", "..."]
    },
    ...
  ]
}

- Do NOT add any text before or after the JSON.
- Do NOT use markdown formatting like \`\`\`json.
`;

    const result = await groq.chat.completions.create({
      model: selectedModel ? selectedModel : 'llama-3.3-70b-versatile',
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = result.choices?.[0]?.message?.content ?? "";
    console.log("Raw Groq response for cheat sheet:", responseText);

    let parsed: CheatSheetData;
    try {
      const cleaned = responseText.replace(/^```json\s*|```$/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse Groq cheat sheet JSON:", parseError);
      throw new Error("Failed to parse cheat sheet response from AI.");
    }

    return parsed;
  } catch (error: any) {
    console.error("Error in generateCheatSheet:", error);
    if (process.env.NODE_ENV !== "production") {
      console.warn("Returning mock cheat sheet due to error");
      return this.generateMockCheatSheet(params);
    }
    throw new Error(error.message || "Unknown error generating cheat sheet.");
  }
}
,

  getSelectedModel(): string {
      // Client-side check for localStorage
      if (typeof window === 'undefined') return 'llama-3.3-70b-versatile'; 
      return localStorage.getItem('selectedGraqModel') || 'llama-3.3-70b-versatile';
  },

  isDevelopment(): boolean {
      return typeof window !== 'undefined' && window.location.hostname === 'localhost';
  },

  generateMockQuestions(params: GenerateQuestionsParams): Question[] {
      const count = params.count || 3;
      const questions: Question[] = [];
      const types = params.types.length > 0 ? params.types : ['Theory']; // Fallback type
      const difficulties = params.difficulties.length > 0 ? params.difficulties : ['Medium']; // Fallback difficulty

      for (let i = 0; i < count; i++) {
          const type = types[i % types.length];
          const difficulty = difficulties[i % difficulties.length];
          questions.push({
              id: `q_mock_${Date.now()}_${i}`,
              question: this.generateMockQuestion(params.content || 'a topic', type, difficulty),
              type: type,
              difficulty: difficulty,
              createdAt: new Date(),
          });
      }
      return questions;
  },

  generateMockQuestion(content: string, type: string, difficulty: string): string {
    const topic = content.length > 30 ? content.substring(0, 30) + "..." : content;
    
    switch (type) {
      case 'Theory':
        return `${difficulty} theory question about ${topic}: Explain the key concepts and principles of ${topic} and how they relate to modern software development.`;
      case 'Code Writing':
        return `${difficulty} coding question about ${topic}: Write a function that implements a ${topic} algorithm with optimal time complexity.`;
      case 'Find the Error in Code':
        return `${difficulty} debugging question about ${topic}: Find and fix the error in this ${topic} implementation:\n\n\`\`\`javascript\nfunction process${topic.replace(/\s/g, '')}(data) {\n  let result = data.length();\n  // More code with intentional errors\n  return result;\n}\`\`\``;
      case 'Scenario-Based':
        return `${difficulty} scenario question about ${topic}: You're working on a system that uses ${topic}. The system is experiencing performance issues. How would you diagnose and address these issues?`;
      default:
        return `${difficulty} question about ${topic}: Describe your experience with ${topic} and how you've applied it in your previous projects.`;
    }
  },
  
  generateMockFeedback(params: CheckAnswerParams): QuestionFeedback {
    const score = Math.floor(Math.random() * 11);
    
    return {
      correct: [
        "You correctly identified the main concept",
        score > 5 ? "Your explanation was clear and concise" : "",
      ].filter(Boolean),
      missed: [
        score < 10 ? "You missed some important details" : "",
        score < 7 ? "The implementation could be optimized" : "",
      ].filter(Boolean),
      correctAnswer: score < 6 ? this.generateMockAnswer(params.question, params.questionType, params.difficulty) : undefined,
      score,
      suggestions: score < 9 ? "Try to focus more on the key concepts and provide more detailed explanations." : undefined,
    };
  },
  
  generateMockAnswer(question: string, type: string, difficulty: string): string {
    switch (type) {
      case 'Theory':
        return "The correct answer would include a comprehensive explanation of the key concepts, their historical context, practical applications, and current best practices.";
      case 'Code Writing':
        return "A good solution would include proper error handling, optimal time and space complexity, and clear documentation explaining the approach.";
      case 'Find the Error in Code':
        return "The main error is using .length() as a function when it's a property. It should be data.length instead. Additionally, there may be edge cases not being handled.";
      case 'Scenario-Based':
        return "An effective response would include systematic approach to diagnosing the issue, tools you would use, metrics you would examine, and potential solutions based on the findings.";
      default:
        return "A strong answer would demonstrate both theoretical understanding and practical experience, with specific examples of implementation and problem-solving.";
    }
  },

  generateMockCheatSheet(params: GenerateCheatSheetParams): CheatSheetData {
    const { topic, days, pace } = params;
    const paceMultiplier = pace === "Slow" ? 0.8 : pace === "Fast" ? 1.2 : 1.0;
    
    return {
      dailyBreakdown: Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        subtopic: `Mock Subtopic ${i + 1} for ${topic} (${pace} pace)`,
        resources: [
          { title: `YouTube: ${topic} Basics Part ${i + 1}`, url: "#", type: "YouTube" },
          { title: `Article: Advanced ${topic} Techniques ${i + 1}`, url: "#", type: "Article" },
          { title: `Docs: Official ${topic} Reference ${i + 1}`, url: "#", type: "Docs" },
        ],
        schedule: `Study ${topic} subtopic ${i + 1} for ${Math.round(2 * paceMultiplier)} hours. Practice coding exercises for ${Math.round(1 * paceMultiplier)} hour. Review notes.`,
      })),
    };
  }
};