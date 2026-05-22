import type {
  ProposalThreadCategoryDto,
  ProposalThreadDetailDto,
  ProposalThreadDto,
  ProposalThreadListDto,
} from "@/types/api";

export type ProposalDiscussionAuthState = {
  authenticated: boolean;
  eligible: boolean;
  enabled: boolean;
};

export const proposalThreadCategoryOptions: Array<{
  value: ProposalThreadCategoryDto | "all";
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "question", label: "Questions" },
  { value: "concern", label: "Concerns" },
  { value: "amendment", label: "Amendments" },
  { value: "support", label: "Support" },
  { value: "execution", label: "Execution" },
  { value: "general", label: "General" },
];

export const proposalThreadCreateCategoryOptions =
  proposalThreadCategoryOptions.filter(
    (item): item is { value: ProposalThreadCategoryDto; label: string } =>
      item.value !== "all",
  );

export const proposalThreadStatusOptions: Array<{
  value: ProposalThreadDto["status"];
  label: string;
}> = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "locked", label: "Locked" },
];

export function proposalThreadCategoryLabel(
  value: ProposalThreadCategoryDto,
): string {
  return (
    proposalThreadCreateCategoryOptions.find((item) => item.value === value)
      ?.label ?? "General"
  );
}

export function proposalThreadStatusLabel(
  value: ProposalThreadDto["status"],
): string {
  if (value === "resolved") return "Resolved";
  if (value === "locked") return "Locked";
  return "Open";
}

export function canAttemptProposalDiscussionWrite(
  auth: ProposalDiscussionAuthState,
): boolean {
  if (!auth.enabled) return true;
  return auth.authenticated && auth.eligible;
}

export function restrictProposalThreadListForReadOnly(
  threadList: ProposalThreadListDto | null,
  writeAllowed: boolean,
): ProposalThreadListDto | null {
  if (!threadList || writeAllowed) return threadList;
  return {
    ...threadList,
    permissions: {
      ...threadList.permissions,
      canCreate: false,
    },
    items: threadList.items.map((thread) => ({
      ...thread,
      permissions: {
        ...thread.permissions,
        canReply: false,
        canTransition: false,
      },
    })),
  };
}

export function restrictProposalThreadDetailForReadOnly(
  activeThread: ProposalThreadDetailDto | null,
  writeAllowed: boolean,
): ProposalThreadDetailDto | null {
  if (!activeThread || writeAllowed) return activeThread;
  return {
    ...activeThread,
    thread: {
      ...activeThread.thread,
      permissions: {
        ...activeThread.thread.permissions,
        canReply: false,
        canTransition: false,
      },
    },
    messages: activeThread.messages,
  };
}

export function filterProposalThreadsByCategory(
  items: ProposalThreadDto[],
  filter: ProposalThreadCategoryDto | "all",
): ProposalThreadDto[] {
  if (filter === "all") return items;
  return items.filter((thread) => thread.category === filter);
}

export function getProposalThreadReplyCount(
  threadList: ProposalThreadListDto | null,
): number {
  return (threadList?.items ?? []).reduce(
    (sum, thread) => sum + thread.replies,
    0,
  );
}
