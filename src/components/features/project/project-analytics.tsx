import { useMemo } from "react";
import { useTheme } from "next-themes";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { type Task } from "../../../types/index";

interface ProjectAnalyticsProps {
  tasks: Task[];
}

export default function ProjectAnalytics({ tasks }: ProjectAnalyticsProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  // Warna tick & grid eksplisit agar SVG tidak default ke hitam di dark mode
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  // 1. Data untuk Status Distribution (Pie Chart)
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {
      todo: 0,
      inprogress: 0,
      review: 0,
      done: 0,
    };
    tasks.forEach((t) => {
      if (counts[t.status] !== undefined) {
        counts[t.status]++;
      }
    });

    return [
      { name: "To Do", value: counts.todo, color: "#3B82F6" }, // Blue
      { name: "In Progress", value: counts.inprogress, color: "#EAB308" }, // Yellow
      { name: "Review", value: counts.review, color: "#A855F7" }, // Purple
      { name: "Done", value: counts.done, color: "#22C55E" }, // Green
    ].filter(item => item.value > 0);
  }, [tasks]);

  // 2. Data untuk Priority distribution (Bar Chart)
  const priorityData = useMemo(() => {
    const counts: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };
    tasks.forEach((t) => {
      if (t.priority && counts[t.priority] !== undefined) {
        counts[t.priority]++;
      }
    });

    return [
      { name: "Low", value: counts.low, color: "#94A3B8" },
      { name: "Medium", value: counts.medium, color: "#EAB308" },
      { name: "High", value: counts.high, color: "#F97316" },
      { name: "Urgent", value: counts.urgent, color: "#EF4444" },
    ];
  }, [tasks]);

  // 3. Data untuk Completion Trend (simulated or based on createdAt)
  // For now, let's group by creation date to show activity
  const trendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      // Gunakan local date (bukan UTC) agar cocok dengan timezone user
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }).reverse();

    return last7Days.map((date) => {
      const created = tasks.filter((t) => {
        if (!t.createdAt) return false;
        // Ambil bagian tanggal dari ISO string (UTC), konversi ke local date string
        const localDate = new Date(t.createdAt);
        const y = localDate.getFullYear();
        const m = String(localDate.getMonth() + 1).padStart(2, '0');
        const d = String(localDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}` === date;
      }).length;

      const completed = tasks.filter((t) => {
        // Gunakan completedAt (field khusus saat status berubah ke "done")
        if (!t.completedAt) return false;
        const localDate = new Date(t.completedAt);
        const y = localDate.getFullYear();
        const m = String(localDate.getMonth() + 1).padStart(2, '0');
        const d = String(localDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}` === date;
      }).length;
      
      return {
        date: new Date(date + 'T00:00:00').toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        Created: created,
        Completed: completed,
      };
    });
  }, [tasks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{completionRate}%</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {new Set(tasks.flatMap(t => t.assignedTo?.map(a => a._id) || [])).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Distribution */}
        <Card className="lg:col-span-1 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', color: tickColor }}
                  itemStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-medium text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base">Weekly Activity (Tasks)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: tickColor }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: tickColor }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', color: tickColor }}
                />
                <Area type="monotone" dataKey="Created" stroke="#3B82F6" fillOpacity={1} fill="url(#colorCreated)" strokeWidth={2} />
                <Area type="monotone" dataKey="Completed" stroke="#22C55E" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Analysis */}
        <Card className="md:col-span-2 lg:col-span-3 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base">Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={60} 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: 500, fill: tickColor }}
                />
                <Tooltip 
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', color: tickColor }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
