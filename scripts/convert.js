"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const TOML = __importStar(require("@iarna/toml"));
const rulesSourceDir = path.join(__dirname, "../data/rules_ts");
const rulesTargetDir = path.join(__dirname, "../data/rules");
// Create target directory if it doesn't exist
if (!fs.existsSync(rulesTargetDir)) {
    fs.mkdirSync(rulesTargetDir, { recursive: true });
}
// Function to format nested object as TOML
function formatNestedObject(obj, prefix = "") {
    const lines = [];
    Object.entries(obj).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            lines.push(...formatNestedObject(value, fullKey));
        }
        else {
            lines.push(TOML.stringify({ [fullKey]: value }).trim());
        }
    });
    return lines;
}
// Function to generate TOML string with ordered fields
function generateOrderedToml(rule) {
    const lines = [];
    const authorField = "author";
    const promptFields = ["title", "version", "tags", "content", "notes"];
    const remainingFields = ["slug", "libs", "description", "category", "framework"];
    // Set default version if not present
    if (!rule.version) {
        rule.version = "0.1.0";
    }
    // Handle author field first
    if (rule[authorField]) {
        lines.push("[author]");
        Object.entries(rule[authorField]).forEach(([key, value]) => {
            lines.push(TOML.stringify({ [key]: value }).trim());
        });
        lines.push(""); // Add empty line after author
    }
    // Add [prompt] section
    lines.push("[prompt]");
    // Add prompt fields in specified order
    promptFields.forEach(field => {
        if (rule[field] !== undefined) {
            if (typeof rule[field] === "object" && !Array.isArray(rule[field])) {
                Object.entries(rule[field]).forEach(([key, value]) => {
                    lines.push(TOML.stringify({ [key]: value }).trim());
                });
            }
            else {
                lines.push(TOML.stringify({ [field]: rule[field] }).trim());
            }
        }
    });
    // Add remaining fields under prompt
    remainingFields.forEach(field => {
        if (rule[field] !== undefined) {
            if (typeof rule[field] === "object" && !Array.isArray(rule[field])) {
                Object.entries(rule[field]).forEach(([key, value]) => {
                    lines.push(TOML.stringify({ [key]: value }).trim());
                });
            }
            else {
                lines.push(TOML.stringify({ [field]: rule[field] }).trim());
            }
        }
    });
    // Add any other fields not explicitly handled
    Object.keys(rule).forEach(key => {
        if (key !== authorField && !promptFields.includes(key) && !remainingFields.includes(key)) {
            if (typeof rule[key] === "object" && !Array.isArray(rule[key])) {
                Object.entries(rule[key]).forEach(([k, v]) => {
                    lines.push(TOML.stringify({ [k]: v }).trim());
                });
            }
            else {
                lines.push(TOML.stringify({ [key]: rule[key] }).trim());
            }
        }
    });
    return lines.join('\n');
}
// Function to convert TS object to TOML format and save individual files
function convertAndSaveRules(tsContent, baseName) {
    // Remove 'export const' and get the array content
    const match = tsContent.match(/export const \w+ = (\[[\s\S]*\])/);
    if (!match)
        throw new Error("Invalid TS file format");
    // Evaluate the array content safely
    const rulesArray = eval(match[1]);
    // Process each rule
    rulesArray.forEach((rule, index) => {
        const fileName = `${rule.slug || `rule-${index + 1}`}.toml`;
        const filePath = path.join(rulesTargetDir, fileName);
        // Generate ordered TOML content
        const tomlContent = generateOrderedToml(rule);
        fs.writeFileSync(filePath, tomlContent);
    });
    return rulesArray.length;
}
// Process all TS files
fs.readdirSync(rulesSourceDir).forEach((file) => {
    if (!file.endsWith(".ts"))
        return;
    const sourcePath = path.join(rulesSourceDir, file);
    const baseName = path.basename(file, ".ts");
    try {
        // Read TS file
        const tsContent = fs.readFileSync(sourcePath, "utf-8");
        // Convert and save individual TOML files
        const count = convertAndSaveRules(tsContent, baseName);
        console.log(`Converted ${file} to ${count} TOML files successfully`);
    }
    catch (error) {
        console.error(`Error converting ${file}:`, error);
    }
});
console.log("Conversion complete!");
//# sourceMappingURL=convert.js.map