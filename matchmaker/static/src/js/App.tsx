import { useState } from "react";
import { scroller } from "react-scroll";

import {
  useResumeViewsResumePdfToTextMutation,
  useResumeViewsGetJobsQuery,
  useResumeViewsCreateResumeMutation,
  useResumeViewsGetResumeQuery,
  useResumeViewsGetTagsQuery,
} from "./store/resumeApi";
import { useSearchParams } from "react-router-dom";

import React, { useEffect } from "react";
import OrderBy, { SortState } from "./components/OrderBy";

import "./App.css";

import { Element } from "react-scroll";
import SkeletonLoader from "./components/SkeletonLoader";
import { Accordion, Button, Tooltip, Checkbox, Label } from "flowbite-react";
import RadioForm from "./components/RadioForm";
import ToggleSwitch from "./components/ToggleSwitch";
import Paginator from "./components/Paginator";
import FileUpload from "./components/FileUpload";
import JobPost from "./components/JobPost";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";

import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";

type HiringPostTime = {
  month: string;
  year: number;
  slug?: string;
};

function titleize(inputStr) {
  // First, replace all dashes with spaces
  let str = inputStr.replace(/-/g, " ");

  // Then, split the string into words, capitalize the first letter of each word,
  // then join the words back together with spaces
  let words = str.split(" ");
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
  }
  return words.join(" ");
}

function App() {
  const HIRING_POSTS = JSON.parse(
    document.getElementById("hiring_posts")?.textContent ?? "{}"
  ) as HiringPostTime[];
  const TAG_CATEGORIES = ["technology", "location", "role", "job-type"];

  const selectedSlug = HIRING_POSTS[0].slug;
  const [selectedHiringPostTime, setSelectedHiringPostTime] =
    useState<HiringPostTime>(HIRING_POSTS[0]);

  // Get the search parameters from the URL
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize the state variables using the values from the URL search parameters
  const initialResumeId = parseInt(searchParams.get("resumeId") || "-1", 10);

  const [resumeId, setResumeId] = useState(initialResumeId);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [distance, setDistance] = useState("cosine");
  const [orderBy, setOrderBy] = useState<SortState>("ascending");
  const [shouldFetchJobs, setShouldFetchJobs] = useState(
    initialResumeId !== -1
  );
  const [resumeText, setResumeText] = useState<string>("");

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [open, setOpen] = useState(false);
  const onOpenModal = () => setOpen(true);
  const onCloseModal = () => setOpen(false);

  const handleCheckboxChange = (event) => {
    const { value, checked } = event.target;

    setSelectedTags((prevTags) => {
      if (checked) {
        // If the checkbox was checked, add the tag to the array
        return [...prevTags, value];
      } else {
        // If the checkbox was unchecked, filter the tag out of the array
        return prevTags.filter((tag) => tag !== value);
      }
    });
  };

  const {
    data: resumeData, // The data returned by the query
    error: resumeError, // Any error that occurred while fetching the data
    isLoading: getResumeIsLoading, // Whether the query is currently loading
    isFetching: getResumeIsFetching, // Whether the query is currently fetching in the background
  } = useResumeViewsGetResumeQuery(
    { resumeId }, // Pass the resumeId as a parameter to the query
    { skip: resumeId === -1 } // Optionally, skip the query if resumeId is -1
  );

  const handleSelectChange = (event) => {
    const [month, year] = event.target.value.split("-");
    setSelectedHiringPostTime({ month: month, year: year } as HiringPostTime);
  };

  useEffect(() => {
    setResumeText(resumeData?.text || "");
  }, [resumeData]);

  const {
    data: jobsData,
    error: jobsError,
    isLoading: getJobsIsLoading,
    isFetching: getJobsIsFetching,
    refetch,
  } = useResumeViewsGetJobsQuery(
    {
      resumeId,
      page,
      pageSize,
      distance,
      orderBy: orderBy.toString(),
      month: selectedHiringPostTime.month,
      year: selectedHiringPostTime.year,
      tags: selectedTags.join(","),
    },
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

  const {
    data: tagsData,
    error: tagsError,
    isLoading: getTagsIsLoading,
    isFetching: getTagsIsFetching,
    refetch: refetchTags,
  } = useResumeViewsGetTagsQuery();

  const [file, setFile] = useState(null);

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

    if ("error" in response) {
      alert("Error creating resume: " + response.error);
      return;
    }

    const resumeId = response.data.id;

    setResumeId(resumeId);

    setSearchParams({ resumeId: resumeId.toString() }, { replace: true });

    // Fetch jobs after the resume is created
    setShouldFetchJobs(true);

    refetch();

    scrollToSkeletonLoader();
  };

  const scrollToSkeletonLoader = () => {
    scroller.scrollTo("skeletonLoader", {
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
    },
  ];

  return (
    <div className="container mx-auto px-10 dark:bg-slate-800">
      <div className="flex flex-col items-center justify-center w-full mt-20">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 ">
          HN Resume to Jobs
        </h1>
      </div>

      <div className="flex flex-row items-center justify-center w-full">
        <h2 className="text-gray-900 dark:text-gray-100 mr-1">
          Find jobs most relevant to your resume for
        </h2>

        <select
          onChange={handleSelectChange}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block py-0.5 px-1 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        >
          {HIRING_POSTS.map((post) => (
            <option
              key={post.slug}
              value={`${post.month}-${post.year}`}
              selected={post.slug === selectedSlug}
            >
              {post.month} {post.year}
            </option>
          ))}
        </select>
      </div>

      <Tooltip content="You can also copy/paste the contents of your resume">
        <div className="flex flex-col sm:flex-row items-start sm:items-end text-gray-900 mt-10 mb-3">
          <div className="flex items-center mb-1 sm:mb-0">
            <span className="text-xl sm:text-2xl font-semibold">Step 1</span>

            <span className="text-xs text-gray-400 ml-1">(Optional)</span>
          </div>
          <span className="text-md sm:text-lg font-semibold ml-0 sm:ml-2 mt-1 sm:mt-0">
            <span className="hidden sm:inline">- </span>Convert your resume to
            text
          </span>
        </div>
      </Tooltip>

      <FileUpload
        file={file}
        onFileChange={handleFileChange}
        errorMsg={errorMsg}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-end text-gray-900 mb-3">
        <span className="text-xl sm:text-2xl font-semibold mb-1 sm:mb-0">
          Step 2
        </span>
        <span className="text-md sm:text-lg font-semibold ml-0 sm:ml-2 mt-1 sm:mt-0">
          <span className="hidden sm:inline">- </span>Search for jobs similar to
          your resume
        </span>
      </div>

      <div className="flex flex-row">
        <div className="w-full flex justify-center">
          <form onSubmit={handleResumeTextSubmit} className="w-full h-full">
            <label
              htmlFor="resume-text"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
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
                <Accordion.Title>Advanced Options</Accordion.Title>
                <Accordion.Content>
                  <ToggleSwitch
                    isChecked={showDistance}
                    setIsChecked={setShowDistance}
                    label="Show Distance"
                  />

                  <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                    Distance Function
                  </h3>
                  <RadioForm
                    options={distanceFunctionOptions}
                    value={distance}
                    onChange={setDistance}
                  />
                </Accordion.Content>
              </Accordion.Panel>
            </Accordion>

            <div className="flex justify-center mt-5">
              <button
                type="submit"
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 my-5"
                onClick={() => {
                  scrollToSkeletonLoader();
                }}
              >
                Search Jobs
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="flex justify-between">

        <p className="text-lg text-gray-900 dark:text-gray-100">
          {jobsData?.total_jobs ?? 0} jobs found
        </p>

        <div className="flex space-x-4">
          <Button onClick={onOpenModal} color="gray">
            <span className="font-medium">Apply Filters</span>
            <FontAwesomeIcon icon={faFilter} className="ml-2" />
          </Button>

          <OrderBy
            sortState={[orderBy, setOrderBy]}
            onSortChange={() => {
              setPage(1);
            }}
          />
        </div>
      </div>

      <Element name="skeletonLoader">
        {(getJobsIsLoading || getJobsIsFetching) && !jobsError && (
          <>
            {[...Array(3)].map((_, index) => (
              <div key={index}>
                <hr className="border-gray-300 dark:border-gray-600 my-10" />
                <SkeletonLoader />
              </div>
            ))}
            <div className="mb-28"></div>
          </>
        )}
      </Element>

      <div>
        {!getJobsIsLoading &&
          !jobsError &&
          jobsData &&
          jobsData.jobs.map((job) => (
            <JobPost job={job} showDistance={showDistance} />
          ))}

        {!getJobsIsLoading && !jobsError && jobsData && (
          <div className="py-16">
            <Paginator
              page={page}
              setPage={setPage}
              pageSize={pageSize}
              totalJobs={jobsData.total_jobs}
            />
          </div>
        )}
      </div>

      <Modal open={open} onClose={onCloseModal}>
        <>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Filter Jobs
          </h3>
          <hr className="h-px mb-4 bg-gray-200 border-0 dark:bg-gray-700" />

          <div className="flex flex-col">
            {tagsData &&
              TAG_CATEGORIES.map((category) => (
                <div className="mb-5">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {titleize(category)}
                  </h3>
                  <div className="grid grid-cols-2 gap-1">
                    {tagsData.tags[category].map((tag) => {
                      const id = `${category}:${tag}`;
                      return (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={id}
                            className="mr-2"
                            checked={selectedTags.includes(id)}
                            value={id}
                            onChange={handleCheckboxChange}
                          />
                          <label
                            htmlFor={id}
                            className="text-gray-900 dark:text-white"
                          >
                            {titleize(tag)}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>

          <hr className="h-px mb-4 bg-gray-200 border-0 dark:bg-gray-700" />
          <div className="py-4">
            <div className="flex space-x-4">
              <Button onClick={onCloseModal}>Apply Filters</Button>
              <Button
                color="gray"
                onClick={() => {
                  setSelectedTags([]);
                }}
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        </>
      </Modal>
    </div>
  );
}

export default App;
