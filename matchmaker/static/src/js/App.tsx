import { useState, CSSProperties } from "react";

import {
  useResumeViewsResumePdfToTextMutation,
  useResumeViewsGetJobsQuery,
  useResumeViewsCreateResumeMutation,
} from "./store/resumeApi";

import "./App.css";
import './index.css';
import React from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";

function App() {
  const [count, setCount] = useState(0);

  const [resumeId, setResumeId] = useState(-1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [distance, setDistance] = useState("maxInnerProduct");
  const [shouldFetchJobs, setShouldFetchJobs] = useState(false);

  const {
    data: getJobsData,
    error: getJobsError,
    isLoading: getJobsIsLoading,
    refetch,
  } = useResumeViewsGetJobsQuery(
    { resumeId, page, pageSize, distance },
    { skip: resumeId === -1 || !shouldFetchJobs }
  );

  const [
    resumePdfToText,
    {
      isLoading: pdfToTextIsLoading,
      isError: pdfToTextIsError,
      error: pdfToTextError,
      isSuccess: pdfToTextIsSuccess,
      data: pdfToTextData,
    },
  ] = useResumeViewsResumePdfToTextMutation();

  const [
    createResume,
    {
      isLoading: createResumeIsLoading,
      isError: createResumeIsError,
      error: createResumeError,
      isSuccess: createResumeIsSuccess,
      data: createResumeData,
    },
  ] = useResumeViewsCreateResumeMutation();

  const [file, setFile] = useState(null);

  const [resumeText, setResumeText] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (selectedFile && selectedFile.size > maxSize) {
      setErrorMsg("File size must be under 2MB");
      setFile(null);
    } else {
      setErrorMsg(""); // Clear the error message if the file is within the allowed size
      setFile(selectedFile);

      if (selectedFile) {
        // Automatically upload the file if it's within the allowed size
        await handleFileUpload(selectedFile);
      }
    }
  };

  const handleFileUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await resumePdfToText({ body: formData });

      setResumeText(response.data.text);
    } catch (error) {
      // Handle error, e.g., show an error message
    } finally {

    }
  };

  const handleResumeTextSubmit = async (event) => {
    event.preventDefault();

    if (!resumeText) {
      alert("Please enter resume text to upload");
      return;
    }

    const response = await createResume({
      createResumeIn: { text: resumeText },
    });

    const resumeId = response.data.id;

    setResumeId(resumeId);

    // Fetch jobs after the resume is created
    setShouldFetchJobs(true);

  };
  const [dragging, setDragging] = useState(false);

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFileChange({ target: { files: event.dataTransfer.files } });
    }
  };

  const dropZoneStyles: CSSProperties = {
    border: dragging ? "2px dashed #000" : "2px solid #ccc",
    backgroundColor: dragging ? "#ccc" : "transparent",
    padding: "20px",
    textAlign: "center",
    cursor: "pointer",
  };

  return (
    <div className="container mx-auto dark:bg-slate-800">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/4 flex justify-center">
          <form>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={dropZoneStyles}
            >
              <div>
                <label htmlFor="file-upload" style={{ cursor: "pointer" }}>
                  <FontAwesomeIcon icon={faPenToSquare} />
                  {dragging ? "Drop file here" : "Select a file or drag and drop here"}
                  {file && <p>Selected file: {file.name}</p>}
                  {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
                </label>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="w-full md:w-3/4 flex justify-center">

          <form onSubmit={handleResumeTextSubmit}>
            <label htmlFor="resume-text" style={{ cursor: "pointer" }}>
              Enter resume text
            </label>
            <textarea
              id="resume-text"
              name="resume-text"
              // rows={30}
              // cols={70}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
            <button type="submit">Upload Text</button>
          </form>

        </div>
      </div>

      <div className="job-list">
        {getJobsData && getJobsData.jobs.map((job) => (
          <React.Fragment key={job.id}>
            <hr className="thin-line" />
            <div className="job-text">
              <div dangerouslySetInnerHTML={{ __html: job.display_text }} />
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>


    // <div className="App">

    //   <div className="content-wrapper">

    //     <div className="left-side">

    //       <form>

    //         <div
    //           onDragOver={handleDragOver}
    //           onDragLeave={handleDragLeave}
    //           onDrop={handleDrop}
    //           style={dropZoneStyles}
    //         >
    //           <div>

    //             <label htmlFor="file-upload" style={{ cursor: "pointer" }}>
    //               <FontAwesomeIcon icon={faPenToSquare} />
    //               {dragging ? "Drop file here" : "Select a file or drag and drop here"}
    //               {file && <p>Selected file: {file.name}</p>}
    //               {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
    //             </label>

    //             <input
    //               id="file-upload"
    //               type="file"
    //               onChange={handleFileChange}
    //               style={{ display: "none" }}
    //             />
    //           </div>

    //         </div>

    //       </form>
    //     </div>

    //     <div className="right-side">
    //       <form onSubmit={handleResumeTextSubmit}>
    //         <label htmlFor="resume-text" style={{ cursor: "pointer" }}>
    //           Enter resume text
    //         </label>
    //         <textarea
    //           id="resume-text"
    //           name="resume-text"
    //           rows={30}
    //           cols={70}
    //           value={resumeText}
    //           onChange={(e) => setResumeText(e.target.value)}
    //         />
    //         <button type="submit">Upload Text</button>
    //       </form>
    //     </div>
    //   </div>
    //   <div className="job-list">
    //     {getJobsData && getJobsData.jobs.map((job) => (
    //       <React.Fragment key={job.id}>
    //         <hr className="thin-line" />
    //         <div className="job-text">
    //           <div dangerouslySetInnerHTML={{ __html: job.display_text }} />
    //         </div>
    //       </React.Fragment>
    //     ))}
    //   </div>

    // </div >
  );
}


export default App;


