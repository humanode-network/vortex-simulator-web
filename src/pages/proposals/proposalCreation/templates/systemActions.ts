export type SystemActionId =
  | "chamber.create"
  | "chamber.rename"
  | "chamber.dissolve"
  | "chamber.censure"
  | "governor.censure";

export const SYSTEM_ACTIONS: Record<
  SystemActionId,
  {
    label: string;
    description: string;
    requiresChamberId: boolean;
    requiresTargetAddress: boolean;
    requiresTitle: boolean;
    showMultiplier: boolean;
    showGenesisMembers: boolean;
  }
> = {
  "chamber.create": {
    label: "Create chamber",
    description: "Establish a new specialization chamber with genesis members.",
    requiresChamberId: true,
    requiresTargetAddress: false,
    requiresTitle: true,
    showMultiplier: true,
    showGenesisMembers: true,
  },
  "chamber.dissolve": {
    label: "Dissolve chamber",
    description: "Remove an existing chamber via General-chamber approval.",
    requiresChamberId: true,
    requiresTargetAddress: false,
    requiresTitle: false,
    showMultiplier: false,
    showGenesisMembers: false,
  },
  "chamber.rename": {
    label: "Rename chamber",
    description: "Rename an active chamber via General-chamber approval.",
    requiresChamberId: true,
    requiresTargetAddress: false,
    requiresTitle: true,
    showMultiplier: false,
    showGenesisMembers: false,
  },
  "chamber.censure": {
    label: "Censure chamber",
    description:
      "Apply chamber censure via General-chamber approval; target chamber members are excluded from this vote.",
    requiresChamberId: true,
    requiresTargetAddress: false,
    requiresTitle: false,
    showMultiplier: false,
    showGenesisMembers: false,
  },
  "governor.censure": {
    label: "Censure governor",
    description:
      "Apply governor censure via General-chamber approval; this temporarily blocks target governor actions.",
    requiresChamberId: false,
    requiresTargetAddress: true,
    requiresTitle: false,
    showMultiplier: false,
    showGenesisMembers: false,
  },
};

export function getSystemActionMeta(action: SystemActionId | undefined) {
  if (action && action in SYSTEM_ACTIONS) return SYSTEM_ACTIONS[action];
  return SYSTEM_ACTIONS["chamber.create"];
}
