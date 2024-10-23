// utils/fetchUVICSchoolId.ts

const { searchSchool } = require('./rateMyProfessor');

async function fetchUVICSchoolId() {
  try {
    const schools = await searchSchool('University of Victoria');

    if (schools && schools.length > 0) {
      const uvic = schools[0];
      //console.log('UVIC School ID:', uvic.node.id);
    } else {
      console.log('UVIC not found.');
    }
  } catch (error) {
    console.error('Error fetching UVIC School ID:', error);
  }
}

fetchUVICSchoolId();