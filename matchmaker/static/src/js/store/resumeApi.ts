import { emptySplitApi as api } from "./emptyApi";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    resumeViewsResumePdfToText: build.mutation<
      ResumeViewsResumePdfToTextApiResponse,
      ResumeViewsResumePdfToTextApiArg
    >({
      query: (queryArg) => ({
        url: `/api/resume/upload`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    resumeViewsResumeTextToJson: build.mutation<
      ResumeViewsResumeTextToJsonApiResponse,
      ResumeViewsResumeTextToJsonApiArg
    >({
      query: (queryArg) => ({ 
        url: `/api/parse`,
        method: "POST",
        body: queryArg.createResumeIn
      }),
    }),
    resumeViewsGetResumeTextToJsonResult: build.query<
      ResumeViewsGetResumeTextToJsonResultApiResponse,
      ResumeViewsGetResumeTextToJsonResultApiArg
    >({
      query: (queryArg) => ({ url: `/api/parse/${queryArg.task_id}` }),
    }),
    resumeViewsGetJobs: build.query<
      ResumeViewsGetJobsApiResponse,
      ResumeViewsGetJobsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/jobs`,
        params: {
          resume_uuid: queryArg.resumeUuid,
          month: queryArg.month,
          year: queryArg.year,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          distance: queryArg.distance,
          order_by: queryArg.orderBy,
          tags: queryArg.tags,
        },
      }),
    }),
    resumeViewsCreateResume: build.mutation<
      ResumeViewsCreateResumeApiResponse,
      ResumeViewsCreateResumeApiArg
    >({
      query: (queryArg) => ({
        url: `/api/resume`,
        method: "POST",
        body: queryArg.createResumeIn,
      }),
    }),
    resumeViewsGetResume: build.query<
      ResumeViewsGetResumeApiResponse,
      ResumeViewsGetResumeApiArg
    >({
      query: (queryArg) => ({ url: `/api/resume/${queryArg.resumeUuid}` }),
    }),
    resumeViewsGetTags: build.query<
      ResumeViewsGetTagsApiResponse,
      ResumeViewsGetTagsApiArg
    >({
      query: () => ({ url: `/api/tags` }),
    }),
  }),
  overrideExisting: false,
});

export { injectedRtkApi as resumeApi };

export type ResumeViewsResumePdfToTextApiResponse =
  /** status 200 OK */ UploadResumeOut;
export type ResumeViewsResumePdfToTextApiArg = {
  body: {
    file: Blob;
  };
};
export type ResumeViewsResumeTextToJsonApiResponse =
  /** status 200 OK */ UploadResumeOut;
export type ResumeViewsResumeTextToJsonApiArg = {
  createResumeIn: CreateResumeIn;
};

export type ResumeViewsGetResumeTextToJsonResultApiResponse = /** status 200 OK */ ResumeOut;
export type ResumeViewsGetResumeTextToJsonResultApiArg = {
  task_id?: string;
}

export type ResumeViewsGetJobsApiResponse = /** status 200 OK */ JobsOut;
export type ResumeViewsGetJobsApiArg = {
  resumeUuid: string;
  month: string;
  year: number;
  page?: number;
  pageSize?: number;
  distance?: string;
  orderBy?: string;
  tags?: string;
};

export type ResumeViewsCreateResumeApiResponse =
  /** status 200 OK */ CreateResumeOut;
export type ResumeViewsCreateResumeApiArg = {
  createResumeIn: CreateResumeIn;
};
export type ResumeViewsGetResumeApiResponse = /** status 200 OK */ ResumeOut;
export type ResumeViewsGetResumeApiArg = {
  resumeUuid: string;
};

export type ResumeViewsGetTagsApiResponse = /** status 200 OK */ TagsOut;
export type ResumeViewsGetTagsApiArg = void;

export type UploadResumeOut = {
  text: string;
};

export type HnJobPostingSchemaOut = {
  id?: number;
  whos_hiring_post: number;
  hn_id: number;
  posted_by: string;
  time_posted: number;
  updated_at: string;
  display_text: string;
  tags?: number[];
  tagged_items?: number[];
  distance: number;
};
export type JobsOut = {
  jobs: HnJobPostingSchemaOut[];
  total_jobs: number;
};
export type CreateResumeOut = {
  uuid: string;
};
export type CreateResumeIn = {
  text: string;
};
export type ResumeOut = {
  uuid: string;
  text: string;
};
export type TagsOut = {
  tags: {
    [key: string]: string[];
  };
};
export const {
  useResumeViewsResumePdfToTextMutation,
  useResumeViewsResumeTextToJsonMutation,
  useResumeViewsGetResumeTextToJsonResultQuery,
  useResumeViewsGetJobsQuery,
  useResumeViewsCreateResumeMutation,
  useResumeViewsGetResumeQuery,
  useResumeViewsGetTagsQuery,
} = injectedRtkApi;
