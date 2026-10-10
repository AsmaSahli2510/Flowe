import { Sun } from "lucide-react";
import { useFlowe } from "../context/FloweContext";
export default function Welcome() {
  const { page, workspace } = useFlowe();
  return (
    <div className="welcome">
      <div>
        <h1>
          {page === "Home"
            ? "Good morning, Asma !"
            : page === "Projects"
              ? workspace
              : page}{" "}
          {page === "Home" && <Sun className="sun" size={31} />}
        </h1>
        <p>
          {page === "Home"
            ? "Here's what's happening with your projects today."
            : workspace + " · A little teamwork, a lot of progress."}
        </p>
      </div>
      <span className="mobile-logo">✿</span>
    </div>
  );
}
