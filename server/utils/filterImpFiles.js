function filterImpFiles(files){

    const impLangs = [
        "JavaScript",
        "JavaScript (React)",
        "TypeScript",
        "TypeScript (React)",
        "Python",
        "Java",
        "C#",
        "Go",
        "Rust",
        "Kotlin",
        "Swift",
        "Scala",
        "PHP",
        "Ruby",
        "Dart (Flutter)",
        "Markdown",
        "Markdown (README)",
        "JSON",
        "YAML",
        "HTML",
        "CSS",
    ];

    const ignoreNames = [
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
        "Cargo.lock",
        "poetry.lock",
        "Pipfile.lock",
        "composer.lock",
    ];

    return files.filter((file)=>{
        const base = file.path.split('/').pop();

        if(ignoreNames.includes(base)) return false;

        if(!impLangs.includes(file.lang)) return false;

        if(file.sizeKB < 0.1) return false;
        if(file.sizeKB > 500) return false;

        return true;
    });
}

module.exports = filterImpFiles;