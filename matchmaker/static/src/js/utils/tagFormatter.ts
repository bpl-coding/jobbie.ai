interface Dictionary {
    [key: string]: {
        [key: string]: string;
    };
}

export const tagDictionary: Dictionary = {
    'arrangement': {},
    'technology': {
        'cplusplus': 'C++',
        'csharp': 'C#',
        'ember': 'Ember.js',
        'ios': 'iOS',
        'javascript': 'JavaScript',
        'node': 'Node.js',
        'php': 'PHP',
        'python-fastapi': 'Python FastAPI',
        'rails': 'Ruby on Rails',
        'vue': 'Vue.js',
        'wasm': 'WebAssembly',
        'react': 'React.js',
        'typescript': 'TypeScript',
    },
    'location': {
        'bogota': 'Bogotá',
        'cambridge-ma': 'Cambridge (MA)',
        'cambridge-uk': 'Cambridge (UK)',
        'dc': 'Washington DC',
        'la': 'Los Angeles',
        'melbourne-au': 'Melbourne (AU)',
        'melbourne-fl': 'Melbourne (FL)',
        'nyc': 'New York City',
        'phoenix-az': 'Phoenix (AZ)',
        'st-louis': 'St. Louis',
    },
    'role': {
        'ux-designer': 'UX Designer',
        'ui-designer': 'UI Designer',
        'qa-engineer': 'QA Engineer',
    },
    'job-type': {},
};

export const formatTag = (tag: string): string => {

    // split tag by colon
    const [tagType, tagValue] = tag.split(':');

    const formattedTag = tagDictionary[tagType][tagValue];
    if (formattedTag) {
        return formattedTag;
    }

    // If not found in the dictionary, then format it by removing dashes and capitalizing words
    return tagValue
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
