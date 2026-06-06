import { Surface } from "@/components/Surface";
import { SectionHeader } from "@/components/SectionHeader";
import {
  ThreadCategoryFilter,
  ThreadComposer,
  ThreadDetail,
  ThreadList,
  type DiscussionStatusOption,
} from "@/components/discussions/ThreadPrimitives";
import { formatLoadError } from "@/lib/errorFormatting";
import {
  proposalThreadCategoryLabel,
  proposalThreadCategoryOptions,
  proposalThreadCreateCategoryOptions,
  proposalThreadStatusLabel,
  proposalThreadStatusOptions,
} from "@/lib/proposalDeliberationUi";
import type { ProposalThreadDto } from "@/types/api";
import { useProposalDeliberation } from "./hooks/useProposalDeliberation";

const THREAD_STATUS_OPTIONS: Array<
  DiscussionStatusOption<ProposalThreadDto["status"]>
> = proposalThreadStatusOptions;

type ProposalDeliberationProps = {
  proposalId: string | undefined;
};

export const ProposalDeliberation: React.FC<ProposalDeliberationProps> = ({
  proposalId,
}) => {
  const deliberation = useProposalDeliberation(proposalId);

  if (!proposalId) return null;

  return (
    <Surface
      as="section"
      variant="panel"
      radius="xl"
      shadow="tile"
      className="p-5"
    >
      <header className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader>Deliberation</SectionHeader>
        <div className="flex flex-wrap gap-2 text-xs text-muted">
          <span>{deliberation.threadCount} threads</span>
          <span>{deliberation.replyCount} replies</span>
        </div>
      </header>

      {deliberation.listError ? (
        <Surface
          variant="panelAlt"
          radius="xl"
          shadow="none"
          className="mt-4 px-4 py-3 text-sm text-destructive"
        >
          Deliberation unavailable: {formatLoadError(deliberation.listError)}
        </Surface>
      ) : null}

      <ThreadCategoryFilter
        options={proposalThreadCategoryOptions}
        value={deliberation.filter}
        onChange={deliberation.setFilter}
      />

      <ThreadComposer
        categoryOptions={proposalThreadCreateCategoryOptions}
        categoryValue={deliberation.newCategory}
        onCategoryChange={deliberation.setNewCategory}
        title={deliberation.newTitle}
        onTitleChange={deliberation.setNewTitle}
        body={deliberation.newBody}
        onBodyChange={deliberation.setNewBody}
        onSubmit={deliberation.createThread}
        canCreate={deliberation.canCreate}
        busy={deliberation.busy}
        disabledMessage={deliberation.createDisabledMessage}
      />

      {deliberation.actionError ? (
        <Surface
          variant="panelAlt"
          radius="xl"
          shadow="none"
          className="mt-4 px-4 py-3 text-sm text-destructive"
        >
          {formatLoadError(deliberation.actionError)}
        </Surface>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-3">
          <ThreadList
            threads={deliberation.visibleThreads}
            selectedThreadId={deliberation.selectedThreadId}
            emptyMessage="No deliberation threads yet."
            categoryLabel={proposalThreadCategoryLabel}
            statusLabel={proposalThreadStatusLabel}
            onSelect={deliberation.selectThread}
          />
        </div>

        <div ref={deliberation.detailRef}>
          <ThreadDetail
            detail={deliberation.activeThreadForViewer}
            errorText={
              deliberation.detailError
                ? `Thread unavailable: ${formatLoadError(deliberation.detailError)}`
                : null
            }
            busy={deliberation.busy}
            emptyMessage="Open a thread to read the full discussion."
            categoryLabel={proposalThreadCategoryLabel}
            statusLabel={proposalThreadStatusLabel}
            statusOptions={THREAD_STATUS_OPTIONS}
            replyBody={deliberation.replyBody}
            onReplyBodyChange={deliberation.setReplyBody}
            onReply={deliberation.replyToThread}
            onTransition={deliberation.transitionThread}
            replyPlaceholder={(thread) =>
              thread.status === "locked" ? "Thread is locked" : "Write a reply"
            }
          />
        </div>
      </div>
    </Surface>
  );
};
