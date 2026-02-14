import Groq from "groq-sdk";
import type { UIPlan } from "./planner";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const EXPLAINER_SYSTEM_PROMPT = `You are a UI Explainer Agent for UIForge.

Your job: Explain to the user what was built, changed, or what the current UI looks like. Write in clear, concise English.

## RULES:
1. If components were built/modified, briefly explain what was done and why (1-2 sentences).
2. If the user is asking a QUESTION about the current UI (e.g., "explain this", "what does this do", "describe the layout"),
   describe the UI structure, its components, and their purpose based on the plan provided. Be helpful and descriptive.
3. If ANY items are listed in the "BLOCKED ITEMS" section, you MUST explicitly tell the user that those requests were rejected.
4. When explaining rejected items, state clearly that you are ONLY permitted to use the predefined component library and cannot process inline styles, AI-generated CSS, arbitrary Tailwind classes, or raw HTML.

Be polite, but strictly enforce the design rules. Do not mention code details like "JSX" or "render()".`;

export async function runExplainer(
    userMessage: string,
    plan: UIPlan | null,
    isEdit: boolean,
    blockedItems: string[] = []
): Promise<string> {
    const planStr = plan ? JSON.stringify(plan, null, 2) : "NO PLAN EXECUTED.";
    const blockedStr = blockedItems.length > 0
        ? blockedItems.join(", ")
        : "None";

    const userPrompt = `
USER REQUEST: "${userMessage}"
PLAN EXECUTED: ${planStr}
BLOCKED ITEMS: ${blockedStr}

Write the explanation following the system rules.`;

    const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
            { role: "system", content: EXPLAINER_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 1024,
    });

    return response.choices[0]?.message?.content?.trim() || "Action completed.";
}