import * as fs from "fs";
import * as path from "path";
import * as TOML from "@iarna/toml";

const rulesSourceDir = path.join(__dirname, "../data/rules_ts");
const rulesTargetDir = path.join(__dirname, "../data/rules");

// Create target directory if it doesn't exist
if (!fs.existsSync(rulesTargetDir)) {
  fs.mkdirSync(rulesTargetDir, { recursive: true });
}

// Function to format nested object as TOML
function formatNestedObject(obj: any, prefix: string = ""): string[] {
  const lines: string[] = [];
  
  Object.entries(obj).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      lines.push(...formatNestedObject(value, fullKey));
    } else {
      lines.push(TOML.stringify({ [fullKey]: value as TOML.JsonMap }).trim());
    }
  });
  
  return lines;
}

// Function to generate TOML string with ordered fields
function generateOrderedToml(rule: any): string {
  const lines: string[] = [];
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
      lines.push(TOML.stringify({ [key]: value as TOML.JsonMap }).trim());
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
          lines.push(TOML.stringify({ [key]: value as TOML.JsonMap }).trim());
        });
      } else {
        lines.push(TOML.stringify({ [field]: rule[field] as TOML.JsonMap }).trim());
      }
    }
  });
  
  // Add remaining fields under prompt
  remainingFields.forEach(field => {
    if (rule[field] !== undefined) {
      if (typeof rule[field] === "object" && !Array.isArray(rule[field])) {
        Object.entries(rule[field]).forEach(([key, value]) => {
          lines.push(TOML.stringify({ [key]: value as TOML.JsonMap }).trim());
        });
      } else {
        lines.push(TOML.stringify({ [field]: rule[field] as TOML.JsonMap }).trim());
      }
    }
  });
  
  // Add any other fields not explicitly handled
  Object.keys(rule).forEach(key => {
    if (key !== authorField && !promptFields.includes(key) && !remainingFields.includes(key)) {
      if (typeof rule[key] === "object" && !Array.isArray(rule[key])) {
        Object.entries(rule[key]).forEach(([k, v]) => {
          lines.push(TOML.stringify({ [k]: v as TOML.JsonMap }).trim());
        });
      } else {
        lines.push(TOML.stringify({ [key]: rule[key] as TOML.JsonMap }).trim());
      }
    }
  });
  
  return lines.join('\n');
}

// Function to convert TS object to TOML format and save individual files
function convertAndSaveRules(tsContent: string, baseName: string) {
  // Remove 'export const' and get the array content
  const match = tsContent.match(/export const \w+ = (\[[\s\S]*\])/);
  if (!match) throw new Error("Invalid TS file format");

  // Evaluate the array content safely
  const rulesArray = eval(match[1]);

  // Process each rule
  rulesArray.forEach((rule: any, index: number) => {
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
  if (!file.endsWith(".ts")) return;

  const sourcePath = path.join(rulesSourceDir, file);
  const baseName = path.basename(file, ".ts");

  try {
    // Read TS file
    const tsContent = fs.readFileSync(sourcePath, "utf-8");

    // Convert and save individual TOML files
    const count = convertAndSaveRules(tsContent, baseName);

    console.log(`Converted ${file} to ${count} TOML files successfully`);
  } catch (error) {
    console.error(`Error converting ${file}:`, error);
  }
});

console.log("Conversion complete!");
