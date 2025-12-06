import './App.css';
import { useState, useEffect } from 'react';

function App() {
  const [ repoUrl, setRepoUrl ] = useState("");
  const [ message, setMessage ] = useState("");
  const [ messageType, setMessageType ] = useState("");
  const [ jobId, setJobId ] = useState(null);
  const [ isSubmitting, setIsSubmitting ] = useState(false);
  const [ jobStatus, setJobStatus ] = useState(null);
  const [ jobResult, setJobResult ] = useState(null);

  const handleSubmit =  async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");
    setJobId(null);
    setJobStatus(null);
    setJobResult(null);


    if(!repoUrl.trim()){
      setMessage("Please enter a repository URL");
      setMessageType("error");
      return;
    }

    if(!repoUrl.includes("github.com")){
      setMessage("This doen't look like a Github URL");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    try{
      const response = await fetch("http://localhost:4000/jobs", {
        method:"POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({repoUrl}),
      });

      const data = await response.json();

      if(response.ok){
        setJobId(data.jobId);
        setMessage("Job created successfully");
        setMessageType("success");
      }
      else{
        setMessage(data.error || "Something went wrong");
        setMessageType("error");
      }
    }
    catch (err){
      console.log(err);
      setMessage("Error communicating server");
      setMessageType("error");
    }

    setIsSubmitting(false);
  };

  const handleCheckStatus = async () => {
    if(!jobId) return;

    try{
      const response = await fetch(`http://localhost:4000/jobs/${jobId}`);
      const data = await response.json();

      if(response.ok){
        setJobStatus(data.status);
        setJobResult(data.result || null);

        if(data.status === "completed"){
          setJobStatus("Job completed");
          setJobResult("success")
        }
        else if (data.status === "error") {
          setMessage(data.error || "Job failed.");
        }
        else{
          setMessage(`Job status: ${data.status}`);
          setMessageType("info")
        }
      }
      else{
        setMessage(data.error || "Failed to fetch job status");
        setMessageType("error");
      }
    }
    catch (err){
      console.log(err);
      setMessage("Error communicationg with server while checking status");
      setMessageType("error");
    }
  }

  useEffect( () => {
    if(!jobId) return;

    if(jobStatus === "completed") return;

    const intervalId = setInterval(() => {
      console.log("Auto checking job status...");
      handleCheckStatus();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [jobId, jobStatus])

  return (
  <div>
    <h1>RepoMind</h1>
    <p>RepoMind is a tool that will require a github repository url to generate the detailed readme.md file for the repository.</p>
    <form onSubmit={handleSubmit}>
      <label for='url'>Enter Your Github Repository URL: </label>
      <input type='url' placeholder='https://github.com/user/repo'
        value={repoUrl}
        onChange={(e)=>{
          setRepoUrl(e.target.value);
          setMessage("");
          setMessageType("");
        }}
      ></input>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
    {message && (
      <p
        style={{
          marginTop: "12px",
          color: messageType === "error" ? "red" : "green",
          fontSize: "0.9rem",
        }}
      >
        {message}
      </p>
    )}

    {jobId && (
      <div
        style={{
          marginTop: "15px",
          color: "#333",
        }}
      >
        <p style={{
          marginTop: "15px",
          color: "#333"  
        }}>
        Job created with Id: <strong>{jobId}</strong>
        </p>
        <button
          type="button"
          onClick={handleCheckStatus}
          style={{ marginTop: "8px" }}
        >
          Check Job Status
        </button>

        {jobStatus && (
         <p style={{ marginTop: "8px" }}>
          Current job status : <strong>{jobStatus}</strong>
         </p> 
        )}

        {jobResult && (
          <p style={{marginTop:"8px"}}>
            Docs link: {" "}
            <a href={jobResult} target="_blank" rel="nonreferree">
              {jobResult}
            </a>
          </p>
        )}
      </div>
    )}
  </div>
  );
}

export default App;
