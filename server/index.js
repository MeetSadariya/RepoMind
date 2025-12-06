const express = require('express');
const cors = require('cors');
const simpleGit = require("simple-git");
const fs = require('fs');
const path = require('path');
const scanFiles = require("./utils/fileScanner");
const filterImpFiles = require('./utils/filterImpFiles');
const { error } = require('console');

const app = express();
app.use(cors());
app.use(express.json());

const jobs = {};

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


    setTimeout( async () => {
        try{
            jobs[jobId].status = "cloning";
            console.log(`Cloning repo for job ${jobId}...`);

            const git = simpleGit();
            await git.clone(repoUrl, jobs[jobId].path);

            jobs[jobId].status = "cloned";
            console.log(`Repo cloned successfully for job ${jobId}`);

            jobs[jobId].status = "processing";
            console.log(`Job ${jobId} is now processing...`);

            setTimeout(() => {
                jobs[jobId].status = "completed";
                jobs[jobId].result = "https://example.com/doc-output.zip";
                console.log(`Job ${jobId} completed`);
            }, 5000);
        }
        catch (err){
            jobs[jobId].status = "error";
            jobs[jobId].error = err.message;
            console.log(`CLone failed for job ${jobId}: `, err.message);
        }
    }, 2000);
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

    if(job.status !== "cloned" && job.status!== "processing" && job.status!== "completed"){
        return res.status(400).json({error: "Repo is note ready yet"});
    }

    try{
        const allFiles = job.files || scanFiles(job.path);
        const imp = filterImpFiles(allFiles);

        job.files =allFiles;
        job.impFiles = imp;

        res.json({files:imp});
    }
    catch (err){
        console.log(err);
        res.status(500).json({
            error: "failed to filter important files",
            details: err.message,
        });
    }
});


const port = 4000;
app.listen(port, () => {
    console.log("Server is running on http://localhost:4000");
})

