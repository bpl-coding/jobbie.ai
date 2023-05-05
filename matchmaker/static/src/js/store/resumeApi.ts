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
    resumeViewsGetJobs: build.query<
      ResumeViewsGetJobsApiResponse,
      ResumeViewsGetJobsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/jobs`,
        params: {
          resume_id: queryArg.resumeId,
          page: queryArg.page,
          page_size: queryArg.pageSize,
          distance: queryArg.distance,
          order_by: queryArg.orderBy,
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
export type ResumeViewsGetJobsApiResponse = /** status 200 OK */ JobsOut;
export type ResumeViewsGetJobsApiArg = {
  resumeId: number;
  page?: number;
  pageSize?: number;
  distance?: string;
  orderBy?: string;
};
export type ResumeViewsCreateResumeApiResponse =
  /** status 200 OK */ CreateResumeOut;
export type ResumeViewsCreateResumeApiArg = {
  createResumeIn: CreateResumeIn;
};
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
  raw_text: string;
  display_text: string;
  embedding_text: string;
  distance: number;
};
export type JobsOut = {
  jobs: HnJobPostingSchemaOut[];
  total_jobs: number;
};
export type CreateResumeOut = {
  id: number;
};
export type CreateResumeIn = {
  text: string;
};
export const {
  useResumeViewsResumePdfToTextMutation,
  useResumeViewsGetJobsQuery,
  useResumeViewsCreateResumeMutation,
} = injectedRtkApi;
