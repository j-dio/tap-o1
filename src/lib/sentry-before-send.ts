import type { Event } from "@sentry/react";

// Regex matches these UVEC/Moodle token patterns:
// - icalUrl= (confirmed param name in supabase/functions/uvec-proxy/index.ts)
// - token= (Moodle iCal export param)
// - feed= (alternative Moodle param)
// - key= (generic token param)
const TOKEN_PARAM_REGEX = /([?&])(icalUrl|token|feed|key)=[^&]*/gi;

export function sentryBeforeSend(event: Event): Event | null {
  // SNTY-03: strip user email
  if (event.user) {
    const { email: _email, ...rest } = event.user;
    event = { ...event, user: rest };
  }

  // SNTY-03: redact iCal URL tokens from event.request.url
  if (event.request?.url) {
    event = {
      ...event,
      request: {
        ...event.request,
        url: event.request.url.replace(TOKEN_PARAM_REGEX, "$1$2=REDACTED"),
      },
    };
  }

  // SNTY-03: redact iCal URL tokens from fetch breadcrumb URLs
  // Note: Sentry v10 Event.breadcrumbs is Breadcrumb[] (flat array), not { values: [] }
  if (event.breadcrumbs) {
    event = {
      ...event,
      breadcrumbs: event.breadcrumbs.map((crumb) => {
        if (crumb.data?.url) {
          return {
            ...crumb,
            data: {
              ...crumb.data,
              url: crumb.data.url.replace(TOKEN_PARAM_REGEX, "$1$2=REDACTED"),
            },
          };
        }
        return crumb;
      }),
    };
  }

  return event;
}
