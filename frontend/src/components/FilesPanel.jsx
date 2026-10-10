import { Files, Download } from "lucide-react";
import { useFlowe } from "../context/FloweContext";
export default function FilesPanel() {
  return (
    <section className="panel overview">
      <h2>Project files</h2>
      {["Design brief", "Sprint checklist", "Meeting notes"].map((n, i) => (
        <div className="file-row" key={n}>
          <Files size={22} />
          <div>
            <b>{n}</b>
            <small>October 2026 · Text document</small>
          </div>
          <a
            aria-label={"Download " + n}
            download={n + ".txt"}
            href={
              "data:text/plain;charset=utf-8," +
              encodeURIComponent(
                n +
                  "\n\nFlowe — Website Redesign\n\n" +
                  [
                    "Goal: Design a clear, collaborative task management experience.\nDeliverables: Research, wireframes, UI kit, responsive pages.",
                    "Research user needs\nCreate wireframes\nBuild components\nReview design\nLaunch",
                    "Team sync — October 10\nReview wireframes and assign development tasks.\nNext meeting: October 16.",
                  ][i],
              )
            }
          >
            <Download size={18} />
          </a>
        </div>
      ))}
    </section>
  );
}
