# Contributions

Every member has to complete at least 2 meaningful tasks per week, where a
single development task should have a granularity of 0.5-1 day. The completed
tasks have to be shown in the weekly TA meetings. You have one "Joker" to miss
one weekly TA meeting and another "Joker" to once skip continuous progress over
the remaining weeks of the course. Please note that you cannot make up for
"missed" continuous progress, but you can "work ahead" by completing twice the
amount of work in one week to skip progress on a subsequent week without using
your "Joker". Please communicate your planning **ahead of time**.

Note: If a team member fails to show continuous progress after using their
Joker, they will individually fail the overall course (unless there is a valid
reason).

**You MUST**:

- Have two meaningful contributions per week.

**You CAN**:

- Have more than one commit per contribution.
- Have more than two contributions per week.
- Link issues to contributions descriptions for better traceability.

**You CANNOT**:

- Link the same commit more than once.
- Use a commit authored by another GitHub user.

---

## Contributions Week 1 - [Begin Date] to [End Date]

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **[@ojg9]**        |30.03.2025| https://github.com/itsmaxjeffrey/sopra-fs25-group-39-client/commit/735028b16aa610a00535349a142082d8fce078b5 | Implemented Map View for Driver on Home Screen | Base for Driver Home Screen |
|                    | 31.03.2025   | https://github.com/itsmaxjeffrey/sopra-fs25-group-39-client/commit/4b5e5190a87ceb378dedacd3d1ad0564dbf7b1e1 | Allow Proposals to be shonw in Driver Home Screen | Essential for Home Screen |
| **[@fksm2003]** | 29.03.2025   | https://github.com/itsmaxjeffrey/sopra-fs25-group-39-client/commit/b628a6b59587d4b7394a0abfeeb0538795336589 | Implemented Driver & Requester Login, with error messages. Implemented user specific Registration Page (incl. file, picture upload, password validation, etc.). Implemented Home/start page. Implemented Naviagtion bar with logic of pages. Implemented logout. |  Basic framework of entire frontend logic. User usage. |
|  **[@fksm2003]** | 30.03.2025   | https://github.com/itsmaxjeffrey/sopra-fs25-group-39-client/commit/0cfa19affa777f45dbcc8225658a22036c1513f6 | fixing bugs for building | Such that the code runs with npm run build. |
| **@xdecentralix** | 30.03.2025  | [Link to Commit 1](https://github.com/itsmaxjeffrey/sopra-fs25-group-39-server/pull/319/commits/957f168961c54da854209bece61b728e7f5a12a6) | Created POST endpoint for creating contracts, ContractDTOMapper, ContractService | Essential for the creation of contracts to have an endpoint as well as the necessary service and DTO |
| **@xdecentralix** | 28.03.2025   | [Link to Commit 2](https://github.com/itsmaxjeffrey/sopra-fs25-group-39-server/pull/309/commits/401b0cedf765a5729583d817760618c2e429027e) | Added the necessary DTO adjustments for the user (driver / requester) registration | DTO adjustments were essential so all the data is correctly stored in the backend (as the previous DTO mappings were still from the template) |
| **@xdecentralix** | 28.03.2025   | [Link to Commit 3](https://github.com/itsmaxjeffrey/sopra-fs25-group-39-server/pull/304/commits/1b6b009e0ada05959ca45fac9c05e13360cd09c8) | Created User registration API endpoint | User Registration is essential for the app. |
| **@xdecentralix** | 31.03.2025   | [Link to Commit 4.1](https://github.com/itsmaxjeffrey/sopra-fs25-group-39-server/pull/304/commits/1b6b009e0ada05959ca45fac9c05e13360cd09c8);  [Link to Commit 4.2](https://github.com/itsmaxjeffrey/sopra-fs25-group-39-server/commit/c214816964dbbb434a84b259eb34e8cb38e69344) | Updated and adjusted API Documentation | As a working document, it is essential that the API documentation is up to date for the frontend development tasks. |
| **@itsmaxjeffrey** | 28.03.2025   | https://github.com/itsmaxjeffrey/sopra-fs25-group-39-server/commit/6e8f60991ac253a806aefb8c236909231af29f6b | user db entity | user entity is needed for databse |
| **@itsmaxjeffrey** | 28.03.2025   | https://github.com/itsmaxjeffrey/sopra-fs25-group-39-server/commit/e2f8953795b186a164ef0fb232c67923ea5b9924 | user rating entity | user rating is needed for databse |
| **@itsmaxjeffrey** | 28.03.2025   | https://github.com/itsmaxjeffrey/sopra-fs25-group-39-server/commit/817fb34f60a10af9661d858f39afdec01148bd2e | driver/requester entity | subclasses of user entity is needed for databse |
| **@itsmaxjeffrey** | 28.03.2025   | https://github.com/itsmaxjeffrey/sopra-fs25-group-39-server/commit/2abf317054acc9e53e8c6637df92a990d298c3f4 | contract entity | contract entity is needed for databse |
| **@itsmaxjeffrey** | 28.03.2025   |  https://github.com/itsmaxjeffrey/sopra-fs25-group-39-server/commit/2d1fb636a9e751b22805641746ca42cdcfe9822a | offer db entity | user entity is needed for databse |
| **@itsmaxjeffrey** | 29.03.2025   | https://github.com/itsmaxjeffrey/sopra-fs25-group-39-server/commit/a82d58e7cc81cda1bbc13e27337a6607885dd0b7 | file storage service to handle file upload | upload user profile or other user files |
| **@itsmaxjeffrey** | 30.03.2025   | https://github.com/itsmaxjeffrey/sopra-fs25-group-39-server/pull/317 | implemented spring security(was later removed because team decided to have stateful auth) |authentication and sec |
| **@itsmaxjeffrey** | 30.03.2025   | https://github.com/itsmaxjeffrey/sopra-fs25-group-39-server/commit/37632cb737956484af19bb6ed0cb87781837c292 | added lambok to remove boilerplate code (getter/setters) | easier code readabilty  |
| **@itsmaxjeffrey** | 01.04.2025   | https://github.com/itsmaxjeffrey/sopra-fs25-group-39-server/commit/271a0614d32b74ac49f6920c13bc8698d075704c | stateful authentication using AuthService and AuthController (approach similar to M1 assignment) | authentication |
| **[@dariohug]** | [28.03.2025]   | [[64f0a54](https://github.com/itsmaxjeffrey/sopra-fs25-group-39-server/commit/f1f34b5ac0c93cc6aa20014e0da0f9c637d783eb)] | [Uniqueness testing of user attributes, fitting testcases, TestUser creation simplification to minimize code repetition.] | [Some User Attributes must be unique to fulfill purbose, e.g. username. ] |
|                    | [29.03.2025]   | [[9186f80](https://github.com/itsmaxjeffrey/sopra-fs25-group-39-server/commit/e72b2b5a27f3e0e8b0aaa3af53456e45014383ed)] | [Added UserToken to User Object and creation logic of token to userService] | [Token is required to manage users permissions.] |

---

## Contributions Week 2 - [Begin Date] to [End Date]

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **[@githubUser1]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser2]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser3]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser4]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |

---

## Contributions Week 3 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 4 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 5 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 6 - [Begin Date] to [End Date]

_Continue with the same table format as above._
