"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  ListVideo,
  Lock,
  PlayCircle,
  Wifi,
} from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";

export type PlayerLesson = {
  id: string;
  slug: string;
  title: string;
  durationSec: number;
  isPreview: boolean;
  body: string;
  videoProvider?: string | null;
  videoId?: string | null;
};

export type PlayerModule = {
  id: string;
  title: string;
  lessons: PlayerLesson[];
};

const STORAGE_KEY_PREFIX = "akwa:course-progress:";

function readSavedCourse(courseSlug: string): { completed?: string[]; lastSlug?: string } {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(
      window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${courseSlug}`) ?? "{}",
    ) as { completed?: string[]; lastSlug?: string };
  } catch {
    return {};
  }
}

export function CoursePlayerClient({
  courseSlug,
  courseTitle,
  modules,
  hasFullAccess,
  initialCompletedIds,
  initialLessonSlug,
}: {
  courseSlug: string;
  courseTitle: string;
  modules: PlayerModule[];
  hasFullAccess: boolean;
  initialCompletedIds: string[];
  initialLessonSlug?: string;
}) {
  const allLessons = modules.flatMap((m) => m.lessons);
  const [completed, setCompleted] = useState<string[]>(() => {
    const saved = readSavedCourse(courseSlug);
    return Array.from(new Set([...initialCompletedIds, ...(saved.completed ?? [])]));
  });
  const [currentSlug, setCurrentSlug] = useState<string>(() => {
    const saved = readSavedCourse(courseSlug);
    return initialLessonSlug || saved.lastSlug || allLessons[0]?.slug || "";
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Spec 8.5: "data saver" (360p) default on mobile
  const [quality, setQuality] = useState<"360p" | "720p" | "1080p">(() =>
    typeof window !== "undefined" && window.innerWidth >= 1024 ? "720p" : "360p",
  );

  function selectLesson(slug: string) {
    setCurrentSlug(slug);
    setDrawerOpen(false);
    try {
      const prev = JSON.parse(
        window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${courseSlug}`) ?? "{}",
      );
      window.localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${courseSlug}`,
        JSON.stringify({ ...prev, lastSlug: slug }),
      );
    } catch {
      /* ignore */
    }
  }

  function toggleComplete(lessonId: string) {
    const next = completed.includes(lessonId)
      ? completed.filter((id) => id !== lessonId)
      : [...completed, lessonId];
    setCompleted(next);
    try {
      window.localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${courseSlug}`,
        JSON.stringify({ completed: next, lastSlug: currentSlug }),
      );
    } catch {
      /* ignore */
    }
    fetch("/api/progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        itemId: lessonId,
        kind: "lesson",
        completed: next.includes(lessonId),
      }),
    }).catch(() => {});
  }

  const currentLesson =
    allLessons.find((l) => l.slug === currentSlug) ?? allLessons[0] ?? null;
  const currentIdx = currentLesson
    ? allLessons.findIndex((l) => l.id === currentLesson.id)
    : -1;
  const nextLesson =
    currentIdx >= 0 && currentIdx + 1 < allLessons.length
      ? allLessons[currentIdx + 1]
      : null;

  const canWatchCurrent = Boolean(
    currentLesson && (hasFullAccess || currentLesson.isPreview),
  );

  const progressPct =
    allLessons.length > 0
      ? Math.round((completed.filter((id) => allLessons.some((l) => l.id === id)).length / allLessons.length) * 100)
      : 0;

  const lessonList = (
    <div className="space-y-4">
      {modules.map((mod) => (
        <div key={mod.id}>
          <p className="text-muted mb-1.5 text-xs font-bold tracking-wider uppercase">
            {mod.title}
          </p>
          <ul className="space-y-1">
            {mod.lessons.map((l) => {
              const isCurrent = l.slug === currentLesson?.slug;
              const isDone = completed.includes(l.id);
              const unlocked = hasFullAccess || l.isPreview;
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => selectLesson(l.slug)}
                    className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm ${
                      isCurrent
                        ? "bg-tint text-link font-bold"
                        : "hover:bg-surface-2 text-fg"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isDone ? (
                        <CheckCircle2 className="text-link size-4 shrink-0" aria-hidden />
                      ) : unlocked ? (
                        <PlayCircle className="text-muted size-4 shrink-0" aria-hidden />
                      ) : (
                        <Lock className="text-muted size-4 shrink-0" aria-hidden />
                      )}
                      <span className="line-clamp-1">{l.title}</span>
                    </span>
                    {l.isPreview && !hasFullAccess && (
                      <Badge tone="green">Preview</Badge>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top progress bar + mobile drawer button */}
      <div className="card flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="border-line bg-surface hover:border-primary inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-semibold lg:hidden"
          >
            <ListVideo className="size-4" aria-hidden />
            <span>Lessons ({allLessons.length})</span>
          </button>
          <div>
            <p className="font-bold">{courseTitle}</p>
            <p className="text-muted text-xs">
              Progress: {progressPct}% ({completed.length} of {allLessons.length} lessons completed)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {progressPct === 100 && (
            <a
              href={`/api/certificates/${courseSlug}`}
              className="bg-primary text-primary-fg hover:bg-primary-hover inline-flex min-h-11 items-center gap-1.5 rounded-md px-4 text-sm font-semibold no-underline"
            >
              <Award className="size-4" aria-hidden />
              <span>Download Certificate (PDF)</span>
            </a>
          )}
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-12">
        {/* Desktop lesson sidebar */}
        <aside
          aria-label="Course lessons"
          className="card hidden p-5 lg:col-span-4 lg:block"
        >
          {lessonList}
        </aside>

        {/* Video + lesson notes */}
        <div className="space-y-6 lg:col-span-8">
          {currentLesson ? (
            <>
              <div className="overflow-hidden rounded-lg border border-line bg-green-900 text-white">
                {canWatchCurrent ? (
                  <div className="flex aspect-video flex-col justify-between p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 font-semibold">
                        <Wifi className="size-3.5 text-gold-500" aria-hidden />
                        Stream quality: {quality}{" "}
                        {quality === "360p" ? "(Mobile Data Saver)" : ""}
                      </span>
                      <div role="group" aria-label="Video quality" className="flex gap-1">
                        {(["360p", "720p", "1080p"] as const).map((q) => (
                          <button
                            key={q}
                            type="button"
                            aria-pressed={quality === q}
                            onClick={() => setQuality(q)}
                            className={`min-h-8 rounded px-2 text-xs font-semibold ${
                              quality === q
                                ? "bg-gold-500 text-ink-900"
                                : "bg-black/30 text-white/80 hover:text-white"
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="my-auto text-center">
                      <PlayCircle className="mx-auto mb-3 size-12 text-gold-500" aria-hidden />
                      <h2 className="font-serif text-xl font-bold text-white md:text-2xl">
                        {currentLesson.title}
                      </h2>
                      <p className="mt-1 text-xs text-white/80">
                        Adaptive video player placeholder ({quality}) — owner will attach Mux / Bunny
                        Stream video ID in /admin.
                      </p>
                    </div>

                    <div className="text-xs text-white/75">
                      Captions: English • Transcript &amp; notes below
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center gap-3 p-6 text-center">
                    <Lock className="size-10 text-gold-500" aria-hidden />
                    <h2 className="font-serif text-xl font-bold text-white">
                      Enrol in {courseTitle} to unlock this lesson
                    </h2>
                    <p className="max-w-md text-sm text-white/80">
                      Preview lessons are free to watch. Purchase the full course with M-Pesa or
                      card for lifetime access to all modules and your completion certificate.
                    </p>
                    <LinkButton href={`/courses/${courseSlug}`} size="sm">
                      View course &amp; enrol
                    </LinkButton>
                  </div>
                )}
              </div>

              {/* Controls: Mark as complete + Next lesson */}
              <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <Button
                  variant={completed.includes(currentLesson.id) ? "secondary" : "primary"}
                  size="sm"
                  onClick={() => toggleComplete(currentLesson.id)}
                  icon={<Check className="size-4" aria-hidden />}
                >
                  {completed.includes(currentLesson.id)
                    ? "Completed"
                    : "Mark lesson as complete"}
                </Button>

                {nextLesson && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectLesson(nextLesson.slug)}
                    iconRight={<ChevronRight className="size-4" aria-hidden />}
                  >
                    Next: {nextLesson.title}
                  </Button>
                )}
              </div>

              {/* Lesson notes & transcript */}
              <div className="card space-y-3 p-6">
                <h3 className="text-lg font-bold">Lesson notes &amp; transcript</h3>
                <p className="text-muted text-sm">{currentLesson.body}</p>
                <p className="text-muted text-xs">
                  Need the companion PDF checklist?{" "}
                  <Link href="/free" className="link">
                    Download from Free Resources
                  </Link>
                  .
                </p>
              </div>
            </>
          ) : (
            <p className="text-muted">No lessons configured yet.</p>
          )}
        </div>
      </div>

      <Modal
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Course curriculum"
        variant="drawer-left"
      >
        {lessonList}
      </Modal>
    </div>
  );
}
