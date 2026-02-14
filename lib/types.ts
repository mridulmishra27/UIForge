export interface StreamingStage {
    intent: "pending" | "running" | "done";
    planning: "pending" | "running" | "done";
    generating: "pending" | "running" | "done";
    explaining: "pending" | "running" | "done";
}

export const INITIAL_STAGE: StreamingStage = {
    intent: "pending",
    planning: "pending",
    generating: "pending",
    explaining: "pending",
};
