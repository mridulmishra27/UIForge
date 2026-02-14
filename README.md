# UIForge

**UIForge** is an AI-powered UI builder that generates React components from natural language descriptions. Built with Next.js, TypeScript, and Groq AI, it uses a sophisticated multi-agent pipeline to interpret user requests, plan UI structures, generate safe code, and provide explanations.

## 🎯 Overview

UIForge transforms natural language into functional React UI components through a controlled, component-based approach. Unlike open-ended code generators, UIForge enforces strict design constraints by limiting generation to a predefined component library, ensuring consistent, maintainable, and safe UI code.

### Key Features

- **Natural Language Interface**: Describe UIs in plain English
- **Live Preview**: See generated components render in real-time
- **Version History**: Track changes with undo/redo functionality
- **Streaming Pipeline**: Real-time progress updates during generation
- **Safe Code Generation**: Validated output with no arbitrary HTML/CSS
- **Session Management**: Persistent chat history and version snapshots

## 📁 Project Structure

```
uiforge/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── chat/                 # SSE streaming chat endpoint
│   │   ├── session/              # Session management
│   │   └── versions/              # Version history API
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main application page
│
├── components/
│   ├── app/                      # Application components
│   │   ├── ArtifactPanel.tsx     # Code editor & live preview
│   │   ├── ChatPanel.tsx         # Chat interface
│   │   ├── CodeEditor.tsx        # Monaco-based code editor
│   │   ├── LivePreview.tsx       # React Live preview
│   │   └── VersionHistoryDropdown.tsx
│   ├── ui/                       # shadcn/ui components
│   └── uikit.tsx                 # Component registry wrappers
│
├── lib/
│   ├── agent/                    # AI Agent Pipeline
│   │   ├── pipeline.ts           # Main orchestration
│   │   ├── intent-classifier.ts  # Gatekeeper/Intent detection
│   │   ├── planner.ts            # UI structure planning
│   │   ├── generator.ts          # Code generation
│   │   ├── validator.ts          # Code validation
│   │   ├── explainer.ts          # User explanations
│   │   ├── component-registry.ts # Component definitions
│   │   └── prompts.ts            # Agent prompts
│   ├── session.ts                # Session management
│   ├── types.ts                  # TypeScript types
│   └── utils.ts                  # Utilities
│
├── config/
│   ├── db.tsx                    # Drizzle ORM setup
│   └── schema.tsx                # Database schema
│
├── hooks/                        # React hooks
└── public/                       # Static assets
```

## 🏗️ Architecture Overview

### System Architecture

UIForge follows a **multi-agent pipeline architecture** where specialized AI agents handle distinct responsibilities:

```
User Request
    ↓
[Intent Classifier] → Classifies & sanitizes request
    ↓
[Planner] → Generates structured UI plan
    ↓
[Generator] → Converts plan to React code
    ↓
[Validator] → Ensures code safety
    ↓
[Explainer] → Provides user feedback
    ↓
UI Component
```

### Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI Components**: shadcn/ui, Radix UI, Tailwind CSS
- **AI/LLM**: Groq SDK (Llama models)
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Code Execution**: react-live for live preview
- **State Management**: React hooks (useState, useCallback)

### Data Flow

1. **User Input** → Chat interface sends message to `/api/chat`
2. **Streaming Pipeline** → Server-Sent Events (SSE) stream stage updates
3. **Agent Processing** → Multi-stage pipeline processes request
4. **Database Persistence** → Versions and messages saved to PostgreSQL
5. **UI Update** → Frontend receives updates and renders preview

## 🤖 Agent Design & Prompts

### 1. Intent Classifier (Gatekeeper)

**Purpose**: First-line defense that classifies user intent and filters forbidden requests.

**Model**: `meta-llama/llama-4-maverick-17b-128e-instruct`  
**Temperature**: 0.1 (low for consistency)

**Responsibilities**:
- Classify intent: `create`, `modify`, or `explain`
- Detect "start over" requests
- Sanitize user input (remove forbidden items)
- Block requests for inline styles, custom CSS, HTML tags, etc.

**Output Format**: XML tags (`<intent>`, `<action>`, `<cleaned_request>`, `<blocked_items>`, etc.)

**Key Prompt Features**:
- Explicit forbidden items list
- Intent classification rules
- Discard detection logic

### 2. Planner

**Purpose**: Converts sanitized user requests into structured UI plans.

**Model**: `meta-llama/llama-4-maverick-17b-128e-instruct`  
**Temperature**: 0.3

**Responsibilities**:
- Generate component tree structure (for `create` actions)
- Plan incremental changes (for `modify` actions)
- Specify exact component locations for additions
- Use only allowed components from registry

**Output Format**: XML with JSON arrays:
- `<action>create|modify</action>`
- `<description>...</description>`
- `<components>[...]</components>` (for create)
- `<changes>[...]</changes>` (for modify)

**Key Prompt Features**:
- Component registry context injection
- Visual hierarchy guidelines
- Precise location specifications for modifications

### 3. Generator

**Purpose**: Converts plans into executable React code.

**Model**: `meta-llama/llama-4-scout-17b-16e-instruct`  
**Temperature**: 0.2 (very low for code accuracy)

**Responsibilities**:
- Generate React code using only allowed components
- Apply incremental edits precisely
- Handle wrapper removal while preserving children
- Output code compatible with `react-live` (noInline mode)

**Output Format**: Raw React code ending with `render(<App />)`

**Key Prompt Features**:
- Strict component-only constraints
- Incremental edit rules
- React Fragment handling for unwrapped siblings

### 4. Validator

**Purpose**: Static code validation to ensure safety.

**Validation Rules**:
- ❌ No HTML tags (`<div>`, `<span>`, etc.)
- ❌ No `className` attributes
- ❌ No `style` attributes
- ❌ No `import` statements
- ❌ No external URLs
- ✅ Must include `render()` call
- ✅ Only whitelisted components allowed

**Retry Logic**: Up to 2 retries if validation fails

### 5. Explainer

**Purpose**: Provides user-friendly explanations of actions taken.

**Model**: `llama-3.1-8b-instant`  
**Temperature**: 0.5

**Responsibilities**:
- Explain what was built/modified
- Describe UI structure when asked
- Inform users about blocked requests
- Provide context-aware feedback

## 🧩 Component System Design

### Component Registry

UIForge uses a **fixed component library** approach. All components are defined in `lib/agent/component-registry.ts` and wrapped in `components/uikit.tsx`.

### Available Components

1. **Button** - Clickable button with variants (primary, secondary, danger, ghost, outline)
2. **Card** - Content container with optional title
3. **Row** - Horizontal layout container with gap
4. **Input** - Text input field (text, password, email, number)
5. **Table** - Data table with auto-generated columns
6. **Modal** - Dialog/modal window
7. **Navbar** - Top navigation bar (page wrapper)
8. **Sidebar** - Side navigation layout (page wrapper)
9. **Chart** - Bar chart visualization (Recharts)

### Design Principles

1. **No HTML/CSS**: Components abstract away raw HTML and styling
2. **Prop-Based Configuration**: All customization via props
3. **Composition**: Components can nest (e.g., `Card` → `Row` → `Button`)
4. **Wrapper Components**: `Navbar` and `Sidebar` act as page layouts
5. **Type Safety**: Full TypeScript definitions for all components

### Component Wrapper Pattern

Each component in `uikit.tsx`:
- Wraps shadcn/ui components
- Maps simplified props to underlying component props
- Provides consistent API for AI generation
- Handles edge cases (empty data, missing props, etc.)

**Example**:
```typescript
export const Button = ({ label, onClick, variant = 'primary', ... }) => {
    return (
        <ShadcnButton variant={mapVariant(variant)} onClick={onClick}>
            {label}
        </ShadcnButton>
    );
};
```

### Forbidden Patterns

The system explicitly blocks:
- Raw HTML tags (`<div>`, `<span>`, `<p>`, etc.)
- Inline styles (`style={{...}}`)
- CSS classes (`className="..."`)
- Custom component creation
- External imports
- Arbitrary React hooks (only `useState` allowed when necessary)

## ⚠️ Known Limitations

### 1. Component Library Constraints
- **Limited Component Set**: Only 9 components available. Complex UIs may require multiple iterations.
- **No Custom Styling**: Cannot generate custom CSS, Tailwind classes, or inline styles.
- **Layout Limitations**: Limited to `Row` for horizontal layouts; no grid or complex flexbox configurations.

### 2. Code Generation Limitations
- **No State Management**: Only basic `useState` allowed. No context, reducers, or external state libraries.
- **No Side Effects**: Cannot use `useEffect`, `useRef`, or other hooks for complex interactions.
- **No External Data**: Cannot fetch data from APIs or external sources.
- **Static Data Only**: Tables and charts require hardcoded data arrays.

### 3. AI Model Limitations
- **Model Accuracy**: Groq models may occasionally misinterpret complex requests.
- **Retry Logic**: Limited to 2 retries on validation failure.
- **Context Window**: Large codebases may exceed model context limits.
- **Temperature Trade-offs**: Lower temperatures improve consistency but reduce creativity.

### 4. User Experience
- **No Authentication**: Sessions are anonymous with 1-day TTL.
- **No Export**: Cannot export generated code as files.
- **No Collaboration**: Single-user sessions only.
- **Limited Undo/Redo**: Version history only within session.

### 5. Validation Limitations
- **Static Analysis Only**: Validates syntax, not runtime behavior.
- **No Type Checking**: TypeScript types not enforced at runtime.
- **Limited Error Messages**: Validation errors may be generic.

### 6. Database Limitations
- **Session Expiry**: Sessions expire after 1 day.
- **No Data Export**: Cannot export chat history or versions.
- **No Search**: Cannot search through version history.

## 🚀 What You'd Improve With More Time

### 1. Enhanced Component Library
- **More Components**: Add `Select`, `Checkbox`, `Radio`, `Textarea`, `Tabs`, `Accordion`, `Tooltip`, `Popover`
- **Layout Components**: Add `Grid`, `Stack`, `Container` for better layout control
- **Data Components**: Add `Pagination`, `Search`, `Filter` for data-heavy UIs
- **Feedback Components**: Add `Toast`, `Alert`, `Progress`, `Skeleton`

### 2. Advanced Code Generation
- **State Management**: Support for React Context, Zustand, or Jotai
- **Side Effects**: Allow `useEffect` for data fetching and lifecycle management
- **Custom Hooks**: Enable AI to create reusable custom hooks
- **API Integration**: Support for mock API calls or real API integration
- **Form Handling**: Built-in form validation with react-hook-form

### 3. Improved AI Pipeline
- **Better Models**: Upgrade to more capable models (GPT-4, Claude) for complex reasoning
- **Fine-tuning**: Fine-tune models on UI generation tasks
- **Multi-step Planning**: Break complex requests into sub-tasks
- **Code Review**: Add AI code review step to suggest improvements
- **Error Recovery**: Better error handling and automatic retry strategies

### 4. User Experience Enhancements
- **Authentication**: User accounts with persistent projects
- **Export Functionality**: Download code as files, copy to clipboard
- **Project Management**: Save/load projects, project templates
- **Collaboration**: Real-time collaboration, sharing projects
- **Search & Filter**: Search chat history, filter versions
- **Keyboard Shortcuts**: Power user shortcuts for common actions

### 5. Developer Experience
- **TypeScript Support**: Full TypeScript generation with proper types
- **Component Props Editor**: Visual editor for component props
- **Code Formatting**: Automatic Prettier/ESLint formatting
- **Linting**: Real-time linting in code editor
- **Testing**: Generate unit tests for components

### 6. Architecture Improvements
- **Caching**: Cache common component patterns and plans
- **Streaming Optimization**: Better SSE handling, connection management
- **Database Optimization**: Indexing, query optimization, connection pooling
- **Error Monitoring**: Sentry or similar for error tracking
- **Analytics**: Track usage patterns, common requests, failure modes

### 7. Validation & Safety
- **Runtime Validation**: Execute code in sandboxed environment
- **Security Scanning**: Detect XSS, injection vulnerabilities
- **Performance Checks**: Warn about performance issues
- **Accessibility**: Validate ARIA attributes, keyboard navigation

### 8. Documentation & Onboarding
- **Interactive Tutorial**: Guided tour of features
- **Component Examples**: Gallery of example UIs
- **Prompt Templates**: Pre-built prompts for common UI patterns
- **Video Tutorials**: Video guides for complex workflows

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- Groq API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd uiforge
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Add your environment variables:
```
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=your_postgres_connection_string
```

4. Set up the database:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## 📝 License

[Add your license here]

## 🤝 Contributing

[Add contribution guidelines here]
