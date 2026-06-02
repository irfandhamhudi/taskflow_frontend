import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { IconRenderer } from '../../components/ui/icon-renderer';
import { toast } from 'sonner';
import { LayoutGrid, Sparkles, Rocket, ArrowRight, Building2, User, Palette, Laptop, Book, Home, Star, Briefcase, GraduationCap, Heart, Zap, Globe, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const ICON_OPTIONS = [
  "Building2", "Rocket", "Palette", "Laptop", "Book", 
  "Home", "Star", "Briefcase", "GraduationCap", "Heart", 
  "Zap", "LayoutGrid"
];

const TYPE_OPTIONS = [
  { id: 'personal', label: 'Personal', icon: User, desc: 'Individual projects & tasks' },
  { id: 'team', label: 'Team', icon: Building2, desc: 'Collaborate with your team' },
  { id: 'project', label: 'Project-Based', icon: Rocket, desc: 'Focus on specific initiatives' },
  { id: 'client', label: 'Client / Guest', icon: Globe, desc: 'Share with external partners' },
  { id: 'enterprise', label: 'Enterprise', icon: Shield, desc: 'Organization-wide management' },
];

export default function SetupWorkspace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createWorkspace, setActiveWorkspace } = useWorkspaceStore();
  
  const [name, setName] = useState(user ? `${user.name}'s Workspace` : 'My Workspace');
  const [icon, setIcon] = useState('Building2');
  const [type, setType] = useState('personal');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    setLoading(true);
    try {
      const newWs = await createWorkspace({
        name: name.trim(),
        icon,
        type,
      });
      
      if (newWs) {
        setActiveWorkspace(newWs);
        toast.success("Welcome to TaskFlow! Your workspace is ready.");
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error("Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background flex items-center justify-center p-4">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
            <LayoutGrid className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-center">Set up your Workspace</h1>
          <p className="text-muted-foreground text-center mt-2">
            Every great project starts with a place to call home.
          </p>
        </div>

        <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/80">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Give your workspace a name and choose an icon.</CardDescription>
          </CardHeader>
          <form onSubmit={handleCreate}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Workspace Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Acme Studio" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background/50"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Choose an Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className={`h-10 w-10 flex items-center justify-center rounded-lg border transition-all ${
                        icon === i 
                          ? 'border-primary bg-primary/10 text-primary scale-110 shadow-sm' 
                          : 'border-border bg-background hover:border-primary/50'
                      }`}
                    >
                      <IconRenderer name={i} className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Workspace Type</Label>
                <div className="grid grid-cols-2 gap-4">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setType(opt.id)}
                      className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                        type === opt.id 
                          ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary' 
                          : 'border-border bg-background hover:border-primary/30'
                      }`}
                    >
                      <opt.icon className={`h-5 w-5 mb-2 ${type === opt.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="font-semibold text-sm">{opt.label}</span>
                      <span className="text-[11px] text-muted-foreground line-clamp-1">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-6">
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold gap-2 group bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 shadow-none"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Workspace"}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground mt-6">
          You can always create more workspaces or change these settings later.
        </p>
      </motion.div>
    </div>
  );
}
