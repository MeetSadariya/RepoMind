const fs = require("fs");
const path = require("path");

function readFileContent(impFiles, repoPath) {
  const results = [];

  // Resolve repoPath to absolute path
  const absoluteRepoPath = path.resolve(repoPath);

  for (const file of impFiles) {
      let fullPath = file.path;

    try {
      // If file.path is not absolute, join it with the resolved repo path
      if (!path.isAbsolute(file.path)) {
        fullPath = path.join(absoluteRepoPath, file.path);
      }

      // Normalize the path to handle any .. or . segments
      fullPath = path.normalize(fullPath);

      const content = fs.readFileSync(fullPath, "utf-8");

      results.push({
        path: file.path,
        lang: file.lang,
        sizeKB: file.sizeKB,
        content,
      });
    } catch (err) {
      console.error(`Failed to read file: ${file.path}`, {
        attemptedPath: fullPath,
        error: err.message,
        code: err.code
      });
      results.push({
        path: file.path,
        lang: file.lang,
        sizeKB: file.sizeKB,
        content: null,
        error: "Failed to read file",
        errorDetails: err.message,
      });
    }
  }

  return results;
}

module.exports = readFileContent;
