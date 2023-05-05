import { useState } from "react";
import { scroller } from 'react-scroll';

import {
  useResumeViewsResumePdfToTextMutation,
  useResumeViewsGetJobsQuery,
  useResumeViewsCreateResumeMutation,
} from "./store/resumeApi";

import React from "react";

import OrderBy, { SortState } from "./components/OrderBy";

import { Link, Element } from 'react-scroll';
import SkeletonLoader from "./components/SkeletonLoader";
import { Accordion, Button, Tooltip } from "flowbite-react";
import RadioForm from "./components/RadioForm";
import ToggleSwitch from './components/ToggleSwitch';
import Paginator from "./components/Paginator";

function App() {
  const [count, setCount] = useState(0);

  const [resumeId, setResumeId] = useState(-1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [distance, setDistance] = useState("maxInnerProduct");
  const [orderBy, setOrderBy] = useState<SortState>('ascending');
  const [shouldFetchJobs, setShouldFetchJobs] = useState(false);

  const {
    data: jobsData,
    error: jobsError,
    isLoading: getJobsIsLoading,
    isFetching: getJobsIsFetching,
    refetch,
  } = useResumeViewsGetJobsQuery(
    { resumeId, page, pageSize, distance, orderBy: orderBy.toString() },
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

  const [showDistance, setShowDistance] = useState(false);

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

    scrollToSkeletonLoader();

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

  const scrollToSkeletonLoader = () => {
    scroller.scrollTo('skeletonLoader', {
      duration: 500, // Duration of the scroll animation in milliseconds
      smooth: true, // Enable smooth scrolling
      offset: -10, // Offset from the element's top position (optional)
    });
  };


  const distanceFunctionOptions = [
    {
      id: "maxInnerProduct",
      value: "maxInnerProduct",
      label: "Max Inner Product",
    },
    {
      id: "cosineDistance",
      value: "cosine",
      label: "Cosine Distance",
    },
    {
      id: "euclideanDistance",
      value: "l2",
      label: "Euclidean Distance",
    }
  ];

  console.log(page)
  console.log(jobsData?.total_jobs)
  return (
    <div className="container mx-auto px-10 dark:bg-slate-800 ">

      <div className="flex flex-col items-center justify-center w-full mt-20">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 ">
          HN Resume to Jobs
        </h1>
      </div>

      <div className="flex flex-col items-center justify-center w-full mb-14">
        <h2 className="text-gray-900 dark:text-gray-100 ">
          Find jobs most relevant to your resume
        </h2>
      </div>

      <div className="flex items-end text-gray-900 mb-5">
        <span className="text-2xl font-semibold">Step 1</span>
        <Tooltip content="You can also copy/paste the contents of your resume">
          <span className="text-xs text-gray-400 ml-1 mb-1">(Optional)</span>
        </Tooltip>
        <span className="text-lg font-semibold ml-2">- Convert your resume to text</span>
      </div>

      <div className="flex flex-row justify-center mb-5">

        <div className="w-full md:w-1/4 flex">

          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col aspect-square items-center justify-center h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">

                <svg aria-hidden="true" className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  {dragging ? "Drop file here" : <span className="font-semibold">Click to upload or drag and drop</span>}

                </p>
                {file && <p className="text-xs text-gray-500 dark:text-gray-400">Selected file: {file.name}</p>}
                {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
                <p className="text-xs text-gray-500 dark:text-gray-400">PDF (MAX. 2MB)</p>
              </div>
              <input
                id="dropzone-file"
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

        </div>
      </div>

      <div className="flex items-end text-gray-900 mb-5">
        <span className="text-2xl font-semibold">Step 2</span>
        <span className="text-lg font-semibold ml-2">- Search for similar jobs to your resume</span>
      </div>

      <div className="flex flex-row">
        <div className="w-full flex justify-center">
          <form onSubmit={handleResumeTextSubmit} className="w-full h-full">
            <label
              htmlFor="resume-text"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Enter resume text
            </label>
            <textarea
              id="resume-text"
              name="resume-text"
              className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 min-h-[500px]"
              placeholder="Enter the text of your resume..."
              onChange={(e) => setResumeText(e.target.value)}
              value={resumeText}
            />

            <Accordion collapseAll={true} className="mt-5">
              <Accordion.Panel>
                <Accordion.Title>
                  Advanced Options
                </Accordion.Title>
                <Accordion.Content>


                  <ToggleSwitch isChecked={showDistance} setIsChecked={setShowDistance} label="Show Distance" />


                  <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Distance Function</h3>
                  <RadioForm options={distanceFunctionOptions} value={distance} onChange={setDistance} />

                </Accordion.Content>
              </Accordion.Panel>
            </Accordion>

            <div className="flex justify-center mt-5">

              <button
                type="submit"
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 my-5"
                onClick={() => { scrollToSkeletonLoader() }}
              >
                Search Jobs
              </button>

            </div>
          </form>

        </div>
      </div>




      <div className="flex justify-end">
        <OrderBy sortState={[orderBy, setOrderBy]} onSortChange={() => { setPage(1) }} />
      </div>

      <Element name="skeletonLoader">
        {(getJobsIsLoading || getJobsIsFetching) && !jobsError &&
          <>
            {[...Array(3)].map((_, index) => (
              <div key={index}>
                <hr className="border-gray-300 dark:border-gray-600 my-10" />
                <SkeletonLoader />
              </div>
            ))}
            <div className="mb-28"></div>
          </>
        }
      </Element>



      <div>
        {!getJobsIsLoading && !jobsError && jobsData && jobsData.jobs.map((job) => (
          <React.Fragment key={job.id}>
            <div>
              <hr className="border-gray-300 dark:border-gray-600 my-10" />
              <div className="flex justify-between">
                <div className="px-10 pb-5">
                  <a href={"https://news.ycombinator.com/user?id=" + job.posted_by}
                    className="text-xl underline text-sky-500">
                    {job.posted_by}
                  </a>
                </div>

                <div>
                  <div className="px-10 pb-5">
                    {showDistance &&
                      <>
                        <span className="font-semibold">Distance: </span>
                        <span>{job.distance.toFixed(4)}</span>
                      </>
                    }
                  </div>
                </div>
              </div>
              <div
                className="wrap-display-text text-xl max-w-full mx-10"
                dangerouslySetInnerHTML={{ __html: job.display_text }}
              />
            </div>
          </React.Fragment>

        ))}
        {!getJobsIsLoading && !jobsError && jobsData &&
          <div className="py-16">
            <Paginator page={page} setPage={setPage} pageSize={pageSize} totalJobs={jobsData.total_jobs} />
          </div>
        }

      </div>
    </div>



  );
}


export default App;


