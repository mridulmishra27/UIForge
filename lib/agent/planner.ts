import Groq from "groq-sdk";
import { PLANNER_SYSTEM_PROMPT, getPlannerUserPrompt } from "./prompts";
import type { UserIntent } from "./intent-classifier";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export interface PlanComponent {
    type: string;
    purpose: string;
    props?: Record<string, unknown>;
    children?: string[];
}

export interface PlanChange {
    type: "add" | "remove" | "update";
    target?: string;     
    component?: string;
    props?: Record<string, unknown>;
    location?: string;   
    note?: string;       
}

export interface UIPlan {
    action: "create" | "modify";
    layout?: string;
    description: string;
    components?: PlanComponent[];
    changes?: PlanChange[];
}

function extractTag(text: string, tag: string): string {
    const regex = new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`, "i");
    const match = text.match(regex);
    return match ? match[1].trim() : "";
}

export async function runPlanner(
    userMessage: string,
    currentCode: string | null,
    currentPlan: UIPlan | null,
    intent: UserIntent
): Promise<UIPlan> {
    const planStr = currentPlan ? JSON.stringify(currentPlan, null, 2) : null;

    const response = await groq.chat.completions.create({
        model: "meta-llama/llama-4-maverick-17b-128e-instruct",
        messages: [
            { role: "system", content: PLANNER_SYSTEM_PROMPT },
            {
                role: "user",
                content: getPlannerUserPrompt(userMessage, currentCode, planStr, intent),
            },
        ],
        temperature: 0.3,
        max_tokens: 8192,
    });

    const text = response.choices[0]?.message?.content?.trim() || "";
    console.log("[Planner] Raw output:", text.slice(0, 500));

    try {
        const action = extractTag(text, "action") as UIPlan["action"];
        const description = extractTag(text, "description");
        const componentsStr = extractTag(text, "components");
        const changesStr = extractTag(text, "changes");

        const plan: UIPlan = {
            action: action || (currentCode ? "modify" : "create"),
            description: description || "No description provided",
        };

        if (componentsStr) {
            try { plan.components = JSON.parse(componentsStr); } 
            catch { console.warn("[Planner] Failed to parse <components>"); }
        }

        if (changesStr) {
            try { plan.changes = JSON.parse(changesStr); } 
            catch { console.warn("[Planner] Failed to parse <changes>"); }
        }

        return plan;
    } catch (err) {
        console.error("[Planner] Failed to parse XML output:", text.slice(0, 500));
        throw new Error(`Planner failed: ${(err as Error).message}`);
    }
}