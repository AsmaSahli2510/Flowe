import { useEffect, useState } from "react";

export default function SharedCard({ reference, workspaceId, call }) {
  const [title, setTitle] = useState("Loading shared card…"),
    [allowed, setAllowed] = useState(false);
  useEffect(() => {
    let live = true;
    call("cardPreview", { project: reference.project, cardId: reference.id })
      .then((r) => {
        if (live) {
          setTitle(r.card.title);
          setAllowed(true);
        }
      })
      .catch(() => {
        if (live) {
          setTitle("Card unavailable");
          setAllowed(false);
        }
      });
    return () => {
      live = false;
    };
  }, [reference.project, reference.id]);
  return (
    <button
      className="lg-shared-card"
      disabled={!allowed}
      onClick={async () => {
        try {
          await call("cardPreview", {
            project: reference.project,
            cardId: reference.id,
          });
          window.location.assign(
            `/workspace/${workspaceId}/project/${reference.project}?card=${reference.id}`,
          );
        } catch {
          setAllowed(false);
          setTitle("Card unavailable");
        }
      }}
    >
      <small>PROJECT CARD</small>
      <strong>{title}</strong>
      {allowed && <span>Open card ↗</span>}
    </button>
  );
}
