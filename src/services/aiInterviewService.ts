import { apiKeyService } from "./apiKeyService";
import { Groq } from "groq-sdk";

export const aiInterviewService = {
  async generateQuestionsFromResume(resumeText: string) {
    const apiKey = await apiKeyService.getApiKey();
    const selectedModel = this.getSelectedModel();
    if (!apiKey) throw new Error("API key not found");

    const groq = new Groq({ apiKey: apiKey.key , dangerouslyAllowBrowser: true });

    const prompt = `Based on this resume:
${resumeText}

Generate 15 relevant technical interview questions.

Format your answer as a JSON array of objects with the following format:
[
  { "id": "q1", "question": "Your first question here" },
  ...
]`;

    const res = await groq.chat.completions.create({
      model: selectedModel ? selectedModel : 'llama-3.3-70b-versatile',
      messages: [{ role: "user", content: prompt }],
    });

    const text = res.choices?.[0]?.message?.content || "";

    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) ||
                      text.match(/```([\s\S]*?)```/) ||
                      text.match(/\[([\s\S]*?)\]/);

    if (jsonMatch && jsonMatch[1]) {
      const jsonStr = jsonMatch[0].startsWith("[") ? jsonMatch[0] : jsonMatch[1];
      return JSON.parse(jsonStr);
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Could not parse questions from AI response");
    }
  },

  async evaluateAnswer(question: string, answer: string) {
    const apiKey = await apiKeyService.getApiKey();
    if (!apiKey) throw new Error("API key not found");
        const selectedModel = this.getSelectedModel();


    const groq = new Groq({ apiKey: apiKey.key , dangerouslyAllowBrowser: true });

    const prompt = `Evaluate this interview answer:
Question: ${question}
Answer: ${answer}

Provide evaluation in JSON format with fields:
{
  "score": 1-5,
  "feedback": "Detailed explanation"
}`;

    const res = await groq.chat.completions.create({
      model: selectedModel ? selectedModel : 'llama-3.3-70b-versatile',
      messages: [{ role: "user", content: prompt }],
    });

    const text = res.choices?.[0]?.message?.content || "";

    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) ||
                      text.match(/```([\s\S]*?)```/) ||
                      text.match(/({[\s\S]*?})/);

    if (jsonMatch && jsonMatch[1]) {
      const jsonStr = jsonMatch[0].startsWith("{") ? jsonMatch[0] : jsonMatch[1];
      return JSON.parse(jsonStr);
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        score: 3,
        feedback: "Answer evaluated, but formatting may be off. Response: " + text.slice(0, 200),
      };
    }
  },

  async evaluateInterviewSession(questions: any[], answers: any, codeSubmissions: any) {
    const apiKey = await apiKeyService.getApiKey();
    if (!apiKey) throw new Error("API key not found");
        const selectedModel = this.getSelectedModel();

    const groq = new Groq({ apiKey: apiKey.key , dangerouslyAllowBrowser: true });

    let summary = "Interview Summary:\n\n";
    questions.forEach((q, idx) => {
      summary += `Question ${idx + 1}: ${q.text}\n`;
      summary += `Answer: ${answers[q.id] || "No answer provided"}\n`;
      if (codeSubmissions[q.id]) {
        summary += `Code:\n${codeSubmissions[q.id]}\n`;
      }
      summary += "\n";
    });

    const prompt = `
You are an expert technical interviewer. Please evaluate this interview comprehensively.

${summary}

Return a JSON object with:
{
  "overallRating": 1-5,
  "communicationRating": 1-5,
  "technicalRating": 1-5,
  "problemSolvingRating": 1-5,
  "strengths": "2-3 sentence summary",
  "areasForImprovement": "2-3 sentence summary",
  "additionalComments": "Optional feedback"
}
`;

    const res = await groq.chat.completions.create({
      model: selectedModel ? selectedModel : 'llama-3.3-70b-versatile',
      messages: [{ role: "user", content: prompt }],
    });

    const text = res.choices?.[0]?.message?.content || "";

    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) ||
                      text.match(/```([\s\S]*?)```/) ||
                      text.match(/({[\s\S]*?})/);

    if (jsonMatch && jsonMatch[1]) {
      const jsonStr = jsonMatch[0].startsWith("{") ? jsonMatch[0] : jsonMatch[1];
      return JSON.parse(jsonStr);
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        overallRating: 3,
        communicationRating: 3,
        technicalRating: 3,
        problemSolvingRating: 3,
        strengths: "Demonstrated understanding of some key topics.",
        areasForImprovement: "Could improve clarity and structure in responses.",
        additionalComments: "Good effort. Continue practicing with more problem-solving examples."
      };
    }
  },
    getSelectedModel(): string {
      // Client-side check for localStorage
      if (typeof window === 'undefined') return 'llama-3.3-70b-versatile'; 
      return localStorage.getItem('selectedGraqModel') || 'llama-3.3-70b-versatile';
  },
};
