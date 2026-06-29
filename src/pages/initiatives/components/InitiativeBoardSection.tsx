import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { NoDataYetBar } from "@/components/NoDataYetBar";
import { GlassySection, GlassyStatusChip } from "@/components/GlassySection";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";
import {
  apiInitiativeBoardCardCreate,
  apiInitiativeBoardCardUpdate,
} from "@/lib/apiClient";
import { formatDateTime } from "@/lib/dateTime";
import {
  initiativeBoardStatusLabel,
  initiativeCardsForColumn,
} from "@/lib/initiativeUi";
import { shortAddress } from "@/lib/profileUi";
import type {
  InitiativeBoardCardDto,
  InitiativeBoardColumnDto,
} from "@/types/api";

type InitiativeBoardSectionProps = {
  cards: InitiativeBoardCardDto[];
  canManage: boolean;
  columns: InitiativeBoardColumnDto[];
  initiativeId: string;
  onChanged: () => Promise<void> | void;
};

export function InitiativeBoardSection({
  cards,
  canManage,
  columns,
  initiativeId,
  onChanged,
}: InitiativeBoardSectionProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updatingCardId, setUpdatingCardId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.sortOrder - b.sortOrder),
    [columns],
  );

  async function submitCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiInitiativeBoardCardCreate({
        initiativeId,
        title: trimmedTitle,
        body: body.trim(),
      });
      setTitle("");
      setBody("");
      await onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function moveCard(
    cardId: string,
    status: InitiativeBoardCardDto["status"],
  ) {
    setUpdatingCardId(cardId);
    setError(null);
    try {
      await apiInitiativeBoardCardUpdate({
        initiativeId,
        cardId,
        status,
      });
      await onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUpdatingCardId(null);
    }
  }

  return (
    <GlassySection title="Board">
      {canManage ? (
        <form
          className="mb-4 grid gap-3 lg:grid-cols-[1fr_2fr_auto]"
          onSubmit={submitCard}
        >
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Card title"
            aria-label="Initiative board card title"
          />
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Work note"
            aria-label="Initiative board card note"
            className="min-h-10 lg:min-h-10"
          />
          <Button
            type="submit"
            size="sm"
            disabled={submitting || !title.trim()}
          >
            Add card
          </Button>
          {error ? (
            <p className="text-sm text-destructive lg:col-span-3">{error}</p>
          ) : null}
        </form>
      ) : null}

      {cards.length === 0 ? (
        <NoDataYetBar
          label="board cards"
          description="Admins and stewards can add the first work item."
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-5">
          {sortedColumns.map((column) => {
            const columnCards = initiativeCardsForColumn(cards, column);

            return (
              <div
                key={column.id}
                className="rounded-2xl border border-[color:var(--surface-glass-border)] bg-[color:var(--surface-glass-bg)] p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-text">
                    {column.title}
                  </h3>
                  <span className="text-xs text-muted">
                    {columnCards.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {columnCards.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[color:var(--surface-glass-border)] px-3 py-4 text-center text-xs text-muted">
                      Empty
                    </p>
                  ) : (
                    columnCards.map((card) => (
                      <article
                        key={card.id}
                        className="rounded-xl border border-[color:var(--surface-glass-border)] bg-[color:var(--panel)] p-3 text-sm shadow-[var(--shadow-control)]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-text">
                            {card.title}
                          </h4>
                          <GlassyStatusChip tone="neutral">
                            {initiativeBoardStatusLabel[card.status]}
                          </GlassyStatusChip>
                        </div>
                        {card.body ? (
                          <p className="mt-2 leading-relaxed text-muted">
                            {card.body}
                          </p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted">
                          <span>
                            {card.ownerAddress
                              ? shortAddress(card.ownerAddress)
                              : "Unassigned"}
                          </span>
                          <span>{formatDateTime(card.updatedAt)}</span>
                        </div>
                        {canManage ? (
                          <Select
                            className="mt-3 h-8 text-xs"
                            aria-label={`Move ${card.title}`}
                            value={card.status}
                            disabled={updatingCardId === card.id}
                            onChange={(event) =>
                              void moveCard(
                                card.id,
                                event.target
                                  .value as InitiativeBoardCardDto["status"],
                              )
                            }
                          >
                            {sortedColumns.map((targetColumn) => (
                              <option
                                key={targetColumn.key}
                                value={targetColumn.key}
                              >
                                {targetColumn.title}
                              </option>
                            ))}
                          </Select>
                        ) : null}
                      </article>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassySection>
  );
}
