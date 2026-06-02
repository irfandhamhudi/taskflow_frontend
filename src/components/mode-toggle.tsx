import { Moon, Sun, Palette, Check, MonitorCog } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../components/ui/dropdown-menu";
import { useThemeStore, type AccentColor } from "../store/useThemeStore";
import { cn } from "../lib/utils";

const accents: { name: AccentColor; color: string }[] = [
  { name: "zinc", color: "bg-slate-500" },
  { name: "blue", color: "bg-blue-500" },
  { name: "rose", color: "bg-rose-500" },
  { name: "orange", color: "bg-orange-500" },
  { name: "green", color: "bg-emerald-500" },
  { name: "violet", color: "bg-violet-500" },
];

export function ModeToggle() {
  const { setTheme, theme } = useTheme();
  const { accent, setAccent } = useThemeStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-none shadow-none bg-transparent hover:bg-accent/50 group relative ">
          <Palette className="h-[1.2rem] w-[1.2rem] transition-all group-hover:scale-110" />
          {accent !== "zinc" && (
            <span 
              className={cn(
                "absolute top-1 right-1 h-2 w-2 rounded-full border border-background",
                accents.find(a => a.name === accent)?.color
              )} 
            />
          )}
          <span className="sr-only">Customize theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-3">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Mode
        </DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Button
            variant={theme === "light" ? "secondary" : "outline"}
            size="sm"
            className={cn(
              "h-8 text-xs",
              theme === "light" && "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
            )}
            onClick={() => setTheme("light")}
          >
            <Sun className="mr-1 h-3 w-3" />
            Light
          </Button>
          <Button
            variant={theme === "dark" ? "secondary" : "outline"}
            size="sm"
            className={cn(
              "h-8 text-xs",
              theme === "dark" && "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
            )}
            onClick={() => setTheme("dark")}
          >
            <Moon className="mr-1 h-3 w-3" />
            Dark
          </Button>
          <Button
            variant={theme === "system" ? "secondary" : "outline"}
            size="sm"
            className={cn(
              "h-8 text-xs",
              theme === "system" && "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
            )}
            onClick={() => setTheme("system")}
          >
            <MonitorCog className="mr-1 h-3 w-3" />
            System
          </Button>
        </div>

        <DropdownMenuSeparator className="-mx-3" />

        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground my-2">
          Accent Color
        </DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-2">
          {accents.map((item) => (
            <button
              key={item.name}
              onClick={() => setAccent(item.name)}
              className={cn(
                "group relative flex h-8 items-center justify-center rounded-md border-2 bg-background transition-all hover:border-primary/50",
                accent === item.name ? "border-primary" : "border-transparent"
              )}
              title={item.name}
            >
              <div className={cn("h-4 w-4 rounded-full", item.color)} />
              {accent === item.name && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-[inherit]">
                  <Check className="h-3 w-3 text-primary" />
                </div>
              )}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
