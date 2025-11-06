import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
    Send,
    MoreVertical,
    Search,
    User,
    Store,
    MessageCircle,
    Image as ImageIcon,
    X,
    Flag,
    XCircle,
    AlertTriangle,
    EyeOff,
    ExternalLink,
    Settings,
    MessagesSquare,
    CheckCircle
} from "lucide-react";
import chatApi from "../../api/chatApi";
import websocketService from "../../services/websocketService";
import sellerApi from "../../api/sellerApi";
import { fetchPostProductById } from "../../api/productApi";
import "./Chat.css";

export function Chat() {
    const location = useLocation();
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [userRole, setUserRole] = useState('buyer'); // 'buyer' hoặc 'seller'
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState("");
    const fileInputRef = useRef(null);
    const menuRef = useRef(null);
    const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
    const [isSidebarMenuOpen, setIsSidebarMenuOpen] = useState(false);
    const sidebarMenuRef = useRef(null);
    // Modals and feature states for sidebar actions
    const [isAutoReplyModalOpen, setIsAutoReplyModalOpen] = useState(false);
    const [autoReplyEnabled, setAutoReplyEnabled] = useState(
        JSON.parse(localStorage.getItem('chat_autoReply_enabled') || 'false')
    );
    const [autoReplyMessage, setAutoReplyMessage] = useState(
        localStorage.getItem('chat_autoReply_message') || "Xin chào! Hiện chúng tôi đang bận, sẽ phản hồi sớm nhất."
    );
    const [isQuickRepliesModalOpen, setIsQuickRepliesModalOpen] = useState(false);
    const [quickReplies, setQuickReplies] = useState(() => {
        try {
            const saved = localStorage.getItem('chat_quickReplies');
            const parsed = saved ? JSON.parse(saved) : null;
            const defaults = [
                "Xe/Pin còn bảo hành không?",
                "Dung lượng pin thực tế còn khoảng bao nhiêu?",
                "Giá có thương lượng không?",
                "Bạn có hỗ trợ giao/ship không?",
                "Xe đã thay pin/bảo dưỡng gần đây chưa?"
            ];
            return (parsed && Array.isArray(parsed) ? parsed : defaults).slice(0, 5);
        } catch {
            return [
                "Xe/Pin còn bảo hành không?",
                "Dung lượng pin thực tế còn khoảng bao nhiêu?",
                "Giá có thương lượng không?",
                "Bạn có hỗ trợ giao/ship không?",
                "Xe đã thay pin/bảo dưỡng gần đây chưa?"
            ];
        }
    });
    const [newQuickReply, setNewQuickReply] = useState("");
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [selectedConversationIds, setSelectedConversationIds] = useState([]);
    const [isHiddenModalOpen, setIsHiddenModalOpen] = useState(false);
    const [isSpamModalOpen, setIsSpamModalOpen] = useState(false);
    const [isAutoReplyRestrictionOpen, setIsAutoReplyRestrictionOpen] = useState(false);
    const [hiddenConversationIds, setHiddenConversationIds] = useState(() => {
        try { return JSON.parse(localStorage.getItem('chat_hidden_ids') || '[]'); } catch { return []; }
    });
    const [spamConversationIds, setSpamConversationIds] = useState(() => {
        try { return JSON.parse(localStorage.getItem('chat_spam_ids') || '[]'); } catch { return []; }
    });
    const [blockedConversationIds, setBlockedConversationIds] = useState(() => {
        try { return JSON.parse(localStorage.getItem('chat_blocked_ids') || '[]'); } catch { return []; }
    });
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('Gian lận/Không trung thực');
    const [reportDetails, setReportDetails] = useState("");
    const [reportImages, setReportImages] = useState([]);
    const reportFileRef = useRef(null);

    // Thông tin seller (để hiển thị trong chat header)
    const [sellerInfo, setSellerInfo] = useState(null);

    const handleInsertQuickReply = (text) => {
        setMessage(text);
    };

    // Danh sách conversations (load từ API)
    const [chatList, setChatList] = useState([]);

    // Tin nhắn theo conversation (load từ API hoặc real-time)
    const [messages, setMessages] = useState({});

    // Helper function để format time
    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return "Vừa xong";
        if (minutes < 60) return `${minutes} phút`;
        if (hours < 24) return `${hours} giờ`;
        if (days === 1) return "Hôm qua";
        if (days < 7) return `${days} ngày`;
        return date.toLocaleDateString('vi-VN');
    };

    // Lấy thông tin seller từ postId
    const loadSellerInfo = async (postId) => {
        if (!postId) {
            setSellerInfo(null);
            return;
        }
        
        try {
            const sellerData = await sellerApi.getSellerByProductId(postId);
            if (sellerData?.data?.data) {
                setSellerInfo(sellerData.data.data);
            } else if (sellerData?.data) {
                setSellerInfo(sellerData.data);
            } else {
                setSellerInfo(sellerData);
            }
        } catch (error) {
            console.error("[Chat] Error loading seller info:", error);
            setSellerInfo(null);
        }
    };

    // Load messages của một conversation từ BE
    const loadMessages = async (conversationId) => {
        if (!conversationId) return;
        
        try {
            console.log("[Chat] Loading messages for conversation:", conversationId);
            const response = await chatApi.getMessagesByConversationId(conversationId);
            
            // Xử lý response - có thể có cấu trúc khác nhau
            let messagesData = [];
            
            // Kiểm tra nhiều cấu trúc response khác nhau
            if (response?.data?.data) {
                // Cấu trúc: { data: { data: [...] } }
                if (Array.isArray(response.data.data)) {
                    messagesData = response.data.data;
                } else if (response.data.data.messages && Array.isArray(response.data.data.messages)) {
                    messagesData = response.data.data.messages;
                } else if (response.data.data.list && Array.isArray(response.data.data.list)) {
                    messagesData = response.data.data.list;
                } else if (response.data.data.content && Array.isArray(response.data.data.content)) {
                    messagesData = response.data.data.content;
                }
            } else if (response?.data) {
                // Cấu trúc: { data: [...] } hoặc { data: { messages: [...] } }
                if (Array.isArray(response.data)) {
                    messagesData = response.data;
                } else if (response.data.messages && Array.isArray(response.data.messages)) {
                    messagesData = response.data.messages;
                } else if (response.data.list && Array.isArray(response.data.list)) {
                    messagesData = response.data.list;
                } else if (response.data.content && Array.isArray(response.data.content)) {
                    messagesData = response.data.content;
                }
            } else if (Array.isArray(response)) {
                // Cấu trúc: [...] (response trực tiếp là array)
                messagesData = response;
            }
            
            // Nếu không có messages, log cảnh báo và return
            if (!messagesData || messagesData.length === 0) {
                console.warn("[Chat] No messages found in response. Full response structure:", {
                    response: response,
                    responseData: response?.data,
                    responseDataData: response?.data?.data,
                    responseDataKeys: response?.data ? Object.keys(response.data) : [],
                    responseDataDataKeys: response?.data?.data ? Object.keys(response.data.data) : []
                });
                // Vẫn set messages rỗng để tránh lỗi
                setMessages(prev => ({
                    ...prev,
                    [conversationId]: []
                }));
                return;
            }
            
            // Lấy buyerId, sellerId và userRole để xác định sender
            const buyerId = localStorage.getItem('buyerId');
            const sellerId = localStorage.getItem('sellerId');
            const currentUserRole = localStorage.getItem('userRole') || 'buyer';
            
            // Xác định currentUserId: ID của người đang đăng nhập
            const currentUserId = currentUserRole === 'seller' && sellerId ? sellerId : buyerId;
            
            
            // Transform messages từ BE format sang format UI
            const transformedMessages = messagesData.map((msg) => {
                const msgSenderId = msg.senderId || msg.sender?.id || msg.sender;
                
                // Xác định sender dựa vào senderId và buyerId
                // Nếu senderId === buyerId → sender là "buyer"
                // Nếu senderId !== buyerId → sender là "seller"
                const isBuyer = buyerId && String(msgSenderId) === String(buyerId);
                
                // Xác định tin nhắn có phải của mình không (để hiển thị sent/received)
                const isMyMessage = currentUserId && String(msgSenderId) === String(currentUserId);
                
                // Format time để hiển thị
                const msgTime = msg.sendAt || msg.createdAt || msg.created_at || msg.timestamp || new Date().toISOString();
                const date = new Date(msgTime);
                const formattedTime = date.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                return {
                    id: msg.id || msg.messageId || Date.now() + Math.random(),
                    text: msg.content || msg.text || "",
                    imageUrl: msg.imageUrl || msg.picture || msg.image || null,
                    sender: isBuyer ? 'buyer' : 'seller', // Role của người gửi
                    senderId: msgSenderId, // ID của người gửi
                    receiverId: msg.receiverId || msg.receiver?.id || msg.receiver,
                    isMyMessage: isMyMessage, // Flag để xác định tin nhắn của mình
                    time: formattedTime,
                    createdAt: msgTime
                };
            });
            
            // Sắp xếp messages theo thời gian (cũ nhất trước)
            transformedMessages.sort((a, b) => {
                const timeA = new Date(a.createdAt || a.time).getTime();
                const timeB = new Date(b.createdAt || b.time).getTime();
                return timeA - timeB;
            });
            
            console.log("[Chat] Loaded", transformedMessages.length, "messages for conversation:", conversationId);
            
            // Lưu messages vào state
            setMessages(prev => ({
                ...prev,
                [conversationId]: transformedMessages
            }));
        } catch (error) {
            console.error("[Chat] Error loading messages:", error);
            // Nếu lỗi, set messages rỗng để tránh hiển thị lỗi
            setMessages(prev => ({
                ...prev,
                [conversationId]: []
            }));
        }
    };

    // Load danh sách conversations từ BE
    const loadConversations = async () => {
        try {
            const response = await chatApi.getAllConversations();
            console.log("[Chat] Raw API response:", response);
            console.log("[Chat] Response.data:", response.data);
            
            // BE trả về format: { success, message, data: [...conversations], errors }
            const rawResponse = response?.data ?? {};
            console.log("[Chat] Raw response structure:", {
                hasSuccess: 'success' in rawResponse,
                hasData: 'data' in rawResponse,
                hasMessage: 'message' in rawResponse,
                dataType: typeof rawResponse?.data,
                isArray: Array.isArray(rawResponse?.data)
            });
            
            // Extract conversations từ data
            const conversations = rawResponse?.data || [];
            console.log("[Chat] Conversations extracted:", conversations);
            
            if (Array.isArray(conversations) && conversations.length > 0) {
                // Transform conversations và fetch seller info cho mỗi conversation
                const transformedChatsPromises = conversations.map(async (conv) => {
                    console.log("[Chat] Mapping conversation:", conv);
                    const chatItem = {
                        id: conv.id || conv.conversationId,
                        name: conv.sellerName || conv.buyerName || conv.seller?.sellerName || conv.buyer?.username || "Người dùng",
                        avatar: conv.sellerAvatar || conv.buyerAvatar || conv.seller?.avatar || conv.buyer?.avatar || "/default-avatar.png",
                        lastMessage: conv.lastMessage?.content || conv.lastMessage || "",
                        time: formatTime(conv.lastMessage?.createdAt || conv.lastMessage?.sendAt),
                        unread: conv.unreadCount || 0,
                        isOnline: false, // TODO: Check online status
                        role: userRole === 'buyer' ? 'seller' : 'buyer',
                        conversationId: conv.id || conv.conversationId,
                        postId: conv.postId,
                        sellerInfo: null, // Sẽ được fill sau
                        productInfo: null, // Thông tin sản phẩm để phân biệt conversations
                        // Lưu thêm raw data để debug
                        _raw: conv
                    };
                    
                    // Nếu có postId, fetch product info và seller info
                    if (conv.postId) {
                        // Fetch product info để hiển thị tên và hình ảnh sản phẩm
                        try {
                            const productData = await fetchPostProductById(conv.postId);
                            if (productData) {
                                chatItem.productInfo = {
                                    title: productData.title || productData.name || "Sản phẩm",
                                    image: productData.images?.[0] || productData.image || productData.imageUrl || null,
                                    price: productData.price || null
                                };
                            }
                        } catch (error) {
                            console.error("[Chat] Error loading product info for conversation:", conv.id, error);
                        }
                        
                        // Nếu là buyer và có postId, fetch seller info
                        if (userRole === 'buyer') {
                            try {
                                const sellerData = await sellerApi.getSellerByProductId(conv.postId);
                                if (sellerData?.data?.data) {
                                    chatItem.sellerInfo = sellerData.data.data;
                                    // Update name và avatar từ seller info
                                    chatItem.name = sellerData.data.data.storeName || sellerData.data.data.sellerName || chatItem.name;
                                    chatItem.avatar = sellerData.data.data.avatar || chatItem.avatar;
                                } else if (sellerData?.data) {
                                    chatItem.sellerInfo = sellerData.data;
                                    chatItem.name = sellerData.data.storeName || sellerData.data.sellerName || chatItem.name;
                                    chatItem.avatar = sellerData.data.avatar || chatItem.avatar;
                                } else if (sellerData) {
                                    chatItem.sellerInfo = sellerData;
                                    chatItem.name = sellerData.storeName || sellerData.sellerName || chatItem.name;
                                    chatItem.avatar = sellerData.avatar || chatItem.avatar;
                                }
                            } catch (error) {
                                console.error("[Chat] Error loading seller info for conversation:", conv.id, error);
                            }
                        }
                    }
                    
                    return chatItem;
                });
                
                const transformedChats = await Promise.all(transformedChatsPromises);
                console.log("[Chat] Transformed chats with seller info:", transformedChats);
                
                // Loại bỏ duplicate conversations dựa trên conversationId
                // Nếu có nhiều conversations với cùng conversationId, chỉ giữ lại conversation đầu tiên
                const uniqueChats = [];
                const seenConversationIds = new Set();
                
                for (const chat of transformedChats) {
                    const conversationId = chat.id || chat.conversationId;
                    
                    // Nếu có conversationId, check duplicate
                    if (conversationId) {
                        if (!seenConversationIds.has(conversationId)) {
                            seenConversationIds.add(conversationId);
                            uniqueChats.push(chat);
                        } else {
                            console.warn("[Chat] Duplicate conversation found, skipping:", conversationId);
                        }
                    } 
                    // Nếu không có conversationId, vẫn add (có thể là conversation mới chưa có ID)
                    else {
                        uniqueChats.push(chat);
                    }
                }
                
                console.log("[Chat] Unique chats after deduplication:", uniqueChats);
                console.log("[Chat] Total conversations before deduplication:", transformedChats.length);
                console.log("[Chat] Total conversations after deduplication:", uniqueChats.length);
                setChatList(uniqueChats);
            } else {
                console.warn("[Chat] No conversations found or empty array");
                // Keep mock data
            }
        } catch (error) {
            console.error("[Chat] Error loading conversations:", error);
            // Fallback to mock data if API fails
        }
    };

    useEffect(() => {
        // Lấy thông tin user role từ localStorage hoặc API
        const role = localStorage.getItem('userRole') || 'buyer';
        setUserRole(role);
        
        // Load conversations từ API chỉ khi component mount hoặc location.key thay đổi (tạo conversation mới)
        // KHÔNG reload mỗi lần click vào chat
        loadConversations();
        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.key]); // Reload khi navigate (tạo conversation mới)
    
    // Subscribe to real-time chat messages via WebSocket
    useEffect(() => {
        const buyerId = localStorage.getItem('buyerId');
        const sellerId = localStorage.getItem('sellerId');
        const currentUserRole = localStorage.getItem('userRole') || 'buyer';
        
        // Xác định ID để subscribe WebSocket
        let userId = buyerId;
        if (currentUserRole === 'seller' && sellerId) {
            userId = sellerId;
        }
        
        if (!userId) {
            console.warn('[Chat] No userId found, skipping WebSocket subscription. buyerId:', buyerId, 'sellerId:', sellerId, 'role:', currentUserRole);
            return;
        }
        
        const chatDestination = `/chatting/notifications/${userId}`;
        console.log('[Chat] Subscribing to WebSocket chat messages:', chatDestination, 'UserRole:', currentUserRole);
        
        // Subscribe to chat messages
        const unsubscribe = websocketService.subscribe(chatDestination, (chatMessage) => {
            console.log('[Chat] New chat message received via WebSocket:', chatMessage);
            
                // Add the new message to the messages state
                if (chatMessage.conversationId || chatMessage.conversation?.id) {
                    const conversationId = chatMessage.conversationId || chatMessage.conversation.id;
                    const currentUserRole = localStorage.getItem('userRole') || 'buyer';
                    
                    // Xác định sender giống như logic trong loadMessages
                    const msgSenderId = chatMessage.senderId || chatMessage.sender?.id || chatMessage.sender;
                    const sellerId = localStorage.getItem('sellerId');
                    
                    // Xác định sender dựa vào senderId và buyerId
                    const isBuyer = buyerId && String(msgSenderId) === String(buyerId);
                    
                    // Xác định currentUserId: ID của người đang đăng nhập
                    const currentUserId = currentUserRole === 'seller' && sellerId ? sellerId : buyerId;
                    
                    // Xác định tin nhắn có phải của mình không
                    const isMyMessage = currentUserId && String(msgSenderId) === String(currentUserId);
                    
                    setMessages(prev => {
                        const currentMessages = prev[conversationId] || [];
                        const msgTime = chatMessage.createdAt || chatMessage.sendAt || new Date().toISOString();
                        const date = new Date(msgTime);
                        const formattedTime = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                        
                        const newMessage = {
                            id: chatMessage.id || Date.now(),
                            text: chatMessage.content || "",
                            imageUrl: chatMessage.imageUrl || chatMessage.pictureUrl || null,
                            sender: isBuyer ? "buyer" : "seller", // Role của người gửi
                            senderId: msgSenderId, // ID của người gửi
                            receiverId: chatMessage.receiverId || chatMessage.receiver?.id || chatMessage.receiver,
                            isMyMessage: isMyMessage, // Flag để xác định tin nhắn của mình
                            time: formattedTime,
                            createdAt: msgTime
                        };
                        
                        // Add to messages
                    return {
                        ...prev,
                        [conversationId]: [...currentMessages, newMessage]
                    };
                });
                
                // Update last message in chat list
                setChatList(prev => prev.map(chat => 
                    chat.conversationId === conversationId
                        ? { ...chat, lastMessage: chatMessage.content || "[Hình ảnh]", time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }
                        : chat
                ));
            }
        });
        
        // Cleanup subscription on unmount
        return () => {
            console.log('[Chat] Cleaning up WebSocket subscription');
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        const onClickOutside = (e) => {
            if (isActionsMenuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
                setIsActionsMenuOpen(false);
            }
            if (isSidebarMenuOpen && sidebarMenuRef.current && !sidebarMenuRef.current.contains(e.target)) {
                setIsSidebarMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [isActionsMenuOpen, isSidebarMenuOpen]);

    // Lock page scroll while on Chat page
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    const handleOpenAutoReplySettings = () => {
        if (userRole !== 'seller') {
            setIsAutoReplyRestrictionOpen(true);
            setIsSidebarMenuOpen(false);
            return;
        }
        setIsAutoReplyModalOpen(true);
        setIsSidebarMenuOpen(false);
    };

    useEffect(() => {
        localStorage.setItem('chat_autoReply_enabled', JSON.stringify(autoReplyEnabled));
    }, [autoReplyEnabled]);

    useEffect(() => {
        localStorage.setItem('chat_autoReply_message', autoReplyMessage);
    }, [autoReplyMessage]);

    useEffect(() => {
        localStorage.setItem('chat_quickReplies', JSON.stringify(quickReplies));
    }, [quickReplies]);

    useEffect(() => {
        localStorage.setItem('chat_hidden_ids', JSON.stringify(hiddenConversationIds));
    }, [hiddenConversationIds]);

    useEffect(() => {
        localStorage.setItem('chat_spam_ids', JSON.stringify(spamConversationIds));
    }, [spamConversationIds]);

    useEffect(() => {
        localStorage.setItem('chat_blocked_ids', JSON.stringify(blockedConversationIds));
    }, [blockedConversationIds]);

    // Load messages khi selectedChat thay đổi hoặc khi reload trang
    useEffect(() => {
        if (selectedChat) {
            const conversationId = selectedChat.conversationId || selectedChat.id;
            if (conversationId) {
                // Luôn load messages từ API khi chọn conversation (để đảm bảo có dữ liệu mới nhất)
                loadMessages(conversationId);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChat?.id, selectedChat?.conversationId]);



    const handleChatSelect = (chat) => {
        // Chỉ set selectedChat nếu chat hợp lệ và có conversationId hoặc postId
        if (!chat || (!chat.id && !chat.conversationId && !chat.postId)) {
            console.warn("[Chat] Invalid chat selected:", chat);
            return;
        }
        
        setSelectedChat(chat);
        
        // Đánh dấu tin nhắn đã đọc
        setChatList(prev => prev.map(c =>
            (c.id === chat.id || c.conversationId === chat.conversationId) ? { ...c, unread: 0 } : c
        ));
        
        // Nếu chat đã có sellerInfo, dùng luôn, không cần fetch lại
        if (chat.sellerInfo) {
            setSellerInfo(chat.sellerInfo);
        } else if (userRole === 'buyer' && chat.postId) {
            // Chỉ fetch nếu chưa có sellerInfo
            loadSellerInfo(chat.postId);
        } else {
            setSellerInfo(null);
        }
        
        // Messages sẽ được load tự động bởi useEffect khi selectedChat thay đổi
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !selectedChat) return;
        
        const messageText = message.trim();
        const buyerId = localStorage.getItem('buyerId');
        
        if (!buyerId) {
            alert("Không thể xác định người dùng. Vui lòng đăng nhập lại!");
            return;
        }

        try {
            // Lấy currentUserId để xác định isMyMessage
            const sellerId = localStorage.getItem('sellerId');
            const currentUserId = userRole === 'seller' && sellerId ? sellerId : buyerId;
            
            // Gửi tin nhắn lên BE
            await chatApi.sendMessage(
                selectedChat.conversationId || selectedChat.id,
                buyerId,
                selectedChat.postId,
                messageText,
                null // Không có file
            );

            // Update UI optimistically
            const now = new Date();
            const newMessage = {
                id: Date.now(),
                text: messageText,
                sender: userRole,
                senderId: currentUserId, // ID của người gửi (chính mình)
                isMyMessage: true, // Tin nhắn của mình → hiển thị bên phải
                time: now.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                createdAt: now.toISOString()
            };

            setMessages(prev => ({
                ...prev,
                [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage]
            }));

            // Cập nhật tin nhắn cuối trong danh sách chat
            setChatList(prev => prev.map(chat =>
                chat.id === selectedChat.id
                    ? { ...chat, lastMessage: messageText, time: newMessage.time }
                    : chat
            ));

            setMessage("");
        } catch (error) {
            console.error("[Chat] Error sending message:", error);
            alert("Gửi tin nhắn thất bại. Vui lòng thử lại!");
        }
    };

    const handleOpenFileDialog = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleImageChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file || !selectedChat) return;
        // Chỉ nhận ảnh
        if (!file.type.startsWith("image/")) {
            return;
        }
        setSelectedImageFile(file);

        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImagePreviewUrl(reader.result || "");
        };
        reader.readAsDataURL(file);
        // reset input để có thể chọn lại cùng một file nếu muốn
        e.target.value = "";
    };

    const handleClearSelectedImage = () => {
        setSelectedImageFile(null);
        setSelectedImagePreviewUrl("");
    };

    const handleSendImage = async () => {
        if (!selectedChat || !selectedImagePreviewUrl || !selectedImageFile) return;
        
        const buyerId = localStorage.getItem('buyerId');
        
        if (!buyerId) {
            alert("Không thể xác định người dùng. Vui lòng đăng nhập lại!");
            return;
        }

        try {
            // Lấy currentUserId để xác định isMyMessage
            const sellerId = localStorage.getItem('sellerId');
            const currentUserId = userRole === 'seller' && sellerId ? sellerId : buyerId;
            
            // Gửi ảnh lên BE
            await chatApi.sendMessage(
                selectedChat.conversationId || selectedChat.id,
                buyerId,
                selectedChat.postId,
                "", // Không có text
                selectedImageFile // Có file ảnh
            );

            // Update UI optimistically
            const now = new Date();
            const newMessage = {
                id: Date.now(),
                text: "",
                imageUrl: selectedImagePreviewUrl,
                sender: userRole,
                senderId: currentUserId, // ID của người gửi (chính mình)
                isMyMessage: true, // Tin nhắn của mình → hiển thị bên phải
                time: now.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                createdAt: now.toISOString()
            };

            setMessages(prev => ({
                ...prev,
                [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage]
            }));

            // Cập nhật tin nhắn cuối trong danh sách chat
            setChatList(prev => prev.map(chat =>
                chat.id === selectedChat.id
                    ? { ...chat, lastMessage: "[Hình ảnh]", time: newMessage.time }
                    : chat
            ));

            handleClearSelectedImage();
        } catch (error) {
            console.error("[Chat] Error sending image:", error);
            alert("Gửi ảnh thất bại. Vui lòng thử lại!");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const filteredChats = chatList
        .filter(chat => chat.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(chat => !hiddenConversationIds.includes(chat.id) && !spamConversationIds.includes(chat.id));

    const isSelectedChatBlocked = selectedChat ? blockedConversationIds.includes(selectedChat.id) : false;

    const handleToggleHide = () => {
        if (!selectedChat) return;
        setHiddenConversationIds(prev => prev.includes(selectedChat.id) ? prev.filter(id => id !== selectedChat.id) : [...prev, selectedChat.id]);
        setIsActionsMenuOpen(false);
        setSelectedChat(null);
    };

    const handleToggleSpam = () => {
        if (!selectedChat) return;
        setSpamConversationIds(prev => prev.includes(selectedChat.id) ? prev.filter(id => id !== selectedChat.id) : [...prev, selectedChat.id]);
        setIsActionsMenuOpen(false);
        setSelectedChat(null);
    };

    const handleToggleBlock = () => {
        if (!selectedChat) return;
        setBlockedConversationIds(prev => prev.includes(selectedChat.id) ? prev.filter(id => id !== selectedChat.id) : [...prev, selectedChat.id]);
        setIsActionsMenuOpen(false);
    };

    const handleSubmitReport = () => {
        if (!selectedChat) return;
        try {
            const key = 'chat_reports';
            const saved = JSON.parse(localStorage.getItem(key) || '[]');
            const newItem = {
                id: Date.now(),
                conversationId: selectedChat.id,
                name: selectedChat.name,
                reason: reportReason,
                details: reportDetails.slice(0, 500),
                images: reportImages,
                createdAt: new Date().toISOString()
            };
            localStorage.setItem(key, JSON.stringify([newItem, ...saved].slice(0, 100)));
        } catch (error) {
            console.error("Error saving report:", error);
        }
        setIsReportModalOpen(false);
        setReportDetails("");
        setReportImages([]);
        setIsActionsMenuOpen(false);
    };

    const handlePickReportImage = () => {
        if (reportFileRef.current) reportFileRef.current.click();
    };

    const handleReportImageChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => {
            setReportImages(prev => prev.length >= 3 ? prev : [...prev, reader.result || '']);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleRemoveReportImage = (idx) => {
        setReportImages(prev => prev.filter((_, i) => i !== idx));
    };

    return (
        <>
            <div className="chat-container">
                <div className="chat-layout">
                    {/* Sidebar - Danh sách chat */}
                    <div className="chat-sidebar">
                        <div className="chat-sidebar-header">
                            <h2>Tin nhắn</h2>
                            <div className="sidebar-menu-wrapper">
                                <button className="menu-btn" onClick={() => setIsSidebarMenuOpen(v => !v)} aria-haspopup="menu" aria-expanded={isSidebarMenuOpen}>
                                    <MoreVertical size={20} />
                                </button>
                                {isSidebarMenuOpen && (
                                    <div className="sidebar-actions-menu" ref={sidebarMenuRef} role="menu">
                                        <button className="menu-item" onClick={handleOpenAutoReplySettings} role="menuitem">
                                            <Settings size={18} />
                                            <span>Cài đặt trả lời tự động</span>
                                        </button>
                                        <button className="menu-item" onClick={() => { setIsQuickRepliesModalOpen(true); setIsSidebarMenuOpen(false); }} role="menuitem">
                                            <MessagesSquare size={18} />
                                            <span>Quản lý Tin nhắn nhanh</span>
                                        </button>
                                        <button className="menu-item" onClick={() => { setIsMultiSelectMode(true); setSelectedConversationIds([]); setIsSidebarMenuOpen(false); }} role="menuitem">
                                            <CheckCircle size={18} />
                                            <span>Chọn nhiều hội thoại</span>
                                        </button>
                                        <button className="menu-item" onClick={() => { setIsHiddenModalOpen(true); setIsSidebarMenuOpen(false); }} role="menuitem">
                                            <EyeOff size={18} />
                                            <span>Hội thoại đã ẩn</span>
                                        </button>
                                        <button className="menu-item" onClick={() => { setIsSpamModalOpen(true); setIsSidebarMenuOpen(false); }} role="menuitem">
                                            <AlertTriangle size={18} />
                                            <span>Tin nhắn rác</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="search-container">
                            <Search size={16} className="search-icon" />
                            <input
                                type="text"
                                placeholder=" Tìm kiếm cuộc trò chuyện..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        {isMultiSelectMode && (
                            <div className="multi-select-toolbar">
                                <span>{selectedConversationIds.length} đã chọn</span>
                                <div className="multi-select-actions">
                                    <button onClick={() => {
                                        if (selectedConversationIds.length) {
                                            setHiddenConversationIds(Array.from(new Set([...hiddenConversationIds, ...selectedConversationIds])));
                                            setSelectedConversationIds([]);
                                        }
                                    }}>Ẩn</button>
                                    <button onClick={() => {
                                        if (selectedConversationIds.length) {
                                            setSpamConversationIds(Array.from(new Set([...spamConversationIds, ...selectedConversationIds])));
                                            setSelectedConversationIds([]);
                                        }
                                    }}>Đánh dấu rác</button>
                                    <button onClick={() => { setIsMultiSelectMode(false); setSelectedConversationIds([]); }}>Hủy</button>
                                </div>
                            </div>
                        )}
                        <div className="chat-list">
                            {filteredChats.map((chat) => (
                                <div
                                    key={chat.id}
                                    className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                                    onClick={() => isMultiSelectMode ?
                                        setSelectedConversationIds(prev => prev.includes(chat.id) ? prev.filter(id => id !== chat.id) : [...prev, chat.id])
                                        : handleChatSelect(chat)
                                    }
                                >
                                    <div className="chat-avatar">
                                        <img src={chat.avatar} alt={chat.name} />
                                        {chat.isOnline && <div className="online-indicator"></div>}
                                    </div>
                                    <div className="chat-info">
                                        <div className="chat-name-row">
                                            <h4 className="chat-name">{chat.name}</h4>
                                            <span className="chat-time">{chat.time}</span>
                                        </div>
                                        {chat.productInfo && (
                                            <div className="chat-product-info">
                                                {chat.productInfo.image && (
                                                    <img 
                                                        src={chat.productInfo.image} 
                                                        alt={chat.productInfo.title} 
                                                        className="chat-product-image"
                                                    />
                                                )}
                                                <span className="chat-product-title">{chat.productInfo.title}</span>
                                            </div>
                                        )}
                                        <div className="chat-last-message-row">
                                            <p className="chat-last-message">{chat.lastMessage}</p>
                                            {chat.unread > 0 && (
                                                <span className="unread-badge">{chat.unread}</span>
                                            )}
                                        </div>
                                    </div>
                                    {isMultiSelectMode && (
                                        <input
                                            type="checkbox"
                                            className="chat-select-checkbox"
                                            checked={selectedConversationIds.includes(chat.id)}
                                            onChange={() => { }
                                            }
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Chat Area */}
                    <div className="chat-main">
                        {selectedChat ? (
                            <>
                                {/* Chat Header */}
                                <div className="chat-header">
                                    <div className="chat-header-info">
                                        <div className="chat-header-avatar">
                                            <img src={selectedChat.avatar} alt={selectedChat.name} />
                                            {selectedChat.isOnline && <div className="online-indicator"></div>}
                                        </div>
                                        <div className="chat-header-details">
                                            <div className="chat-header-name-row">
                                                <h3>
                                                    {sellerInfo?.storeName || sellerInfo?.sellerName || selectedChat.name}
                                                </h3>
                                                {sellerInfo?.status === 'ACCEPTED' && (
                                                    <span className="chat-status-verified">Đã xác thực</span>
                                                )}
                                            </div>
                                            {selectedChat.productInfo && (
                                                <div className="chat-header-product">
                                                    {selectedChat.productInfo.image && (
                                                        <img 
                                                            src={selectedChat.productInfo.image} 
                                                            alt={selectedChat.productInfo.title} 
                                                            className="chat-header-product-image"
                                                        />
                                                    )}
                                                    <span className="chat-header-product-title">{selectedChat.productInfo.title}</span>
                                                </div>
                                            )}
                                            {sellerInfo?.status !== 'ACCEPTED' && (
                                                <p className="chat-status">
                                                    {sellerInfo?.status === 'PENDING' ? 'Đang chờ duyệt' :
                                                     sellerInfo ? 'Người bán' : 
                                                     selectedChat.isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="chat-header-actions">
                                        <button className="action-btn" onClick={() => setIsActionsMenuOpen((v) => !v)} aria-haspopup="menu" aria-expanded={isActionsMenuOpen}>
                                            <MoreVertical size={20} />
                                        </button>
                                        {isActionsMenuOpen && (
                                            <div className="chat-actions-menu" ref={menuRef} role="menu">
                                                <div className="chat-actions-profile">
                                                    <div className="profile-avatar">
                                                        <img src={selectedChat.avatar} alt={selectedChat.name} />
                                                    </div>
                                                    <div className="profile-info">
                                                        <div className="profile-name">
                                                            {sellerInfo?.storeName || sellerInfo?.sellerName || selectedChat.name}
                                                        </div>
                                                        <button className="view-page-btn" onClick={() => { window.location.href = `/seller/${selectedChat.id}`; }}>
                                                            <ExternalLink size={14} />
                                                            <span>Xem Trang</span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="menu-separator"></div>
                                                <button className="menu-item" onClick={() => setIsReportModalOpen(true)} role="menuitem">
                                                    <Flag size={18} />
                                                    <span>Báo xấu</span>
                                                </button>
                                                <button className="menu-item" onClick={handleToggleBlock} role="menuitem">
                                                    <XCircle size={18} />
                                                    <span>{blockedConversationIds.includes(selectedChat.id) ? 'Bỏ chặn người dùng' : 'Chặn người dùng'}</span>
                                                </button>
                                                <button className="menu-item" onClick={handleToggleSpam} role="menuitem">
                                                    <AlertTriangle size={18} />
                                                    <span>{spamConversationIds.includes(selectedChat.id) ? 'Bỏ đánh dấu rác' : 'Đánh dấu tin nhắn rác'}</span>
                                                </button>
                                                <button className="menu-item" onClick={handleToggleHide} role="menuitem">
                                                    <EyeOff size={18} />
                                                    <span>{hiddenConversationIds.includes(selectedChat.id) ? 'Bỏ ẩn hội thoại' : 'Ẩn hội thoại'}</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="messages-container">
                                    <div className="messages">
                                        {messages[selectedChat.id]?.map((msg) => {
                                            // Xác định class dựa vào isMyMessage (tin nhắn của mình → sent, tin nhắn của đối tác → received)
                                            // Nếu có flag isMyMessage thì dùng, nếu không thì fallback về logic cũ
                                            const isSent = msg.isMyMessage !== undefined 
                                                ? msg.isMyMessage 
                                                : (msg.sender === userRole);
                                            
                                            return (
                                            <div
                                                key={msg.id}
                                                className={`message ${isSent ? 'sent' : 'received'}`}
                                            >
                                                <div className="message-content">
                                                    {msg.imageUrl ? (
                                                        <div className="image-message">
                                                            <img src={msg.imageUrl} alt="Hình ảnh" />
                                                            {msg.text && <p>{msg.text}</p>}
                                                        </div>
                                                    ) : (
                                                        <p>{msg.text}</p>
                                                    )}
                                                    <span className="message-time">{msg.time}</span>
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Message Input */}
                                <div className="message-input-container">
                                    {isSelectedChatBlocked && (
                                        <div className="warning-banner">Bạn đã chặn người dùng này. Bỏ chặn để tiếp tục nhắn.</div>
                                    )}
                                    {/* Quick replies chips */}
                                    <div className="quick-replies-bar">
                                        {quickReplies.slice(0, 5).map((qr, idx) => (
                                            <button key={idx} className="quick-chip" onClick={() => handleInsertQuickReply(qr)}>{qr}</button>
                                        ))}
                                    </div>
                                    {selectedImagePreviewUrl && (
                                        <div className="image-preview-bar">
                                            <div className="image-preview-thumb">
                                                <img src={selectedImagePreviewUrl} alt="Xem trước" />
                                                <button className="clear-image-btn" onClick={handleClearSelectedImage} aria-label="Xoá ảnh">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <button className="send-image-btn" onClick={handleSendImage}>Gửi ảnh</button>
                                        </div>
                                    )}
                                    <div className="message-input">
                                        <button className="attach-btn" onClick={handleOpenFileDialog} aria-label="Chọn ảnh">
                                            <ImageIcon size={20} />
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            style={{ display: 'none' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Nhập tin nhắn..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            className="message-text-input"
                                            disabled={isSelectedChatBlocked}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            className="send-btn"
                                            disabled={!message.trim() || isSelectedChatBlocked}
                                        >
                                            <Send size={20} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Empty State */
                            <div className="chat-empty">
                                <div className="empty-icon">
                                    <MessageCircle size={64} />
                                </div>
                                <h3>Chọn một cuộc trò chuyện</h3>
                                <p>Bắt đầu trò chuyện với người dùng hoặc người bán</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {
                isAutoReplyModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsAutoReplyModalOpen(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <h3>Cài đặt trả lời tự động</h3>
                            <label className="switch-row">
                                <input type="checkbox" checked={autoReplyEnabled} onChange={(e) => setAutoReplyEnabled(e.target.checked)} />
                                <span>Bật trả lời tự động</span>
                            </label>
                            <textarea className="modal-textarea" rows={4} value={autoReplyMessage} onChange={(e) => setAutoReplyMessage(e.target.value)} />
                            <div className="modal-actions">
                                <button onClick={() => setIsAutoReplyModalOpen(false)}>Hủy</button>
                                <button className="primary" onClick={() => setIsAutoReplyModalOpen(false)}>Lưu</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                isQuickRepliesModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsQuickRepliesModalOpen(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <h3>Quản lý Tin nhắn nhanh</h3>
                            <p style={{ margin: "0 0 8px 0", color: "#6c757d", fontSize: 12 }}>Tối đa 5 tin nhắn sẽ hiển thị phía trên khung nhập.</p>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                <span style={{ fontSize: 12, color: "#6c757d" }}>Đang có {quickReplies.length}/5</span>
                                {quickReplies.length >= 5 && <span style={{ fontSize: 12, color: "#dc3545" }}>Đã đạt giới hạn</span>}
                            </div>
                            <div className="quick-replies-list">
                                {quickReplies.map((qr, idx) => (
                                    <div key={idx} className="quick-reply-item">
                                        <span>{qr}</span>
                                        <button onClick={() => setQuickReplies(quickReplies.filter((_, i) => i !== idx))}>Xóa</button>
                                    </div>
                                ))}
                            </div>
                            <div className="quick-reply-add">
                                <input value={newQuickReply} onChange={(e) => setNewQuickReply(e.target.value)} placeholder="Nhập tin nhắn nhanh mới" disabled={quickReplies.length >= 5} />
                                <button disabled={quickReplies.length >= 5 || !newQuickReply.trim()} onClick={() => { if (newQuickReply.trim() && quickReplies.length < 5) { setQuickReplies([...quickReplies, newQuickReply.trim()]); setNewQuickReply(""); } }}>Thêm</button>
                            </div>
                            <div className="modal-actions">
                                <button onClick={() => setIsQuickRepliesModalOpen(false)}>Đóng</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                isHiddenModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsHiddenModalOpen(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <h3>Hội thoại đã ẩn</h3>
                            <div className="list-group">
                                {hiddenConversationIds.length === 0 && <div className="empty-row">Không có hội thoại ẩn</div>}
                                {hiddenConversationIds.map(id => {
                                    const c = chatList.find(x => x.id === id);
                                    if (!c) return null;
                                    return (
                                        <div key={id} className="list-row">
                                            <span>{c.name}</span>
                                            <button onClick={() => setHiddenConversationIds(hiddenConversationIds.filter(x => x !== id))}>Bỏ ẩn</button>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="modal-actions">
                                <button onClick={() => setIsHiddenModalOpen(false)}>Đóng</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                isSpamModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsSpamModalOpen(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <h3>Tin nhắn rác</h3>
                            <div className="list-group">
                                {spamConversationIds.length === 0 && <div className="empty-row">Không có cuộc trò chuyện bị đánh dấu rác</div>}
                                {spamConversationIds.map(id => {
                                    const c = chatList.find(x => x.id === id);
                                    if (!c) return null;
                                    return (
                                        <div key={id} className="list-row">
                                            <span>{c.name}</span>
                                            <button onClick={() => setSpamConversationIds(spamConversationIds.filter(x => x !== id))}>Bỏ đánh dấu</button>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="modal-actions">
                                <button onClick={() => setIsSpamModalOpen(false)}>Đóng</button>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                isReportModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsReportModalOpen(false)}>
                        <div className="modal report-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header-row">
                                <button className="modal-close-left" onClick={() => setIsReportModalOpen(false)} aria-label="Đóng">×</button>
                                <h3>Báo xấu</h3>
                            </div>
                            <div className="divider"></div>
                            <div className="report-related">
                                <div className="related-avatar">
                                    <img src={selectedChat?.avatar} alt="avatar" />
                                </div>
                                <div className="related-info">
                                    <div className="related-title">{selectedChat?.name}</div>
                                    <div className="related-sub">Cuộc trò chuyện liên quan</div>
                                </div>
                            </div>
                            <h4 className="section-title">Chọn lý do</h4>
                            <div className="report-reasons">
                                <label className="radio-row"><input type="radio" name="rp" checked={reportReason === 'Gian lận/Không trung thực'} onChange={() => setReportReason('Gian lận/Không trung thực')} /> Báo cáo trường hợp gian lận/không trung thực</label>
                                <label className="radio-row"><input type="radio" name="rp" checked={reportReason === 'Gửi tin nhắn spam'} onChange={() => setReportReason('Gửi tin nhắn spam')} /> Báo cáo trường hợp gửi tin nhắn spam</label>
                                <label className="radio-row"><input type="radio" name="rp" checked={reportReason === 'Lạm dụng chính sách/Quấy rối'} onChange={() => setReportReason('Lạm dụng chính sách/Quấy rối')} /> Báo cáo trường hợp lạm dụng/quấy rối</label>
                                <label className="radio-row"><input type="radio" name="rp" checked={reportReason === 'Hàng giả/Pin kém chất lượng nguy hiểm'} onChange={() => setReportReason('Hàng giả/Pin kém chất lượng nguy hiểm')} /> Hàng giả / Pin kém chất lượng gây nguy hiểm</label>
                                <label className="radio-row"><input type="radio" name="rp" checked={reportReason === 'Thông tin sai lệch về pin/xe'} onChange={() => setReportReason('Thông tin sai lệch về pin/xe')} /> Thông tin sai lệch về pin/xe (dung lượng, số lần sạc, tai nạn...)</label>
                                <label className="radio-row"><input type="radio" name="rp" checked={reportReason === 'Lý do khác'} onChange={() => setReportReason('Lý do khác')} /> Lý do khác</label>
                            </div>
                            <div className="report-textarea-wrap">
                                <textarea className="modal-textarea" rows={5} maxLength={500} placeholder="Mô tả chi tiết trường hợp và góp ý của bạn (tối đa 500 ký tự)" value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} />
                                <div className="char-counter">{reportDetails.length}/500</div>
                            </div>
                            <div className="report-images">
                                <div className="images-title">Hình ảnh dùng để báo cáo</div>
                                <div className="images-grid">
                                    {reportImages.map((src, idx) => (
                                        <div key={idx} className="img-thumb">
                                            <img src={src} alt={`report-${idx}`} />
                                            <button className="remove-img" onClick={() => handleRemoveReportImage(idx)}>×</button>
                                        </div>
                                    ))}
                                    {reportImages.length < 3 && (
                                        <button className="img-add" onClick={handlePickReportImage}>+
                                            <input ref={reportFileRef} type="file" accept="image/*" onChange={handleReportImageChange} style={{ display: 'none' }} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button onClick={() => setIsReportModalOpen(false)}>Hủy</button>
                                <button className="primary" onClick={handleSubmitReport} disabled={!reportReason}>Gửi báo cáo</button>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                isAutoReplyRestrictionOpen && (
                    <div className="modal-overlay" onClick={() => setIsAutoReplyRestrictionOpen(false)}>
                        <div className="modal auto-reply-restrict-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header-row">
                                <button className="modal-close-left" onClick={() => setIsAutoReplyRestrictionOpen(false)} aria-label="Đóng">×</button>
                                <h3>Cài đặt trả lời tự động</h3>
                            </div>
                            <div className="divider"></div>
                            <h4 className="section-title">Tính năng cho Người bán</h4>
                            <p className="section-subtle"><em>Vui lòng nâng cấp lên Người bán để sử dụng tính năng này.</em></p>
                        </div>
                    </div>
                )
            }
        </>
    );
}
