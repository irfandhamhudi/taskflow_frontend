import { create } from 'zustand';
import api from '../utils/api';

export interface Message {
  _id: string;
  conversationId: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  text: string;
  attachments: any[];
  readBy: { user: string; readAt: string }[];
  deliveredTo: { user: string; deliveredAt: string }[];
  createdAt: string;
  isEdited?: boolean;
  isDeletedForAll?: boolean;
  deletedFor?: string[];
  type?: 'text' | 'poll' | 'system';
  poll?: {
    question: string;
    options: {
      text: string;
      votes: string[];
    }[];
    isClosed: boolean;
    expiresAt?: string;
  };
}

export interface Conversation {
  _id: string;
  participants: any[];
  isGroup: boolean;
  name?: string;
  projectId?: string;
  lastMessage?: Message;
  acceptedBy: string[];
  rejectedBy: string[];
  updatedAt: string;
  unreadCount?: number;
}

interface ChatState {
  isOpen: boolean;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  setIsOpen: (isOpen: boolean) => void;
  fetchConversations: () => Promise<void>;
  setActiveConversation: (conversation: Conversation | null) => void;
  fetchMessages: (conversationId: string) => Promise<void>;
  addMessage: (message: Message, currentUserId?: string) => void;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  startDirectMessage: (participantId: string) => Promise<void>;
  acceptConversation: (conversationId: string) => Promise<void>;
  rejectConversation: (conversationId: string) => Promise<void>;
  editMessage: (messageId: string, text: string) => Promise<void>;
  deleteMessageForMe: (messageId: string) => Promise<void>;
  deleteMessageForEveryone: (messageId: string) => Promise<void>;
  updateMessageInStore: (message: Message) => void;
  removeMessageFromStore: (messageId: string) => void;
  onlineUsers: string[];
  setOnlineUsers: (users: string[]) => void;
  markAsRead: (conversationId: string) => Promise<void>;
  markAsDelivered: (conversationId: string) => Promise<void>;
  incrementUnreadCount: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
}


export const useChatStore = create<ChatState>((set, get) => ({
  isOpen: false,
  conversations: [],
  activeConversation: null,
  messages: [],
  loading: false,
  onlineUsers: [],

  setIsOpen: (isOpen) => set({ isOpen }),

  fetchConversations: async () => {
    try {
      const res = await api.get('/chats');
      set({ conversations: res.data });
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    }
  },

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation });
    if (conversation) {
      get().fetchMessages(conversation._id);
      get().markAsRead(conversation._id);
    }
  },

  fetchMessages: async (conversationId) => {
    set({ loading: true });
    try {
      const res = await api.get(`/chats/${conversationId}/messages`);
      set({ messages: res.data, loading: false });
    } catch (error) {
      console.error('Failed to fetch messages', error);
      set({ loading: false });
    }
  },

  addMessage: (message, currentUserId) => {
    const { activeConversation, messages, conversations } = get();
    
    // If message belongs to active chat, add to messages list
    if (activeConversation?._id === message.conversationId) {
      // Check if already exists
      if (!messages.find(m => m._id === message._id)) {
        set({ messages: [...messages, message] });
      }
    }

    // Update conversation's last message and unread count
    const updatedConversations = conversations.map(c => {
      if (c._id === message.conversationId) {
        const isInactive = activeConversation?._id !== message.conversationId;
        const isMe = message.sender._id === currentUserId;
        const unreadCount = (isInactive && !isMe) ? (c.unreadCount || 0) + 1 : 0;
        return { 
          ...c, 
          lastMessage: message, 
          updatedAt: new Date().toISOString(),
          unreadCount: unreadCount
        };
      }
      return c;
    });
    
    // Sort so most recent is at top
    updatedConversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    set({ conversations: updatedConversations });
  },

  sendMessage: async (conversationId, text) => {
    try {
      const res = await api.post(`/chats/${conversationId}/messages`, { text });
      // No need to addMessage here, the socket event 'receive_message' will do it
      
      // But we can do optimistic update if we want. For now let's rely on socket for simplicity.
    } catch (error) {
      console.error('Failed to send message', error);
    }
  },

  startDirectMessage: async (participantId) => {
    try {
      const res = await api.post('/chats', { participantId });
      const conversation = res.data;
      
      // Add to list if not there
      const existing = get().conversations.find(c => c._id === conversation._id);
      if (!existing) {
        set({ conversations: [conversation, ...get().conversations] });
      }
      
      // Open chat and set active
      set({ isOpen: true, activeConversation: conversation });
      get().fetchMessages(conversation._id);
    } catch (error) {
      console.error('Failed to start chat', error);
    }
  },

  acceptConversation: async (conversationId) => {
    try {
      const res = await api.post(`/chats/${conversationId}/accept`);
      const updatedConversation = res.data;
      
      // Update in conversations list
      const updatedConversations = get().conversations.map(c => 
        c._id === conversationId ? updatedConversation : c
      );
      
      set({ 
        conversations: updatedConversations,
        activeConversation: get().activeConversation?._id === conversationId ? updatedConversation : get().activeConversation
      });
    } catch (error) {
      console.error('Failed to accept conversation', error);
      throw error;
    }
  },

  rejectConversation: async (conversationId) => {
    try {
      await api.post(`/chats/${conversationId}/reject`);
      
      // Remove from conversations list
      const updatedConversations = get().conversations.filter(c => c._id !== conversationId);
      
      set({ 
        conversations: updatedConversations,
        activeConversation: get().activeConversation?._id === conversationId ? null : get().activeConversation
      });
    } catch (error) {
      console.error('Failed to reject conversation', error);
      throw error;
    }
  },

  editMessage: async (messageId, text) => {
    try {
      await api.put(`/chats/messages/${messageId}`, { text });
      // Store will be updated by socket event 'message_updated'
    } catch (error) {
      console.error('Failed to edit message', error);
    }
  },

  deleteMessageForMe: async (messageId) => {
    try {
      await api.delete(`/chats/messages/${messageId}/me`);
      set({ messages: get().messages.filter(m => m._id !== messageId) });
    } catch (error) {
      console.error('Failed to delete message for me', error);
    }
  },

  deleteMessageForEveryone: async (messageId) => {
    try {
      await api.delete(`/chats/messages/${messageId}/all`);
      // Store will be updated by socket event 'message_deleted'
    } catch (error) {
      console.error('Failed to delete message for everyone', error);
    }
  },

  updateMessageInStore: (updatedMessage) => {
    const { messages, conversations } = get();
    
    // Update in messages list
    const updatedMessages = messages.map(m => m._id === updatedMessage._id ? updatedMessage : m);
    
    // Update in conversations list (last message)
    const updatedConversations = conversations.map(c => {
      if (c.lastMessage?._id === updatedMessage._id) {
        return { ...c, lastMessage: updatedMessage };
      }
      return c;
    });

    set({ 
      messages: updatedMessages,
      conversations: updatedConversations
    });
  },

  removeMessageFromStore: (messageId) => {
    const { messages, conversations } = get();
    
    // Update messages list
    const updatedMessages = messages.filter(m => m._id !== messageId);
    
    // Update conversations list
    const updatedConversations = conversations.map(c => {
      if (c.lastMessage?._id === messageId) {
        return { 
          ...c, 
          lastMessage: null
        };
      }
      return c;
    });

    set({ 
      messages: updatedMessages,
      conversations: updatedConversations
    });
  },

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  markAsRead: async (conversationId) => {
    try {
      await api.post(`/chats/${conversationId}/read`);
      
      // Update local state
      const updatedConversations = get().conversations.map(c => 
        c._id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      set({ conversations: updatedConversations });
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  },

  markAsDelivered: async (conversationId) => {
    try {
      await api.post(`/chats/${conversationId}/delivered`);
    } catch (error) {
      console.error('Failed to mark as delivered', error);
    }
  },

  incrementUnreadCount: (conversationId) => {
    const { conversations, activeConversation } = get();
    if (activeConversation?._id === conversationId) return;

    const updatedConversations = conversations.map(c => 
      c._id === conversationId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c
    );
    set({ conversations: updatedConversations });
  },
  
  deleteConversation: async (conversationId) => {
    try {
      await api.delete(`/chats/${conversationId}`);
      set({ 
        conversations: get().conversations.filter(c => c._id !== conversationId),
        activeConversation: get().activeConversation?._id === conversationId ? null : get().activeConversation
      });
    } catch (error) {
      console.error('Failed to delete conversation', error);
      throw error;
    }
  },

  blockUser: async (userId) => {
    try {
      await api.post(`/chats/users/${userId}/block`);
      // Update local user state if needed, but for now just returning success
    } catch (error) {
      console.error('Failed to block user', error);
      throw error;
    }
  },

  unblockUser: async (userId) => {
    try {
      await api.post(`/chats/users/${userId}/unblock`);
    } catch (error) {
      console.error('Failed to unblock user', error);
      throw error;
    }
  },
}));
