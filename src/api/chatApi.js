import axiosInstance from "./axiosInstance";

const chatApi = {
  // Lấy danh sách tất cả cuộc trò chuyện của user hiện tại
  // GET /api/v1/chatting/conversation
  getAllConversations: async () => {
    try {
      const response = await axiosInstance.get("/api/v1/chatting/conversation");
      return response;
    } catch (error) {
      console.error("[ChatAPI] Error fetching conversations:", error);
      throw error;
    }
  },

  // Tạo cuộc trò chuyện mới với seller của một post
  // POST /api/v1/chatting/create-conversation/{postId}
  createConversation: async (postId) => {
    try {
      const response = await axiosInstance.post(
        `/api/v1/chatting/create-conversation/${postId}`
      );
      return response;
    } catch (error) {
      console.error("[ChatAPI] Error creating conversation:", error);
      throw error;
    }
  },

  // Gửi tin nhắn (text hoặc image)
  // POST /api/v1/chatting/create-message
  // multipart/form-data với: conversationId, buyerId, postId, content, picture (optional)
  sendMessage: async (conversationId, buyerId, postId, content, pictureFile = null) => {
    try {
      const formData = new FormData();
      formData.append("conversationId", conversationId);
      formData.append("buyerId", buyerId);
      formData.append("postId", postId);
      
      // Chỉ append content hoặc picture
      if (content) {
        formData.append("content", content);
      }
      
      if (pictureFile) {
        formData.append("picture", pictureFile);
      }

      const response = await axiosInstance.post(
        "/api/v1/chatting/create-message",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );
      return response;
    } catch (error) {
      console.error("[ChatAPI] Error sending message:", error);
      throw error;
    }
  },

  // Lấy tin nhắn của một conversation
  // (Tạm thời chưa có endpoint, có thể cần thêm sau)
  getMessagesByConversationId: async (conversationId) => {
    try {
      // TODO: Khi BE có endpoint này
      // const response = await axiosInstance.get(
      //   `/api/v1/chatting/conversation/${conversationId}/messages`
      // );
      console.warn("[ChatAPI] getMessagesByConversationId - Endpoint not yet implemented");
      return { data: [] };
    } catch (error) {
      console.error("[ChatAPI] Error fetching messages:", error);
      throw error;
    }
  }
};

export default chatApi;

