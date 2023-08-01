import React, {useState, useEffect} from 'react';
import { SiGithub, SiLinkedin, SiTwitter } from '@icons-pack/react-simple-icons';
import { DateTime } from 'luxon';
import default_resume from '../.././assets/default_resume.json';
import { OpenAIChatApi } from 'llm-api';
import { completion } from 'zod-gpt';
import { z } from 'zod';

const openai = new OpenAIChatApi(
  { apiKey: process.env.OPENAI_API_KEY },
  { model: 'gpt-3.5-turbo-16k' },
);

const Icon = ({ url }: any) => {
  const size = 20;
  const style = { marginRight: 4 };
  const u = url.toLowerCase();
  if (u.indexOf('github') >= 0) {
    return <SiGithub size={size} color="black" style={style} />;
  }
  if (u.indexOf('linkedin') >= 0) {
    return <SiLinkedin size={size} color="black" style={style} />;
  }
  if (u.indexOf('twitter') >= 0) {
    return <SiTwitter size={size} color="black" style={style} />;
  }
  return null;
};

const Experience = ({ items }: any) =>
  isEmpty(items) ? null : (
    <div style={{ marginTop: 60 }}>
      <h4 style={{ marginBottom: '0.5em' }}>WORK EXPERIENCE</h4>
      {items.map((item: any, k: any) => (
        <div key={k} style={{ position: 'relative' }}>
          {items.length === 1 ? null : (
            <Timeline isLast={k === items.length - 1} />
          )}
          <h4 style={{ marginBottom: 0 }}>{item.position} 
            <a style={{color:"#8a2be2"}} href={item.website} target="_blank">@
               {item.name || item.company}
            </a>
        </h4>
          <h5>
            {item.startDate}{item.startDate !== "" && item.endDate !== "" ? " - " : ""}{item.endDate}
            {/* <Period startDate={item.startDate} endDate={item.endDate} /> */}
          </h5>
          <p>{item.summary}</p>
        </div>
      ))}
    </div>
  );

const Degree = ({ education }: any) =>
  isEmpty(education) ? null : (
    <div style={{ marginTop: '0.5em' }}>
      <h4 style={{ marginBottom: '0.5em' }}>EDUCATION</h4>
      {education.map((item: any, k: any) => (
        <div key={k} style={{ position: 'relative' }}>
          {education.length === 1 ? null : (
            <Timeline isLast={k === education.length - 1} />
          )}
          <h4 style={{ marginBottom: 0 }}>{item.institution}</h4>
          <h5
            style={{
              margin: '2px 0',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <a href={item.website} target="_blank">
              {item.website}
            </a>
            {/* <Period startDate={item.startDate} endDate={item.endDate} /> */}
          </h5>
          <p>{item.area}</p>
        </div>
      ))}
    </div>
  );

const Timeline = ({ isLast }: any) => {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          width: 24,
          height: 24,
          border: '1px solid var(--textLink)',
          borderRadius: '100%',
          left: -30,
          top: 3,
          padding: 6,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            backgroundColor: 'var(--textLink)',
            borderRadius: '100%',
          }}
        ></div>
      </div>
      {isLast ? null : (
        <div
          style={{
            position: 'absolute',
            width: 2,
            left: -19,
            top: 26,
            bottom: -31,
            backgroundColor: 'var(--textLink)',
          }}
        ></div>
      )}
    </>
  );
};

const Period = ({ startDate, endDate }: any) => (
  <span style={{ width: 130 }}>
    <span>
      {DateTime.fromFormat(startDate, 'yyyy-MM-dd').toFormat('MMM yyyy')}
    </span>
    <span>&nbsp;-&nbsp;</span>
    <span>
      {endDate
        ? DateTime.fromFormat(endDate, 'yyyy-MM-dd').toFormat('MMM yyyy')
        : 'now'}
    </span>
  </span>
);

const Tag = ({ color, children }: any) => {
  return (
    <span
      style={{
        backgroundColor: color === 'secondary' ? '#8a2be2' : 'var(--textLink)',
        color: 'white',
        borderRadius: 4,
        padding: '0px 4px 2px 4px',
        marginLeft: 4,
        boxSizing: 'border-box',
        fontSize: 'smaller',
        fontWeight: 'bold',
      }}
    >
      {children}
    </span>
  );
};

function isEmpty(a: any) {
  return !a || a.length === 0;
}

export function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(...objects) {
  const isObject = obj => obj && typeof obj === 'object';
  
  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach(key => {
      const pVal = prev[key];
      const oVal = obj[key];
      
      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = pVal.concat(...oVal);
      }
      else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(pVal, oVal);
      }
      else {
        prev[key] = oVal;
      }
    });
    
    return prev;
  }, {});
}

const iso8601 = z.string().regex(/^([1-2][0-9]{3}-[0-1][0-9]-[0-3][0-9]|[1-2][0-9]{3}-[0-1][0-9]|[1-2][0-9]{3})$/, {
    message: "Similar to the standard date type, but each section after the year is optional. e.g. 2014-06-29 or 2023-04"
});

const profile = z.object({
    network: z.string().optional().describe("e.g. Facebook or Twitter"),
    username: z.string().optional().describe("e.g. neutralthoughts"),
    url: z.string().optional().describe("e.g. http://twitter.example.com/neutralthoughts")
});

const location = z.object({
    address: z.string().optional().describe("To add multiple address lines, use \n. For example, 1234 Glücklichkeit Straße\nHinterhaus 5. Etage li."),
    postalCode: z.string().optional(),
    city: z.string().optional(),
    countryCode: z.string().optional().describe("code as per ISO-3166-1 ALPHA-2, e.g. US, AU, IN"),
    region: z.string().optional().describe("The general region where you live. Can be a US state, or a province, for instance.")
});

const basics = z.object({
    name: z.string(),
    label: z.string().optional().describe("e.g. Web Developer"),
    image: z.string().optional().describe("URL (as per RFC 3986) to a image in JPEG or PNG format"),
    email: z.string().email().optional().describe("e.g. thomas@gmail.com"),
    phone: z.string().optional().describe("Phone numbers are stored as strings so use any format you like, e.g. 712-117-2923"),
    url: z.string().optional().describe("URL (as per RFC 3986) to your website, e.g. personal homepage"),
    summary: z.string().optional().describe("Write a short 2-3 sentence biography about yourself"),
    location: location.optional(),
    profiles: z.array(profile).optional().describe("Specify any number of social networks that you participate in")
});

const work = z.object({
    company: z.string().optional().describe("e.g. Facebook"),
    location: z.string().optional().describe("e.g. Menlo Park, CA"),
    position: z.string().optional().describe("e.g. Software Engineer"),
    url: z.string().optional().describe("e.g. http://facebook.example.com"),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    summary: z.string().optional().describe("Give an overview of your responsibilities at the company"),
    highlights: z.array(z.string().describe("e.g. Increased profits by 20% from 2011-2012 through viral advertising")).optional()
});

const volunteer = z.object({
  organization: z.string().optional().describe("e.g. Facebook"),
  position: z.string().optional().describe("e.g. Software Engineer"),
  url: z.string().optional().describe("e.g. http://facebook.example.com"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  summary: z.string().optional().describe("Give an overview of your responsibilities at the company"),
  highlights: z.array(z.string().describe("e.g. Increased profits by 20% from 2011-2012 through viral advertising")).optional()
});

const education = z.object({
  institution: z.string().optional().describe("e.g. Massachusetts Institute of Technology"),
  url: z.string().optional().describe("e.g. http://facebook.example.com"),
  area: z.string().optional().describe("e.g. Arts"),
  studyType: z.string().optional().describe("e.g. Bachelor"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  score: z.string().optional().describe("grade point average, e.g. 3.67/4.0"),
  courses: z.array(z.string().describe("e.g. H1302 - Introduction to American history")).optional()
});

const awards = z.object({
  title: z.string().optional().describe("e.g. One of the 100 greatest minds of the century"),
  date: z.string().optional(),
  awarder: z.string().optional().describe("e.g. Time Magazine"),
  summary: z.string().optional().describe("e.g. Received for my work with Quantum Physics")
});

const certificates = z.object({
  name: z.string().optional().describe("e.g. Certified Kubernetes Administrator"),
  date: z.string().optional(),
  url: z.string().optional().describe("e.g. http://example.com"),
  issuer: z.string().optional().describe("e.g. CNCF")
});

const publications = z.object({
  name: z.string().optional().describe("e.g. The World Wide Web"),
  publisher: z.string().optional().describe("e.g. IEEE, Computer Magazine"),
  releaseDate: z.string().optional(),
  url: z.string().optional().describe("e.g. http://www.computer.org.example.com/csdl/mags/co/1996/10/rx069-abs.html"),
  summary: z.string().optional().describe("Short summary of publication. e.g. Discussion of the World Wide Web, HTTP, HTML.")
});

const skills = z.object({
  name: z.string().optional().describe("e.g. Web Development"),
  level: z.string().optional().describe("e.g. Master"),
  keywords: z.array(z.string().describe("e.g. HTML")).optional()
});

const languages = z.object({
  language: z.string().optional().describe("e.g. English, Spanish"),
  fluency: z.string().optional().describe("e.g. Fluent, Beginner")
});

const interests = z.object({
  name: z.string().optional().describe("e.g. Philosophy"),
  keywords: z.array(z.string().describe("e.g. Friedrich Nietzsche")).optional()
});

const references = z.object({
  name: z.string().optional().describe("e.g. Timothy Cook"),
  reference: z.string().optional().describe("e.g. Joe blogs was a great employee, who turned up to work at least once a week. He exceeded my expectations when it came to doing nothing.")
});

const projects = z.object({
  name: z.string().optional().describe("e.g. The World Wide Web"),
  description: z.string().optional().describe("Short summary of project. e.g. Collated works of 2017."),
  highlights: z.array(z.string().describe("e.g. Directs you close but not quite there")).optional(),
  keywords: z.array(z.string().describe("e.g. AngularJS")).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  url: z.string().optional().describe("e.g. http://www.computer.org/csdl/mags/co/1996/10/rx069-abs.html"),
  roles: z.array(z.string().describe("e.g. Team Lead, Speaker, Writer")).optional(),
  entity: z.string().optional().describe("Specify the relevant company/entity affiliations e.g. 'greenpeace', 'corporationXYZ'"),
  type: z.string().optional().describe(" e.g. 'volunteering', 'presentation', 'talk', 'application', 'conference'")
});

const meta = z.object({
  canonical: z.string().optional().describe("URL (as per RFC 3986) to latest version of this document"),
  version: z.string().optional().describe("A version field which follows semver - e.g. v1.0.0"),
  lastModified: z.string().optional().describe("Using ISO 8601 with YYYY-MM-DDThh:mm:ss")
});

const ResumeSchema = z.object({
  "basics": basics.optional(),
  "work": z.array(work).optional(),
  "volunteer": z.array(volunteer).optional(),
  "education": z.array(education).optional(),
  "awards": z.array(awards).optional(),
  "certificates": z.array(certificates).optional(),
  "publications": z.array(publications).optional(),
  "skills": z.array(skills).optional(),
  "languages": z.array(languages).optional(),
  "interests": z.array(interests).optional(),
  "references": z.array(references).optional(),
  "projects": z.array(projects).optional(),
}).describe("Resume Schema");

async function getCompletionResponse(openai, jsonString) {
  const chat = await completion(
    openai,
    "Convert this resume text into JSON Resume format.  Do not skip any fields.  Create a fake data if a field is not present in the resume text.  Only respond with the full json solution: " + jsonString,
    {
      schema: ResumeSchema,
      autoSlice: true,
      autoHeal: true,
      retries: 3,
    }
  );
  console.log(chat.content);
  console.log(chat.usage);
  return chat.data;
}

const JsonResume = ({resumeText, resumeJson, setResumeJson, style}: any) => {

  useEffect(() => {
    getCompletionResponse(openai, resumeText).then(response => {
      setResumeJson(response);
      console.log(response);
    }).catch(error => {
      console.error(error);
    });
  }, [resumeText]);
  
  // data will be typed as { plan: { reason: string; id: string; task: string }[] }  
  const resume = resumeJson; //JSON.parse(jsonString);//mergeDeep(JSON.parse(jsonString), default_resume);
  return (
      resume == "" ? <div></div> :
      <div
          style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
          }}
      >
          {resume.hasOwnProperty('basics') ? (
          <div style={{ display: 'flex' }}>
            <div style={{ width: 300, marginRight: 80 }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img
                    src={resume.basics.image || default_resume.basics.image}
                    style={{ height: 150, borderRadius: '100%' }}
                />
                </div>
                <div style={{ marginBottom: '0.5em' }}>
                    <h4 style={{ marginBottom: '0.5em' }}>SUMMARY</h4>
                    <p>{resume.basics.summary || default_resume.basics.summary}</p>
                </div>
                <div style={{ marginBottom: '0.5em' }}>
                    <h4 style={{ marginBottom: '0.5em' }}>CONTACT</h4>
                    <div>
                        <a href={`mailto:${resume.basics.email || default_resume.basics.email}`}>
                        {resume.basics.email || default_resume.basics.email} 
                        </a>
                    </div>
                    <div>{resume.basics.phone || default_resume.basics.phone}</div>
                    <div>
                        <a href={resume.basics.website || default_resume.basics.website} target="_blank">
                        {resume.basics.website ||default_resume.basics.website}
                        </a>
                    </div>
                </div>
                {isEmpty(resume.profiles) ? null : (
                <div style={{ marginBottom: '0.5em' }}>
                    <h4 style={{ marginBottom: '0.5em' }}>PROFILES</h4>
                    {(resume.basics.profiles || []).map((p: any, k: any) => (
                        <div key={k}>
                        <a
                            href={p.url}
                            target="_blank"
                            style={{ display: 'inline-flex', alignItems: 'center' }}
                        >
                            <Icon url={p.url} />
                            {p.username}
                        </a>
                        </div>
                    ))}
                </div>
                )}
                {isEmpty(resume.skills) ? null : (
                <div style={{ marginBottom: '0.5em' }}>
                    <h4 style={{ marginBottom: '0.5em' }}>SKILLS</h4>
                    {(resume.skills || []).map((item: any, k: any) => (
                    <div key={k}>
                        <div style={{display: 'inline-flex', flexWrap: 'wrap'}}>
                            <Tag color="secondary">{item.name}: {item.level}</Tag>
                        </div>
                        <div>
                            {(item.keywords || []).map((tag: any, k: any) => (
                            <Tag key={k} color="secondary">
                                {tag}
                            </Tag>
                            ))}
                        </div>
                    </div>
                    ))}
                
                </div>
                )}
                {isEmpty(resume.languages) ? null : (
                <div style={{ marginBottom: '0.5em' }}>
                    <h4 style={{ marginBottom: '0.5em' }}>LANGUAGES</h4>
                    {(resume.languages || []).map((item: any, k: any) => (
                    <div key={k}>
                        <span>{item.language}</span>
                        <Tag color="secondary">{item.fluency}</Tag>
                    </div>
                    ))}
                </div>
                )}
                {isEmpty(resume.interests) ? null : (
                <div>
                    <h4 style={{ marginBottom: '0.5em' }}>INTERESTS</h4>
                    {(resume.interests || []).map((item: any, k: any) => (
                    <div key={k}>
                        <span>{item.name}</span>
                        <div>
                        {(item.keywords || []).map((tag: any, k: any) => (
                            <Tag key={k} color="secondary">
                            {tag}
                            </Tag>
                        ))}
                        </div>
                    </div>
                    ))}
                </div>
                )}
                <Degree education={resume.education || []} />
            </div>
            <div>
                <div style={{ marginTop: 40 }}>
                <h1>{resume.basics.name || default_resume.basics.name}</h1>
                <h5 style={{ textTransform: 'uppercase', marginTop: -20 }}>
                    {resume.basics.label || default_resume.basics.label}
                </h5>
                </div>
                <Experience items={resume.work || []} />
                <Experience items={resume.volunteer || []} />
            </div>
          </div>) : null }
      </div>
  );
};

export default JsonResume;
