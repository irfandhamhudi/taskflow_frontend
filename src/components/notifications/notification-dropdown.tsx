import { Bell, CheckCheck, RefreshCw, Sparkles, Settings2, Trash2, CheckSquare, X } from "lucide-react";
import { isToday, isYesterday } from "date-fns";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Checkbox } from "../ui/checkbox";
import { useNotifications } from "../../context/NotificationContext";
import { NotificationItem } from "./notification-item";
import { Separator } from "../ui/separator";
import { NotificationPreferences } from "./notification-preference";

const GroupHeader = ({ title, count }: { title: string; count: number }) => (
  count > 0 ? (
    <div className="sticky top-0 z-10 px-4 py-2 bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center justify-between">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">{title}</span>
      <span className="text-[10px] font-bold text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">{count}</span>
    </div>
  ) : null
);

export const NotificationDropdown = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    // markAllAsRead, 
    markNotificationsAsRead,
    deleteNotification, 
    deleteNotifications, 
    deleteAllNotifications, 
    isLoading 
  } = useNotifications();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Grouping logic
  const groupedNotifications = {
    today: notifications.filter(n => isToday(new Date(n.createdAt))),
    yesterday: notifications.filter(n => isYesterday(new Date(n.createdAt))),
    earlier: notifications.filter(n => !isToday(new Date(n.createdAt)) && !isYesterday(new Date(n.createdAt)))
  };

  const hasNotifications = notifications.length > 0;
  const isAllSelected = hasNotifications && selectedIds.length === notifications.length;

  const handleToggleSelect = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(notifications.map(n => n._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleMarkSelectedAsRead = async () => {
    if (selectedIds.length === 0) return;
    await markNotificationsAsRead(selectedIds);
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    await deleteNotifications(selectedIds);
    setSelectedIds([]);
    setIsSelectionMode(false); 
  };

  const handleDeleteAll = async () => {
    await deleteAllNotifications();
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds([]); // Clear selection when toggling
  };

  const [showPreferences, setShowPreferences] = useState(false);

  if (showPreferences) {
      return (
          <Popover open={true} onOpenChange={(open) => !open && setShowPreferences(false)}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group hover:bg-primary/5 transition-all duration-300">
                    <Bell className="h-[1.2rem] w-[1.2rem] transition-transform group-hover:rotate-12" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded h-2 w-2 bg-red-600"></span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-xl shadow rounded" align="end" sideOffset={12}>
                <div className="flex items-center justify-between p-4 border-b border-border/40">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPreferences(false)}>
                            <Bell className="h-4 w-4" />
                        </Button>
                        <h4 className="font-bold text-sm">Preferences</h4>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPreferences(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <NotificationPreferences />
            </PopoverContent>
          </Popover>
      )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group hover:bg-primary/5 transition-all duration-300">
          <Bell className="h-[1.2rem] w-[1.2rem] transition-transform group-hover:rotate-12" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded bg-red-400 opacity-75"></span>
               <span className="relative inline-flex rounded h-2 w-2 bg-red-600"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-xl shadow rounded animate-in fade-in zoom-in-95 duration-300" align="end" sideOffset={12}>
        <div className="flex flex-col">
          {/* Header Actions */}
          <div className="flex flex-col border-b border-border/40 bg-muted/20 backdrop-blur-md">
            <div className="flex items-center justify-between p-4 pb-2">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 p-1.5 rounded">
                    <Bell className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col">
                    <h4 className="font-bold text-sm tracking-tight">Notifications</h4>
                    {unreadCount > 0 ? (
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {unreadCount} unread messages
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        Up to date
                      </p>
                    )}
                </div>
              </div>
              <div className="flex gap-1">
                 {hasNotifications && !isSelectionMode && (
                   <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[10px] uppercase font-bold text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={toggleSelectionMode}
                      title="Select notifications"
                   >
                     <CheckSquare className="mr-1.5 h-3 w-3" />
                     Select
                   </Button>
                 )}
                 {isSelectionMode && (
                   <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground hover:bg-muted"
                      onClick={toggleSelectionMode}
                      title="Cancel selection"
                   >
                     <X className="mr-1.5 h-3 w-3" />
                     Cancel
                   </Button>
                 )}
                 {/* {!isSelectionMode && unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[10px] uppercase font-bold text-primary hover:bg-primary/10"
                      onClick={() => markAllAsRead()}
                      title="Mark all as read"
                    >
                      <CheckCheck className="mr-1.5 h-3 w-3" />
                      Read All
                    </Button>
                 )} */}
              </div>
            </div>

            {/* Selection Toolbar */}
            {hasNotifications && isSelectionMode && (
                <div className="flex items-center justify-between px-4 py-2 bg-background/50 border-t border-border/30 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2">
                        <Checkbox 
                            id="select-all" 
                            checked={isAllSelected}
                            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                            className="rounded-full w-4 h-4"
                        />
                        <label htmlFor="select-all" className="text-xs text-muted-foreground font-medium cursor-pointer select-none">
                            Select All
                        </label>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedIds.length > 0 ? (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 duration-200">
                                 <span className="text-xs font-semibold text-primary">
                                    {selectedIds.length} selected
                                 </span>
                                 <Separator orientation="vertical" className="h-4" />
                                 <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="h-6 text-[10px] px-2 shadow text-primary hover:text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20"
                                    onClick={handleMarkSelectedAsRead}
                                    title="Mark selected as read"
                                 >
                                    <CheckCheck className="mr-1 h-3 w-3" />
                                    Read
                                 </Button>
                                 <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    className="h-6 text-[10px] px-2 shadow-sm"
                                    onClick={handleDeleteSelected}
                                 >
                                    <Trash2 className="mr-1 h-3 w-3" />
                                    Delete
                                 </Button>
                            </div>
                        ) : (
                             <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px] uppercase font-bold text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                onClick={handleDeleteAll}
                                title="Delete all notifications"
                            >
                                <Trash2 className="mr-1.5 h-3 w-3" />
                                Clear All
                            </Button>
                        )}
                    </div>
                </div>
            )}
          </div>

          <ScrollArea className="h-[450px]">
            {!hasNotifications && !isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-[450px]">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded animate-pulse" />
                  <div className="relative bg-linear-to-br from-muted/50 to-muted/10 p-8 rounded border border-border/50 shadow-inner group transition-all duration-500 hover:scale-105">
                    <Sparkles className="h-12 w-12 text-primary/40 group-hover:text-primary/60 transition-colors" />
                  </div>
                </div>
                <div className="space-y-2 max-w-[240px]">
                  <p className="font-bold text-lg tracking-tight text-foreground">You're all clear!</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    No new updates for now. Enjoy your clean workspace.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border/30">
                {groupedNotifications.today.length > 0 && (
                  <div className="flex flex-col">
                    <GroupHeader title="Today" count={groupedNotifications.today.length} />
                    {groupedNotifications.today.map((notification) => (
                      <NotificationItem 
                        key={notification._id}
                        notification={notification}
                        onRead={markAsRead}
                        onDelete={deleteNotification}
                        isSelected={selectedIds.includes(notification._id)}
                        onToggleSelect={handleToggleSelect}
                        showCheckbox={isSelectionMode}
                      />
                    ))}
                  </div>
                )}

                {groupedNotifications.yesterday.length > 0 && (
                  <div className="flex flex-col">
                    <GroupHeader title="Yesterday" count={groupedNotifications.yesterday.length} />
                    {groupedNotifications.yesterday.map((notification) => (
                      <div key={notification._id}>
                        <NotificationItem 
                          notification={notification}
                          onRead={markAsRead}
                          onDelete={deleteNotification}
                          isSelected={selectedIds.includes(notification._id)}
                          onToggleSelect={handleToggleSelect}
                          showCheckbox={isSelectionMode}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {groupedNotifications.earlier.length > 0 && (
                  <div className="flex flex-col">
                    <GroupHeader title="Earlier" count={groupedNotifications.earlier.length} />
                    {groupedNotifications.earlier.map((notification) => (
                      <div key={notification._id}>
                        <NotificationItem 
                          notification={notification}
                          onRead={markAsRead}
                          onDelete={deleteNotification}
                          isSelected={selectedIds.includes(notification._id)}
                          onToggleSelect={handleToggleSelect}
                          showCheckbox={isSelectionMode}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {isLoading && (
               <div className="p-12 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="h-6 w-6 text-primary animate-spin opacity-40" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 animate-pulse">Syncing</p>
               </div>
            )}
          </ScrollArea>


          <div className="p-3 bg-muted/10 border-t border-border/40 flex items-center justify-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 h-9 rounded transition-all"
                onClick={() => setShowPreferences(true)}
              >
                  <Settings2 className="mr-2 h-3.5 w-3.5" />
                  Preferences
              </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};





