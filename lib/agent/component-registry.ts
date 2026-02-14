/**
 * Fixed Component Registry
 *
 * This is the single source of truth for all components the AI is allowed to use.
 * The AI may ONLY select, compose, and set props on these components.
 * It may NOT create new components, use inline styles, or generate arbitrary CSS.
 */

export interface ComponentProp {
    name: string;
    type: string;
    description: string;
    required?: boolean;
    values?: string[]; // enum-like allowed values
}

export interface ComponentDef {
    name: string;
    tag: string; // JSX tag
    description: string;
    props: ComponentProp[];
    children?: boolean; // whether it accepts children
    example: string;
}

export const COMPONENT_REGISTRY: ComponentDef[] = [
    {
        name: "Button",
        tag: "Button",
        description: "A clickable button with variants.",
        props: [
            {
                name: "label",
                type: "string",
                description: "The text to display on the button. REQUIRED.",
                required: true
            },
            {
                name: "onClick",
                type: "function",
                description: "Function to call on click. OPTIONAL.",
            },
            {
                name: "variant",
                type: "string",
                description: "Visual style: 'primary', 'secondary', 'danger', 'ghost', 'outline'. Default 'primary'.",
                values: ["primary", "secondary", "danger", "ghost", "outline"],
            },
            {
                name: "size",
                type: "string",
                description: "Size: 'default', 'sm', 'lg', 'icon'. Default 'default'.",
                values: ["default", "sm", "lg", "icon"],
            },
            {
                name: "isLoading",
                type: "boolean",
                description: "Show loading spinner.",
            },
        ],
        children: false,
        example: `<Button label="Click Me" variant="primary" />`,
    },
    {
        name: "Card",
        tag: "Card",
        description: "A container for content.",
        children: true,
        props: [
            {
                name: "title",
                type: "string",
                description: "Optional title for the card header.",
            }
        ],
        example: `<Card title="My Card"><Row><Button label="Action" /></Row></Card>`,
    },
    {
        name: "Row",
        tag: "Row",
        description: "A horizontal layout container with gap.",
        children: true,
        props: [],
        example: `<Row><Button label="A" /><Button label="B" /></Row>`,
    },
    {
        name: "Input",
        tag: "Input",
        description: "A text input field.",
        children: false,
        props: [
            { name: "value", type: "string", description: "Input value." },
            { name: "placeholder", type: "string", description: "Placeholder text." },
            { name: "type", type: "string", description: "Type: text, password, etc.", values: ["text", "password", "email", "number"] },
            { name: "onChange", type: "function", description: "Change handler." },
        ],
        example: `<Input placeholder="Type here..." />`,
    },
    {
        name: "Table",
        tag: "Table",
        description: "A data table. Auto-generates columns from keys of first item.",
        children: false,
        props: [
            { name: "data", type: "array", description: "Array of objects. Keys become columns. REQUIRED.", required: true },
            { name: "caption", type: "string", description: "Optional table caption." }
        ],
        example: `<Table data={[{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]} caption="Users" />`
    },
    {
        name: "Modal",
        tag: "Modal",
        description: "A dialog/modal window.",
        children: true,
        props: [
            { name: "triggerLabel", type: "string", description: "Text for the button that opens the modal. REQUIRED.", required: true },
            { name: "title", type: "string", description: "Title of the modal. REQUIRED.", required: true },
            { name: "description", type: "string", description: "Description text." }
        ],
        example: `<Modal triggerLabel="Open" title="Details"><p>Content</p></Modal>`
    },
    {
        name: "Navbar",
        tag: "Navbar",
        description: "Top navigation bar that acts as a page layout wrapper. Place content INSIDE it as children — the navbar renders at the top, children render below.",
        children: true,
        props: [
            { name: "items", type: "array", description: "Array of { title: string, href: string }. REQUIRED.", required: true }
        ],
        example: `<Navbar items={[{ title: "Home", href: "#" }, { title: "Profile", href: "#" }]}>\n  <Card title="Page Content"><Button label="Click" /></Card>\n</Navbar>`
    },
    {
        name: "Sidebar",
        tag: "Sidebar",
        description: "Side navigation layout. Wraps the main content.",
        children: true,
        props: [
            { name: "items", type: "array", description: "Array of { title: string, url: string }. REQUIRED.", required: true }
        ],
        example: `<Sidebar items={[{ title: "Dashboard", url: "/dash" }]}><Row>Main Content</Row></Sidebar>`
    },
    {
        name: "Chart",
        tag: "Chart",
        description: "A chart visualization.",
        children: false,
        props: [
            { name: "data", type: "array", description: "Array of data objects. REQUIRED.", required: true },
            { name: "config", type: "object", description: "Chart config object mapping keys to labels/colors. REQUIRED.", required: true },
            { name: "xKey", type: "string", description: "Key for X axis. REQUIRED.", required: true },
            { name: "yKeys", type: "array", description: "Array of keys for Y axis bars. REQUIRED.", required: true },
            { name: "type", type: "string", description: "Chart type: 'bar'. Default 'bar'.", values: ["bar"] }
        ],
        example: `<Chart data={[{ name: "A", val: 10 }]} config={{ val: { label: "Value", color: "blue" } }} xKey="name" yKeys={["val"]} />`
    }
];

/**
 * Component name whitelist for validation
 */
export const ALLOWED_COMPONENTS = COMPONENT_REGISTRY.map((c) => c.name);

/**
 * Generate a condensed component reference for AI prompts
 */
export function getComponentPromptContext(): string {
    return COMPONENT_REGISTRY.map((comp) => {
        const propsStr = comp.props.length > 0
            ? comp.props
                .map((p) => {
                    let def = `  - ${p.name} (${p.type}): ${p.description}`;
                    if (p.values) def += ` [${p.values.join(" | ")}]`;
                    return def;
                })
                .join("\n")
            : "  (no configurable props)";

        return `### ${comp.name}
${comp.description}
${comp.children ? "Accepts children: yes" : "Accepts children: no"}
Props:
${propsStr}
Example:
\`\`\`jsx
${comp.example}
\`\`\``;
    }).join("\n\n");
}
