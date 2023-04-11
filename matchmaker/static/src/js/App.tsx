import { useState } from 'react'
import {
  useResumeViewsResumePdfToTextMutation,
  useResumeViewsGetJobsQuery,
  useResumeViewsCreateResumeMutation,
} from './store/resumeApi'

import './App.css'
import React from 'react'

function App() {
  const [count, setCount] = useState(0)


  const { data, error, isLoading } = useResumeViewsGetJobsQuery(
    { resumeId: 1 },
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

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resumeText, setResumeText] = useState<string>('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleFileUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await resumePdfToText({ body: formData });

      // console.log(response.data.text)
      setResumeText(response.data.text)
      console.log(response.data.text)
      console.log(resumeText)
      // Do something with the response, e.g., update the state or show a success message
    } catch (error) {
      // Handle error, e.g., show an error message
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);

      // useResumeViewsResumePdfToTextMutation({ "file": formData });
      handleFileUpload(file);

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="App">

      {/* create textarea for resume text as well as form */}
      <form >
        <label htmlFor="resume-text" style={{ cursor: 'pointer' }}>
          Enter resume text
        </label>
        <textarea
          id="resume-text"
          name="resume-text"
          rows={10}
          cols={50}
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
        />
        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Text'}
        </button>
      </form>



      <form onSubmit={handleSubmit}>
        <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
          Select a file
        </label>
        <input
          id="file-upload"
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {file && <p>Selected file: {file.name}</p>}
        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </form>

      <p>
        {data && data.jobs.map((job) => (
          <p>{job.text}</p>
        ))}
      </p>



    </div >
  )
}

export default App
