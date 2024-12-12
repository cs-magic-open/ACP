import {defaultPrompt, Prompt} from "@/types";
import {atomWithStorage} from './storage';


export const promptAtom = atomWithStorage<Prompt>({
    key: "prompt", defaultValue: defaultPrompt, storageType: "both",
});