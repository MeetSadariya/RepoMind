require("dotenv").config();
const express = require('express');
const cors = require('cors');
const simpleGit = require("simple-git");
const fs = require('fs');
const path = require('path');
const scanFiles = require("./utils/fileScanner");
const filterImpFiles = require('./utils/filterImpFiles');
const readFileContent = require('./utils/readFileContent');
const writeDocsToDisk = require('./utils/writeDocsToDisk');
const zipFolder = require('./utils/zipFolder');
const listDocs = require('./utils/listDocs');
const generateAIDocs = require("./utils/generateAIDocs");
const app = express();
app.use(cors());
app.use(express.json());

const jobs = {};

const workspaceRoot = path.join(__dirname, "workspace");
if (!fs.existsSync(workspaceRoot)) {
  fs.mkdirSync(workspaceRoot, { recursive: true });
}

async function runJobPipeline(jobId) {
  const job = jobs[jobId];
  if (!job) return;

  try {
    // 1) Clone
    job.status = "cloning";

    const git = simpleGit();
    await git.clone(job.repoUrl, job.path);

    job.status = "scanning";

    // 2) Scan files
    const allFiles = scanFiles(job.path);
    job.files = allFiles;

    // 3) Filter important files
    job.status = "filtering";
    const impFiles = filterImpFiles(allFiles);
    job.impFiles = impFiles;

    // 4) Read contents
    job.status = "reading";
    const fileContents = readFileContent(impFiles, job.path);
    job.fileContents = fileContents;

    // 5) Generate AI docs
    job.status = "ai-generating";
    const docs = await generateAIDocs(fileContents, (current, total, filePath) => {
      console.log(`AI docs ${current}/${total} for ${filePath}`);
    });
    job.docs = docs;

    // 6) Save docs to disk
    job.status = "saving-docs";
    const docsDir = writeDocsToDisk(docs, job.path);
    job.docsDir = docsDir;

    // 7) Zip docs
    job.status = "zipping-docs";
    const zipPath = path.join(job.path, "docs.zip");
    await zipFolder(docsDir, zipPath);
    job.docsZip = zipPath;

    // 8) Done
    job.status = "docs-generated";
    job.result = `/jobs/${jobId}/docs-zip`; // handy for frontend

    console.log(`✅ Job ${jobId} completed: docs generated`);
  } catch (err) {
    console.error(`❌ Job ${jobId} failed:`, err.message);
    job.status = "error";
    job.error = err.message;
  }
}

app.get('/', (req,res) => {
    res.send("Hello World!");
});

app.post('/jobs', (req,res) => {
    const { repoUrl } = req.body;

    if(!repoUrl){
        return res.status(400).json({
            error: "repoUrl is required"
        });
    }

    const jobId = Date.now().toString();

    jobs[jobId] = {
        status: "received",
        repoUrl,
        path: `./workspace/${jobId}`,
    }

    console.log("New job created: ", jobId, repoUrl);

    res.json({
        jobId,
        status: "received"
    });

    runJobPipeline(jobId);

    res.json({
        jobId,
        status: "queued",
    });
});
    

app.get('/jobs/:id', (req,res) => {
    const job = jobs[req.params.id];

    if(!job){
        return res.status(404).json({
            error: "Job not found",
        });
    }
    res.json(job);
})

app.get("/jobs/:id/files", (req,res) => {
    const job = jobs[req.params.id];

    if(!job){
        return res.status(404).json({error: "Job not found"});
    }

    if(job.status !== "cloned" && job.status !== "completed"){
        return res.status(400).json({error: "Repo is not ready yet"});
    }

    try{   
        const files =scanFiles(job.path);
        job.files = files;
        res.json({files});
    }catch (err){
        res.status(500).json({error: "failed to scan repo", details: err.message});
    }
})

app.get("/jobs/:id/imp-files", (req,res) => {
    const job = jobs[req.params.id];

    if(!job){
        return res.status(404).json({ error: "Job not found"});
    }

    if(job.status !== "cloned" && job.status !== "processing" && job.status !== "completed"){
        return res.status(400).json({error: "Repo is not ready yet"});
    }

    try{
        const allFiles = job.files || scanFiles(job.path);
        const imp = filterImpFiles(allFiles);

        job.files =allFiles;
        job.impFiles = imp;

        res.json({files:imp});
    }
    catch (err){
        console.error(err);
        res.status(500).json({
            error: "failed to filter important files",
            details: err.message,
        });
    }
});

app.get("/jobs/:id/read-files", (req,res) => {
    const job = jobs[req.params.id];

    if(!job){
        return res.status(404).json({
            error: "Job not found"
        });
    }

    if(!job.impFiles){
        return res.status(400).json({
            error: "Important files not generated. Please call /imp-files first"
        });
    }

    try{
        const fileData = readFileContent(job.impFiles, job.path);
        job.fileContents = fileData;

        res.json({
            files: fileData
        });
    }
    catch(err){
        res.status(500).json({
            error: "Failed to read file contents",
            details: err.message
        })
    }
}); 

app.post("/jobs/:id/generate-docs", async (req,res) => {
    const job = jobs[req.params.id];

    if(!job){
        return res.status(404).json({ error: "Job not found" });
    }

    if(!job.fileContents){
        return res.status(400).json({
            error: "File contents not loaded. Call /read-files first",
        });
    }

    try{
        job.status = "ai-generating";

        const docs = await generateAIDocs(job.fileContents, (current, total, filePath) => {
            console.log(`AI generating docs ${current}/${total} for ${filePath}`);
        });
        job.docs = docs;
        job.status = "docs-generated";

        res.json({docs});
    }
    catch(err){
        console.log(err);
        job.status = "error";
        return res.status(500).json({
            error: "Failed to generate docs via AI",
            details: err.message,
        })
    }
});

app.post("/jobs/:id/save-docs", (req,res) => {
    const job = jobs[req.params.id];

    if(!job){
        return res.status(404).json({ error: "Job not found" });
    }

    if(!job.docs || !Array.isArray(job.docs) || job.docs.length === 0 ){
        return res.status(404).json({ error: "No docs found on job. Call /generate-docs first" });
    }

    try{
        const docsDir = writeDocsToDisk(job.docs, job.path);

        job.docsDir = docsDir;
        job.result = docsDir;

        return res.json({
            message: "Docs written to disk successfully",
            docsDir,
        })
    }
    catch(err){
        console.error(err);
        return res.status(500).json({
            error: "Failed to write docs to disk",
            details: err.message,
        })
    }
});

app.get("/jobs/:id/docs-zip", async (req, res) => {
  const job = jobs[req.params.id];

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }
  
  if (!job.docsDir) {
    return res.status(400).json({ error: "Docs not saved yet. Call /save-docs first" });
  }

  try {
    const absoluteJobPath = path.resolve(job.path);
    const absoluteDocsDir = path.resolve(job.docsDir);
    const zipPath = path.join(absoluteJobPath, "docs.zip");
    
    if (!fs.existsSync(absoluteDocsDir)) {
      return res.status(404).json({ error: `Docs directory does not exist: ${absoluteDocsDir}` });
    }

    console.log(`Creating zip from ${absoluteDocsDir} to ${zipPath}`);

    await zipFolder(absoluteDocsDir, zipPath);
    
    if (!fs.existsSync(zipPath)) {
      throw new Error("Zip file was not created successfully");
    }

    const stats = fs.statSync(zipPath);
    console.log(`Zip file created successfully: ${zipPath} (${stats.size} bytes)`);

    job.docsZip = zipPath;

    const wantsFile = req.query.download === 'true' || req.query.download === '1';

    if (!wantsFile) {
      return res.json({
        message: "Zip file created successfully",
        zipPath: zipPath,
        size: stats.size,
        sizeKB: (stats.size / 1024).toFixed(2),
        downloadUrl: `/jobs/${req.params.id}/docs-zip?download=true`,
        note: "Add ?download=true to the URL to download the file, or use a browser",
        createdAt: new Date().toISOString()
      });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="docs.zip"');
    res.setHeader('Content-Length', stats.size);

    const fileStream = fs.createReadStream(zipPath);
    
    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to read zip file", details: err.message });
      } else {
        res.end();
      }
    });

    fileStream.on('end', () => {
      console.log('File sent successfully');
    });

    fileStream.pipe(res);

  } catch (err) {
    console.error("Error creating zip:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to create zip file", details: err.message });
    }
  }
});

app.get("/jobs/:id/docs-list", (req,res) => {
    const job = jobs[req.params.id];

    if(!job){
        return res.status(404).json({ error: "Job not found" });
    }

    if(!job.docsDir || !fs.existsSync(job.docsDir)){
        return res.status(400).json({
            error: "Docs not found. Make sure /generate-docs and /save-docs were calles",
        });
    }

     try{
        const docsDir = path.resolve(job.docsDir);
        const files = listDocs(docsDir);
        return res.json({files});
    }
    catch(err){
        return res.status(500).json({
            error: "Failed to list docs",
            details: err.message,
        });
    }
});

app.get("/jobs/:id/docs-file", (req,res) => {
    const job = jobs[req.params.id];
    const filePath = req.query.path;

    if(!job){
        return res.status(404).json({ error: "Job not found" });
    }

    if(!filePath){
        return res.status(400).json({ error: "Path query is required" });
    }

    if(!job.docsDir || !fs.existsSync(job.docsDir)){
        return res.status(400).json({
            error: "Docs not found. Run /generate-docs and /save-docs first"
        });
    }

    const docsDir = path.resolve(job.docsDir);
    const fullPath = path.resolve(docsDir, filePath);

    // Prevent path traversal outside docsDir
    if(!fullPath.startsWith(docsDir)){
        return res.status(400).json({ error: "Invalid file path" });
    }

    try{
        if(!fs.existsSync(fullPath)){
            return res.status(404).json({
                error: "Doc file not found"
            });
        }

        const content = fs.readFileSync(fullPath, "utf-8");
        return res.json({path: filePath, content});
    }
    catch(err){
        console.error(err);
        return res.status(500).json({
            error: "Failed to read doc file",
            details: err.message
        });
    }
});


const port = 4000;
app.listen(port, () => {
    console.log("Server is running on http://localhost:4000");
})

