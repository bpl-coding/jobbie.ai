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

    return (
        <div key={job.id}>
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
    )
};

export default JobPost