import type { ConfigFile } from '@rtk-query/codegen-openapi'

const config: ConfigFile = {
    schemaFile: 'http://127.0.0.1:8000/api/openapi.json',
    apiFile: './matchmaker/static/src/js/store/emptyApi.ts',
    apiImport: 'emptySplitApi',
    // outputFiles: {
    //     './matchmaker/static/src/js/store/resume.ts': {
    //         filterEndpoints: [/resume/i],
    //     }
    // },
    outputFile: './matchmaker/static/src/js/store/resumeApi.ts',
    exportName: 'resumeApi',
    hooks: true,
}

export default config