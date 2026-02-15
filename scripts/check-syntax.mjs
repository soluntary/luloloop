import { execSync } from 'child_process';

try {
  const result = execSync('npx tsc --noEmit --pretty 2>&1', { 
    cwd: '/vercel/share/v0-project',
    encoding: 'utf-8',
    timeout: 60000
  });
  console.log("No errors found!");
  console.log(result);
} catch (error) {
  // Filter for library/page.tsx errors
  const lines = error.stdout?.split('\n') || [];
  const libraryErrors = lines.filter(l => l.includes('library/page.tsx') || l.includes('error TS'));
  if (libraryErrors.length > 0) {
    console.log("Library page errors:");
    libraryErrors.slice(0, 30).forEach(l => console.log(l));
  } else {
    console.log("All errors (first 30):");
    lines.slice(0, 30).forEach(l => console.log(l));
  }
}
