function generateFakeDocs(fileContents){

    return fileContents.map((file) => {
        if(!file.content || file.error){
            return {
                path: file.path,
                lang: file.lang,
                summary: "Could not read this file, so no documentation was generated",
                details: file.errorDetails || "File could not be read",
            };
        }

        const lines = file.content.split("\n").length;

        return {
            path: file.path,
            lang: file.lang,
            summary: `This file ${file.path} is a ${file.lang} source file with about ${lines} lines of code`,
            details: [
                "-This is a placeholder documentation.",
                "-In a real version, AI will analyze function and then will generate the documentation for the code."
            ].join("\n"),
            }
        });
}

module.exports = generateFakeDocs;