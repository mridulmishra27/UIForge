import { ALLOWED_COMPONENTS } from "./component-registry";

interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export function validateHTML(code: string): ValidationResult {
    const errors: string[] = [];

    if (!code || code.trim().length === 0) {
        return { valid: false, errors: ["Empty code output"] };
    }

    // THE ULTIMATE HTML BLOCKER (Catches <div, <marquee, <span, etc.)
    const lowercaseTagRegex = /<([a-z][a-z0-9-]*)\b/g;
    let match;
    while ((match = lowercaseTagRegex.exec(code)) !== null) {
        errors.push(`Forbidden HTML tag found: <${match[1]}>. You MUST use only allowed UI components.`);
    }

    if (/className\s*=/i.test(code)) errors.push("className attribute is forbidden");
    if (/style\s*=/i.test(code)) errors.push("style attribute is forbidden");
    if (/onClick\s*=/i.test(code)) errors.push("JavaScript events are forbidden");
    if (/import\s+/i.test(code)) errors.push("Import statements are not allowed");
    if (/https?:\/\//i.test(code)) errors.push("External URLs/CDN links are not allowed");
    if (!/render\s*\(/i.test(code)) errors.push("Missing 'render(...)' call at the end");

    return {
        valid: errors.length === 0,
        errors,
    };
}

export function validatePlan(plan: {
    components?: Array<{ type: string }>;
    changes?: Array<{ component?: string }>;
}): ValidationResult {
    const errors: string[] = [];

    if (plan.components && Array.isArray(plan.components)) {
        for (const component of plan.components) {
            if (!ALLOWED_COMPONENTS.includes(component.type)) {
                errors.push(`Invalid component: "${component.type}" is not in the whitelist`);
            }
        }
    }

    if (plan.changes && Array.isArray(plan.changes)) {
        for (const change of plan.changes) {
            if (change.component && !ALLOWED_COMPONENTS.includes(change.component)) {
                errors.push(`Invalid component in change: "${change.component}" is not in the whitelist`);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}