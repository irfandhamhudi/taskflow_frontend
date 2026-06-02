import { CreateProjectSheet } from "../../../components/projects/create-project-sheet";

export function ProjectHeader() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            All Projects
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Manage, track, and organize all your active projects in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CreateProjectSheet />
        </div>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-border/50 via-border to-transparent" />
    </div>
  );
}
