import "./App.css";
import { useState, useEffect, useMemo } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000";

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error || data.message || "Request failed";
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function App() {
  const [repoUrl, setRepoUrl] = useState("");
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [jobResult, setJobResult] = useState(null);
  const [docsList, setDocsList] = useState([]);
  const [docContent, setDocContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const hasDocs = useMemo(() => docsList.length > 0, [docsList]);

  const resetState = () => {
    setJobId(null);
    setJobStatus(null);
    setJobResult(null);
    setDocsList([]);
    setDocContent(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("info");
    resetState();

    if (!repoUrl.trim()) {
      setMessage("Please enter a repository URL");
      setMessageType("error");
      return;
    }
    if (!repoUrl.includes("github.com")) {
      setMessage("This doesn't look like a GitHub URL");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      const data = await api("/jobs", {
        method: "POST",
        body: JSON.stringify({ repoUrl }),
      });
      setJobId(data.jobId);
      setJobStatus(data.status || "queued");
      setMessage("Job queued. We will generate docs automatically.");
      setMessageType("success");
    } catch (err) {
      setMessage(err.message || "Failed to create job");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!jobId) return;
    try {
      const data = await api(`/jobs/${jobId}`);
      setJobStatus(data.status);
      setJobResult(data.result || null);

      if (data.status === "docs-generated") {
        setMessage("Docs generated successfully");
        setMessageType("success");
        await fetchDocsList();
      } else if (data.status === "error") {
        setMessage(data.error || "Job failed");
        setMessageType("error");
      } else {
        setMessage(`Job status: ${data.status}`);
        setMessageType("info");
      }
    } catch (err) {
      setMessage(err.message || "Failed to fetch job status");
      setMessageType("error");
    }
  };

  const fetchDocsList = async () => {
    if (!jobId) return;
    try {
      const data = await api(`/jobs/${jobId}/docs-list`);
      setDocsList(data.files || []);
    } catch (err) {
      setMessage(err.message || "Failed to list docs");
      setMessageType("error");
    }
  };

  const handleViewDoc = async (path) => {
    if (!jobId || !path) return;
    try {
      const data = await api(`/jobs/${jobId}/docs-file?path=${encodeURIComponent(path)}`);
      setDocContent(data);
    } catch (err) {
      setMessage(err.message || "Failed to read doc file");
      setMessageType("error");
    }
  };

  // Poll status every 3s until docs are ready or error
  useEffect(() => {
    if (!jobId) return;
    if (jobStatus === "docs-generated" || jobStatus === "error") return;
    const timer = setInterval(() => {
      handleCheckStatus();
    }, 3000);
    return () => clearInterval(timer);
  }, [jobId, jobStatus]);

  return (
    <div className="app">
      <h1>RepoMind</h1>
      <p>Enter a GitHub repo URL to generate AI documentation.</p>

      <form onSubmit={handleSubmit} className="form">
        <label htmlFor="url">GitHub repository URL</label>
        <input
          id="url"
          type="url"
          placeholder="https://github.com/user/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>

      {message && (
        <p className={`msg ${messageType}`}>
          {message}
        </p>
      )}

      {jobId && (
        <div className="card">
          <p>Job ID: <strong>{jobId}</strong></p>
          <p>Status: <strong>{jobStatus || "queued"}</strong></p>
          <div className="actions">
            <button type="button" onClick={handleCheckStatus}>Refresh Status</button>
            {jobResult && (
              <a href={`${API_BASE}${jobResult}?download=true`} target="_blank" rel="noreferrer">
                Download Zip
              </a>
            )}
          </div>
        </div>
      )}

      {hasDocs && (
        <div className="docs">
          <h2>Generated Docs</h2>
          <div className="docs-grid">
            <div className="docs-list">
              <ul>
                {docsList.map((file) => (
                  <li key={file}>
                    <button onClick={() => handleViewDoc(file)}>
                      {file}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="docs-viewer">
              {docContent ? (
                <>
                  <h3>{docContent.path}</h3>
                  <pre>{docContent.content}</pre>
                </>
              ) : (
                <p>Select a file to view its content.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;