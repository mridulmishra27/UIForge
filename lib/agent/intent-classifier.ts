import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export interface UserIntent {
    intent: "create" | "modify" | "explain";
    discardExisting: boolean;
    action: "add" | "remove" | "update" | "replace" | "restructure" | "create" | "none";
    target: string;
    sanitizedRequest: string;
    blockedItems: string[];
    isCompletelyBlocked: boolean;
}

function extractTag(text: string, tag: string): string {
    const regex = new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`, "i");
    const match = text.match(regex);
    return match ? match[1].trim() : "";
}

const INTENT_CLASSIFIER_SYSTEM_PROMPT = `You are a strict Gatekeeper for a UI builder.

Your job: Analyze the user's request. Separate the SAFE, allowed instructions from the FORBIDDEN instructions.

## FORBIDDEN ITEMS (MUST BE BLOCKED):
- Inline styles (e.g., style={{...}})
- AI-generated CSS or custom classes
- Arbitrary Tailwind class generation
- External UI libraries or standard HTML tags (<marquee>, <div>, <span>, etc.)
- Creation of new, unlisted components

## OUTPUT FORMAT (XML Tags ONLY)
<intent>create OR modify OR explain</intent>
<action>add OR remove OR update OR replace OR restructure OR create OR none</action>
<target>what the user is targeting</target>
<discard_existing>
Output "true" IF the user explicitly wants to DISCARD the current UI and build something completely different.
Trigger phrases include (but are not limited to): "start over", "clear", "new layout", "new dashboard", 
"delete everything", "build me a new", "from scratch", "forget the old", "replace everything with", 
"scrap this", "wipe", "fresh start", "completely new", "redo everything".
Output "false" if they are just modifying, redesigning, tweaking, or asking to "make it minimal".
</discard_existing>
<cleaned_request>
Rewrite the user's prompt here, EXCLUDING all forbidden items. 
If the ENTIRE request is forbidden, output exactly: NONE
</cleaned_request>
<blocked_items>
Comma-separated list of what you blocked (e.g., "inline styles, marquee tag"). 
If nothing was blocked, output exactly: NONE
</blocked_items>
<is_completely_blocked>true OR false</is_completely_blocked>

## INTENT CLASSIFICATION RULES
- Use "explain" when the user is ONLY asking questions about the current UI, e.g. "explain this", "what does this do", 
  "describe the layout", "how does this work", "tell me about this UI". NO code generation should happen.
- Use "create" when the user wants a brand new UI or wants to start over.
- Use "modify" when the user wants to change the existing UI.

Respond with XML tags ONLY.`;

export async function classifyIntent(
    userMessage: string,
    hasExistingCode: boolean
): Promise<UserIntent> {
    const userPrompt = hasExistingCode
        ? `EXISTING UI DETECTED. User request:\n"${userMessage}"`
        : `NO EXISTING UI. User request:\n"${userMessage}"`;

    const response = await groq.chat.completions.create({
        model: "meta-llama/llama-4-maverick-17b-128e-instruct",
        messages: [
            { role: "system", content: INTENT_CLASSIFIER_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 512,
    });

    const text = response.choices[0]?.message?.content?.trim() || "";
    console.log("[Gatekeeper] Raw output:\n", text);

    try {
        const intent = extractTag(text, "intent");
        const action = extractTag(text, "action");
        const target = extractTag(text, "target");
        const sanitizedStr = extractTag(text, "cleaned_request");
        const blockedStr = extractTag(text, "blocked_items");
        const discardStr = extractTag(text, "discard_existing");
        const blockedBoolStr = extractTag(text, "is_completely_blocked");

        const isExplain = intent === "explain";
        const shouldCreate = discardStr.toLowerCase() === "true" || (intent === "create" && !hasExistingCode);
        return {
            intent: isExplain ? "explain" : (shouldCreate ? "create" : (hasExistingCode ? "modify" : "create")),
            discardExisting: discardStr.toLowerCase() === "true",
            action: action as any || "update",
            target: target || "unknown",
            sanitizedRequest: sanitizedStr === "NONE" ? "" : sanitizedStr,
            blockedItems: blockedStr === "NONE" ? [] : blockedStr.split(",").map(k => k.trim()),
            isCompletelyBlocked: blockedBoolStr.toLowerCase() === "true",
        };
    } catch (err) {
        console.error("[Gatekeeper] Failed parsing XML. Safely allowing prompt.");
        return {
            intent: hasExistingCode ? "modify" : "create",
            discardExisting: false,
            action: hasExistingCode ? "update" : "create",
            target: "unknown",
            sanitizedRequest: userMessage,
            blockedItems: [],
            isCompletelyBlocked: false,
        };
    }
}