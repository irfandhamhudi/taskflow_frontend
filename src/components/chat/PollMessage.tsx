import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Check, BarChart2, Users } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface PollOption {
  text: string;
  votes: any[];
}

interface PollMessageProps {
  messageId: string;
  question: string;
  options: PollOption[];
  isClosed: boolean;
  isMe: boolean;
}

export const PollMessage: React.FC<PollMessageProps> = ({ 
  messageId, 
  question, 
  options, 
  isClosed,
  isMe 
}) => {
  const { user } = useAuth();
  const totalVotes = options.reduce((sum, opt) => sum + opt.votes.length, 0);
  const uniqueVoters = new Set(options.flatMap(opt => opt.votes.map(v => typeof v === 'object' ? (v._id || v.id) : v))).size;

  const handleVote = async (optionIndex: number) => {
    if (isClosed) return;
    try {
      await api.post(`/chats/messages/${messageId}/vote`, { optionIndex });
    } catch (err) {
      toast.error("Failed to cast vote");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-1 rounded transition-all duration-300 min-w-[300px] group ">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* <div className="p-1 rounded ring-1 transition-transform group-hover:scale-110 bg-primary/10 ring-primary/20">
            <BarChart2 className="h-5 w-5 text-primary" />
          </div> */}
          <div className="flex flex-col">
            <h4 className="font-bold text-[15px] leading-snug tracking-tight text-primary">{question}</h4>
            {/* <div className="flex items-center gap-1.5 mt-0.5">
               <Users className="h-3 w-3 text-primary/60" />
               <span className="text-[10px]  uppercase tracking-wider text-primary/60">
                {totalVotes} {totalVotes === 1 ? 'Response' : 'Responses'}
               </span>
            </div> */}
          </div>
        </div>
      </div>

      {/* Options List */}
      <div className="space-y-2.5">
        {options.map((option, index) => {
          const isVoted = user && option.votes.some((v: any) => (v._id || v) === (user._id || user.id));
          const percentage = uniqueVoters > 0 ? Math.round((option.votes.length / uniqueVoters) * 100) : 0;
          const isWinner = totalVotes > 0 && option.votes.length === Math.max(...options.map(o => o.votes.length));

          return (
            <button
              key={index}
              disabled={isClosed}
              onClick={() => handleVote(index)}
              className={cn(
                "group/opt relative w-full text-left px-4 py-2 rounded border transition-all duration-500 overflow-hidden",
                isVoted 
                  ? 'border-primary bg-primary/20' 
                  : 'border-primary/10 hover:border-primary/30',
                isClosed ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'
              )}
            >
              {/* Animated Progress Fill */}
              <div 
                className={cn(
                  "absolute inset-y-0 left-0 transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                  isWinner ? 'bg-primary/20' : (isVoted ? 'bg-primary/15' : 'bg-primary/10'),
                  isWinner && "ring-1 ring-inset ring-primary/20"
                )}
                style={{ width: `${percentage}%` }}
              />

              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300",
                    isVoted 
                      ? "border-primary bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]" 
                      : "border-primary/30 bg-transparent",
                  )}>
                    {isVoted && <Check className="h-3 w-3 text-primary-foreground stroke-[3px] animate-in zoom-in duration-300" />}
                  </div>
                  <span className={cn(
                    "text-sm font-semibold truncate transition-colors",
                    isVoted ? 'text-primary' : 'text-primary/70'
                  )}>
                    {option.text}
                  </span>
                </div>
                
                <div className="flex items-center gap-0.5 shrink-0">
                  {/* Voter Avatars */}
                  {option.votes.length > 0 && (
                    <div className="flex -space-x-1.5 overflow-hidden py-1 pr-1">
                      {option.votes.slice(0, 3).map((voter: any, vIdx: number) => {
                        const isPopulated = typeof voter === 'object' && voter !== null;
                        const name = isPopulated ? voter.name : 'User';
                        const pic = isPopulated ? voter.profilePicture : null;
                        
                        return (
                          <div 
                            key={vIdx}
                            className="inline-block h-6 w-6 rounded-full ring-1 ring-background bg-muted overflow-hidden transition-transform hover:scale-110 hover:z-10"
                            title={name}
                          >
                            {pic ? (
                              <img src={pic} alt={name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary text-[8px] font-bold">
                                {name?.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {option.votes.length > 3 && (
                        <div className="inline-block h-6 w-6 rounded-full ring-1 ring-background bg-primary/10 items-center justify-center text-[8px] font-bold text-primary">
                          +{option.votes.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  <div className=" min-w-0">
                    <span className={cn(
                      "text-xs font-semibold tracking-tight leading-none",
                      isVoted ? "text-primary" : "text-primary/70"
                    )}>
                      {option.votes.length}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary/30 mt-0.5">
                      {option.votes.length === 1}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {totalVotes > 0 && (
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 w-full text-[10px] font-bold uppercase tracking-widest text-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
            >
              View Votes
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-primary/20 shadow-2xl">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="flex items-center gap-3 text-xl font-bold tracking-tight text-primary">
                <div className="bg-primary/10 p-2 rounded-lg ring-1 ring-primary/20">
                  <BarChart2 className="h-5 w-5 text-primary" />
                </div>
                Poll Results
              </DialogTitle>
            </DialogHeader>
            
            <div className="px-6 py-2">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                <span>Detailed breakdown</span>
                <span>{uniqueVoters} Total {uniqueVoters === 1 ? 'Participant' : 'Participants'}</span>
              </div>
              <Separator className="mt-2 bg-primary/10" />
            </div>

            <ScrollArea className="max-h-[65vh]">
              <div className="p-6 pt-2 space-y-8">
                {options.map((option, idx) => {
                  const percentage = uniqueVoters > 0 ? Math.round((option.votes.length / uniqueVoters) * 100) : 0;
                  const isWinner = totalVotes > 0 && option.votes.length === Math.max(...options.map(o => o.votes.length));
                  const isVotedByMe = user && option.votes.some((v: any) => (v._id || v) === (user._id || user.id));

                  return (
                    <div key={idx} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                           <div className={cn(
                             "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold border transition-all duration-300",
                             isVotedByMe ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(var(--primary),0.4)]" : 
                             isWinner ? "bg-primary/20 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"
                           )}>
                            {isVotedByMe ? <Check className="h-4 w-4 stroke-[3px]" /> : idx + 1}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className={cn("text-sm font-bold leading-tight", isVotedByMe ? "text-primary" : "text-foreground")}>
                                {option.text}
                              </span>
                              {isVotedByMe && <Badge variant="secondary" className="h-4 px-1 text-[8px] font-black uppercase tracking-tighter bg-primary/10 text-primary border-none">Your Vote</Badge>}
                            </div>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{percentage}% of total</span>
                          </div>
                        </div>
                        <Badge variant={isWinner ? "default" : "outline"} className={cn("h-6 px-2 text-[10px] font-bold shrink-0", !isWinner && "text-muted-foreground border-muted-foreground/20")}>
                          {option.votes.length} {option.votes.length === 1 ? 'Vote' : 'Votes'}
                        </Badge>
                      </div>

                      {/* Results Dialog Progress Bar */}
                      <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "absolute inset-y-0 left-0 transition-all duration-1000",
                            isWinner ? "bg-primary" : "bg-primary/40"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-10">
                        {option.votes.length > 0 ? (
                          option.votes.map((voter: any, vIdx: number) => {
                            const isPopulated = typeof voter === 'object' && voter !== null;
                            const voterId = isPopulated ? (voter._id || voter) : voter;
                            const isVoterMe = user && voterId === (user._id || user.id);
                            const name = isPopulated ? voter.name : 'Unknown User';
                            const pic = isPopulated ? voter.profilePicture : null;
                            
                            return (
                              <div 
                                key={vIdx} 
                                className={cn(
                                  "flex items-center gap-2.5 px-2 py-1.5 rounded transition-all group/voter cursor-default border",
                                  isVoterMe 
                                    ? "bg-primary/10 border-primary/20 shadow-sm" 
                                    : "bg-muted/20 border-primary/30 hover:border-primary/20 hover:bg-primary/5"
                                )}
                              >
                                <div className="relative">
                                  <Avatar className={cn(
                                    "h-6 w-6 ring-1 transition-all",
                                    isVoterMe ? "ring-primary/40 shadow-sm" : "ring-background group-hover/voter:ring-primary/20"
                                  )}>
                                    <AvatarImage src={pic} />
                                    <AvatarFallback className={cn(
                                      "text-[8px] font-bold",
                                      isVoterMe ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                                    )}>
                                      {name.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  {isVoterMe && (
                                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm border border-background">
                                      <Check className="h-1.5 w-1.5 stroke-[4px]" />
                                    </div>
                                  )}
                                </div>
                                <span className={cn(
                                  "text-[11px] font-semibold truncate transition-colors",
                                  isVoterMe ? "text-primary" : "text-foreground/70 group-hover/voter:text-primary"
                                )}>
                                  {name} {isVoterMe && "(You)"}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="col-span-full py-2 px-3 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/5 flex items-center justify-center">
                            <p className="text-[10px] text-muted-foreground font-medium italic">No participants yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="p-4 bg-muted/30 border-t flex justify-center">
               <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em]">End of results</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
