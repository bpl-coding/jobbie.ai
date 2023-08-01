import { useState } from "react";
import { scroller } from "react-scroll";

import {
    useResumeViewsResumePdfToTextMutation,
    useResumeViewsResumeTextToJsonMutation,
    useResumeViewsGetResumeTextToJsonResultQuery,
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
import { Accordion, Tooltip, Checkbox, Label } from "flowbite-react";
import RadioForm from "./components/RadioForm";
import ToggleSwitch from "./components/ToggleSwitch";
import Paginator from "./components/Paginator";
import FileUpload from "./components/FileUpload";
import JobPost from "./components/JobPost";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import JsonForm from "./components/JsonForm";
import JsonResume from "./components/JsonResume";
import { Modal, Button, Divider, Steps } from 'antd';

import "react-responsive-modal/styles.css";

import { formatTag } from "./utils/tagFormatter";
import DarkModeButton from "./components/DarkModeButton";

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
    const TAG_CATEGORIES = ["technology", "arrangement", "location", "role", "job-type"];
    const selectedSlug = HIRING_POSTS[0].slug;
    const [selectedHiringPostTime, setSelectedHiringPostTime] =
        useState<HiringPostTime>(HIRING_POSTS[0]);

    // Get the search parameters from the URL
    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize the state variables using the values from the URL search parameters
    const initialResumeUUID = searchParams.get("resumeUUID") || "";

    const [resumeUUID, setResumeUUID] = useState<string>(initialResumeUUID);
    const [file, setFile] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    const [shouldFetchJobs, setShouldFetchJobs] = useState(
        initialResumeUUID !== ""
    );

    const [resumeText, setResumeText] = useState<string>("");
    const [resumeJson, setResumeJson] = useState("");
    const [parseId, setParseId] = useState("");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [distance, setDistance] = useState("cosine");
    const [orderBy, setOrderBy] = useState<SortState>("ascending");
    const [showDistance, setShowDistance] = useState(false);

    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const onOpenModal = () => setOpen(true);
    const onCloseModal = () => setOpen(false);

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
        resumeTextToJSON,
        {
            isLoading: textToJsonIsLoading,
            isError: textToJsonIsError,
            isSuccess: textToJsonIsSuccess,
            data: textToJsonData,
        },
    ] = useResumeViewsResumeTextToJsonMutation();

    const
        {
            data: jsonData, // The data returned by the query
            error: jsonError, // Any error that occurred while fetching the data
            isLoading: getJsonIsLoading, // Whether the query is currently loading
            isFetching: getJsonIsFetching, // Whether the query is currently fetching in the background
            refetch: refetchJsonQuery
        } = useResumeViewsGetResumeTextToJsonResultQuery(
            { task_id: parseId }, // Pass the resumeUUID as a parameter to the query
        );

    const {
        data: jobsData,
        error: jobsError,
        isLoading: getJobsIsLoading,
        isFetching: getJobsIsFetching,
        refetch,
    } = useResumeViewsGetJobsQuery(
        {
            resumeUuid: resumeUUID,
            page,
            pageSize,
            distance,
            orderBy: orderBy.toString(),
            month: selectedHiringPostTime.month,
            year: selectedHiringPostTime.year,
            tags: selectedTags.join(","),
        },
        { skip: resumeUUID === "" || !shouldFetchJobs }
    );

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
        data: resumeData, // The data returned by the query
        error: resumeError, // Any error that occurred while fetching the data
        isLoading: getResumeIsLoading, // Whether the query is currently loading
        isFetching: getResumeIsFetching, // Whether the query is currently fetching in the background
    } = useResumeViewsGetResumeQuery(
        { resumeUuid: resumeUUID }, // Pass the resumeUUID as a parameter to the query
        { skip: resumeUUID === "" } // Optionally, skip the query if resumeUUID is -1
    );

    const {
        data: tagsData,
        error: tagsError,
        isLoading: getTagsIsLoading,
        isFetching: getTagsIsFetching,
        refetch: refetchTags,
    } = useResumeViewsGetTagsQuery();

    const handleFileChange = async (event) => {

        let selectedFile = null;
        if (event.target) {
            selectedFile = event.target.files[0];
        } else {
            selectedFile = event[0];
        }

        const maxSize = 2 * 1024 * 1024; // 2MB

        if (selectedFile && selectedFile['size'] > maxSize) {
            setErrorMsg("File size must be under 2MB");
            setFile(null);
        } else if (selectedFile && selectedFile['type'] !== "application/pdf") {
            setErrorMsg("File must be a PDF");
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
            setResumeText(response['data'].text);

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

        const resumeUUID = response.data.uuid;

        setResumeUUID(resumeUUID);

        setSearchParams({ resumeUUID: resumeUUID.toString() }, { replace: true });

        // Fetch jobs after the resume is created
        setShouldFetchJobs(true);

        refetch();

    };

    const scrollToSkeletonLoader = () => {
        scroller.scrollTo("skeletonLoader", {
            duration: 500, // Duration of the scroll animation in milliseconds
            smooth: true, // Enable smooth scrolling
            offset: -10, // Offset from the element's top position (optional)
        });
    };

    const handleSelectChange = (event) => {
        const [month, year] = event.target.value.split("-");
        setSelectedHiringPostTime({ month: month, year: year } as HiringPostTime);
    };

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

    // useEffect(() => {
    //   let intervalId;
    //   console.log(parseId);
    //   console.log(getJsonIsFetching);
    //   console.log(getJobsIsLoading);
    //   if (parseId !== "") {
    //     // Start a new interval when parseId changes
    //     intervalId = setInterval(() => {
    //       if (parseId === "" || jsonData?.text.length > 20) {
    //         // If parseId is cleared, stop the interval immediately
    //         console.log("clearing interval")
    //         clearInterval(intervalId);
    //       } else {
    //         console.log("refetching"+parseId)
    //         refetchJsonQuery();
    //       }
    //     }, 5000); // Poll every 5 seconds
    //   }

    //   // Clean up the interval when the component unmounts or parseId changes
    //   return () => clearInterval(intervalId);
    // }, [parseId, refetchJsonQuery, jsonData]);

    // useEffect(() => {
    //   const parseResumeText = async (resumeText) => {
    //     if (!resumeText) {
    //       return;
    //     }
    //     const response = await resumeTextToJSON({ createResumeIn: { text: resumeText }});
    //     if (response['data']) {
    //       setParseId(response['data'].task_id || "");
    //     } else {
    //         await new Promise(resolve => setTimeout(resolve, 2000));  // Wait 2 seconds before retrying
    //     }
    //   };
    //   parseResumeText(resumeText);
    // }, [resumeText]);

    useEffect(() => {
        // console.log(getResumeIsFetching);
        // console.log(getResumeIsLoading);
        if (resumeText?.length > 20 && resumeJson === "") {
            console.log(resumeJson);
            setResumeJson(resumeText);
        }
    }, [resumeText, resumeJson]);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-row mt-5">
                    <div className="w-full">
                        <form onSubmit={handleResumeTextSubmit} className="w-full h-full">
                            <Accordion collapseAll={true}>
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

                            <div className="flex justify-center my-10">
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

                    <p className="text-lg text-gray-900 dark:text-gray-200">
                        {jobsData?.total_jobs ?? 0} jobs found
                    </p>

                    <div className="flex space-x-4">
                        <Button onClick={onOpenModal} color="gray">
                            <span className="font-medium dark:text-gray-200">Apply Filters</span>
                            <FontAwesomeIcon icon={faFilter} className="ml-2 text-gray-600 dark:text-gray-200" />
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

                <Modal open={open} onClose={onCloseModal}
                    classNames={{
                        modal: 'p-0',
                    }}
                >
                    <div className="bg-white dark:bg-slate-800 p-5">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-2">
                            Filter Jobs
                        </h3>
                        <hr className="h-px mb-4 bg-gray-200 border-0 dark:bg-gray-700" />

                        <div className="flex flex-col">
                            {tagsData &&
                                TAG_CATEGORIES.map((category) => (
                                    <div className="mb-5">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-2">
                                            {titleize(category)}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-1">
                                            {tagsData.tags[category] && tagsData.tags[category].map((tag) => {
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
                                                            className="text-gray-900 dark:text-gray-200"
                                                        >
                                                            {formatTag(id)}
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
                    </div>
                </Modal>
            </div>
        </div>
    );
}

export default App;
