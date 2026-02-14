import Groq from "groq-sdk";
import { GENERATOR_SYSTEM_PROMPT, getGeneratorUserPrompt } from "./prompts";
import type { UIPlan } from "./planner";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function runGenerator(
    plan: UIPlan,
    currentCode: string | null
): Promise<string> {
    const planStr = JSON.stringify(plan, null, 2);

    const response = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
            { role: "system", content: GENERATOR_SYSTEM_PROMPT },
            { role: "user", content: getGeneratorUserPrompt(planStr, currentCode) },
        ],
        temperature: 0.2,
        max_tokens: 8192,
    });

    const text = response.choices[0]?.message?.content?.trim() || "";

    const code = text
        .replace(/^```(?:html|jsx|tsx|javascript|typescript)?\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    if (!code) {
        throw new Error("Generator produced empty output");
    }

    return code;
}