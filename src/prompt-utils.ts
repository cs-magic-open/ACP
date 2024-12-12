import {promptSchema} from "@/types";

export function formatTag(tag: string): string {
    return tag.trim().toLowerCase().replace(/\s+/g, "-");
}

export function validatePrompt(data: unknown): { success: boolean; errors?: string[] } {
    try {
        promptSchema.parse(data);
        return {success: true};
    } catch (error) {
        if (error instanceof Error) {
            return {
                success: false, errors: [error.message],
            };
        }
        return {
            success: false, errors: ["Invalid prompt data"],
        };
    }
}