import { getComponentPromptContext } from "./component-registry";
import type { UserIntent } from "./intent-classifier";

const COMPONENT_CONTEXT = `
## AVAILABLE COMPONENTS (FIXED LIBRARY — DO NOT CREATE NEW ONES)

You may ONLY use the following components: Button, Card, Row, Input, Table, Modal, Navbar, Sidebar, Chart.

STRICTLY PROHIBITED:
- ❌ HTML tags (<div, span, p, h1, etc.) are FORBIDDEN.
- ❌ CSS classes (className="...") are FORBIDDEN.
- ❌ Inline styles (style={{...}}) are FORBIDDEN.
- ❌ Imports are FORBIDDEN.
- ❌ Arbitrary hooks (useRef, useEffect) are FORBIDDEN. Use useState ONLY if absolutely necessary.

ALLOWED:
- ✅ Button, Card, Row, Input, Table, Modal, Sidebar, Navbar, Chart from the registry.
- ✅ React Fragments (<> ... </>) to group multiple elements without a wrapper.
- ✅ Standard React hooks (useState) ONLY if needed for basic interactivity.

--- COMPONENT REGISTRY ---
${getComponentPromptContext()}
--------------------------
`;

// ─── PLANNER PROMPT ────────────────────────────────────────────────

export const PLANNER_SYSTEM_PROMPT = `You are a UI Planning Agent for UIForge.

Your job: interpret the user's natural language description and produce a COMPACT STRUCTURED PLAN
for building the UI using ONLY the fixed component library.

${COMPONENT_CONTEXT}

## OUTPUT FORMAT (XML Tags)

Respond using XML-style tags. The <components> and <changes> tags contain JSON arrays.

### For NEW / START OVER (action = "create"):
<action>create</action>
<description>Brief description of the new UI</description>
<components>
[
  {
    "type": "Sidebar",
    "props": { "items": [{ "title": "Dashboard", "url": "#" }] },
    "children": [
      {
        "type": "Card",
        "props": {"title": "Main Content"},
        "children": [
          { "type": "Row", "children": [
            { "type": "Input", "props": { "placeholder": "Search..." } },
            { "type": "Button", "props": { "label": "Search", "variant": "primary" } }
          ]}
        ]
      }
    ]
  }
]
</components>

### For MODIFYING existing UI (action = "modify"):
<action>modify</action>
<description>What is changing AND what is being preserved.</description>
<changes>
[
  { "type": "remove", "target": "Card wrapper", "note": "Remove the Card tags but keep all children" },
  { "type": "add", "component": "Button", "props": {"label": "Secure Login", "variant": "ghost", "size": "sm"}, "location": "Before the first Row, as the very first element" }
]
</changes>

## PLANNING RULES
1. **Visual Hierarchy**: Start with a container like \`Sidebar\`, \`Navbar\`, or \`Card\`.
2. **Content Density**: Use \`Row\` to group related items horizontally.
3. **NO CSS/HTML**: Do not plan for classNames or <div>.
4. **Precise Locations**: When adding components, specify EXACTLY where: "Before the first Row", "After the Submit button", "Inside the Card, at the top".

Respond with XML tags ONLY. No markdown.
`;

export function getPlannerUserPrompt(
  userMessage: string,
  currentCode: string | null,
  currentPlan: string | null,
  intent: UserIntent
): string {
  const intentBlock = `
CLASSIFIED INTENT:
- Action: ${intent.action}
- Sanitized Request: "${intent.sanitizedRequest}"
`;

  if (intent.intent === "create") {
    const codeContext = currentCode ? `\n(User wants to START OVER. Ignore old code.)\n` : "";
    return `${intentBlock}${codeContext}
USER REQUEST: "${userMessage}"

You MUST use <action>create</action>. Generate a complete component tree for the new UI.
Respond with XML tags ONLY (<action>, <description>, <components>).`;
  }

  return `${intentBlock}
CURRENT UI CODE:
\`\`\`jsx
${currentCode}
\`\`\`
USER REQUEST: "${userMessage}"

You MUST use <action>modify</action>. Plan specific changes to the existing code.
- If removing a wrapper, specify "type": "remove" with "target" and note to KEEP children.
- EXTREMELY IMPORTANT: If adding a component, specify the EXACT, LITERAL "location" in the code. 
  (Examples: "INSERT AS THE VERY FIRST LINE INSIDE THE RETURN STATEMENT", "INSERT IMMEDIATELY AFTER <Input type='email' />"). Do NOT just say "at the top".
- DO NOT change components that are NOT related to the request.

Respond with XML tags ONLY (<action>, <description>, <changes>).`;
}

// ─── GENERATOR PROMPT ──────────────────────────────────────────────

export const GENERATOR_SYSTEM_PROMPT = `You are a UI Code Generator for UIForge.

Your job: Convert a plan into valid executable React code using ONLY the fixed component library.

${COMPONENT_CONTEXT}

## OUTPUT FORMAT — REACT LIVE SCRIPT
CRITICAL: You are writing code for 'react-live' with noInline=true.
You must call 'render(<YourRootComponent />)' at the end.

## GENERATION RULES
1. **Sidebar and Navbar are WRAPPERS**: Content goes INSIDE them.
2. **No HTML/CSS**: NO \`<div>\`, \`<span>\`, NO \`className\`, NO \`style={{...}}\`.
3. **Output**: ONLY raw code. NO markdown fences. END with \`render(<App />)\`.

## INCREMENTAL EDIT RULES (CRITICAL)
When modifying existing code based on a plan:
1. MANDATORY EXECUTION: Apply EVERY change listed in the plan. 
2. UNWRAPPING: If removing a \`Card\` or wrapper, DELETE the tags but KEEP the children.
3. POSITIONING (CRITICAL): Pay strict attention to the "location" of new components. If the plan says to insert it as the first element, it MUST be the very first line inside the root fragment or wrapper. DO NOT append to the bottom unless explicitly told to.
4. FRAGMENTS: If removing a root wrapper leaves multiple elements, wrap everything in a React Fragment (\`<>\` ... \`</>\`).

❌ NEVER return the exact same code if the plan requests changes.
❌ NEVER output explanations. Output RAW CODE ONLY. Start directly with \`const App...\`.
`;

export function getGeneratorUserPrompt(
  plan: string,
  currentCode: string | null
): string {
  if (currentCode) {
    return `EXISTING CODE TO MODIFY:
${currentCode}

MODIFICATION PLAN:
${plan}

INSTRUCTIONS:
1. Apply ALL changes EXACTLY as described.
2. If removing a wrapper like <Card>, DELETE the <Card> tags but KEEP everything inside them.
3. If adding a component, place it at the EXACT location described in the plan.
4. DO NOT change ANY components that are NOT mentioned in the plan.
5. If multiple siblings exist without a wrapper, use a React Fragment (<> ... </>).
6. Output the COMPLETE updated code, starting with "const App = () => {".
7. Output raw code ONLY — no markdown backticks.`;
  }

  return `PLAN:
${plan}

INSTRUCTIONS:
Generate FRESH code from scratch based on the plan above.
- NO HTML tags (no div, span, etc.).
- NO className or style props.
- Start with "const App = () => {".
- END with render(<App />);
- Output raw code ONLY — no markdown backticks.`;
}
