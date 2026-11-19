export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  articles: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface QuickLink {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
}
