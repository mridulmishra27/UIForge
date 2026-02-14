import { runPlanner, type UIPlan } from "./planner";
import { runGenerator } from "./generator";
import { runExplainer } from "./explainer";
import { validateHTML } from "./validator";
import { classifyIntent } from "./intent-classifier";

export interface PipelineResult {
    plan: UIPlan;
    code: string;
    explanation: string;
}

// ─── STREAMING PIPELINE ────────────────────────────────────────────

export type StageName = "intent" | "planning" | "generating" | "explaining";

export interface StageEvent {
    stage: StageName;
    status: "running" | "done";
    plan?: UIPlan;
    code?: string;
    explanation?: string;
}

export async function runPipelineStreaming(
    userMessage: string,
    currentCode: string | null,
    currentPlan: UIPlan | null = null,
    onStage: (event: StageEvent) => void
): Promise<PipelineResult> {

    // Step 1: Gatekeeper
    onStage({ stage: "intent", status: "running" });
    const intent = await classifyIntent(userMessage, currentCode !== null);
    console.log("[Pipeline] Sanitized Request:", intent.sanitizedRequest);
    onStage({ stage: "intent", status: "done" });

    // Blocked
    if (intent.isCompletelyBlocked) {
        onStage({ stage: "explaining", status: "running" });
        const explanation = await runExplainer(userMessage, null, currentCode !== null, intent.blockedItems);
        onStage({ stage: "explaining", status: "done", explanation });
        return {
            plan: currentPlan || { action: "modify", description: "Blocked", changes: [] },
            code: currentCode || "",
            explanation
        };
    }

    // Explain-only
    if (intent.intent === "explain") {
        onStage({ stage: "explaining", status: "running" });
        const explanation = await runExplainer(userMessage, currentPlan, true, intent.blockedItems);
        onStage({ stage: "explaining", status: "done", explanation });
        return {
            plan: currentPlan || { action: "modify", description: "Explanation only", changes: [] },
            code: currentCode || "",
            explanation
        };
    }

    // Start-over detection
    const resetRegex = /(start over|clear everything|new UI|new layout|new dashboard|delete everything|from scratch|fresh start|scrap this|wipe|completely new|redo everything|build me a new|replace everything|forget the old)/i;
    const shouldDiscard = resetRegex.test(userMessage) || intent.discardExisting;

    if (shouldDiscard) {
        intent.intent = "create";
        intent.action = "create";
    }

    const codeForPlanner = shouldDiscard ? null : currentCode;
    const planForPlanner = shouldDiscard ? null : currentPlan;

    // Step 2: Planner
    onStage({ stage: "planning", status: "running" });
    const plan = await runPlanner(intent.sanitizedRequest, codeForPlanner, planForPlanner, intent);
    if (shouldDiscard) plan.action = "create";
    onStage({ stage: "planning", status: "done", plan });

    // Step 3: Generator
    onStage({ stage: "generating", status: "running" });
    const codeForGenerator = shouldDiscard ? null : currentCode;
    let code = "";
    let generationSuccessful = false;
    const MAX_RETRIES = 2;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        code = await runGenerator(plan, codeForGenerator);
        const validation = validateHTML(code);
        if (validation.valid) {
            generationSuccessful = true;
            break;
        }
        console.warn(`[Pipeline] Validation failed (attempt ${attempt + 1}): ${validation.errors.join(", ")}`);
    }

    let finalCode = code;
    if (!generationSuccessful) {
        if (currentCode) {
            finalCode = currentCode;
        } else {
            finalCode = `const App = () => <Card title="Error"><Row>Failed to generate safe UI.</Row></Card>; render(<App />);`;
        }
        intent.blockedItems.push("Generation failed compilation safety checks.");
    }
    onStage({ stage: "generating", status: "done", code: finalCode });

    // Step 4: Explainer
    onStage({ stage: "explaining", status: "running" });
    const explanation = await runExplainer(userMessage, plan, intent.intent === "modify", intent.blockedItems);
    onStage({ stage: "explaining", status: "done", explanation });

    console.log("[Pipeline] Pipeline complete ✓");
    return { plan, code: finalCode, explanation };
}
