import { z } from "zod";

export const tagSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Tag cannot be empty"),
});

// Schema definitions
export const promptSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  version: z.string().default("0.1.0"),
  tags: z.array(tagSchema),
  content: z.string().min(10, "Prompt content must be at least 10 characters"),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Type definitions
export type Tag = z.infer<typeof tagSchema>;
export type Prompt = z.infer<typeof promptSchema>;

// Default values
export const defaultPrompt: Prompt = {
  title: "",
  notes: "",
  version: "0.1.0",
  tags: [],
  content: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export interface PromptData {
  prompt: {
    title: string;
    content: string;
    version?: string;
    tags: string[];
    slug?: string;
  };
  author?: {
    name: string;
    email?: string;
    url?: string;
  };
}
