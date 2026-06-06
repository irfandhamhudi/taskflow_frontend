import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { ScrollArea } from '../../ui/scroll-area';
import { Button } from '../../ui/button';
import { MoreHorizontal, ExternalLink, Trash2, User, Settings2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { useMeetings } from '../../../hooks/use-meetings';
import { useAuth } from '../../../context/AuthContext';
import { meetingService } from '../../../services/meetingService';
import { toast } from 'sonner';
import { Badge } from '../../ui/badge';
import { CreateMeetingDialog } from './create-meeting-dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "../../ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

// Import SVG Assets
import zoomLogo from '../../../assets/zoom.svg';
import googleMeetLogo from '../../../assets/googlemeet.svg';

export function ScheduleMeetings() {
  const { user, refetchUser } = useAuth();
  const { meetings, loading: meetingsLoading, refreshMeetings } = useMeetings();

  // Check for successful OAuth redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const platform = urlParams.get('platform');

    if (status === 'success' && platform) {
      toast.success(`${platform === 'zoom' ? 'Zoom' : 'Google Meet'} connected successfully!`);
      refetchUser();
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refetchUser]);

  const handleConnect = async (platform: string) => {
    try {
      const authUrl = await meetingService.getAuthUrl(platform);
      window.location.href = authUrl;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    try {
      await meetingService.deleteMeeting(id);
      toast.success("Meeting deleted successfully");
      refreshMeetings();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const isZoomConnected = true; // Zoom is integrated globally at system level
  const isGoogleConnected = !!user?.externalAccounts?.google?.accessToken;

  return (
    <Card className="flex flex-col h-fit border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg font-semibold">Schedule</CardTitle>
          <CardDescription>Upcoming meetings and calls</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <CreateMeetingDialog user={user} onCreated={refreshMeetings} />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded bg-muted/30 hover:bg-muted/50 border-border/50">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[350px] sm:w-[370px] translate-x-5 sm:translate-x-0">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Platforms
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="flex items-center justify-between py-3 cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50/50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-100 dark:border-blue-800/30">
                    <img src={zoomLogo} alt="Zoom" className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">Zoom</span>
                    <span className="text-[10px] text-muted-foreground">Schedule Zoom calls</span>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 py-0 h-5">Integrated</Badge>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => isGoogleConnected ? null : handleConnect('google')}
                className="flex items-center justify-between py-3 cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                    <img src={googleMeetLogo} alt="Google Meet" className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">Google Meet</span>
                    <span className="text-[10px] text-muted-foreground">Use Google Calendar</span>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {isGoogleConnected ? (
                    <>
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 py-0 h-5">Connected</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={async () => {
                          try {
                            await meetingService.disconnectPlatform('google');
                            toast.success("Google connected");
                            refetchUser();
                          } catch (err: any) {
                            toast.error(err.message);
                          }
                        }}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-6 px-2 text-[10px]"
                      onClick={() => handleConnect('google')}
                    >
                      Link Account
                    </Button>
                  )}
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-[10px] text-muted-foreground justify-center py-2 italic">
                Microsoft Teams & Slack coming soon
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-4 sm:px-6 flex flex-col">
        {meetings.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center min-h-[300px] sm:min-h-[450px]">
            {(!isZoomConnected && !isGoogleConnected) ? (
              <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-xl bg-muted/30 border-border/60 w-full">
                 <div className="flex gap-4 mb-4">
                   <div className="bg-card p-3 rounded-2xl shadow-sm border border-border/40">
                     <img src={zoomLogo} alt="Zoom" className="w-8 h-8" />
                   </div>
                   <div className="bg-card p-3 rounded-2xl shadow-sm border border-border/40">
                     <img src={googleMeetLogo} alt="Google Meet" className="w-8 h-8" />
                   </div>
                 </div>
                 <p className="text-sm font-medium mb-1">No platforms connected</p>
                 <p className="text-xs text-muted-foreground mb-6 max-w-[200px]">Connect your accounts to start scheduling meetings</p>
                 <div className="flex gap-2">
                   <Button size="sm" variant="outline" onClick={() => handleConnect('zoom')} className="text-xs h-9 bg-background">
                     Connect Zoom
                   </Button>
                   <Button size="sm" variant="outline" onClick={() => handleConnect('google')} className="text-xs h-9 bg-background">
                     Connect Google
                   </Button>
                 </div>
              </div>
            ) : (
              <div className="text-center py-10 w-full border border-dashed rounded border-border">
                <p className="text-sm text-muted-foreground">No meetings scheduled for today.</p>
              </div>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[450px] pr-4 -mr-4">
            <div className="flex flex-col gap-4 pb-4">

            {meetings.map((meeting) => (
              <div key={meeting._id} className="border border-border/60 rounded p-4 shadow-sm bg-card hover:border-primary/30 transition-all hover:shadow-md group relative">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-[15px] tracking-tight group-hover:text-primary transition-colors">{meeting.title}</h3>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="bg-amber-100/80 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500 text-[10px] font-medium px-2 py-0">
                          {new Date(meeting.startTime) > new Date() ? 'Upcoming' : 'Ongoing'}
                        </Badge>
                        {meeting.host === user?._id && (
                          <Badge variant="outline" className="sm:mr-0 mr-2 text-[10px] h-4 border-primary/30 text-primary bg-primary/5">
                            Host
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 border border-border/60 rounded px-2 py-1 w-fit bg-muted/10 shadow-sm">
                      <div className="rounded p-[2px]">
                        <img 
                          src={meeting.platform === 'zoom' ? zoomLogo : googleMeetLogo} 
                          alt={meeting.platform} 
                          className="w-3.5 h-3.5" 
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                        {meeting.platform === 'zoom' ? 'Zoom' : 'Google Meet'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right flex flex-col gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Time</span>
                      <span className="text-[12px] font-bold">
                        {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    {meeting.host === user?._id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive/50 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Meeting?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this meeting? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteMeeting(meeting._id)}
                              className="bg-destructive hover:bg-destructive/90 text-white"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-border/50 mt-4 pt-3 flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {/* Prioritize showing project members if available, otherwise show attendees */}
                    {(meeting.projectId?.members || meeting.attendees || []).map((member: any, i: number) => {
                      const userData = member.user || member;
                      return (
                        <Avatar key={i} className="w-7 h-7 border-2 border-background">
                          <AvatarImage src={userData?.profilePicture} />
                          <AvatarFallback className="text-[10px]">
                            {(userData?.name || '?')[0]}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })}
                    {!(meeting.projectId?.members?.length || meeting.attendees?.length) && (
                      <Avatar className="w-7 h-7 border-2 border-background">
                        <AvatarFallback className="text-[10px]">
                          <User className="h-3.5 w-3.5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <a 
                    href={meeting.joinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[12px] text-emerald-500 font-semibold hover:text-emerald-600 transition-colors flex items-center gap-1"
                  >
                    Join Meeting <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
