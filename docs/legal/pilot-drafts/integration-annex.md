# Integration and data-handling annex

> Drafting note: legal applicability and operator obligations require counsel and school approval; this document records proposed controls, not certification.[1]

## Google Classroom / Canvas
School admin authorizes the exact tenant and scopes. Display provider, purpose, fields, last sync, error status, token revocation, and disconnect. Import only the minimum roster/course data; do not overwrite authoritative school records without a logged preview/approval. On disconnect, revoke token where possible, stop jobs, delete cached data on the approved schedule, and retain only necessary audit evidence. Code contains integration services/routes, but real tenant operation and scopes were not independently verified.

## Email/reminders
Use only transactional messages authorized by school/user context: invite, verification, reset, approval, reminder, incident/request response. Minimize content, recipient, and metadata. Avoid sensitive student details in subject/previews. Provider, region, retention, and delivery logs require register verification.

## Imports/exports
CSV imports require school authorization, field mapping preview, validation, error report, rollback, least privilege, and secure disposal of source files. Exports require role check, scope confirmation, access log, encrypted delivery or download, expiry, and school-approved destination.

## Uploads/signatures
Accept only approved types/size; validate MIME and content, malware scan if implemented, store under non-guessable identifiers, authorize every read, log access, and delete per schedule. Do not call a drawn/uploaded image a legally valid signature without separate review.

## Billing/procurement
Billing code exists, but pilot enablement is unknown. If enabled, document merchant/provider, payment-data boundary, school purchase authority, invoices, tax/accounting retention, refund process, and child/minor restrictions. GoodHours should not collect card data directly unless explicitly reviewed.

## Sources

[1] https://studentprivacy.ed.gov/ferpa — U.S. Department of Education, FERPA 34 CFR Part 99
