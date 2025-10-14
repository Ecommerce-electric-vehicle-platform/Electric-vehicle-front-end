import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Send,
    Phone,
    Video,
    MoreVertical,
    Search,
    ArrowLeft,
    User,
    Store,
    MessageCircle
} from "lucide-react";
import "./Chat.css";

export function Chat() {
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [userRole, setUserRole] = useState('buyer'); // 'buyer' hoặc 'seller'
    const navigate = useNavigate();

    // Mock data cho danh sách chat
    const [chatList, setChatList] = useState([
        {
            id: 1,
            name: "Nguyễn Văn A",
            avatar: "/default-avatar.png",
            lastMessage: "Xe này còn không ạ?",
            time: "10:30",
            unread: 2,
            isOnline: true,
            role: "buyer"
        },
        {
            id: 2,
            name: "Cửa hàng Xe điện ABC",
            avatar: "/default-avatar.png",
            lastMessage: "Cảm ơn bạn đã quan tâm!",
            time: "09:15",
            unread: 0,
            isOnline: false,
            role: "seller"
        },
        {
            id: 3,
            name: "Trần Thị B",
            avatar: "/default-avatar.png",
            lastMessage: "Giá có thể thương lượng không?",
            time: "08:45",
            unread: 1,
            isOnline: true,
            role: "buyer"
        },
        {
            id: 4,
            name: "Shop Xe máy điện XYZ",
            avatar: "/default-avatar.png",
            lastMessage: "Sản phẩm đã được bán",
            time: "Hôm qua",
            unread: 0,
            isOnline: false,
            role: "seller"
        }
    ]);

    // Mock data cho tin nhắn
    const [messages, setMessages] = useState({
        1: [
            { id: 1, text: "Chào bạn, tôi quan tâm đến sản phẩm này", sender: "buyer", time: "10:25" },
            { id: 2, text: "Chào bạn! Sản phẩm vẫn còn hàng ạ", sender: "seller", time: "10:26" },
            { id: 3, text: "Xe này còn không ạ?", sender: "buyer", time: "10:30" }
        ],
        2: [
            { id: 1, text: "Cảm ơn bạn đã quan tâm!", sender: "seller", time: "09:15" }
        ],
        3: [
            { id: 1, text: "Giá có thể thương lượng không?", sender: "buyer", time: "08:45" }
        ],
        4: [
            { id: 1, text: "Sản phẩm đã được bán", sender: "seller", time: "Hôm qua" }
        ]
    });

    useEffect(() => {
        // Lấy thông tin user role từ localStorage hoặc API
        const role = localStorage.getItem('userRole') || 'buyer';
        setUserRole(role);
    }, []);

    const handleBackToHome = () => {
        navigate('/');
    };

    const handleChatSelect = (chat) => {
        setSelectedChat(chat);
        // Đánh dấu tin nhắn đã đọc
        setChatList(prev => prev.map(c =>
            c.id === chat.id ? { ...c, unread: 0 } : c
        ));
    };

    const handleSendMessage = () => {
        if (message.trim() && selectedChat) {
            const newMessage = {
                id: Date.now(),
                text: message,
                sender: userRole,
                time: new Date().toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };

            setMessages(prev => ({
                ...prev,
                [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage]
            }));

            // Cập nhật tin nhắn cuối trong danh sách chat
            setChatList(prev => prev.map(chat =>
                chat.id === selectedChat.id
                    ? { ...chat, lastMessage: message, time: newMessage.time }
                    : chat
            ));

            setMessage("");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const filteredChats = chatList.filter(chat =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="chat-container">
            <div className="chat-layout">
                {/* Sidebar - Danh sách chat */}
                <div className="chat-sidebar">
                    <div className="chat-sidebar-header">
                        <button className="back-btn" onClick={handleBackToHome}>
                            <ArrowLeft size={20} />
                        </button>
                        <h2>Tin nhắn</h2>
                        <button className="menu-btn">
                            <MoreVertical size={20} />
                        </button>
                    </div>

                    <div className="search-container">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm cuộc trò chuyện..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="chat-list">
                        {filteredChats.map((chat) => (
                            <div
                                key={chat.id}
                                className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                                onClick={() => handleChatSelect(chat)}
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
                                    <div className="chat-last-message-row">
                                        <p className="chat-last-message">{chat.lastMessage}</p>
                                        {chat.unread > 0 && (
                                            <span className="unread-badge">{chat.unread}</span>
                                        )}
                                    </div>
                                </div>
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
                                        <h3>{selectedChat.name}</h3>
                                        <p className="chat-status">
                                            {selectedChat.isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
                                        </p>
                                    </div>
                                </div>
                                <div className="chat-header-actions">
                                    <button className="action-btn">
                                        <Phone size={20} />
                                    </button>
                                    <button className="action-btn">
                                        <Video size={20} />
                                    </button>
                                    <button className="action-btn">
                                        <MoreVertical size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="messages-container">
                                <div className="messages">
                                    {messages[selectedChat.id]?.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`message ${msg.sender === userRole ? 'sent' : 'received'}`}
                                        >
                                            <div className="message-content">
                                                <p>{msg.text}</p>
                                                <span className="message-time">{msg.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Message Input */}
                            <div className="message-input-container">
                                <div className="message-input">
                                    <input
                                        type="text"
                                        placeholder="Nhập tin nhắn..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        className="message-text-input"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        className="send-btn"
                                        disabled={!message.trim()}
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
    );
}
