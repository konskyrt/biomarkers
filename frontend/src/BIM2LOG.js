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
    // First check if we need to show detail selection
    if (!selectedDetailLevel) {
      setShowDetailSelection(true);
      return;
    }

    // Proceed with processing if detail level is selected
    if (!timelineFile || !elementsFile) return;
    
    setIsProcessing(true);
    setFinalResults(null);
    setProgressMessages([]);

    // Rest of your existing handleConnect logic...
    const formData = new FormData();
    formData.append("timeline", timelineFile);
    formData.append("elements", elementsFile);
    formData.append("detail_level", selectedDetailLevel); // Add this line
  
    fetch('/api/bim2log/process', {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        function readStream() {
          reader.read().then(({ done, value }) => {
            if (done) {
              setIsProcessing(false);
              return;
            }
            const text = decoder.decode(value);
            const lines = text.split('\n');
            lines.forEach((line) => {
              const trimmed = line.trim();
              if (trimmed) {
                // Remove the "data: " prefix if present.
                const jsonStr = trimmed.startsWith("data: ") ? trimmed.slice(6) : trimmed;
                try {
                  const data = JSON.parse(jsonStr);
                  if (data.type === 'status') {
                    setProgressMessages((prev) => [
                      ...prev,
                      `${new Date().toLocaleTimeString()}: ${data.message}`,
                    ]);
                  } else if (data.type === 'result') {
                    setFinalResults(data.data);
                  } else if (data.type === 'error') {
                    setProgressMessages((prev) => [
                      ...prev,
                      `${new Date().toLocaleTimeString()}: ERROR - ${data.message}`,
                    ]);
                    setIsProcessing(false);
                  }
                } catch (e) {
                  console.error("Error parsing stream line", e);
                }
              }
            });
            readStream();
          });
        }
        readStream();
      })
      .catch((error) => {
        setProgressMessages((prev) => [
          ...prev,
          `${new Date().toLocaleTimeString()}: ERROR - ${error.message}`,
        ]);
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
          onClick={() => {
            if (!selectedDetailLevel) {
              setShowDetailSelection(true);
            } else {
              handleConnect();
            }
          }}
          disabled={!timelineFile || !elementsFile || isProcessing}
          style={{ padding: "5px 10px" }}
        >
          {isProcessing ? "Processing..." : "Connect"}
        </button>
      )}
      
      {showDetailSelection && (
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p>Please select the level of detail to connect:</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button onClick={() => {
              setSelectedDetailLevel('low');
              setShowDetailSelection(false);
              handleConnect();
            }}>Low</button>
            <button onClick={() => {
              setSelectedDetailLevel('medium');
              setShowDetailSelection(false);
              handleConnect();
            }}>Medium</button>
            <button onClick={() => {
              setSelectedDetailLevel('high');
              setShowDetailSelection(false);
              handleConnect();
            }}>High</button>
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
