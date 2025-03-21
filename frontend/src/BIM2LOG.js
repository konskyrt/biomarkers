import React, { useState, useEffect, useRef } from 'react';
import { ClipLoader } from 'react-spinners';

const BIM2LOG = () => {
  const [timelineFile, setTimelineFile] = useState(null);
  const [elementsFile, setElementsFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalResults, setFinalResults] = useState(null);
  const [progressMessages, setProgressMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [showDetailSelection, setShowDetailSelection] = useState(false);
  const [selectedDetailLevel, setSelectedDetailLevel] = useState('');

  // Reference for auto-scroll of progress messages
  const progressContainerRef = useRef(null);
  useEffect(() => {
    if (progressContainerRef.current) {
      progressContainerRef.current.scrollTop = progressContainerRef.current.scrollHeight;
    }
  }, [progressMessages]);

  // SSE connection for progress messages
  const eventSourceRef = useRef(null);
  useEffect(() => {
    if (sessionId && isProcessing) {
      console.log(`Connecting to progress stream for session ${sessionId}`);
      if (eventSourceRef.current) eventSourceRef.current.close();
      eventSourceRef.current = new EventSource(`/api/bim2log/progress/${sessionId}`);
      eventSourceRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.message === 'keep-alive') return;
        setProgressMessages((prev) => [...prev, data.message]);
      };
      eventSourceRef.current.onerror = (error) => {
        console.error('EventSource error:', error);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      };
      return () => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      };
    }
  }, [sessionId, isProcessing]);

  useEffect(() => {
    if (!isProcessing && eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, [isProcessing]);

  // When the user clicks Connect, we validate file selection and show detail-level options.
  const handleConnect = () => {
    if (!timelineFile || !elementsFile) {
      console.log("Files not selected", { timelineFile, elementsFile });
      return;
    }
    // Clear previous results and show the detail selection
    setFinalResults(null);
    setProgressMessages([]);
    setSessionId(null);
    setShowDetailSelection(true);
  };

  // When the user selects a detail level (e.g., "Medium"), start processing.
  const startProcessing = (level) => {
    setSelectedDetailLevel(level);
    setIsProcessing(true);
    setShowDetailSelection(false);

    // Create FormData and append files and the chosen detail level.
    const formData = new FormData();
    formData.append("timeline", timelineFile);
    formData.append("elements", elementsFile);
    formData.append("detail_level", level);

    fetch("/api/bim2log/process", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        console.log("Response status:", response.status);
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Data received from backend:", data);
        if (data.session_id) {
          setSessionId(data.session_id);
        }
        setFinalResults(data);
      })
      .catch((error) => {
        console.error("Error in startProcessing:", error);
        setProgressMessages((prev) => [...prev, `Error: ${error.message}`]);
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  const downloadFile = (data, filename) => {
    const blob = new Blob([data], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bim2log">
      <h2>BIM2LOG</h2>
      {/* File Inputs */}
      <div style={{ marginBottom: "10px" }}>
        <label style={{ marginRight: "10px" }}>Timeline File:</label>
        <input
          type="file"
          onChange={(e) => setTimelineFile(e.target.files[0])}
          accept=".xlsx"
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label style={{ marginRight: "10px" }}>Elements File:</label>
        <input
          type="file"
          onChange={(e) => setElementsFile(e.target.files[0])}
          accept=".xlsx,.ifc"
        />
      </div>
      {/* Connect Button */}
      {!showDetailSelection && (
        <button
          onClick={handleConnect}
          disabled={!timelineFile || !elementsFile || isProcessing}
          style={{ padding: "5px 10px" }}
        >
          {isProcessing ? "Processing..." : "Connect"}
        </button>
      )}
      {/* Detail Level Selection */}
      {showDetailSelection && (
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p>Please select the level of detail to connect:</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button onClick={() => startProcessing("low")}>Low</button>
            <button onClick={() => startProcessing("medium")}>Medium</button>
            <button onClick={() => startProcessing("high")}>High</button>
          </div>
        </div>
      )}

      {/* Progress Console */}
      <div
        ref={progressContainerRef}
        style={{
          marginTop: "20px",
          maxHeight: "300px",
          overflowY: "auto",
          backgroundColor: "#f5f5f5",
          padding: "10px",
          border: "1px solid #ddd",
          fontFamily: "monospace",
          fontSize: "14px",
          display: progressMessages.length > 0 ? "block" : "none",
        }}
      >
        <h3>Processing Progress:</h3>
        {progressMessages.map((message, index) => (
          <div key={index} style={{ marginBottom: "5px" }}>
            <span style={{ color: "#666", marginRight: "10px" }}>
              {new Date().toLocaleTimeString()}:
            </span>
            <span>{message}</span>
          </div>
        ))}
        {isProcessing && (
          <div style={{ display: "flex", alignItems: "center", marginTop: "10px" }}>
            <ClipLoader size={16} color="#36D7B7" />
            <span style={{ marginLeft: "10px" }}>Processing...</span>
          </div>
        )}
      </div>

      {/* Final Results Display */}
      {finalResults && (
        <div className="final-results" style={{ marginTop: "20px" }}>
          <h2>Final Summary</h2>
          
          <section>
            <h3>Object Summary</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>Floor Name</th>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>Task</th>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>Object Count</th>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>Total Volume</th>
                </tr>
              </thead>
              <tbody>
                {finalResults.objectSummary.map((row, index) => (
                  <tr key={index}>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>{row.FloorName}</td>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>{row.associated_task}</td>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>{row.objectCount}</td>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>{row.totalVolume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section style={{ marginTop: "20px" }}>
            <h3>Ending Tasks</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>Task</th>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>Object Count</th>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>Total Volume</th>
                </tr>
              </thead>
              <tbody>
                {finalResults.endingTasks.map((row, index) => (
                  <tr key={index}>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>{row.associated_task}</td>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>{row.objectCount}</td>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>{row.totalVolume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section style={{ marginTop: "20px" }}>
            <h3>Validation Summary</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>Reason</th>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {finalResults.validationSummary.map((row, index) => (
                  <tr key={index}>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>{row.Reason}</td>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}

    {/* Download Buttons */}
    </div>
  );
};

export default BIM2LOG;
