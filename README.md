# UVic CourseMap

UVic CourseMap is a tool designed to help students at the University of Victoria (UVic) plan their course schedules with ease. This project provides an interactive and user-friendly course map to visualize program requirements and course offerings. It’s built for UVic students who want a streamlined way to manage their academic journey.

**Note:** This project is not affiliated with the University of Victoria (UVic) in any way. It is a personal project to assist other UVic students.

## Live Website
Check out the live version of the project [here](https://uvic-coursemap.vercel.app).

## Inspiration Credits

- [CourseUp by VikeLabs](https://courseup.vikelabs.ca/) — A scheduling tool for UVic students to help plan courses.
- [RMP API Wrapper by snow4060](https://github.com/snow4060/rmp-api) - Wrapper for Rate My Prof API that was used.

## API Reference

CourseMap reads directly from UVic's **Banner 9 Student Registration Self-Service (SSB)** JSON API
(`https://banner.uvic.ca/StudentRegistrationSsb/ssb`). No separate scraper is required — the app's API
routes talk to Banner 9 and to a MongoDB cache.

- `GET /api/terms` — list of available terms.
- `GET /api/courses?term=<code>` — all sections for a term (served from MongoDB, with a live Banner 9 fallback).
- `GET /api/seat-capacity?term=<code>&crn=<crn>` — live seat + waitlist counts for a section.
- `GET /api/course-details/[courseId]` — calendar description / prerequisites for a course.
- `GET /api/ratings/[professorName]` — RateMyProfessors data for an instructor.

### Storage: MongoDB

Course data is cached in **MongoDB**, in the `Course-Data` database's `sections` collection. To populate
the cache for a term, run the Banner 9 sync script:

```bash
npm run sync -- --term 202609
```

The sync script requires a **`MONGODB_URI`** environment variable in `.env.local`. It connects, ensures the
required indexes, fetches the full Banner catalog (enriching instructors), and upserts each section keyed on
`{ term, crn }`. The script fails fast with a clear message if `MONGODB_URI` is missing.

Without MongoDB configured, the site still works: `/api/courses` and `/api/course-details` transparently fall
back to **live Banner 9 data**. In that mode instructor names are unavailable (rendered as TBA), since the
live Banner search results do not include faculty.

### Seat Capacity Data

Seat availability is **fixed** and live again. It is fetched per-CRN from the Banner 9 SSB endpoint
(`/searchResults/getEnrollmentInfo`), which returns current enrolment and waitlist numbers without
authentication — no more scraping `BAN1P` HTML.

## Appendix

This project was created with the aim of making it easier for UVic students to select and organize their courses. Users can effortlessly input their desired courses, visualize prerequisites, and ensure their academic progress aligns with program requirements. At the time of development, CourseUp by VikeLabs was the only viable alternative to UVic's internal registration system. However, as it had not been updated recently, CourseMap was designed to serve as a faster, more responsive alternative while actively addressing the needs of students.

## Authors

- [@tanujdargan](https://github.com/tanujdargan)

## FAQ

#### Is UVic CourseMap officially supported by UVic?

No, this is an independent project and not officially affiliated with the University of Victoria.

#### Can I contribute to the project?

Yes! Contributions are always welcome. Check out the "Contributing" section for more information.

## Contributing

Contributions are encouraged and appreciated! If you would like to contribute, follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes and commit them (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a pull request for review.

Please ensure that your code adheres to the existing code style and passes all linting and formatting checks before submitting a pull request.
You may face issues with fetching data for the pages since you need an API key. Feel free to reach out to me to get access to one!
(Checkout my profile for ways to contact me)

## Run Locally

Clone the project

```bash
git clone https://github.com/tanujdargan/uvic-coursemap.git
```

Go to the project directory

```bash
cd uvic-coursemap
```

Install dependencies

```bash
npm install
```

Start the development server

```bash
npm run dev
```
