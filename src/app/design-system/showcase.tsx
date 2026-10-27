"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Avatar,
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CheckIcon,
  Chip,
  Dialog,
  EmptyState,
  IconButton,
  Input,
  SearchIcon,
  Select,
  Sheet,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tooltip,
  useToast,
  XIcon,
  type BadgeVariant,
  type ButtonVariant,
  type SheetSide,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";

const surfaces = [
  { label: "surface-0", className: "bg-surface-0" },
  { label: "surface-1", className: "bg-surface-1" },
  { label: "surface-2", className: "bg-surface-2" },
  { label: "surface-3", className: "bg-surface-3" },
];

const accentScale = [
  { label: "50", className: "bg-accent-50" },
  { label: "100", className: "bg-accent-100" },
  { label: "200", className: "bg-accent-200" },
  { label: "300", className: "bg-accent-300" },
  { label: "400", className: "bg-accent-400" },
  { label: "500", className: "bg-accent-500" },
  { label: "600", className: "bg-accent-600" },
  { label: "700", className: "bg-accent-700" },
  { label: "800", className: "bg-accent-800" },
  { label: "900", className: "bg-accent-900" },
  { label: "950", className: "bg-accent-950" },
];

const inkScale = [
  { label: "50", className: "bg-ink-50" },
  { label: "100", className: "bg-ink-100" },
  { label: "200", className: "bg-ink-200" },
  { label: "300", className: "bg-ink-300" },
  { label: "400", className: "bg-ink-400" },
  { label: "500", className: "bg-ink-500" },
  { label: "600", className: "bg-ink-600" },
  { label: "700", className: "bg-ink-700" },
  { label: "800", className: "bg-ink-800" },
  { label: "900", className: "bg-ink-900" },
  { label: "950", className: "bg-ink-950" },
];

const semantic = [
  { label: "success", className: "bg-success" },
  { label: "warning", className: "bg-warning" },
  { label: "danger", className: "bg-danger" },
  { label: "info", className: "bg-info" },
  { label: "success-soft", className: "bg-success-soft" },
  { label: "warning-soft", className: "bg-warning-soft" },
  { label: "danger-soft", className: "bg-danger-soft" },
  { label: "info-soft", className: "bg-info-soft" },
];

const elevations = [
  { label: "elev-sm", className: "elev-sm" },
  { label: "elev-md", className: "elev-md" },
  { label: "elev-lg", className: "elev-lg" },
  { label: "elev-glow", className: "elev-glow" },
];

const badgeVariants: BadgeVariant[] = ["neutral", "accent", "success", "warning", "danger", "info"];
const buttonVariantList: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];
const sheetSides: SheetSide[] = ["responsive", "bottom", "right", "left"];

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-fg">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm text-fg-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Swatches({ items }: { items: { label: string; className: string }[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1.5">
          <div className={cn("h-14 rounded-xl border border-line", item.className)} />
          <span className="text-xs text-fg-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-3", className)}>{children}</div>;
}

function Sections() {
  const { toast } = useToast();
  const [dialog, setDialog] = useState<"basic" | "confirm" | null>(null);
  const [sheet, setSheet] = useState<SheetSide | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("overview");
  const [filters, setFilters] = useState({ hiring: true, remote: false, startups: false });
  const [removable, setRemovable] = useState(["Bengaluru", "AI / ML", "Series B"]);
  const loadingTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(loadingTimer.current), []);

  function simulateLoad() {
    setLoading(true);
    loadingTimer.current = window.setTimeout(() => setLoading(false), 1600);
  }

  return (
    <div className="flex flex-col gap-12">
      <Section title="Colour tokens" description="Surfaces step up in elevation; text, border, accent and semantic colours all switch with the theme.">
        <Swatches items={surfaces} />
        <div className="flex flex-wrap gap-6 rounded-2xl border border-line bg-surface-1 p-5">
          <span className="text-2xl font-semibold text-fg">Primary</span>
          <span className="text-2xl font-semibold text-fg-muted">Secondary</span>
          <span className="text-2xl font-semibold text-fg-subtle">Tertiary</span>
          <span className="text-2xl font-semibold text-accent-text">Accent</span>
        </div>
        <Swatches items={accentScale} />
        <Swatches items={inkScale} />
        <Swatches items={semantic} />
      </Section>

      <Section title="Typography" description="Outfit for display, DM Sans for interface text. Headings balance, paragraphs avoid orphans.">
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface-1 p-6">
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-fg">
            Find the companies shaping what comes next
          </h1>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-fg">Section heading</h2>
          <p className="max-w-[65ch] text-base text-fg-muted">
            Body copy stays under sixty-five characters per line, uses the secondary text colour, and keeps a relaxed line
            height so long descriptions remain easy to scan on any screen size.
          </p>
          <p className="text-sm tabular-nums text-fg-subtle">12,480 companies · 3,204 hiring · Updated 2 min ago</p>
        </div>
      </Section>

      <Section title="Elevation, radius and motion" description="Hover the tiles to compare easings. Cards below use hairline rings in light mode and inner highlights in dark.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {elevations.map((item) => (
            <div key={item.label} className={cn("grid h-24 place-items-center rounded-2xl bg-surface-2 text-sm text-fg-muted", item.className)}>
              {item.label}
            </div>
          ))}
        </div>
        <Row>
          {[
            { label: "8", className: "rounded-lg" },
            { label: "12", className: "rounded-xl" },
            { label: "16", className: "rounded-2xl" },
            { label: "24", className: "rounded-3xl" },
            { label: "full", className: "rounded-full" },
          ].map((item) => (
            <div key={item.label} className={cn("grid size-16 place-items-center bg-accent-soft text-sm text-accent-text", item.className)}>
              {item.label}
            </div>
          ))}
        </Row>
        <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface-1 p-4">
          {[
            { label: "standard", className: "ease-standard" },
            { label: "emphasized", className: "ease-emphasized" },
            { label: "spring", className: "ease-spring" },
          ].map((item) => (
            <div key={item.label} className="group flex items-center gap-4">
              <span className="w-24 text-xs text-fg-muted">{item.label}</span>
              <div className="relative h-6 flex-1" style={{ containerType: "inline-size" }}>
                <span
                  className={cn(
                    "absolute left-0 top-0 size-6 rounded-full bg-accent transition-transform duration-500 group-hover:translate-x-[calc(100cqw-1.5rem)]",
                    item.className,
                  )}
                />
              </div>
            </div>
          ))}
          <p className="text-xs text-fg-subtle">Hover a row to run its curve.</p>
        </div>
      </Section>

      <Section title="Buttons" description="Hover, press and Tab to see states. Minimum 44px touch target on coarse pointers.">
        <div className="flex flex-col gap-4">
          {buttonVariantList.map((variant) => (
            <Row key={variant}>
              <span className="w-20 text-xs capitalize text-fg-muted">{variant}</span>
              <Button variant={variant} size="sm">Small</Button>
              <Button variant={variant}>Medium</Button>
              <Button variant={variant} size="lg">Large</Button>
              <Button variant={variant} leadingIcon={<CheckIcon className="size-4" />}>With icon</Button>
              <Button variant={variant} disabled>Disabled</Button>
              <Button variant={variant} loading>Loading</Button>
            </Row>
          ))}
          <Row>
            <span className="w-20 text-xs text-fg-muted">Interactive</span>
            <Button loading={loading} onClick={simulateLoad}>{loading ? "Saving" : "Click to save"}</Button>
            <a href="#buttons" className={buttonVariants({ variant: "secondary" })}>Link styled as button</a>
            <Button fullWidth className="sm:max-w-xs">Full width</Button>
          </Row>
          <Row>
            <span className="w-20 text-xs text-fg-muted">Icon only</span>
            <IconButton label="Search" variant="primary"><SearchIcon /></IconButton>
            <IconButton label="Search" variant="secondary"><SearchIcon /></IconButton>
            <IconButton label="Search"><SearchIcon /></IconButton>
            <IconButton label="Remove" variant="danger"><XIcon /></IconButton>
            <IconButton label="Search" size="sm"><SearchIcon /></IconButton>
            <IconButton label="Search" size="lg"><SearchIcon /></IconButton>
            <IconButton label="Loading" loading><SearchIcon /></IconButton>
          </Row>
        </div>
      </Section>

      <Section title="Inputs" description="Native controls with visible labels, hints and errors wired to aria-describedby.">
        <div className="grid gap-5 md:grid-cols-2">
          <Input label="Company name" placeholder="Acme Robotics" hint="Shown on the public listing." />
          <Input label="Search" placeholder="Search companies" leading={<SearchIcon />} />
          <Input label="Website" defaultValue="acme" error="Enter a full URL, such as https://acme.com." />
          <Input label="Disabled" defaultValue="Locked value" disabled />
          <Input
            label="With trailing control"
            placeholder="Type to clear"
            trailing={<IconButton label="Clear" size="sm"><XIcon /></IconButton>}
          />
          <Input label="Required" placeholder="Work email" type="email" required />
          <Select label="Hub" defaultValue="blr">
            <option value="blr">Bengaluru</option>
            <option value="sf">San Francisco Bay Area</option>
            <option value="ldn">London</option>
          </Select>
          <Select label="Stage" error="Choose a funding stage." defaultValue="">
            <option value="" disabled>Select a stage</option>
            <option value="seed">Seed</option>
            <option value="a">Series A</option>
          </Select>
        </div>
      </Section>

      <Section title="Badges and chips">
        <Row>
          {badgeVariants.map((variant) => (
            <Badge key={variant} variant={variant} dot>{variant}</Badge>
          ))}
          <Badge variant="accent" size="sm">Small</Badge>
          <Badge variant="success" icon={<CheckIcon className="size-3.5" />}>Verified</Badge>
        </Row>
        <Row>
          <Chip selected={filters.hiring} count={3204} onClick={() => setFilters((f) => ({ ...f, hiring: !f.hiring }))}>Hiring</Chip>
          <Chip selected={filters.remote} onClick={() => setFilters((f) => ({ ...f, remote: !f.remote }))}>Remote friendly</Chip>
          <Chip selected={filters.startups} onClick={() => setFilters((f) => ({ ...f, startups: !f.startups }))}>Startups</Chip>
          <Chip disabled>Disabled</Chip>
        </Row>
        <Row>
          {removable.map((label) => (
            <Chip key={label} selected onRemove={() => setRemovable((list) => list.filter((item) => item !== label))}>
              {label}
            </Chip>
          ))}
          {removable.length === 0 && (
            <Button size="sm" variant="ghost" onClick={() => setRemovable(["Bengaluru", "AI / ML", "Series B"])}>
              Reset chips
            </Button>
          )}
        </Row>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Default</CardTitle>
              <CardDescription>Resting surface with a hairline and soft shadow.</CardDescription>
            </CardHeader>
          </Card>
          <Card variant="raised">
            <CardHeader>
              <CardTitle>Raised</CardTitle>
              <CardDescription>For menus and floating panels.</CardDescription>
            </CardHeader>
          </Card>
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Glass</CardTitle>
              <CardDescription>Use only where content scrolls beneath.</CardDescription>
            </CardHeader>
          </Card>
          <Card interactive tabIndex={0} className="focus-ring">
            <CardHeader>
              <CardTitle>Interactive</CardTitle>
              <CardDescription>Lifts 2px; the shadow fades in on a pseudo-element.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Badge variant="accent" dot>Hiring</Badge>
            </CardFooter>
          </Card>
        </div>
        <Card variant="outline" className="max-w-md">
          <CardHeader>
            <CardTitle>Loading state</CardTitle>
          </CardHeader>
          <CardContent className="flex items-start gap-4">
            <SkeletonCircle size={48} />
            <SkeletonText lines={3} className="flex-1" />
          </CardContent>
        </Card>
      </Section>

      <Section title="Skeleton and spinner">
        <Row className="items-start">
          <div className="flex w-64 flex-col gap-3">
            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Spinner className="text-2xl text-accent-text" />
          <Spinner className="text-4xl text-fg-muted" />
        </Row>
      </Section>

      <Section title="Tabs" description="Arrow keys, Home and End move between tabs. The indicator slides to the active tab.">
        <div className="flex flex-col gap-8">
          <Tabs value={tab} onValueChange={setTab}>
            <TabList aria-label="Company sections">
              <Tab value="overview">Overview</Tab>
              <Tab value="jobs">Jobs <Badge size="sm" variant="accent">24</Badge></Tab>
              <Tab value="location">Location</Tab>
              <Tab value="reviews" disabled>Reviews</Tab>
            </TabList>
            <TabPanel value="overview" className="pt-4 text-sm text-fg-muted">Overview content renders here.</TabPanel>
            <TabPanel value="jobs" className="pt-4 text-sm text-fg-muted">24 open roles across 3 offices.</TabPanel>
            <TabPanel value="location" className="pt-4 text-sm text-fg-muted">Map and nearby places.</TabPanel>
            <TabPanel value="reviews" className="pt-4 text-sm text-fg-muted">Disabled tab.</TabPanel>
          </Tabs>
          <Tabs variant="pill" defaultValue="list">
            <TabList aria-label="View mode">
              <Tab value="list">List</Tab>
              <Tab value="map">Map</Tab>
              <Tab value="split">Split</Tab>
            </TabList>
            <TabPanel value="list" className="pt-4 text-sm text-fg-muted">List view.</TabPanel>
            <TabPanel value="map" className="pt-4 text-sm text-fg-muted">Map view.</TabPanel>
            <TabPanel value="split" className="pt-4 text-sm text-fg-muted">Split view.</TabPanel>
          </Tabs>
        </div>
      </Section>

      <Section title="Tooltip" description="Shows on hover after a short delay and immediately on keyboard focus. Escape dismisses.">
        <Row>
          {(["top", "bottom", "left", "right"] as const).map((side) => (
            <Tooltip key={side} content={`Tooltip on ${side}`} side={side}>
              <Button variant="secondary" size="sm">{side}</Button>
            </Tooltip>
          ))}
        </Row>
      </Section>

      <Section title="Dialog and sheet" description="Native dialogs: focus is trapped, ESC and backdrop close, focus returns to the trigger. Sheets drag down to dismiss on narrow screens.">
        <Row>
          <Button variant="secondary" onClick={() => setDialog("basic")}>Open dialog</Button>
          <Button variant="danger" onClick={() => setDialog("confirm")}>Confirm dialog</Button>
          {sheetSides.map((side) => (
            <Button key={side} variant="secondary" onClick={() => setSheet(side)}>Sheet: {side}</Button>
          ))}
        </Row>

        <Dialog
          open={dialog === "basic"}
          onOpenChange={(open) => !open && setDialog(null)}
          title="Edit company"
          description="Changes appear on the public listing after review."
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialog(null)}>Cancel</Button>
              <Button onClick={() => { setDialog(null); toast({ title: "Company saved", variant: "success" }); }}>Save changes</Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Input label="Name" defaultValue="Acme Robotics" />
            <Select label="Hub" defaultValue="blr">
              <option value="blr">Bengaluru</option>
              <option value="sf">San Francisco Bay Area</option>
            </Select>
          </div>
        </Dialog>

        <Dialog
          open={dialog === "confirm"}
          onOpenChange={(open) => !open && setDialog(null)}
          title="Delete this listing?"
          description="This cannot be undone. ESC and backdrop clicks are disabled until you choose."
          size="sm"
          dismissible={false}
          showClose={false}
          footer={
            <>
              <Button variant="secondary" data-autofocus onClick={() => setDialog(null)}>Keep listing</Button>
              <Button variant="danger" onClick={() => { setDialog(null); toast({ title: "Listing deleted", variant: "error" }); }}>Delete</Button>
            </>
          }
        />

        {sheetSides.map((side) => (
          <Sheet
            key={side}
            side={side}
            open={sheet === side}
            onOpenChange={(open) => !open && setSheet(null)}
            title="Company details"
            description={`Sheet side: ${side}`}
            footer={<Button onClick={() => setSheet(null)}>Done</Button>}
          >
            <div className="flex flex-col gap-3">
              {Array.from({ length: 12 }, (_, index) => (
                <p key={index} className="text-sm text-fg-muted">
                  Scrollable content row {index + 1}. The header stays pinned while the body scrolls.
                </p>
              ))}
            </div>
          </Sheet>
        ))}
      </Section>

      <Section title="Toast" description="Pauses on hover and focus, stacks up to four, and renders above open dialogs.">
        <Row>
          <Button variant="secondary" onClick={() => toast({ title: "Saved to your list" })}>Default</Button>
          <Button variant="secondary" onClick={() => toast({ title: "Profile updated", description: "Your changes are live.", variant: "success" })}>Success</Button>
          <Button variant="secondary" onClick={() => toast({ title: "Sync failed", description: "Check your connection and retry.", variant: "error" })}>Error</Button>
          <Button variant="secondary" onClick={() => toast({ title: "Approaching limit", variant: "warning" })}>Warning</Button>
          <Button variant="secondary" onClick={() => toast({ title: "New roles added", variant: "info", action: { label: "View", onClick: () => {} } })}>With action</Button>
        </Row>
      </Section>

      <Section title="Empty state">
        <Card variant="outline" padding="none">
          <EmptyState
            icon={<SearchIcon />}
            title="No companies match these filters"
            description="Try widening the location or removing a filter to see more results."
            action={
              <>
                <Button>Clear filters</Button>
                <Button variant="ghost">Suggest a company</Button>
              </>
            }
          />
        </Card>
      </Section>

      <Section title="Avatar">
        <Row>
          <Avatar name="Asha Rao" size="xs" />
          <Avatar name="Asha Rao" size="sm" />
          <Avatar name="Dev Patel" size="md" status="online" />
          <Avatar name="Maria Gonzalez" size="lg" status="away" />
          <Avatar name="Li Wei" size="xl" status="busy" />
          <Avatar name="Broken Image" src="https://invalid.example/missing.png" size="md" status="offline" />
          <Avatar size="md" />
        </Row>
      </Section>
    </div>
  );
}

type View = "current" | "split";

export function DesignSystemShowcase() {
  const [view, setView] = useState<View>("current");

  return (
    <div className="min-h-screen bg-surface-0 text-fg">
      <header className="glass top-0 z-[var(--z-sticky)] border-x-0 border-t-0 sm:sticky">
        <div className="mx-auto flex max-w-[110rem] flex-wrap items-center gap-4 px-4 py-3 sm:px-8">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-semibold tracking-tight">LocaToGo design system</h1>
            <p className="text-xs text-fg-subtle">Development only. This route returns 404 in production.</p>
          </div>
          <Tabs variant="pill" value={view} onValueChange={(next) => setView(next as View)}>
            <TabList aria-label="Preview mode">
              <Tab value="current">Site theme</Tab>
              <Tab value="split">Light + dark</Tab>
            </TabList>
          </Tabs>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-[110rem] px-4 py-10 sm:px-8">
        {view === "current" ? (
          <Sections />
        ) : (
          <div className="grid gap-6 2xl:grid-cols-2">
            <div className="light rounded-3xl border border-line bg-surface-0 p-5 text-fg sm:p-8">
              <p className="mb-8 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Light</p>
              <Sections />
            </div>
            <div className="dark rounded-3xl border border-line bg-surface-0 p-5 text-fg sm:p-8">
              <p className="mb-8 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Dark</p>
              <Sections />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
