const API_LINK = "https://www.ratemyprofessors.com/graphql";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.5",
  "Content-Type": "application/json",
  Authorization: `Basic ${process.env.RMP_AUTH_TOKEN}`,
  "Sec-GPC": "1",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  Priority: "u=4",
};

const TEACHER_BODY_QUERY =
  '"query TeacherSearchResultsPageQuery(\\n  $query: TeacherSearchQuery!\\n  $schoolID: ID\\n  $includeSchoolFilter: Boolean!\\n) {\\n  search: newSearch {\\n    ...TeacherSearchPagination_search_1ZLmLD\\n  }\\n  school: node(id: $schoolID) @include(if: $includeSchoolFilter) {\\n    __typename\\n    ... on School {\\n      name\\n    }\\n    id\\n  }\\n}\\n\\nfragment TeacherSearchPagination_search_1ZLmLD on newSearch {\\n  teachers(query: $query, first: 8, after: \\"\\") {\\n    didFallback\\n    edges {\\n      cursor\\n      node {\\n        ...TeacherCard_teacher\\n        id\\n        __typename\\n      }\\n    }\\n    pageInfo {\\n      hasNextPage\\n      endCursor\\n    }\\n    resultCount\\n    filters {\\n      field\\n      options {\\n        value\\n        id\\n      }\\n    }\\n  }\\n}\\n\\nfragment TeacherCard_teacher on Teacher {\\n  id\\n  legacyId\\n  avgRating\\n  numRatings\\n  ...CardFeedback_teacher\\n  ...CardSchool_teacher\\n  ...CardName_teacher\\n  ...TeacherBookmark_teacher\\n}\\n\\nfragment CardFeedback_teacher on Teacher {\\n  wouldTakeAgainPercent\\n  avgDifficulty\\n}\\n\\nfragment CardSchool_teacher on Teacher {\\n  department\\n  school {\\n    name\\n    id\\n  }\\n}\\n\\nfragment CardName_teacher on Teacher {\\n  firstName\\n  lastName\\n}\\n\\nfragment TeacherBookmark_teacher on Teacher {\\n  id\\n  isSaved\\n}\\n"';

const SCHOOL_BODY_QUERY = `\"query NewSearchSchoolsQuery(\\n  $query: SchoolSearchQuery!\\n) {\\n  newSearch {\\n    schools(query: $query) {\\n      edges {\\n        cursor\\n        node {\\n          id\\n          legacyId\\n          name\\n          city\\n          state\\n          departments {\\n            id\\n            name\\n          }\\n          numRatings\\n          avgRatingRounded\\n          summary {\\n            campusCondition\\n            campusLocation\\n            careerOpportunities\\n            clubAndEventActivities\\n            foodQuality\\n            internetSpeed\\n            libraryCondition\\n            schoolReputation\\n            schoolSafety\\n            schoolSatisfaction\\n            socialActivities\\n          }\\n        }\\n      }\\n      pageInfo {\\n        hasNextPage\\n        endCursor\\n      }\\n    }\\n  }\\n}\\n\"`;

export interface ISchoolSearch {
  cursor: string;
  node: {
    avgRatingRounded: number;
    city: string;
    departments: {
      id: string;
      name: string;
    }[];
    id: string;
    legacyId: number;
    name: string;
    numRatings: number;
    state: string;
    summary: {
      campusConditions: number;
      campusLocation: number;
      careerOpportunities: number;
      clubAndEventActivities: number;
      foodQuality: number;
      internetSpeed: number;
      libraryCondition: number;
      schoolReputation: number;
      schoolSafety: number;
      schoolSatisfaction: number;
      socialActivities: number;
    };
  };
}

export interface ITeacherSearch {
  cursor: string;
  node: {
    __typename: string;
    avgDifficulty: number;
    avgRating: number;
    department: string;
    firstName: string;
    id: string;
    isSaved: boolean;
    lastName: string;
    legacyId: number;
    numRatings: number;
    school: {
      id: string;
      name: string;
    };
    wouldTakeAgainPercent: number;
  };
}

export async function searchProfessorsAtSchoolId(
    professorName: string,
    schoolId: string
  ): Promise<ITeacherSearch[] | undefined> {
    try {
      const response = await fetch(API_LINK, {
        credentials: "include",
        headers: HEADERS,
        body: `{"query":${TEACHER_BODY_QUERY},"variables":{"query":{"text":"${professorName}","schoolID":"${schoolId}","fallback":true,"departmentID":null},"schoolID":"${schoolId}","includeSchoolFilter":true}}`,
        method: "POST",
        mode: "cors",
      });
  
      const responseBody = await response.text(); // Get the raw response text
      //console.log('Response Status:', response.status);
      //console.log('Response Body:', responseBody);
  
      if (!response.ok) {
        throw new Error("Network response from RMP not OK");
      }
  
      const data = JSON.parse(responseBody);
  
      // Handle potential errors in the response
      if (!data || !data.data || !data.data.search || !data.data.search.teachers) {
        console.error('Unexpected API response structure:', data);
        return [];
      }
  
      return data.data.search.teachers.edges as ITeacherSearch[];
    } catch (error) {
      console.error('Error in searchProfessorsAtSchoolId:', error);
      return [];
    }
  }  

export async function searchSchool(
  schoolName: string
): Promise<ISchoolSearch[] | undefined> {
  try {
    const response = await fetch("https://www.ratemyprofessors.com/graphql", {
      credentials: "include",
      headers: HEADERS,
      body: `{\"query\":${SCHOOL_BODY_QUERY},\"variables\":{\"query\":{\"text\":\"${schoolName}\"}}}`,
      method: "POST",
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error("Network response from RMP not OK");
    }

    const data = await response.json();
    return data.data.newSearch.schools.edges as ISchoolSearch[];
  } catch (error) {
    console.error(error);
  }
}

export interface IProfessorRating {
  avgRating: number;
  avgDifficulty: number;
  wouldTakeAgainPercent: number;
  numRatings: number;
  formattedName: string;
  department: string;
  link: string;
}

export async function getProfessorRatingAtSchoolId(
  professorName: string,
  schoolId: string,
): Promise<IProfessorRating> {
  const searchResults = await searchProfessorsAtSchoolId(
    professorName,
    schoolId
  );

  if (searchResults === undefined || searchResults.length == 0) {
    return {
      avgRating: -1,
      avgDifficulty: -1,
      wouldTakeAgainPercent: -1,
      numRatings: 0,
      formattedName: professorName,
      department: "",
      link: "",
    };
  }

  const professorResult = searchResults[0];

  return {
    avgRating: professorResult.node.avgRating,
    avgDifficulty: professorResult.node.avgDifficulty,
    wouldTakeAgainPercent: professorResult.node.wouldTakeAgainPercent,
    numRatings: professorResult.node.numRatings,
    formattedName:
      professorResult.node.firstName + " " + professorResult.node.lastName,
    department: professorResult.node.department,
    link:
      "https://www.ratemyprofessors.com/professor/" +
      professorResult.node.legacyId,
  };
}
