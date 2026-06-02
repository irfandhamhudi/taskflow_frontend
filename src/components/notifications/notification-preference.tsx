import { Skeleton } from '../../components/ui/skeleton';
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import {  Save } from "lucide-react";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";

export const NotificationPreferences = () => {
    const { user } = useAuth();
    const { updatePreferences } = useNotifications();
    const [isLoading, setIsLoading] = useState(false);
    
    // Initial state from user settings or defaults
    const [preferences, setPreferences] = useState({
        task: user?.settings?.notificationTypes?.task ?? true,
        comment: user?.settings?.notificationTypes?.comment ?? true,
        project: user?.settings?.notificationTypes?.project ?? true,
        system: user?.settings?.notificationTypes?.system ?? true,
        emailNotifications: user?.settings?.emailNotifications ?? true,
        desktopNotifications: user?.settings?.desktopNotifications ?? true,
    });

    const handleToggle = (key: string) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key as keyof typeof preferences]
        }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const { emailNotifications, desktopNotifications, ...notificationTypes } = preferences;
            await updatePreferences({ 
                notificationTypes, 
                emailNotifications, 
                desktopNotifications 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h4 className="font-bold text-sm">Notification Preferences</h4>
                    <p className="text-[10px] text-muted-foreground">Manage what you want to be notified about.</p>
                </div>
            </div>

            <div className="space-y-4 py-2">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="pref-email" className="text-sm font-bold text-primary">Email Notifications</Label>
                        <p className="text-[10px] text-muted-foreground">Receive updates via your email address</p>
                    </div>
                    <Switch 
                        id="pref-email"
                        checked={preferences.emailNotifications}
                        onCheckedChange={() => handleToggle("emailNotifications")}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="pref-desktop" className="text-sm font-bold text-primary">Desktop Notifications</Label>
                        <p className="text-[10px] text-muted-foreground">Show alerts on your computer screen</p>
                    </div>
                    <Switch 
                        id="pref-desktop"
                        checked={preferences.desktopNotifications}
                        onCheckedChange={() => handleToggle("desktopNotifications")}
                    />
                </div>
            </div>

            <Separator />

            <div className="space-y-4 pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Notification Types</p>
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="pref-task" className="text-sm font-medium">Task Updates</Label>
                        <p className="text-[10px] text-muted-foreground">Assignments, status changes, and due dates</p>
                    </div>
                    <Switch 
                        id="pref-task"
                        checked={preferences.task}
                        onCheckedChange={() => handleToggle("task")}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="pref-comment" className="text-sm font-medium">Comments & Mentions</Label>
                        <p className="text-[10px] text-muted-foreground">When someone comments on your tasks</p>
                    </div>
                    <Switch 
                        id="pref-comment"
                        checked={preferences.comment}
                        onCheckedChange={() => handleToggle("comment")}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="pref-project" className="text-sm font-medium">Project Activity</Label>
                        <p className="text-[10px] text-muted-foreground">New members, project updates</p>
                    </div>
                    <Switch 
                        id="pref-project"
                        checked={preferences.project}
                        onCheckedChange={() => handleToggle("project")}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="pref-system" className="text-sm font-medium">System Alerts</Label>
                        <p className="text-[10px] text-muted-foreground">File uploads, security alerts</p>
                    </div>
                    <Switch 
                        id="pref-system"
                        checked={preferences.system}
                        onCheckedChange={() => handleToggle("system")}
                    />
                </div>
            </div>

            <Button 
                className="w-full mt-4 h-8 text-xs font-bold bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 shadow-none" 
                onClick={handleSave} 
                disabled={isLoading}
            >
                {isLoading ? <Skeleton className="h-4 w-4 rounded-full mr-2" /> : <Save className="mr-2 h-3 w-3" />}
                {isLoading ? "Saving..." : "Save Preferences"}
            </Button>
        </div>
    );
};
