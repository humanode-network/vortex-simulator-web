import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const feedItems = [
  { title: "Mesh telemetry board", detail: "Formation · Milestone 3 delivered", meta: "2h ago" },
  { title: "Adaptive fee shaping", detail: "Chamber vote · Economics & Treasury", meta: "5h ago" },
  { title: "Deterrence sim lab", detail: "Formation · Team slots filled", meta: "8h ago" },
  { title: "Protocol council chat", detail: "New thread opened", meta: "12h ago" },
];

const Feed: React.FC = () => {
  return (
    <div className="app-page flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-(--text)">Feed</h1>
        <p className="text-sm text-muted">Latest activity across proposals, chambers, and Formation.</p>
      </header>
      <Card className="border border-border bg-panel">
        <CardHeader className="pb-2">
          <CardTitle>Recent updates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-(--text)">
          {feedItems.map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-panel-alt px-3 py-2">
              <p className="text-base font-semibold">{item.title}</p>
              <p className="text-sm text-muted">{item.detail}</p>
              <p className="text-xs text-muted">{item.meta}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Feed;
