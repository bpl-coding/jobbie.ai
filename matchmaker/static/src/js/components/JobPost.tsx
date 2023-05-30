import React from 'react'

import { HnJobPostingSchemaOut } from '../store/resumeApi';

type JobPostProps = {
    job: HnJobPostingSchemaOut;
    showDistance: boolean;
};


const JobPost: React.FC<JobPostProps> = ({
    job,
    showDistance,
}) => {

    function convertTimePosted(jobTime) {
        const date = new Date(jobTime * 1000).toISOString().split('T')[0];
        return date;
    }

    return (
        <div key={job.id}>
            <hr className="border-gray-300 dark:border-gray-600 my-10" />
            <div className="flex justify-between">
                <div className="px-10 pb-5">
                    <a href={"https://news.ycombinator.com/user?id=" + job.posted_by}
                        className="text-xl underline text-sky-500 hover:text-sky-700">
                        {job.posted_by}
                    </a>
                </div>

                <div>
                    <div className="px-10 pb-5 flex flex-row items-center">
                        <a href={"https://news.ycombinator.com/item?id=" + job.hn_id}>
                            <p className="text-lg text-gray-500 hover:text-gray-700 dark:text-gray-400">{convertTimePosted(job.time_posted)}</p>
                        </a>
                        {showDistance &&
                            <div className="flex">
                                <span className="mx-2 dark:text-gray-200"> | </span>
                                <span className="font-semibold dark:text-gray-200">Distance: </span>
                                <span className="dark:text-gray-200">{job.distance.toFixed(4)}</span>
                            </div>
                        }
                    </div>

                </div>
            </div>
            <div
                className="wrap-display-text text-xl max-w-full mx-10 dark:text-gray-200"
                dangerouslySetInnerHTML={{ __html: job.display_text }}
            />
        </div>
    )
};

export default JobPost