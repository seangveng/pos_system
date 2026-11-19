export type FeedbackRating = 1 | 2 | 3 | 4 | 5;

export type FeedbackStatus = "Unread" | "Read" | "Replied";

export interface FeedbackItem {
  id: string;
  customerName: string;
  email: string;
  rating: FeedbackRating;
  message: string;
  status: FeedbackStatus;
  reply: string;
  createdAt: string;
}
