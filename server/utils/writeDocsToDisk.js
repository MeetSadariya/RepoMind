const fs = require('fs');
const path = require('path');

function writeDocsToDisk(docs, repoPath){
    const absoluteRepoPath = path.resolve(repoPath);
    const docsRoot = path.join(absoluteRepoPath, "docs");

    fs.mkdirSync(docsRoot, { recursive: true });

    for(const doc of docs){

        const targetPath = path.join(docsRoot, doc.path + ".md");

        const folder = path.dirname(targetPath);
        fs.mkdirSync(folder, { recursive: true });

        const markdown = buildMarkdownForDoc(doc);

        fs.writeFileSync(targetPath, markdown, "utf-8");
    }
    return docsRoot;
}

function buildMarkdownForDoc(doc){
    const { path: filePath, lang, summary, details } = doc;

    return [
        `# Documentation: ${filePath}`,
        "",
        `- **Language:** ${lang || "Unknown"}`,
        "",
        "#Summary",
        "",
        summary || "No summary available.",
        "",
        details ? "## Details\n\n" + details : "",
        "",
    ].join('\n');
}

module.exports = writeDocsToDisk;