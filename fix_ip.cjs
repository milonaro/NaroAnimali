import fs from "fs";
let content = fs.readFileSync("server.ts", "utf-8");
content = content.replace(/const ip = req\.ip \|\| \(req\.headers\['x-forwarded-for'\] as string\) \|\| '';(?:\\r|\\n)\\s*const userAgent = req\.headers\['user-agent'\] \|\| '';/g, `const ipHeader = req.ip || (req.headers['x-forwarded-for'] as string) || '';\n    const ip = ipHeader.substring(0, 45);\n    const userAgent = (req.headers['user-agent'] || '').substring(0, 255);`);
fs.writeFileSync("server.ts", content);
console.log("Replaced!")
