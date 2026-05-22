import { AddressInline } from "@/components/AddressInline";
import { AttachmentList } from "@/components/AttachmentList";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { ProposalStageBar } from "@/components/ProposalStageBar";
import { StatTile } from "@/components/StatTile";
import { Surface } from "@/components/Surface";
import { TierLabel } from "@/components/TierLabel";
import { TitledSurface } from "@/components/TitledSurface";
import type { ProposalDraftDetailDto } from "@/types/api";

type ProposalDraftDetailsCardProps = {
  draft: ProposalDraftDetailDto;
  openSlots: number;
};

export const ProposalDraftDetailsCard: React.FC<
  ProposalDraftDetailsCardProps
> = ({ draft, openSlots }) => {
  return (
    <Card>
      <CardHeader className="space-y-3 pb-3">
        <CardTitle className="text-2xl font-semibold text-text">
          {draft.title}
        </CardTitle>
        <ProposalStageBar current="draft" />
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Chamber"
            value={draft.chamber}
            radius="2xl"
            className="px-4 py-4"
            labelClassName="text-[0.8rem]"
            valueClassName="text-lg"
          />
          <StatTile
            label="Proposer"
            value={
              <AddressInline
                address={draft.proposer}
                className="justify-center"
                textClassName="text-base"
              />
            }
            radius="2xl"
            className="px-4 py-4"
            labelClassName="text-[0.8rem]"
            valueClassName="text-lg"
          />
          <StatTile
            label="Tier"
            value={<TierLabel tier={draft.tier} />}
            radius="2xl"
            className="px-4 py-4"
            labelClassName="text-[0.8rem]"
            valueClassName="text-lg"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Budget ask", value: draft.budget },
            {
              label: "Formation",
              value: draft.formationEligible ? "Yes" : "No",
            },
            {
              label: "Team slots",
              value: `${draft.teamSlots} (open: ${openSlots})`,
            },
            {
              label: "Milestones",
              value: draft.milestonesPlanned,
            },
          ].map((item) => (
            <StatTile key={item.label} label={item.label} value={item.value} />
          ))}
        </div>

        <Surface variant="panelAlt" className="space-y-4 px-4 py-4 text-text">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Summary</p>
            <p className="text-sm leading-relaxed text-muted">
              {draft.summary}
            </p>
          </div>
          <TitledSurface
            variant="panel"
            radius="xl"
            shadow="control"
            title="Proposal overview"
            className="space-y-2 px-3 py-3"
          >
            <p className="text-sm leading-relaxed text-muted">
              {draft.rationale}
            </p>
          </TitledSurface>
          <TitledSurface
            variant="panel"
            radius="xl"
            shadow="control"
            title="Execution plan"
            className="space-y-2 px-3 py-3"
          >
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
              {draft.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </TitledSurface>
          <TitledSurface
            variant="panel"
            radius="xl"
            shadow="control"
            title="Budget &amp; scope"
            className="space-y-2 px-3 py-3"
          >
            <p className="text-sm text-muted">{draft.budgetScope}</p>
          </TitledSurface>
        </Surface>

        <div className="grid gap-3 lg:grid-cols-2">
          <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
            <p className="text-sm font-semibold">Team (locked)</p>
            <ul className="space-y-2 text-sm text-muted">
              {draft.teamLocked.map((member) => (
                <Surface
                  key={member.name}
                  as="li"
                  variant="panel"
                  radius="xl"
                  shadow="control"
                  className="flex items-center justify-between px-3 py-2"
                >
                  <span className="font-semibold text-text">
                    {member.name}
                  </span>
                  <span className="text-xs text-muted">{member.role}</span>
                </Surface>
              ))}
            </ul>
          </Surface>
          <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
            <p className="text-sm font-semibold">Open slots (positions)</p>
            <ul className="space-y-2 text-sm text-muted">
              {draft.openSlotNeeds.map((slot) => (
                <Surface
                  key={slot.title}
                  as="li"
                  variant="panel"
                  radius="xl"
                  shadow="control"
                  className="px-3 py-2"
                >
                  <p className="font-semibold text-text">{slot.title}</p>
                  <p className="text-xs text-muted">{slot.desc}</p>
                </Surface>
              ))}
            </ul>
          </Surface>
        </div>

        <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
          <p className="text-sm font-semibold">Milestones</p>
          <ul className="space-y-2 text-sm text-muted">
            {draft.milestonesDetail.map((milestone) => (
              <Surface
                key={milestone.title}
                as="li"
                variant="panel"
                radius="xl"
                shadow="control"
                className="px-3 py-2"
              >
                <p className="font-semibold text-text">{milestone.title}</p>
                <p className="text-xs text-muted">{milestone.desc}</p>
              </Surface>
            ))}
          </ul>
        </Surface>

        <AttachmentList
          items={draft.attachments.map((file) => ({
            id: file.title,
            title: file.title,
            href: file.href,
          }))}
        />
      </CardContent>
    </Card>
  );
};
