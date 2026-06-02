import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Send, 
  ArrowLeft, 
  MessageCircle, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Paperclip, 
  X, 
  FileIcon, 
  Image as ImageIcon,
  Edit2,
  Trash2,
  Download,
  Camera,
  FileText,
  Check,
  CheckCheck,
  BarChart2
} from 'lucide-react';
import { PollMessage } from './PollMessage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { format } from 'date-fns';
import { toast } from 'sonner';
import api from '../../utils/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { cn } from '../../lib/utils';

export const ChatPanel = () => {
  const { 
    isOpen, 
    setIsOpen, 
    conversations, 
    activeConversation, 
    setActiveConversation, 
    messages, 
    addMessage,
    acceptConversation,
    editMessage,
    deleteMessageForMe,
    deleteMessageForEveryone,
    updateMessageInStore,
    removeMessageFromStore,
    fetchConversations,
    onlineUsers,
    setOnlineUsers,
    markAsRead,
    markAsDelivered,
    rejectConversation
  } = useChatStore();
  
  const { socket } = useSocket();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // New features state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll state
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const prevMessagesLengthRef = useRef(messages.length);

  // Search & Block features
  const [isMessageSearching, setIsMessageSearching] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const { deleteConversation, blockUser, unblockUser } = useChatStore();

  useEffect(() => {
    fetchConversations().then(() => {
      const allParticipants = useChatStore.getState().conversations.flatMap(c => c.participants);
      const onlineIds = Array.from(new Set(
        allParticipants
          .filter(p => p.isOnline && p._id !== user?._id)
          .map(p => p._id)
      )) as string[];
      setOnlineUsers(onlineIds);
    });
  }, [fetchConversations, setOnlineUsers, user?._id]);

  useEffect(() => {
    if (socket) {
      socket.on('receive_message', (message: any) => {
        addMessage(message, user?._id);

        // Show notification if sender is not me and chat is closed or not active for this conversation
        const isMe = message.sender._id === user?._id;
        if (!isMe) {
          const currentChatState = useChatStore.getState();
          const isChatOpen = currentChatState.isOpen;
          const activeConvId = currentChatState.activeConversation?._id;

          // Mark as delivered if we are the recipient
          markAsDelivered(message.conversationId);

          if (!isChatOpen || activeConvId !== message.conversationId) {
            toast.custom((t) => (
              <div 
                className={`${t.visible ? 'animate-in fade-in slide-in-from-right-4' : 'animate-out fade-out slide-out-to-right-4'} 
                  group max-w-sm w-full bg-background border shadow rounded pointer-events-auto flex overflow-hidden transition-all duration-300 hover:shadow`}
              >
                <div className="flex-1 p-4">
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={message.sender.profilePicture} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">
                          {message.sender.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary ring-2 ring-background">
                        {message.type === 'poll' ? <BarChart2 className="h-2 w-2 text-white" /> : <MessageCircle className="h-2 w-2 text-white" />}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {message.sender.name}
                        </p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">Just now</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {message.text || (message.type === 'poll' ? 'Created a poll & vote' : message.attachments?.length ? 'Sent an attachment' : 'New message')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col border-l border-border bg-muted/20 w-24">
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      setIsOpen(true);
                      const conv = useChatStore.getState().conversations.find(c => c._id === message.conversationId);
                      if (conv) {
                        setActiveConversation(conv);
                      } else {
                        fetchConversations().then(() => {
                          const updatedConv = useChatStore.getState().conversations.find(c => c._id === message.conversationId);
                          if (updatedConv) setActiveConversation(updatedConv);
                        });
                      }
                    }}
                    className="flex-1 flex items-center justify-center text-xs font-bold text-primary hover:bg-primary/5 active:bg-primary/10 transition-colors"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="h-10 border-t border-border flex items-center justify-center text-[10px] font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ), {
              duration: 5000,
              position: 'top-right',
            });
          }
        }
      });
      
      socket.on('message_updated', (message: any) => {
        updateMessageInStore(message);
      });

      socket.on('message_deleted', (data: any) => {
        if (data.isDeletedForAll) {
           updateMessageInStore(data.message);
        } else {
           removeMessageFromStore(data.messageId);
        }
      });

      socket.on('user_typing', ({ conversationId, userId, isTyping }: any) => {
        if (useChatStore.getState().activeConversation?._id === conversationId) {
          setTypingUsers(prev => ({ ...prev, [userId]: isTyping }));
        }
      });

      socket.on('conversation_accepted', ({ user: acceptingUser }: any) => {
        toast.success(`${acceptingUser.name} accepted your chat invitation!`, {
          icon: <MessageCircle className="h-4 w-4 text-green-500" />,
        });
        fetchConversations();
      });

      socket.on('conversation_rejected', ({ user: rejectingUser }: any) => {
        toast.error(`${rejectingUser.name} declined your chat invitation.`, {
          icon: <X className="h-4 w-4 text-destructive" />,
        });
        fetchConversations();
        if (useChatStore.getState().activeConversation) {
          // If the active conversation was rejected by the other party, close it
          const currentActive = useChatStore.getState().activeConversation;
          if (currentActive && currentActive.participants.some(p => p._id === rejectingUser._id)) {
             setActiveConversation(null);
          }
        }
      });

      socket.on('messages_delivered', ({ conversationId, userId: delivererId }: any) => {
        if (useChatStore.getState().activeConversation?._id === conversationId) {
          // Refresh messages to see double ticks
          useChatStore.getState().fetchMessages(conversationId);
        }
      });

      socket.on('user_unblocked', ({ unblockerId, unblockedId, conversationId }: any) => {
        // Refresh conversations to restore privacy info (photo, status)
        fetchConversations();
        
        // If we are in the active chat, refresh messages to see the restored ones
        if (useChatStore.getState().activeConversation?._id === conversationId) {
          useChatStore.getState().fetchMessages(conversationId);
        }
      });

      socket.on('poll_updated', (message: any) => {
        updateMessageInStore(message);
      });

      return () => {
        socket.off('receive_message');
        socket.off('message_updated');
        socket.off('message_deleted');
        socket.off('user_typing');
        socket.off('conversation_accepted');
        socket.off('conversation_rejected');
        socket.off('poll_updated');
      };
    }
  }, [socket, addMessage, user, setIsOpen, setActiveConversation, fetchConversations, updateMessageInStore, removeMessageFromStore, setOnlineUsers, markAsRead]);

  // Handle online status and unread status from socket
  useEffect(() => {
    if (socket) {
      socket.on('user_status_change', ({ userId, isOnline }: any) => {
        // Check if this user has rejected any conversation with us
        const conversations = useChatStore.getState().conversations;
        const isRejectedByThisUser = conversations.some(c => 
          c.rejectedBy?.includes(userId) && !c.rejectedBy?.includes(user?._id || '')
        );

        if (isRejectedByThisUser && isOnline) {
          // If they rejected and are coming online, don't show it to us
          return;
        }

        const currentOnline = [...useChatStore.getState().onlineUsers];
        if (isOnline) {
          if (!currentOnline.includes(userId)) {
            setOnlineUsers([...currentOnline, userId]);
          }
        } else {
          setOnlineUsers(currentOnline.filter(id => id !== userId));
        }
      });

      socket.on('mark_as_read', ({ conversationId, userId: readerId }: any) => {
        if (readerId === user?._id) {
          // Sync across tabs
          const currentConversations = useChatStore.getState().conversations;
          const updated = currentConversations.map(c => 
            c._id === conversationId ? { ...c, unreadCount: 0 } : c
          );
          useChatStore.setState({ conversations: updated });
        } else {
          // Other user read it, refresh messages to see blue ticks
          if (useChatStore.getState().activeConversation?._id === conversationId) {
             useChatStore.getState().fetchMessages(conversationId);
          }
        }
      });
    }
  }, [socket, user, setOnlineUsers]);

  useEffect(() => {
    if (socket && activeConversation) {
      socket.emit('join_chat', activeConversation._id);
      setTypingUsers({});
    }
  }, [socket, activeConversation]);

  useEffect(() => {
    const isNewMessage = messages.length > prevMessagesLengthRef.current;

    if (isNewMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    // Only scroll for typing if we're already near the bottom
    const isAtBottom = messagesEndRef.current && 
      (messagesEndRef.current.getBoundingClientRect().top <= window.innerHeight + 100);
    
    if (isAtBottom && Object.values(typingUsers).some(v => v)) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [typingUsers]);

  const handleTyping = () => {
    if (!activeConversation || !socket) return;
    socket.emit('typing', { conversationId: activeConversation._id, userId: user?._id, isTyping: true });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { conversationId: activeConversation._id, userId: user?._id, isTyping: false });
    }, 2000);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    handleTyping();
  };

  const handleSend = async () => {
    if ((!text.trim() && attachments.length === 0) || !activeConversation) return;
    
    const messageData = {
      text: text.trim(),
      attachments: attachments
    };

    try {
      await api.post(`/chats/${activeConversation._id}/messages`, messageData);
      setText('');
      setAttachments([]);
      if (socket) {
        socket.emit('typing', { conversationId: activeConversation._id, userId: user?._id, isTyping: false });
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  const handleCreatePoll = async () => {
    if (!pollQuestion.trim() || pollOptions.some(opt => !opt.trim()) || !activeConversation) return;

    const pollData = {
      type: 'poll',
      poll: {
        question: pollQuestion.trim(),
        options: pollOptions.map(opt => ({ text: opt.trim(), votes: [] }))
      }
    };

    try {
      await api.post(`/chats/${activeConversation._id}/messages`, pollData);
      setShowPollDialog(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch (err) {
      toast.error("Failed to create poll");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newAttachments = res.data.data.map((f: any) => ({
        fileName: f.fileName,
        fileUrl: f.fileUrl,
        fileType: f.fileType,
        fileSize: f.fileSize
      }));

      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (err) {
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const startEditing = (message: any) => {
    setEditingMessageId(message._id);
    setEditText(message.text);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditText('');
    if (socket && activeConversation) {
      socket.emit('typing', { conversationId: activeConversation._id, userId: user?._id, isTyping: false });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const downloadFile = async (url: string, fileName: string) => {
    try {
      toast.info("Starting download...");
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed', error);
      window.open(url, '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getLastMessagePreview = (message: any) => {
    if (!message) return 'No messages yet';
    const isMe = message.sender?._id === user?._id;
    const prefix = isMe ? 'You: ' : '';
    
    if (message.isDeletedForAll) return <span>{prefix}Message deleted</span>;
    
    if (message.text) return <span>{prefix}{message.text}</span>;

    if (message.type === 'poll') return (
      <span className="inline-flex items-center gap-1">
        {prefix}
        <BarChart2 className="h-3 w-3 text-primary" />
        Poll & Vote
      </span>
    );
    
    if (message.attachments && message.attachments.length > 0) {
      const file = message.attachments[0];
      const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'png'].includes(file.fileType?.toLowerCase()) || file.fileType?.includes('image');
      return (
        <span className="inline-flex items-center gap-1">
          {prefix}
          {isImg ? <Camera className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
          {isImg ? 'Photo' : 'File'}
        </span>
      );
    }
    
    return 'No messages yet';
  };

  const saveEdit = async () => {
    if (!editingMessageId || !editText.trim()) return;
    try {
      await editMessage(editingMessageId, editText.trim());
      setEditingMessageId(null);
      setEditText('');
      if (socket && activeConversation) {
        socket.emit('typing', { conversationId: activeConversation._id, userId: user?._id, isTyping: false });
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    } catch (err) {
      toast.error("Failed to edit message");
    }
  };

  const getOtherParticipant = (participants: any[]) => {
    return participants.find(p => p._id !== user?._id) || participants[0];
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length > 1) {
      try {
        const res = await api.get(`/auth/search-user?email=${query}`);
        setSearchResults(res.data.data.filter((u: any) => u._id !== user?._id));
      } catch (err) {
        console.error(err);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleStartChat = async (userId: string) => {
    setIsSearching(false);
    setSearchQuery('');
    setSearchResults([]);
    useChatStore.getState().startDirectMessage(userId);
  };

  const handleDeleteConversation = async () => {
    if (!activeConversation) return;
    try {
      await deleteConversation(activeConversation._id);
      toast.success("Conversation deleted");
      setShowDeleteConfirm(false);
    } catch (err) {
      toast.error("Failed to delete conversation");
    }
  };

  const handleBlockUser = async () => {
    const other = getOtherParticipant(activeConversation?.participants || []);
    if (!other) return;
    
    const isCurrentlyBlocked = user?.blockedUsers?.includes(other._id);
    
    setIsBlocking(true);
    try {
      if (isCurrentlyBlocked) {
        await unblockUser(other._id);
        toast.success("User unblocked");
      } else {
        await blockUser(other._id);
        toast.success("User blocked");
      }
      setShowBlockConfirm(false);
      window.location.reload();
    } catch (err) {
      toast.error("Action failed");
    } finally {
      setIsBlocking(false);
    }
  };

  const filteredMessages = isMessageSearching && messageSearchQuery.trim()
    ? messages.filter(m => m.text?.toLowerCase().includes(messageSearchQuery.toLowerCase()))
    : messages;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" hideCloseButton className="w-full sm:max-w-[480px] sm:p-2 p-0 flex flex-col h-full overflow-hidden border-l shadow-sm">
        {!activeConversation ? (
          // Conversations List
          <>
            <SheetHeader className="sm:p-5 p-4 border-b flex-row justify-between items-center space-y-0 bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <SheetTitle className="text-lg font-bold tracking-tight">Messages</SheetTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md" onClick={() => setIsSearching(!isSearching)}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md sm:hidden " onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>
            
            {isSearching && (
              <div className="p-4 border-b bg-muted/30">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="pl-9"
                    autoFocus
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {searchResults.map(result => (
                      <div 
                        key={result._id} 
                        className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer"
                        onClick={() => handleStartChat(result._id)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={result.profilePicture} />
                          <AvatarFallback>{result.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{result.name}</p>
                          <p className="text-xs text-muted-foreground">{result.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <ScrollArea className="flex-1">
              {conversations.length === 0 && !isSearching ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center mt-20">
                  <MessageCircle className="h-12 w-12 mb-4 opacity-20" />
                  <p className="font-medium mb-1">No conversations yet</p>
                  <p className="text-sm mb-6">Connect with your team members directly.</p>
                  <Button onClick={() => setIsSearching(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Start New Conversation
                  </Button>
                </div>
              ) : (
                conversations.map((conv) => {
                  const other = getOtherParticipant(conv.participants);
                  return (
                    <div 
                      key={conv._id} 
                      className="flex items-center gap-3 p-4 border-b cursor-pointer hover:bg-muted/50 transition relative"
                      onClick={() => setActiveConversation(conv)}
                    >
                      {!conv.acceptedBy?.includes(user?._id || '') && (
                        <div className="absolute right-4 top-4 bg-primary text-primary-foreground text-[10px] font-bold h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full border-2 border-background animate-pulse shadow-sm" title="New Invitation">
                          1
                        </div>
                      )}
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={other?.profilePicture} />
                          <AvatarFallback>{other?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {onlineUsers.includes(other?._id) && !other?.blockedUsers?.includes(user?._id) && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold truncate">{conv.isGroup ? conv.name : other?.name}</p>
                          <span className={`text-xs ${conv.unreadCount && conv.unreadCount > 0 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                            {conv.lastMessage ? format(new Date(conv.updatedAt), 'h:mm a') : ''}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-0.5">
                          <p className={`text-sm truncate w-56 ${conv.unreadCount && conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                            {getLastMessagePreview(conv.lastMessage)}
                          </p>
                          {!!(conv.unreadCount && conv.unreadCount > 0) && (
                            <div className="bg-primary text-primary-foreground text-[10px] font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full shadow-sm">
                              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </ScrollArea>
          </>
        ) : (
          // Active Chat
          <>
            <div className="p-3.5 border-b flex items-center justify-between shrink-0 bg-background/95 backdrop-blur-sm z-10 shadow sticky top-0">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setActiveConversation(null)} className="shrink-0 h-8 w-8 rounded-md">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="relative">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={getOtherParticipant(activeConversation.participants)?.profilePicture} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">
                      {getOtherParticipant(activeConversation.participants)?.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {onlineUsers.includes(getOtherParticipant(activeConversation.participants)?._id) && !getOtherParticipant(activeConversation.participants)?.blockedUsers?.includes(user?._id) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                  )}
                </div>
                <div className="flex flex-col">
                  <h3 className="font-bold text-sm tracking-tight">
                    {activeConversation.isGroup ? activeConversation.name : getOtherParticipant(activeConversation.participants)?.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${onlineUsers.includes(getOtherParticipant(activeConversation.participants)?._id) && !getOtherParticipant(activeConversation.participants)?.blockedUsers?.includes(user?._id) ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
                      {onlineUsers.includes(getOtherParticipant(activeConversation.participants)?._id) && !getOtherParticipant(activeConversation.participants)?.blockedUsers?.includes(user?._id) ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 ${isMessageSearching ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                  onClick={() => {
                    setIsMessageSearching(!isMessageSearching);
                    if (isMessageSearching) setMessageSearchQuery('');
                  }}
                >
                  <Search className="h-4 w-4" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Conversation
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowBlockConfirm(true)}>
                      <X className="h-4 w-4 mr-2" /> 
                      {user?.blockedUsers?.includes(getOtherParticipant(activeConversation.participants)?._id) ? 'Unblock User' : 'Block User'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground sm:hidden" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {isMessageSearching && (
              <div className="px-4 py-2 border-b bg-muted/30 animate-in slide-in-from-top-2 duration-200">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search in conversation..."
                    value={messageSearchQuery}
                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs bg-background"
                    autoFocus
                  />
                  {messageSearchQuery && (
                    <button 
                      onClick={() => setMessageSearchQuery('')}
                      className="absolute right-2.5 top-2.5"
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {!activeConversation.acceptedBy?.includes(user?._id || '') && !activeConversation.isGroup ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/5 animate-in fade-in zoom-in duration-300">
                <div className="bg-primary/10 p-6 rounded-full mb-6">
                  <MessageCircle className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">New Chat Invitation</h3>
                <p className="text-muted-foreground mb-8 max-w-[280px]">
                  {getOtherParticipant(activeConversation.participants)?.name} invited you to chat. 
                  Accept to start messaging.
                </p>
                <div className="flex flex-col gap-3 w-full max-w-[240px]">
                  <Button 
                    className="w-full h-11 text-base font-semibold shadow shadow-primary/20" 
                    onClick={() => acceptConversation(activeConversation._id)}
                  >
                    Accept Invitation
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-11 text-destructive hover:bg-destructive/5 border-destructive/20 hover:border-destructive transition-colors font-medium" 
                    onClick={() => rejectConversation(activeConversation._id)}
                  >
                    Decline Invitation
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 bg-muted/20 overflow-y-auto">
                <div className="space-y-4 p-4">
                    {filteredMessages.length === 0 && messageSearchQuery ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Search className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-sm">No messages matching "{messageSearchQuery}"</p>
                      </div>
                    ) : filteredMessages.map((msg) => {
                      const isMe = msg.sender._id === user?._id;
                      const isEditing = editingMessageId === msg._id;

                      return (
                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2 mb-4 group`}>
                          {!isMe && (
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={msg.sender.profilePicture} />
                              <AvatarFallback>{msg.sender.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                            <div className="flex items-center gap-2 group/msg relative">
                              {isMe && !isEditing && (
                                <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity absolute -left-10 top-1/2 -translate-y-1/2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {!msg.isDeletedForAll && msg.type !== 'poll' && (
                                        <DropdownMenuItem onClick={() => startEditing(msg)}>
                                          <Edit2 className="h-4 w-4 mr-2" /> Edit
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem onClick={() => deleteMessageForMe(msg._id)}>
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete for me
                                      </DropdownMenuItem>
                                      {!msg.isDeletedForAll && (
                                        <DropdownMenuItem 
                                          className="text-destructive" 
                                          onClick={() => deleteMessageForEveryone(msg._id)}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" /> Delete for everyone
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}

                               <div className={cn(
                                 "px-3.5 py-2 rounded-[10px] shadow-sm transition-all relative group/bubble w-fit max-w-full",
                                 isMe 
                                   ? 'bg-primary/10 text-primary border border-primary/20 rounded-br-none ml-auto' 
                                   : 'bg-background border border-border rounded-bl-none mr-auto',
                                 msg.isDeletedForAll && 'italic opacity-70'
                               )}>
                                {!isMe && activeConversation.isGroup && (
                                  <p className="text-[10px] font-bold mb-1 text-primary uppercase tracking-tight">{msg.sender.name}</p>
                                )}
                                
                                {isEditing ? (
                                  <div className="flex flex-col gap-2 min-w-[200px]">
                                    <textarea 
                                      className="bg-background/10 border-none focus:ring-0 text-sm resize-none w-full outline-none"
                                      value={editText}
                                      onChange={(e) => {
                                        setEditText(e.target.value);
                                        handleTyping();
                                      }}
                                      autoFocus
                                      rows={2}
                                    />
                                    <div className="flex justify-end gap-2">
                                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={cancelEditing}>Cancel</Button>
                                      <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={saveEdit}>Save</Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {msg.type === 'poll' && msg.poll ? (
                                      <PollMessage 
                                        messageId={msg._id}
                                        question={msg.poll.question}
                                        options={msg.poll.options}
                                        isClosed={msg.poll.isClosed}
                                        isMe={isMe}
                                      />
                                    ) : (
                                      <div className="flex flex-wrap items-end gap-x-2 gap-y-0.5">
                                        <p className="text-sm leading-relaxed wrap-break-word text-justify">{msg.text}</p>
                                        <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
                                          {msg.isEdited && !msg.isDeletedForAll && (
                                            <span className={cn("text-[9px]", isMe ? "text-primary/40" : "text-muted-foreground/40")}>edited</span>
                                          )}
                                          <p className={cn("text-[10px] font-medium leading-none", isMe ? "text-primary/60" : "text-muted-foreground/60")}>
                                            {format(new Date(msg.createdAt), 'h:mm a')}
                                          </p>
                                          {isMe && (
                                            <div className="flex items-center ml-0.5">
                                              {msg.readBy && msg.readBy.length > 0 ? (
                                                <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
                                              ) : msg.deliveredTo && msg.deliveredTo.length > 0 ? (
                                                <CheckCheck className={cn("h-3.5 w-3.5 opacity-70", isMe ? "text-primary/50" : "text-muted-foreground/50")} />
                                              ) : (
                                                <Check className={cn("h-3.5 w-3.5 opacity-70", isMe ? "text-primary/50" : "text-muted-foreground/50")} />
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Attachments */}
                                    {msg.attachments && msg.attachments.length > 0 && (
                                      <div className="mt-2 space-y-2">
                                        {msg.attachments.map((file: any, idx: number) => {
                                          const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.fileType?.toLowerCase());
                                          return (
                                            <div key={idx} className="rounded-lg overflow-hidden border bg-background/5 p-1">
                                              {isImg ? (
                                                <div className="relative group/img">
                                                  <img src={file.fileUrl} alt={file.fileName} className="max-w-full h-auto rounded cursor-pointer hover:opacity-90 transition" />
                                                  <button 
                                                    onClick={() => downloadFile(file.fileUrl, file.fileName)} 
                                                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover/img:opacity-100 transition shadow hover:bg-black/70"
                                                    title="Download Image"
                                                  >
                                                    <Download className="h-4 w-4 text-white" />
                                                  </button>
                                                </div>
                                              ) : (
                                                <button 
                                                  onClick={() => downloadFile(file.fileUrl, file.fileName)}
                                                  className="flex items-center gap-3 p-2 hover:bg-background/10 transition w-full text-left"
                                                  title="Download File"
                                                >
                                                  <div className="bg-primary/20 p-2 rounded">
                                                    <FileIcon className="h-5 w-5" />
                                                  </div>
                                                  <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs font-medium truncate">{file.fileName}</p>
                                                    <p className="text-[10px] opacity-60">{formatFileSize(file.fileSize)}</p>
                                                  </div>
                                                </button>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </>
                                )}
                                
                                {msg.type === 'poll' && (
                                  <div className="flex items-center justify-end gap-1.5 mt-1">
                                     {msg.isEdited && !msg.isDeletedForAll && (
                                       <span className={cn("text-[9px]", isMe ? "text-primary/40" : "text-muted-foreground/40")}>edited</span>
                                     )}
                                     <p className={cn("text-[9px] font-medium", isMe ? "text-primary/60" : "text-muted-foreground/60")}>
                                       {format(new Date(msg.createdAt), 'h:mm a')}
                                     </p>
                                    {isMe && (
                                       <div className="flex items-center">
                                         {msg.readBy && msg.readBy.length > 0 ? (
                                           <CheckCheck className="h-3 w-3 text-sky-400" />
                                         ) : msg.deliveredTo && msg.deliveredTo.length > 0 ? (
                                           <CheckCheck className={cn("h-3 w-3", isMe ? "text-primary/50" : "text-muted-foreground/50")} />
                                         ) : (
                                           <Check className={cn("h-3 w-3", isMe ? "text-primary/50" : "text-muted-foreground/50")} />
                                         )}
                                       </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              {!isMe && (
                                <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity absolute -right-10 top-1/2 -translate-y-1/2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                      <DropdownMenuItem onClick={() => deleteMessageForMe(msg._id)}>
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete for me
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </div>
                          </div>

                          {isMe && (
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={user?.profilePicture} />
                              <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Typing Indicator ... */}
                    {Object.keys(typingUsers).filter(id => typingUsers[id] && id !== user?._id).map(typingUserId => {
                      const typingParticipant = activeConversation.participants.find((p: any) => p._id === typingUserId);
                      return (
                        <div key={`typing-${typingUserId}`} className="flex justify-start mb-2 items-end">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={typingParticipant?.profilePicture} />
                            <AvatarFallback>{typingParticipant?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col gap-1 max-w-[80%]">
                            {activeConversation.isGroup && typingParticipant && (
                              <span className="text-xs font-semibold text-muted-foreground ml-1">
                                {typingParticipant.name} is typing...
                              </span>
                            )}
                            <div className="rounded-lg p-3 bg-muted flex items-center gap-1 w-fit">
                              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-3.5 border-t bg-background flex flex-col gap-2 shrink-0 z-10 sticky bottom-0">
                  {user?.blockedUsers?.includes(getOtherParticipant(activeConversation.participants)?._id) ? (
                    <div className="bg-muted/50 p-3 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-2">
                        <X className="h-3 w-3" /> You have blocked this user. Unblock to send messages.
                      </p>
                    </div>
                  ) : (
                    <>
                      {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {attachments.map((file, idx) => (
                            <div key={idx} className="relative group/att bg-muted border rounded-lg p-2 pr-8 flex items-center gap-2 max-w-[200px] transition-all">
                              <FileIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium truncate">{file.fileName}</span>
                              <button 
                                onClick={() => removeAttachment(idx)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl border border-border focus-within:border-primary/50 transition-all">
                        <input 
                          type="file" 
                          multiple 
                          className="hidden" 
                          ref={fileInputRef} 
                          onChange={handleFileUpload} 
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="shrink-0 h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          <Paperclip className={`h-4 w-4 ${isUploading ? 'animate-pulse' : ''}`} />
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="shrink-0 h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
                          onClick={() => setShowPollDialog(true)}
                        >
                          <BarChart2 className="h-4 w-4" />
                        </Button>

                        <Input 
                          value={text}
                          onChange={handleTextChange}
                          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                          placeholder={isUploading ? "Uploading..." : "Type a message..."}
                          className="flex-1 bg-transparent border-none focus-visible:ring-0 shadow-none h-8 text-sm"
                          disabled={isUploading}
                        />
                        <Button 
                          onClick={handleSend} 
                          disabled={(!text.trim() && attachments.length === 0) || isUploading} 
                          size="icon"
                          className="h-8 w-8 rounded-lg shadow-none bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </SheetContent>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the conversation from your list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConversation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBlockConfirm} onOpenChange={setShowBlockConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user?.blockedUsers?.includes(getOtherParticipant(activeConversation?.participants || [])?._id) ? 'Unblock' : 'Block'} {getOtherParticipant(activeConversation?.participants || [])?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user?.blockedUsers?.includes(getOtherParticipant(activeConversation?.participants || [])?._id) 
                ? 'You will be able to send and receive messages from this user again.' 
                : 'Blocked users will not be able to send you messages or see your online status.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlockUser} className={user?.blockedUsers?.includes(getOtherParticipant(activeConversation?.participants || [])?._id) ? 'bg-primary' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}>
              {user?.blockedUsers?.includes(getOtherParticipant(activeConversation?.participants || [])?._id) ? 'Unblock' : 'Block'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Poll Creation Dialog */}
      <AlertDialog open={showPollDialog} onOpenChange={setShowPollDialog}>
        <AlertDialogContent className="sm:max-w-[450px] rounded border-primary/20 shadow-2xl backdrop-blur-xl bg-background/95">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex flex-col items-start gap-1 text-xl font-bold tracking-tight">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded ring-1 ring-primary/20 shadow-inner">
                  <BarChart2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-primary">Create New Poll</span>
                  <span className="text-sm font-medium text-muted-foreground/60">Gather feedback from your team instantly.</span>
                </div>
              </div>
            </AlertDialogTitle>
           
          </AlertDialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 ml-1">Question</label>
              <div className="relative group">
                 <Input 
                  placeholder="What would you like to ask?" 
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="px-5  py-5 bg-primary/5 border-primary/20 focus:border-primary/50 transition-all rounded pl-4 pr-10 shadow-none font-semibold focus-visible:ring-0 text-primary placeholder:text-primary/40"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
                  <MessageCircle className="h-4 w-4" />
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Options</label>
                <span className="text-[10px] font-bold text-muted-foreground/40">{pollOptions.length} / 5</span>
              </div>
              
              <div className="space-y-3">
                {pollOptions.map((option, idx) => (
                  <div key={idx} className="flex gap-2 group/opt animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="relative flex-1">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                        {idx + 1}
                      </div>
                      <Input 
                        placeholder={`Choice ${idx + 1}...`} 
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...pollOptions];
                          newOptions[idx] = e.target.value;
                          setPollOptions(newOptions);
                        }}
                        className="px-5 py-5 bg-muted/20 border-border/40 focus:border-primary/30 transition-all rounded pl-12 shadow-none font-medium focus-visible:ring-0 text-primary placeholder:text-primary/40"
                      />
                    </div>
                    {pollOptions.length > 2 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-11 w-11 shrink-0 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all hover:scale-105"
                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {pollOptions.length < 5 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-xs h-10 border-dashed border-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 rounded transition-all font-bold text-muted-foreground hover:text-primary"
                  onClick={() => setPollOptions([...pollOptions, ''])}
                >
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  Add Another Option
                </Button>
              )}
            </div>
          </div>
          
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel 
              className="rounded shadow-none border hover:bg-accent"
              onClick={() => {
                setPollQuestion('');
                setPollOptions(['', '']);
              }}
            >
              Discard
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCreatePoll}
              disabled={!pollQuestion.trim() || pollOptions.filter(opt => opt.trim()).length < 2}
              className="rounded px-8 bg-primary/10 text-primary border border-primary/20 shadow-none hover:bg-primary/15 transition-all hover:scale-[1.02] active:scale-95"
            >
              Post to Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
};
