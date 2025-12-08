# RepoMind Server

## Setup
1. Install dependencies:
   ```
   npm install
   ```
2. Create a `.env` file:
   ```
   PORT=4000
   FRONTEND_URL=http://localhost:3000
   GEMINI_API_KEY=your_gemini_api_key_here   # optional, falls back to fake docs if missing
   GEMINI_MODEL=gemini-2.5-flash
   ```
3. Run the server:
   ```
   npm run dev
   ```

## Deploy notes
- Expose `PORT` and point `FRONTEND_URL` to the deployed client origin.
- Provide `GEMINI_API_KEY` to enable real AI docs; without it the server generates placeholder docs.
- The `/workspace` directory is written to disk; on stateless hosts mount a writable volume or use a temp directory.

