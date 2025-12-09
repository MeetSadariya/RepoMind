RepoMind
RepoMind is a web application for fully automated AI-powered documentation of GitHub repositories. Submit any public repo URL, and RepoMind clones, analyzes, and generates structured Markdown documentation for important files leveraging Gemini AI or fallback heuristics. All docs are available for live viewing and bulk download.
Features
Clone Any Public GitHub Repo: Input the repository URL and let RepoMind handle the rest.
Automated File Scanning & Analysis: Identifies and filters the most relevant project files.
AI-Driven Documentation: Uses Google Gemini to create detailed, human-readable documentation. Falls back to placeholder docs if API key is missing.
Modern React Frontend: Simple UI to submit jobs, track progress, and browse/download docs.
Downloadable Results: One-click download of generated documentation as a .zip.
Configurable & Deployable: Works locally or can be adapted for cloud/serverless environments.
Tech Stack
Frontend: React (Create React App), CSS
with syntax

Here’s a complete and well-formatted README.md with usage instructions and code snippets for your RepoMind project, based on actual features and code:
RepoMind
RepoMind is a web application that uses AI to generate high-quality, structured documentation for any public GitHub repository. Given a repo URL, RepoMind clones the repo, analyzes and filters important files, and produces Markdown documentation using Google Gemini AI or fallback heuristics. Users can browse docs in the browser or download them as a zip archive.
Features
Submit any public GitHub repo URL via the web UI
Automatic cloning, scanning, and selection of important files
AI-generated documentation using Gemini (or placeholder fallback)
View, search, and download docs from your browser
Modern tech stack: React, Node.js, Express, Google GenAI
Tech Stack
Frontend: React (Create React App), CSS, Fetch API
Backend: Node.js, Express.js, simple-git, @google/genai, dotenv, cors
Other: Markdown, zip utilities, GitHub integration
Getting Started
Prerequisites
Node.js (version 14 or later recommended)
npm
Clone the repository
git clone https://github.com/YOUR_USERNAME/RepoMind.gitcd RepoMind
Setting up the Server
Install dependencies:
install
    cd server    npm install
Create a .env file in the server directory:
    PORT=4000    FRONTEND_URL=http://localhost:3000    GEMINI_API_KEY=your_gemini_api_key_here   # Optional, falls back to fake docs if missing    GEMINI_MODEL=gemini-2.5-flash
Start the server:
    npm run dev
Setting up the Client
Install dependencies:
install
    cd ../client    npm install
Start the client:
    npm start
Open http://localhost:3000 in your browser.
Usage
Enter a public GitHub repository URL into the input form.
Track progress via job status.
Once ready, view generated docs file-by-file in the browser, or click "Download Zip" to get all documentation.
Example Workflow
Input:
    https://github.com/user/some-project
Output:
Structured Markdown docs for important code/files
Downloadable as a .zip
Configuration
Adjust port, frontend URL, and Gemini API key in the server/.env file as needed.
If GEMINI_API_KEY is missing, the server falls back to fake/placeholder docs for development/testing.
License
MIT
