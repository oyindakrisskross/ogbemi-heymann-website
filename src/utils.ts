import type { Exhibition, LocationDetails } from "./types";

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
    .format(new Date(value))
    .toUpperCase();
}

export function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startText = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" })
  })
    .format(start)
    .toUpperCase();
  const endText = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
    .format(end)
    .toUpperCase();
  return `${startText} - ${endText}`;
}

export function locationLine(location: LocationDetails) {
  return [location.galleryName, location.city, location.country].filter(Boolean).join(", ");
}

export function exhibitionStatus(exhibition: Exhibition) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(exhibition.startDate);
  const end = new Date(exhibition.endDate);
  if (start <= today && end >= today) return "Ongoing";
  if (start > today) return "Upcoming";
  return "Past";
}

export function makeInquiryMessage(title: string, dimensions: string) {
  return `I would like to inquire about ${title} ${dimensions}.`;
}
