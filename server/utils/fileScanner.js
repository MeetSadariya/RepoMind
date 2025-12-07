const fs = require("fs");
const path = require("path");

function scanFiles(dir) {
    const result = [];
    
    // Resolve dir to absolute path for consistent path handling
    const absoluteDir = path.resolve(dir);

    const ignoreDirs = [
        "node_modules",
        ".git",
        ".next",
        "dist",
        "build",
        "out",
        ".turbo",
        ".cache",
        ".vscode",
        ".idea",
    ];

    const ignoreExtensions = [
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".svg",
        ".ico",
        ".woff",
        ".woff2",
        ".ttf",
        ".eot",
        ".mp4",
        ".mp3",
        ".zip",
        ".tar",
        ".gz",
    ];

    const languageMap = {
        // 🔹 Web / Frontend
        ".js": "JavaScript",
        ".jsx": "JavaScript (React)",
        ".ts": "TypeScript",
        ".tsx": "TypeScript (React)",
        ".html": "HTML",
        ".css": "CSS",
        ".scss": "Sass",
        ".less": "LESS",
        ".vue": "Vue",
        ".svelte": "Svelte",

        // 🔹 Backend / Server-side
        ".py": "Python",
        ".java": "Java",
        ".cs": "C#",
        ".php": "PHP",
        ".rb": "Ruby",
        ".go": "Go",
        ".rs": "Rust",
        ".kt": "Kotlin",
        ".swift": "Swift",
        ".scala": "Scala",

        // 🔹 System & Low-level
        ".c": "C",
        ".cpp": "C++",
        ".h": "C/C++ Header",
        ".hpp": "C++ Header",
        ".asm": "Assembly",

        // 🔹 Scripting
        ".sh": "Shell Script",
        ".bash": "Bash Script",
        ".ps1": "PowerShell",

        // 🔹 Mobile
        ".dart": "Dart (Flutter)",

        // 🔹 AI / ML / Data
        ".ipynb": "Jupyter Notebook",
        ".r": "R",
        ".jl": "Julia",

        // 🔹 Config / Meta
        ".json": "JSON",
        ".yaml": "YAML",
        ".yml": "YAML",
        ".xml": "XML",
        ".toml": "TOML",
        ".ini": "INI Config",

        // 🔹 Documentation
        ".md": "Markdown",
        ".txt": "Plain Text",
        ".adoc": "AsciiDoc",

        // 🔹 Build / Automation
        ".gradle": "Gradle Build Script",
        ".make": "Makefile",
        ".cmake": "CMake Build Scri pt",

        // 🔹 Logs / Misc
        ".log": "Log File",
    };

    function detectSpecialFiles(fileName) {
        const lower = fileName.toLowerCase();

        if (lower === "dockerfile") return "Dockerfile";
        if (lower === "makefile") return "Makefile";
        if (lower === "license") return "License";
        if (lower === "readme" || lower === "readme.md") return "Markdown (README)";
        if (lower === ".env") return "Environment Config";

        return null;
    }

    function walk(filePath) {
        let stat;
        try{
            stat = fs.lstatSync(filePath);
        }
        catch(e){
            return;
        }

        if(stat.isSymbolicLink()){
            return;
        }

        if(stat.isDirectory()){
            const base = path.basename(filePath);

            if(ignoreDirs.includes(base)){
                return;
            }

            const children = fs.readdirSync(filePath);
            children.forEach((child) => {
                walk(path.join(filePath, child));
            });
        }
        else{
            const ext = path.extname(filePath);

            if(ignoreExtensions.includes(ext)){
                return;
            }
            
            const fileName = path.basename(filePath);
            let lang = languageMap[ext] || detectSpecialFiles(fileName) || "Unknown";

            // Get relative path from the base directory
            const relativePath = path.relative(absoluteDir, filePath);
            // Normalize to use forward slashes (for consistency across platforms)
            const normalizedPath = relativePath.split(path.sep).join('/');

            result.push({
                path: normalizedPath,
                ext,
                sizeKB: Number((stat.size / 1024).toFixed(2)),
                lang,
            })
     }
    }

    walk(absoluteDir);
    return result;
}

module.exports = scanFiles;
