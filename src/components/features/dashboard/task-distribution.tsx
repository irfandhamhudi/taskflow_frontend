// src/features/dashboard/components/TaskDistribution.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../ui/card';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../ui/chart";
import type { DashboardData } from '../../../types/dashboard';

type TaskDistributionProps = {
  taskDistribution: DashboardData['taskDistribution'];
};

const chartConfig = {
  tasks: {
    label: "Tasks",
  },
  todo: {
    label: "To Do",
    color: "var(--color-chart-1)",
  },
  inprogress: {
    label: "In Progress",
    color: "var(--color-chart-2)",
  },
  review: {
    label: "Review",
    color: "var(--color-chart-3)",
  },
  done: {
    label: "Done",
    color: "var(--color-chart-4)",
  },
} satisfies ChartConfig;

export function TaskDistribution({ taskDistribution }: TaskDistributionProps) {
  const totalAllTasks = 
    (taskDistribution.byStatus.todo ?? 0) +
    (taskDistribution.byStatus.inprogress ?? 0) +
    (taskDistribution.byStatus.review ?? 0) +
    (taskDistribution.byStatus.done ?? 0);

  const chartData = [
    { 
      status: "todo", 
      label: "To Do", 
      tasks: taskDistribution.byStatus.todo ?? 0, 
      fill: "var(--color-todo)" 
    },
    { 
      status: "inprogress", 
      label: "In Progress", 
      tasks: taskDistribution.byStatus.inprogress ?? 0, 
      fill: "var(--color-inprogress)" 
    },
    { 
      status: "review", 
      label: "Review", 
      tasks: taskDistribution.byStatus.review ?? 0, 
      fill: "var(--color-review)" 
    },
    { 
      status: "done", 
      label: "Done", 
      tasks: taskDistribution.byStatus.done ?? 0, 
      fill: "var(--color-done)" 
    },
  ];

  const completionRate = totalAllTasks > 0 
    ? Math.round((taskDistribution.byStatus.done / totalAllTasks) * 100)
    : 0;

  return (
    <Card className="flex flex-col h-full shadow-sm border-border/50">
      <CardHeader className="shrink-0 pb-4">
        <CardTitle className="text-lg font-semibold">Task Distribution</CardTitle>
        <CardDescription>Grouped by Task Status</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              right: 0,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
            <XAxis
              dataKey="label"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
              fontSize={12}
            />
            <YAxis hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="tasks" radius={[4, 4, 0, 0]} maxBarSize={60}>
              <LabelList
                dataKey="tasks"
                position="top"
                offset={10}
                className="fill-foreground font-semibold"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm border-t mt-4 pt-4">
        <div className="flex items-center justify-between w-full">
          <span className="text-muted-foreground font-medium">Total Tasks</span>
          <span className="font-bold text-foreground text-base">{totalAllTasks}</span>
        </div>
        <div className="flex items-center justify-between w-full mt-1">
          <span className="text-muted-foreground font-medium">Completion Rate</span>
          <span className="font-bold text-foreground text-base">{completionRate}%</span>
        </div>
      </CardFooter>
    </Card>
  );
}
