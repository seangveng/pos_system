import { FeedbackItem } from "../_type/feedback";

export const FEEDBACK_STORAGE_KEY = "pos-feedback";

export const FEEDBACK_UPDATED_EVENT = "pos-feedback-updated";

export const DEFAULT_FEEDBACK: FeedbackItem[] = [
  {
    id: "feedback-1",
    customerName: "Dara Sok",
    email: "dara@example.com",
    rating: 5,
    message: "Very easy to use and the ordering process was fast.",
    status: "Read",
    reply: "",
    createdAt: "2026-09-17T09:30:00",
  },
  {
    id: "feedback-2",
    customerName: "Sreyneang",
    email: "sreyneang@example.com",
    rating: 4,
    message:
      "The products are easy to find. It would be nice to have more filters.",
    status: "Unread",
    reply: "",
    createdAt: "2026-09-17T08:15:00",
  },
  {
    id: "feedback-3",
    customerName: "Vannak",
    email: "vannak@example.com",
    rating: 5,
    message: "Great experience. Everything worked smoothly.",
    status: "Replied",
    reply: "Thank you very much for your feedback!",
    createdAt: "2026-09-16T17:45:00",
  },
  {
    id: "feedback-4",
    customerName: "Sophea",
    email: "sophea@example.com",
    rating: 3,
    message: "The system is good, but I think the checkout could be faster.",
    status: "Unread",
    reply: "",
    createdAt: "2026-09-16T15:20:00",
  },
];

function isBrowser() {
  return typeof window !== "undefined";
}

function dispatchFeedbackUpdated() {
  if (!isBrowser()) return;

  window.dispatchEvent(new Event(FEEDBACK_UPDATED_EVENT));
}

export function getFeedback(): FeedbackItem[] {
  if (!isBrowser()) {
    return DEFAULT_FEEDBACK;
  }

  try {
    const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);

    if (!stored) {
      localStorage.setItem(
        FEEDBACK_STORAGE_KEY,
        JSON.stringify(DEFAULT_FEEDBACK),
      );

      return DEFAULT_FEEDBACK;
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return DEFAULT_FEEDBACK;
    }

    return parsed;
  } catch (error) {
    return DEFAULT_FEEDBACK;
  }
}

export function saveFeedback(feedback: FeedbackItem[]) {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedback));

    dispatchFeedbackUpdated();
  } catch (error) {}
}

export function resetFeedback() {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(
      FEEDBACK_STORAGE_KEY,
      JSON.stringify(DEFAULT_FEEDBACK),
    );

    dispatchFeedbackUpdated();
  } catch (error) {}
}

export function createFeedbackId() {
  return `feedback-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}
