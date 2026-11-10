# Burp Suite Community assessment guide

This is a manual testing guide, not a claim that Burp testing was completed.

## IDOR and roles

1. Start the localhost lab, open Burp's dedicated browser and sign in as `michael.chen@university.example` using the instructor-guide password.
2. Capture GET `/api/staff/7`, send it to Repeater and verify Michael's original response.
3. Duplicate the request and change only the path to `/api/staff/8`; keep the same authenticated cookie.
4. Record whether Emily's fictional record is returned. Save both request/response pairs with cookies redacted.
5. Repeat against the secure local app with a secure session: the other record should return 404. Verify a head can read department staff but cannot read another department's record.

Compare role-specific mutations too: staff cannot add accounts, change roles, approve leave or submit another user's leave. Heads cannot approve their own leave or another department's requests.

## Session expiry

Record login time and Set-Cookie attributes. The lab records a 30-minute expiry but fails to enforce it and keeps a longer cookie. For an actual elapsed-time test, wait beyond 30 minutes and replay GET `/api/auth/me` in Repeater. Record the actual interval and response.

If an instructor instead moves only a test session's timestamps into the past, label it an expiry-boundary simulation. It does not show a real 30-minute wait. The secure app must return 401 for expired/idle sessions and for cookies invalidated by logout, password change or deactivation.

## Read-only SQL demonstration

With a fictional authenticated lab cookie, compare GET `/api/staff?q=NoSuchPersonZZ` with the URL-encoded value `NoSuchPersonZZ' OR TRUE--`. The dummy lab search changes from zero rows to fictional staff rows. Do not use destructive, filesystem, external-network or resource-exhaustion payloads.

Repeat the same literal search against the secure app, which should return zero matches. Save actual status, body and row counts. Repeater is the evidence source; a prepared guide or Node replay is not a Burp result.

Reference: [PortSwigger Repeater](https://portswigger.net/burp/documentation/desktop/tools/repeater).
