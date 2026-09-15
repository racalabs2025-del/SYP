import fs from 'node:fs';
import readline from 'node:readline';

const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/candu/.gemini/antigravity-ide/brain/be0b0121-30fa-45bc-b5bd-fdd3cd82dd11/.system_generated/logs/transcript.jsonl'),
  crlfDelay: Infinity
});

let count = 0;
for await (const line of rl) {
  if (line.includes('"name":"generate_image"') && count < 6) {
    try {
      const obj = JSON.parse(line);
      const calls = (obj.tool_calls || []).filter(c => c.name === 'generate_image');
      for (const call of calls) {
        console.log(`\n=== CALL ${++count} ===`);
        console.log('ImageName:', call.args?.ImageName);
        console.log('AspectRatio:', call.args?.AspectRatio);
        console.log('ImagePaths:', call.args?.ImagePaths);
        console.log('Prompt:', call.args?.Prompt);
        if (count >= 6) break;
      }
    } catch {
      // ignore
    }
  }
}
