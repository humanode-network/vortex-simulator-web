import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { Surface } from "@/components/Surface";
import { PageHint } from "@/components/PageHint";
import { Kicker } from "@/components/Kicker";
import { courtCases } from "@/data/mock/courts";
import { getHumanNode } from "@/data/mock/humanNodes";
import { CourtStatusBadge } from "@/components/CourtStatusBadge";
import { VoteButton } from "@/components/VoteButton";

const Courtroom: React.FC = () => {
  const { id } = useParams();
  const courtCase = id ? courtCases.find((c) => c.id === id) : undefined;
  const caseTitle =
    courtCase?.subject ?? (id ? `Courtroom · ${id}` : "Courtroom");

  const [verdict, setVerdict] = useState<"guilty" | "not_guilty" | null>(null);
  const votingEnabled = courtCase?.status === "live";

  const juryMembers = (courtCase?.juryIds ?? []).map((memberId) => {
    const node = getHumanNode(memberId);
    return {
      id: memberId,
      name: node?.name ?? memberId,
      role: node?.role,
      tier: node?.tier,
    };
  });

  const parties = useMemo(() => {
    return (courtCase?.parties ?? []).map((party) => {
      const node = getHumanNode(party.humanId);
      return {
        ...party,
        name: node?.name ?? party.humanId,
        tier: node?.tier,
      };
    });
  }, [courtCase?.parties]);

  const renderInlineCode = (text: string) =>
    text.split(/`([^`]+)`/g).map((part, idx) => {
      if (idx % 2 === 1) {
        return (
          <code
            key={`${idx}-${part}`}
            className="rounded bg-panel px-1 font-mono text-[0.92em] text-text"
          >
            {part}
          </code>
        );
      }
      return <span key={`${idx}-${part}`}>{part}</span>;
    });

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="courtroom" />
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="mt-1">{caseTitle}</CardTitle>
            </div>
            <div className="flex flex-col items-end gap-2">
              {courtCase?.status ? (
                <CourtStatusBadge status={courtCase.status} />
              ) : null}
              <div className="flex flex-wrap justify-end gap-2 text-xs text-muted">
                <span>Opened {courtCase?.opened ?? "—"}</span>
                <span className="text-muted">·</span>
                <span>{courtCase?.reports ?? "—"} reports</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Verdict</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <VoteButton
              size="lg"
              tone="accent"
              label="Not guilty"
              disabled={!votingEnabled}
              aria-pressed={verdict === "not_guilty"}
              className={
                verdict === "not_guilty"
                  ? "min-w-[260px] bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "min-w-[260px]"
              }
              onClick={() => setVerdict("not_guilty")}
            />
            <VoteButton
              size="lg"
              tone="destructive"
              label="Guilty"
              disabled={!votingEnabled}
              aria-pressed={verdict === "guilty"}
              className={
                verdict === "guilty"
                  ? "min-w-[260px] bg-[var(--destructive)] text-[var(--destructive-foreground)]"
                  : "min-w-[260px]"
              }
              onClick={() => setVerdict("guilty")}
            />
          </div>
          {!votingEnabled ? (
            <p className="text-xs text-muted">
              Voting is available only when the session is live.
            </p>
          ) : verdict ? (
            <p className="text-xs text-muted">
              Selected: {verdict === "guilty" ? "Guilty" : "Not guilty"}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Proceedings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted">
            <Surface
              variant="panelAlt"
              radius="xl"
              shadow="tile"
              className="px-4 py-3"
            >
              <Kicker>Claim</Kicker>
              <p className="mt-1 leading-relaxed text-text">
                {courtCase?.proceedings?.claim
                  ? renderInlineCode(courtCase.proceedings.claim)
                  : "—"}
              </p>
            </Surface>

            <Surface
              variant="panelAlt"
              radius="xl"
              shadow="tile"
              className="px-4 py-3"
            >
              <Kicker>Evidence</Kicker>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-text">
                {(courtCase?.proceedings?.evidence ?? []).length > 0 ? (
                  courtCase?.proceedings?.evidence.map((item) => (
                    <li key={item} className="leading-relaxed">
                      {renderInlineCode(item)}
                    </li>
                  ))
                ) : (
                  <li>—</li>
                )}
              </ul>
            </Surface>

            <Surface
              variant="panelAlt"
              radius="xl"
              shadow="tile"
              className="px-4 py-3"
            >
              <Kicker>Next steps</Kicker>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-text">
                {(courtCase?.proceedings?.nextSteps ?? []).length > 0 ? (
                  courtCase?.proceedings?.nextSteps.map((item) => (
                    <li key={item} className="leading-relaxed">
                      {renderInlineCode(item)}
                    </li>
                  ))
                ) : (
                  <li>—</li>
                )}
              </ol>
            </Surface>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Parties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {parties.length > 0 ? (
                parties.map((party) => {
                  return (
                    <Surface
                      key={`${party.role}-${party.humanId}`}
                      variant="panelAlt"
                      radius="xl"
                      shadow="control"
                      className="px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Kicker>{party.role}</Kicker>
                          <p className="mt-0.5 text-sm font-semibold text-text">
                            {party.name}
                          </p>
                          {party.note ? (
                            <p className="mt-1 text-xs text-muted">
                              {party.note}
                            </p>
                          ) : null}
                        </div>
                        {party.tier ? (
                          <span className="mt-0.5 text-xs text-muted capitalize">
                            {party.tier}
                          </span>
                        ) : null}
                      </div>
                    </Surface>
                  );
                })
              ) : (
                <p className="text-sm text-muted">—</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Jury</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {juryMembers.map((member) => (
                <Surface
                  key={member.id}
                  variant="panelAlt"
                  radius="xl"
                  shadow="control"
                  className="px-3 py-2 text-sm text-text"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{member.name}</span>
                    {member.tier ? (
                      <span className="text-xs text-muted capitalize">
                        {member.tier}
                      </span>
                    ) : null}
                  </div>
                  {member.role ? (
                    <p className="mt-0.5 text-xs text-muted">{member.role}</p>
                  ) : null}
                </Surface>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Courtroom;
