const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

// Extract just the JavaScript part
const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.log("No script tag found");
  process.exit(1);
}

const jsCode = scriptMatch[1];

// Try to parse it
try {
  new Function(jsCode);
  console.log("✅ No syntax errors found");
} catch (e) {
  console.log("❌ Syntax error:", e.message);
  console.log("Line info:", e.stack);
}
