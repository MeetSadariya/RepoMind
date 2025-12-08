const { generateDocsForFile } = require('./aiEngine')

async function generateAIDocs(fileContents, onProgress){
    const docs = [];

    for(let i=0; i<fileContents.length; i++){
        const file = fileContents[i];

        try{
            if(onProgress){
                onProgress(i+1, fileContents.length, file.path);
            }

            const doc = await generateDocsForFile({
                path: file.path,
                lang: file.lang,
                content: file.content
            });
            docs.push(doc);
        }
        catch(err){
            console.error("AI doc generation failed for", file.path, err.message);

            docs.push({
                path: file.path,
                lang: file.lang,
                summary: `Failed to generate docs via AI for ${file.path}`,
                details: `Error: ${err.message}`,
            })
        }
    }
    return docs;
}

module.exports = generateAIDocs;