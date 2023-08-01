
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Form, Input, Modal, Pagination, Collapse, Radio, Skeleton, Space, Switch, Typography } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import JobPost from "../components/JobPost";
import OrderBy, { SortState } from "../components/OrderBy";
import Paginator from "../components/Paginator";
import { scroller } from "react-scroll";

import { Element } from "react-scroll";
import SkeletonLoader from "../components/SkeletonLoader";
import { Accordion, Tooltip, Checkbox, Label } from "flowbite-react";
import RadioForm from "../components/RadioForm";
import ToggleSwitch from "../components/ToggleSwitch";
import FileUpload from "../components/FileUpload";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { formatTag } from "../utils/tagFormatter";
import DarkModeButton from "../components/DarkModeButton";

import {
    useResumeViewsResumePdfToTextMutation,
    useResumeViewsResumeTextToJsonMutation,
    useResumeViewsGetResumeTextToJsonResultQuery,
    useResumeViewsGetJobsQuery,
    useResumeViewsCreateResumeMutation,
    useResumeViewsGetResumeQuery,
    useResumeViewsGetTagsQuery,
} from "../store/resumeApi";

import "../App.css";
import "react-responsive-modal/styles.css";


const Matcher = ({resumeJson}) => {
    const HIRING_POSTS = JSON.parse(
        document.getElementById("hiring_posts")?.textContent ?? "{}"
    ) as HiringPostTime[];
    const TAG_CATEGORIES = ["technology", "arrangement", "location", "role", "job-type"];
    const [selectedHiringPostTime, setSelectedHiringPostTime] =
        useState<HiringPostTime>(HIRING_POSTS[0]);

    const [searchParams, setSearchParams] = useSearchParams();
    
    const initialResumeUUID = searchParams.get("resumeUUID") || "";
    const [resumeUUID, setResumeUUID] = useState<string>(initialResumeUUID);
    const [shouldFetchJobs, setShouldFetchJobs] = useState(
        initialResumeUUID !== ""
    );

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [distance, setDistance] = useState("cosine");
    const [orderBy, setOrderBy] = useState<SortState>("ascending");
    const [showDistance, setShowDistance] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const onOpenModal = () => setOpen(true);
    const onCloseModal = () => setOpen(false);

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

    const handleResumeTextSubmit = async (event) => {
        event.preventDefault();

        if (!resumeJson) {
            alert("Please enter resume text to upload");
            return;
        }

        const response = await createResume({
            createResumeIn: { text: JSON.stringify(resumeJson) },
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
            orderBy: "ascending",
            month: selectedHiringPostTime.month,
            year: selectedHiringPostTime.year,
            tags: selectedTags.join(","),
        },
        { skip: resumeUUID === "" || !shouldFetchJobs }
    );

    const {
        data: tagsData,
        error: tagsError,
        isLoading: getTagsIsLoading,
        isFetching: getTagsIsFetching,
        refetch: refetchTags,
    } = useResumeViewsGetTagsQuery();

    
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

                <Modal open={open} onCancel={onCloseModal}>
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
};

export default Matcher;