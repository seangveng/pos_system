"use client";

import { useMemo, useState } from "react";

import { FAQ_ITEMS } from "../_action/helps";

import { HelpsHeader } from "./helps-header";
import { HelpsSearch } from "./helps-search";
import { FAQList } from "./faq-list";
import { QuickLinks } from "./quick-links";
import { ContactSupport } from "./contact-support";
import { HelpCategory } from "../_types/helps";
import { HelpsCategories } from "./helps-categories";

export default function Helps() {
  const [search, setSearch] = useState("");

  const filteredFAQs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return FAQ_ITEMS;
    }

    return FAQ_ITEMS.filter((item) => {
      return (
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    });
  }, [search]);

  const handleCategoryClick = (category: HelpCategory) => {
    setSearch(category.title);
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <HelpsHeader />

      <HelpsSearch search={search} onSearchChange={setSearch} />

      <HelpsCategories onCategoryClick={handleCategoryClick} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <FAQList items={filteredFAQs} />

        <div className="space-y-5">
          <QuickLinks />

          <ContactSupport />
        </div>
      </div>
    </div>
  );
}
