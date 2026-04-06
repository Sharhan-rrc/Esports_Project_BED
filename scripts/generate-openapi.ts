import fs from "fs";
import path from "path";
import { generateSwaggerSpec } from "../src/config/swaggerOptions";

const outputPath = path.resolve(process.cwd(), "openapi.json");
const specs = generateSwaggerSpec();

fs.writeFileSync(outputPath, JSON.stringify(specs, null, 2), "utf8");

console.log("OpenAPI specification generated successfully at openapi.json");
