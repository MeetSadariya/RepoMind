const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

function zipFolder(sourceDir, outPath){
    return new Promise((resolve, reject) => {
        // Check if source directory exists
        if (!fs.existsSync(sourceDir)) {
            return reject(new Error(`Source directory does not exist: ${sourceDir}`));
        }

        const output = fs.createWriteStream(outPath);
        const archive = archiver("zip", { zlib: { level: 9 }});

        // Pipe archive data to the file
        archive.pipe(output);

        output.on("close", () => {
            console.log(`Created zip at ${outPath} ${archive.pointer()} total bytes`);
            resolve();
        });

        output.on("error", (err) => {
            reject(err);
        });

        archive.on("error", (err) => {
            reject(err);
        });

        archive.directory(sourceDir, false);
        archive.finalize();
    })
}

module.exports = zipFolder;