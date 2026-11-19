"use client";

import { useEffect, useMemo, useState } from "react";

import {
  createFeedbackId,
  FEEDBACK_STORAGE_KEY,
  FEEDBACK_UPDATED_EVENT,
  getFeedback,
  saveFeedback,
} from "../_action/feedback";

import { FeedbackHeader } from "./feedback-header";
import { FeedbackStats } from "./feedback-stats";
import { FeedbackToolbar } from "./feedback-toolbar";
import { FeedbackList } from "./feedback-list";
import { FeedbackDialog } from "./feedback-dialog";
import { DeleteFeedbackDialog } from "./delete-feedback-dialog";
import { FeedbackItem } from "../_types/feedback";

export default function Feedback() {
  const [feedback, setFeedback] = useState<FeedbackItem[] | null>(null);

  const [search, setSearch] = useState("");

  const [ratingFilter, setRatingFilter] = useState("all");

  const [statusFilter, setStatusFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(
    null,
  );

  useEffect(() => {
    setFeedback(getFeedback());
  }, []);

  useEffect(() => {
    const handleFeedbackUpdate = () => {
      setFeedback(getFeedback());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === FEEDBACK_STORAGE_KEY) {
        setFeedback(getFeedback());
      }
    };

    window.addEventListener(FEEDBACK_UPDATED_EVENT, handleFeedbackUpdate);

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(FEEDBACK_UPDATED_EVENT, handleFeedbackUpdate);

      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const filteredFeedback = useMemo(() => {
    if (!feedback) return [];

    const query = search.trim().toLowerCase();

    return feedback.filter((item) => {
      const matchesSearch =
        !query ||
        item.customerName.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.message.toLowerCase().includes(query);

      const matchesRating =
        ratingFilter === "all" || item.rating === Number(ratingFilter);

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesRating && matchesStatus;
    });
  }, [feedback, search, ratingFilter, statusFilter]);

  if (!feedback) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-gray-500">Loading feedback...</p>
      </div>
    );
  }

  const total = feedback.length;

  const averageRating =
    total === 0
      ? 0
      : feedback.reduce((sum, item) => sum + item.rating, 0) / total;

  const positive = feedback.filter((item) => item.rating >= 4).length;

  const pending = feedback.filter((item) => item.status === "Unread").length;

  const handleAddFeedback = () => {
    setSelectedFeedback(null);
    setDialogOpen(true);
  };

  const handleEditFeedback = (item: FeedbackItem) => {
    setSelectedFeedback(item);
    setDialogOpen(true);
  };

  const handleDeleteFeedback = (item: FeedbackItem) => {
    setSelectedFeedback(item);
    setDeleteDialogOpen(true);
  };

  const handleSaveFeedback = (item: FeedbackItem) => {
    let updatedFeedback: FeedbackItem[];

    if (selectedFeedback) {
      updatedFeedback = feedback.map((current) =>
        current.id === item.id ? item : current,
      );
    } else {
      updatedFeedback = [
        {
          ...item,
          id: createFeedbackId(),
          createdAt: item.createdAt || new Date().toISOString(),
        },
        ...feedback,
      ];
    }

    setFeedback(updatedFeedback);
    saveFeedback(updatedFeedback);

    setDialogOpen(false);
    setSelectedFeedback(null);
  };

  const handleConfirmDelete = () => {
    if (!selectedFeedback) return;

    const updatedFeedback = feedback.filter(
      (item) => item.id !== selectedFeedback.id,
    );

    setFeedback(updatedFeedback);
    saveFeedback(updatedFeedback);

    setDeleteDialogOpen(false);
    setSelectedFeedback(null);
  };

  const handleToggleStatus = (item: FeedbackItem) => {
    const nextStatus =
      item.status === "Unread"
        ? "Read"
        : item.status === "Read"
          ? "Replied"
          : "Unread";

    const updatedFeedback = feedback.map((current) =>
      current.id === item.id
        ? {
            ...current,
            status: nextStatus,
          }
        : current,
    );

    setFeedback(updatedFeedback);
    saveFeedback(updatedFeedback);
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <FeedbackHeader />

      <FeedbackStats
        total={total}
        averageRating={averageRating}
        positive={positive}
        pending={pending}
      />

      <FeedbackToolbar
        search={search}
        rating={ratingFilter}
        status={statusFilter}
        onSearchChange={setSearch}
        onRatingChange={setRatingFilter}
        onStatusChange={setStatusFilter}
        onAddFeedback={handleAddFeedback}
      />

      <FeedbackList
        feedback={filteredFeedback}
        onEdit={handleEditFeedback}
        onDelete={handleDeleteFeedback}
        onToggleStatus={handleToggleStatus}
      />

      <FeedbackDialog
        open={dialogOpen}
        feedback={selectedFeedback}
        onOpenChange={(open) => {
          setDialogOpen(open);

          if (!open) {
            setSelectedFeedback(null);
          }
        }}
        onSave={handleSaveFeedback}
      />

      <DeleteFeedbackDialog
        open={deleteDialogOpen}
        feedback={selectedFeedback}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);

          if (!open) {
            setSelectedFeedback(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
