// app/api/seat-capacity/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import axios from 'axios';
import { load } from 'cheerio';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get('term');
  const crn = searchParams.get('crn');

  if (!term || !crn) {
    return NextResponse.json({ error: 'Missing term or crn parameter' }, { status: 400 });
  }

  try {
    const url = `https://www.uvic.ca/BAN1P/bwckschd.p_disp_detail_sched?term_in=${term}&crn_in=${crn}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    const htmlContent = response.data;
    const $ = load(htmlContent);

    // Find the 'Registration Availability' table
    const regTable = $('table.datadisplaytable').filter(function (this: HTMLElement) {
      return $(this).find('caption.captiontext').text().includes('Registration Availability');
    }).first();

    if (!regTable.length) {
      return NextResponse.json({ error: 'Registration Availability table not found' }, { status: 404 });
    }

    const data: any = {
      Seats: {},
      Waitlist: {},
    };

    // Parse the rows
    const rows = regTable.find('tr');
    rows.each((index, element) => {
      if (index === 0) return; // Skip header row
      const headerCell = $(element).find('th.ddlabel').text().trim();
      const cells = $(element).find('td.dddefault');
      if (cells.length >= 3) {
        const capacity = cells.eq(0).text().trim();
        const actual = cells.eq(1).text().trim();
        const remaining = cells.eq(2).text().trim();

        if (headerCell === 'Seats') {
          data.Seats = {
            Capacity: capacity,
            Actual: actual,
            Remaining: remaining,
          };
        } else if (headerCell === 'Waitlist Seats') {
          data.Waitlist = {
            Capacity: capacity,
            Actual: actual,
            Remaining: remaining,
          };
        }
      }
    });

    return NextResponse.json({ term, crn, data });
  } catch (error) {
    console.error('Error fetching seat capacity data:', error);
    return NextResponse.json({ error: 'Failed to fetch seat capacity data' }, { status: 500 });
  }
}
