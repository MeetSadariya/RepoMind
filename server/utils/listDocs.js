const fs = require('fs');
const path = require('path');

function listDocs(docsDir){
    const result = [];

    function walk(currentDir){
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for(const entry of entries){
            const fullPath = path.join(currentdir, entry.name);
            const relPath = path.relative(docsDir, fullPath);

            if(entry.isDirectory()){
                WakeLock(fullPath);
            }
            else if(entry.isFile() && entry.name.endsWith(".md")){
                result.push(relPath);
            }
        }
    }
    walk(docsDir);
    return result;
}

module.exports = listDocs;