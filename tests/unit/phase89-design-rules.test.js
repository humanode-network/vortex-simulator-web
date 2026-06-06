import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { test } from "@rstest/core";

const root = process.cwd();
const srcRoot = join(root, "src");
const textExtensions = new Set([".css", ".tsx", ".ts", ".js", ".jsx"]);

function sourceFiles(dir = srcRoot) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...sourceFiles(path));
      continue;
    }
    if (textExtensions.has(extname(path))) files.push(path);
  }
  return files;
}

function collectMatches(regex) {
  const matches = [];
  for (const path of sourceFiles()) {
    const text = readFileSync(path, "utf8");
    for (const match of text.matchAll(regex)) {
      const before = text.slice(0, match.index);
      const line = before.split("\n").length;
      matches.push(`${relative(root, path)}:${line}: ${match[0]}`);
    }
  }
  return matches;
}

test("Phase 89 does not render the repeated Humanode equation motif", () => {
  assert.deepEqual(collectMatches(/\b1 Human\b|\b1 Node\b|\b1 Vote\b/g), []);
  assert.deepEqual(collectMatches(/humanode-equation|landing__equation/g), []);
});

test("Phase 89 rejected panel abstractions stay removed", () => {
  const removedFiles = [
    "src/components/OperationalHeader.tsx",
    "src/components/DisabledModule.tsx",
    "src/components/primitives/textarea.tsx",
    "src/pages/proposals/list/ProposalListCard.css",
    "src/pages/proposals/shared/ProposalActionPanel.tsx",
    "src/pages/proposals/shared/ProposalMetricPanel.tsx",
  ];

  assert.deepEqual(
    removedFiles.filter((path) => existsSync(join(root, path))),
    [],
  );
  assert.deepEqual(
    collectMatches(
      /OperationalHeader|DisabledModule|ProposalActionPanel|ProposalMetricPanel/g,
    ),
    [],
  );
});

test("Phase 89 app shell avoids global decorative chrome", () => {
  const shell = readFileSync(join(srcRoot, "app/AppShell.css"), "utf8");
  const shellTsx = readFileSync(join(srcRoot, "app/AppShell.tsx"), "utf8");
  const sidebar = readFileSync(join(srcRoot, "app/AppSidebar.tsx"), "utf8");
  const sidebarCss = readFileSync(join(srcRoot, "app/AppSidebar.css"), "utf8");
  const atmosphere = readFileSync(
    join(srcRoot, "app/MainAtmosphere.tsx"),
    "utf8",
  );
  const atmosphereCss = readFileSync(
    join(srcRoot, "app/MainAtmosphere.css"),
    "utf8",
  );
  const app = readFileSync(join(srcRoot, "app/App.tsx"), "utf8");
  const global = readFileSync(join(srcRoot, "styles/global.css"), "utf8");

  assert.doesNotMatch(shell, /workspace::before|humanode-equation/);
  assert.match(shellTsx, /<MainAtmosphere \/>/);
  assert.match(atmosphere, /main-atmosphere__sky/);
  assert.match(atmosphere, /main-atmosphere__light/);
  assert.match(atmosphere, /main-atmosphere__night/);
  assert.match(atmosphere, /main-atmosphere__fire/);
  assert.match(atmosphere, /<svg[\s\S]*main-atmosphere__cloud/);
  assert.match(atmosphere, /main-atmosphere__cloud-wash/);
  assert.match(atmosphere, /main-atmosphere__cloud-fill/);
  assert.match(atmosphere, /main-atmosphere__cloud-line--curl/);
  assert.match(atmosphereCss, /atmosphere-cloud-pass/);
  assert.match(atmosphereCss, /atmosphere-petal-flow/);
  assert.match(atmosphere, /main-atmosphere__galaxy/);
  assert.match(atmosphere, /main-atmosphere__galaxy[\s\S]*<b \/>/);
  assert.match(atmosphere, /main-atmosphere__galaxy[\s\S]*<i \/>/);
  assert.match(atmosphereCss, /atmosphere-galaxy-breathe/);
  assert.doesNotMatch(atmosphere, /constellation/);
  assert.doesNotMatch(atmosphereCss, /constellation/);
  assert.match(atmosphereCss, /atmosphere-smoke-rise/);
  assert.match(atmosphereCss, /atmosphere-cinder-rise/);
  assert.match(atmosphereCss, /atmosphere-campfire-glow/);
  assert.doesNotMatch(atmosphere, /phoenix/i);
  assert.doesNotMatch(atmosphereCss, /phoenix/i);
  assert.match(atmosphereCss, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(sidebarCss, /main-atmosphere/);
  assert.match(shell, /position:\s*sticky/);
  assert.match(shell, /height:\s*100vh/);
  assert.doesNotMatch(sidebar, /sidebar__logo/);
  assert.doesNotMatch(sidebar, /useLocation/);
  assert.doesNotMatch(sidebarCss, /sidebar__link--active::before/);
  assert.doesNotMatch(sidebarCss, /@keyframes sidebar-link/);
  assert.match(sidebarCss, /overflow-y:\s*auto/);
  assert.doesNotMatch(app, /scrollTo/);
  assert.match(global, /scrollbar-gutter:\s*stable/);
});

test("Phase 89 stage chips use semantic theme colors", () => {
  const stageChip = readFileSync(
    join(srcRoot, "components/StageChip.tsx"),
    "utf8",
  );
  const stageChipCss = readFileSync(
    join(srcRoot, "components/StageChip.css"),
    "utf8",
  );
  const chipKinds = [
    "proposal-pool",
    "chamber-vote",
    "citizen-veto",
    "chamber-veto",
    "formation",
    "passed",
    "failed",
    "thread",
    "courts",
    "faction",
    "system",
  ];

  assert.doesNotMatch(stageChip, /bg-panel-alt|text-muted|text-primary/);
  for (const kind of chipKinds) {
    assert.match(stageChipCss, new RegExp(`stage-chip--${kind}`));
    assert.match(
      stageChipCss,
      new RegExp(`data-theme="light"[\\s\\S]*stage-chip--${kind}`),
    );
    assert.match(
      stageChipCss,
      new RegExp(`data-theme="night"[\\s\\S]*stage-chip--${kind}`),
    );
    assert.match(
      stageChipCss,
      new RegExp(`data-theme="fire"[\\s\\S]*stage-chip--${kind}`),
    );
  }
});

test("Phase 89 sidebar brush palettes are distinct per theme", () => {
  const sidebarCss = readFileSync(join(srcRoot, "app/AppSidebar.css"), "utf8");
  const themes = ["sky", "light", "night", "fire"];
  const brushColors = themes.map((theme) => {
    const block = sidebarCss.match(
      new RegExp(
        `:root\\[data-theme="${theme}"\\] \\.sidebar \\{([\\s\\S]*?)\\}`,
      ),
    );
    assert.ok(block, `missing ${theme} sidebar brush block`);
    const ink = block[1].match(/--sidebar-ink-a:\s*([^;]+);/);
    assert.ok(ink, `missing ${theme} sidebar ink token`);
    return ink[1];
  });

  assert.equal(new Set(brushColors).size, themes.length);
});

test("Phase 89 My Governance modules avoid redundant outer card shells", () => {
  const myGovernanceComponents = join(
    srcRoot,
    "pages/my-governance/components",
  );
  for (const file of readdirSync(myGovernanceComponents)) {
    if (!file.endsWith(".tsx")) continue;
    const text = readFileSync(join(myGovernanceComponents, file), "utf8");
    assert.doesNotMatch(text, /CardHeader|CardContent|CardTitle/);
    assert.doesNotMatch(text, /from "@\/components\/Surface"|<Surface\b/);
    assert.doesNotMatch(
      text,
      /from "@\/components\/SectionHeader"|<SectionHeader\b/,
    );
    assert.doesNotMatch(text, /variant="panelAlt"/);
    assert.doesNotMatch(
      text,
      /Badge|bg-primary|bg-muted|bg-panel|bg-panel-alt/,
    );
    assert.doesNotMatch(
      text,
      /font-bold|font-semibold|font-extrabold|text-xl|text-2xl|text-lg/,
    );
  }
});

test("Phase 89 Formation keeps card grid while using shared glass grammar", () => {
  const formation = readFileSync(
    join(srcRoot, "pages/formation/Formation.tsx"),
    "utf8",
  );
  const card = readFileSync(
    join(srcRoot, "pages/formation/components/FormationProjectCard.tsx"),
    "utf8",
  );

  assert.match(formation, /formation-project-grid/);
  assert.match(card, /<Surface[\s\S]*as="article"/);
  assert.match(card, /<Chip className="formation-project-card__stage"/);
  assert.match(card, /stageLabel/);
  assert.match(card, /chamberLabel/);
  assert.match(card, /project\.chamberTitle/);
  assert.match(card, /formation-project-card__fact/);
  assert.match(card, /formationProjectCardFromProfileProject/);
  assert.doesNotMatch(card, /StageChip/);
  assert.doesNotMatch(card, /GlassyCard/);
  assert.doesNotMatch(card, /GlassyRecordCard/);
  assert.doesNotMatch(card, /CardHeader|CardContent/);
  assert.doesNotMatch(
    card,
    /categoryLabel|formation-project-card__category|formation-project-card__focus|formation-project-card__statusDot/,
  );
});
