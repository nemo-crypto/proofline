"use client";

import * as React from "react";

import { CheckIcon, CopyIcon, FileTextIcon } from "lucide-react";
import { toast } from "sonner";

import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/i18n";
import { api } from "@/lib/api";
import { copyText } from "@/lib/utils";

export function ReportTab({ taskId }: { taskId: string }) {
  const [attempt, setAttempt] = React.useState(0);
  return (
    <TaskReport
      key={JSON.stringify([taskId, attempt])}
      taskId={taskId}
      onRetry={() => setAttempt((current) => current + 1)}
    />
  );
}

function TaskReport({ taskId, onRetry }: { taskId: string; onRetry: () => void }) {
  const [report, setReport] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    api
      .report(taskId)
      .then((text) => {
        if (active) setReport(text);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [taskId]);

  async function copy() {
    if (!report) return;
    const ok = await copyText(report);
    if (ok) {
      setCopied(true);
      toast.success(t("Markdown copied"));
      setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error(t("Copy failed; please select the text and copy it manually"));
    }
  }

  let content: React.ReactNode;
  if (loading) {
    content = (
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-16 text-muted-foreground text-sm">
        <FileTextIcon className="size-8 opacity-40" />
        {t("Loading…")}
      </div>
    );
  } else if (failed) {
    content = (
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-16 text-muted-foreground text-sm">
        <p role="alert">{t("Failed to load")}</p>
        <Button size="sm" variant="outline" onClick={onRetry}>
          {t("Retry")}
        </Button>
      </div>
    );
  } else if (report) {
    content = (
      <div className="max-h-[60vh] overflow-auto rounded-md border bg-muted/20 p-4">
        <Markdown text={report} />
      </div>
    );
  } else {
    content = (
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-16 text-muted-foreground text-sm">
        <FileTextIcon className="size-8 opacity-40" />
        {t("No report yet")}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileTextIcon className="size-4" /> {t("Penetration test report (Markdown)")}
        </CardTitle>
        <div className="flex gap-2">
          {report && (
            <Button size="sm" variant="outline" onClick={copy}>
              {copied ? <CheckIcon /> : <CopyIcon />} {t("Copy")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
