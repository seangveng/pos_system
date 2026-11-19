import { FAQItem, HelpCategory, QuickLink } from "../_types/helps";

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Learn the basics and set up your POS system.",
    icon: "Rocket",
    articles: 8,
  },
  {
    id: "orders",
    title: "Orders & Transactions",
    description: "Learn how to create and manage orders.",
    icon: "ShoppingCart",
    articles: 12,
  },
  {
    id: "products",
    title: "Products & Inventory",
    description: "Manage products, categories and stock.",
    icon: "Package",
    articles: 10,
  },
  {
    id: "payments",
    title: "Payments",
    description: "Learn about payments and transactions.",
    icon: "CreditCard",
    articles: 7,
  },
  {
    id: "settings",
    title: "Settings",
    description: "Configure your store and application.",
    icon: "Settings",
    articles: 9,
  },
  {
    id: "account",
    title: "Account & Users",
    description: "Manage users, roles and account access.",
    icon: "Users",
    articles: 6,
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: "faq-1",
    question: "How do I add a new product?",
    answer:
      "Go to Products from the sidebar and select Add Product. Enter the product name, price, category, stock and other information, then save the product.",
    category: "Products & Inventory",
  },
  {
    id: "faq-2",
    question: "How do I create a new order?",
    answer:
      "Open the Orders section, select the products your customer wants, review the cart and complete the checkout process.",
    category: "Orders & Transactions",
  },
  {
    id: "faq-3",
    question: "How can I create a new category?",
    answer:
      "Open Categories from the sidebar and click Add Category. Enter the category information and save it.",
    category: "Products & Inventory",
  },
  {
    id: "faq-4",
    question: "How do I create a promotion?",
    answer:
      "Go to Promos and select Add Promotion. You can create a promotion, configure its discount and activate or deactivate it.",
    category: "Products & Inventory",
  },
  {
    id: "faq-5",
    question: "How do I manage staff users?",
    answer:
      "Open Management from the sidebar. From there you can add users, edit their information, change their roles and activate or deactivate accounts.",
    category: "Account & Users",
  },
  {
    id: "faq-6",
    question: "How do I change my store settings?",
    answer:
      "Open Settings from the sidebar. You can update store information, account settings, notifications and appearance preferences.",
    category: "Settings",
  },
  {
    id: "faq-7",
    question: "Where can I see transactions?",
    answer:
      "Open Transactions from the sidebar to view your transaction history and payment information.",
    category: "Payments",
  },
  {
    id: "faq-8",
    question: "How can I send feedback?",
    answer:
      "Open Feedback from the sidebar to submit or manage customer feedback and reviews.",
    category: "Account & Users",
  },
];

export const QUICK_LINKS: QuickLink[] = [
  {
    id: "quick-1",
    title: "Products",
    description: "Manage your products and inventory.",
    href: "/products",
    icon: "Package",
  },
  {
    id: "quick-2",
    title: "Management",
    description: "Manage users and roles.",
    href: "/management",
    icon: "Users",
  },
  {
    id: "quick-3",
    title: "Settings",
    description: "Configure your store settings.",
    href: "/settings",
    icon: "Settings",
  },
  {
    id: "quick-4",
    title: "Feedback",
    description: "View customer feedback.",
    href: "/feedback",
    icon: "MessageSquare",
  },
];
