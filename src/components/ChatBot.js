import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ref, push, set, onValue, serverTimestamp, get } from 'firebase/database';
import { database } from '../firebase-config';
import { toast } from 'react-toastify';
import { 
  FaUserCircle, 
  FaUserMd, 
  FaPaperPlane, 
  FaRegClock, 
  FaInfoCircle, 
  FaPlus
} from 'react-icons/fa';

function ChatBot({ currentUser, setisFixed }) {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setisFixed(false);
    fetchChats();
    fetchHospitals();
  }, [currentUser]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
    }
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      
      const chatsRef = ref(database, 'MaternalHealthSystem/chats');
      onValue(chatsRef, (snapshot) => {
        if (snapshot.exists()) {
          const chatsData = snapshot.val();
          const chatsList = Object.keys(chatsData)
            .filter(chatId => {
              return (
                (chatsData[chatId].userId === currentUser.phone) || 
                (chatsData[chatId].hospitalId === currentUser.phone)
              );
            })
            .map(chatId => ({
              id: chatId,
              ...chatsData[chatId]
            }));
          
          setChats(chatsList);
          
          // Set active chat if none is selected yet
          if (chatsList.length > 0 && !activeChat) {
            setActiveChat(chatsList[0]);
          }
        } else {
          setChats([]);
        }
        setLoading(false);
      });
    } catch (error) {
      toast.error('Error fetching chats: ' + error.message);
      setLoading(false);
    }
  };

  const fetchHospitals = async () => {
    try {
      const usersRef = ref(database, 'MaternalHealthSystem/users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const hospitalsList = Object.keys(usersData)
          .filter(key => usersData[key].userType === 'hospital')
          .map(key => ({
            id: key,
            ...usersData[key]
          }));
        
        setHospitals(hospitalsList);
      }
    } catch (error) {
      toast.error('Error fetching hospitals: ' + error.message);
    }
  };

  const fetchMessages = (chatId) => {
    const messagesRef = ref(database, `MaternalHealthSystem/chatMessages/${chatId}`);
    onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const messagesList = Object.keys(messagesData).map(messageId => ({
          id: messageId,
          ...messagesData[messageId]
        })).sort((a, b) => a.timestamp - b.timestamp);
        
        setChatMessages(messagesList);
      } else {
        setChatMessages([]);
      }
    });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !activeChat) return;
    
    try {
      const messagesRef = ref(database, `MaternalHealthSystem/chatMessages/${activeChat.id}`);
      const newMessageRef = push(messagesRef);
      
      await set(newMessageRef, {
        senderId: currentUser.phone,
        text: messageInput,
        timestamp: serverTimestamp(),
        read: false
      });
      
      // Update last message in chat
      const chatRef = ref(database, `MaternalHealthSystem/chats/${activeChat.id}`);
      await set(chatRef, {
        ...activeChat,
        lastMessage: messageInput,
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSenderId: currentUser.phone
      });
      
      setMessageInput('');
    } catch (error) {
      toast.error('Error sending message: ' + error.message);
    }
  };

  const createNewChat = async () => {
    if (!selectedHospital) return;
    
    try {
      // Check if chat already exists
      const existingChat = chats.find(chat => (
        (chat.userId === currentUser.phone && chat.hospitalId === selectedHospital.id) ||
        (chat.hospitalId === currentUser.phone && chat.userId === selectedHospital.id)
      ));
      
      if (existingChat) {
        setActiveChat(existingChat);
        setShowNewChatModal(false);
        return;
      }
      
      // Create new chat
      const chatsRef = ref(database, 'MaternalHealthSystem/chats');
      const newChatRef = push(chatsRef);
      
      const newChat = {
        userId: currentUser.userType === 'user' ? currentUser.phone : selectedHospital.id,
        hospitalId: currentUser.userType === 'hospital' ? currentUser.phone : selectedHospital.id,
        userName: currentUser.userType === 'user' ? currentUser.name : selectedHospital.name,
        hospitalName: currentUser.userType === 'hospital' ? currentUser.name : selectedHospital.name,
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSenderId: ''
      };
      
      await set(newChatRef, newChat);
      
      // Add ID to newChat object
      newChat.id = newChatRef.key;
      
      setActiveChat(newChat);
      setSelectedHospital(null);
      setShowNewChatModal(false);
    } catch (error) {
      toast.error('Error creating chat: ' + error.message);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-vh-100 py-5 bg-light">
      <div className="container">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="row mb-4">
            <div className="col">
              <h2 className="mb-3 fw-bold text-primary">
                <FaUserMd className="me-2" /> Health Chat
              </h2>
              <p className="lead text-muted">
                {currentUser.userType === 'user' 
                  ? 'Chat with your healthcare providers' 
                  : 'Communicate with your patients'}
              </p>
            </div>
          </div>

          <div className="row">
            {/* Chat list */}
            <div className="col-md-4 mb-4 mb-md-0">
              <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
                <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-0">
                  <h5 className="mb-0 fw-bold">Conversations</h5>
                  <button 
                    className="btn btn-primary btn-sm rounded-circle" 
                    onClick={() => setShowNewChatModal(true)}
                    title="Start new chat"
                  >
                    <FaPlus />
                  </button>
                </div>
                <div className="card-body p-0" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                  {loading ? (
                    <div className="text-center p-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 text-muted">Loading chats...</p>
                    </div>
                  ) : chats.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {chats.map(chat => (
                        <button
                          key={chat.id}
                          className={`list-group-item list-group-item-action border-0 py-3 px-4 ${activeChat && activeChat.id === chat.id ? 'active' : ''}`}
                          onClick={() => setActiveChat(chat)}
                        >
                          <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                              {currentUser.userType === 'user' ? (
                                <FaUserMd className={`${activeChat && activeChat.id === chat.id ? 'text-white' : 'text-primary'}`} size={20} />
                              ) : (
                                <FaUserCircle className={`${activeChat && activeChat.id === chat.id ? 'text-white' : 'text-primary'}`} size={20} />
                              )}
                            </div>
                            <div className="flex-grow-1 overflow-hidden">
                              <h6 className="mb-1 fw-bold text-truncate">
                                {currentUser.userType === 'user' ? chat.hospitalName : chat.userName}
                              </h6>
                              {chat.lastMessage && (
                                <p className="mb-0 small text-truncate opacity-75">
                                  {chat.lastMessageSenderId === currentUser.phone ? 'You: ' : ''}
                                  {chat.lastMessage}
                                </p>
                              )}
                            </div>
                            {chat.lastMessageTimestamp && (
                              <div className="ms-3 text-muted small">
                                <FaRegClock size={14} className="me-1" />
                                {new Date(chat.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-muted mb-0">No conversations yet.</p>
                      <button 
                        className="btn btn-outline-primary mt-3"
                        onClick={() => setShowNewChatModal(true)}
                      >
                        <FaPlus className="me-2" /> Start a new conversation
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chat messages */}
            <div className="col-md-8">
              <div className="card border-0 shadow-sm" style={{ borderRadius: "15px", minHeight: '70vh' }}>
                {activeChat ? (
                  <>
                    <div className="card-header bg-white py-3 border-0">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                          {currentUser.userType === 'user' ? (
                            <FaUserMd className="text-primary" size={20} />
                          ) : (
                            <FaUserCircle className="text-primary" size={20} />
                          )}
                        </div>
                        <div>
                          <h5 className="mb-0 fw-bold">
                            {currentUser.userType === 'user' ? activeChat.hospitalName : activeChat.userName}
                          </h5>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className="card-body"
                      style={{ 
                        height: '55vh', 
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column' 
                      }}
                    >
                      {chatMessages.length > 0 ? (
                        <div className="mb-auto">
                          {chatMessages.map(message => (
                            <div 
                              key={message.id} 
                              className={`d-flex mb-3 ${message.senderId === currentUser.phone ? 'justify-content-end' : 'justify-content-start'}`}
                            >
                              {message.senderId !== currentUser.phone && (
                                <div className="me-2">
                                  {currentUser.userType === 'user' ? (
                                    <div className="rounded-circle bg-primary bg-opacity-10 p-2">
                                      <FaUserMd className="text-primary" size={14} />
                                    </div>
                                  ) : (
                                    <div className="rounded-circle bg-primary bg-opacity-10 p-2">
                                      <FaUserCircle className="text-primary" size={14} />
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div 
                                className={`${
                                  message.senderId === currentUser.phone 
                                    ? 'bg-primary text-white' 
                                    : 'bg-light text-dark'
                                } py-2 px-3 rounded-3 shadow-sm`}
                                style={{ maxWidth: '75%' }}
                              >
                                <p className="mb-0">{message.text}</p>
                                <small 
                                  className={`${
                                    message.senderId === currentUser.phone 
                                      ? 'text-white-50' 
                                      : 'text-muted'
                                  } d-block mt-1`}
                                >
                                  {message.timestamp ? formatTimestamp(message.timestamp) : 'Sending...'}
                                </small>
                              </div>
                              
                              {message.senderId === currentUser.phone && (
                                <div className="ms-2">
                                  <div className="rounded-circle bg-primary p-2">
                                    <FaUserCircle className="text-white" size={14} />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      ) : (
                        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center text-muted">
                          <FaInfoCircle size={48} className="mb-3 text-primary opacity-50" />
                          <h5>No messages yet</h5>
                          <p className="mb-0">Start the conversation by sending a message.</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="card-footer bg-white py-3 border-0">
                      <form onSubmit={sendMessage}>
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Type your message..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            required
                          />
                          <button
                            className="btn btn-primary"
                            type="submit"
                          >
                            <FaPaperPlane />
                          </button>
                        </div>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center text-muted p-4">
                    <FaInfoCircle size={48} className="mb-3 text-primary opacity-50" />
                    <h4>No conversation selected</h4>
                    <p>Select a conversation from the list or start a new one.</p>
                    <button 
                      className="btn btn-primary mt-2"
                      onClick={() => setShowNewChatModal(true)}
                    >
                      <FaPlus className="me-2" /> Start a new conversation
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* New Chat Modal */}
          {showNewChatModal && (
            <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow" style={{ borderRadius: "15px" }}>
                  <div className="modal-header border-0">
                    <h5 className="modal-title fw-bold">Start New Conversation</h5>
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={() => {
                        setShowNewChatModal(false);
                        setSelectedHospital(null);
                      }}
                    ></button>
                  </div>
                  <div className="modal-body">
                    {currentUser.userType === 'user' ? (
                      <>
                        <p className="text-muted mb-3">Select a healthcare provider to chat with:</p>
                        <div className="list-group">
                          {hospitals.map(hospital => (
                            <button
                              key={hospital.id}
                              className={`list-group-item list-group-item-action border-0 py-3 ${selectedHospital && selectedHospital.id === hospital.id ? 'active' : ''}`}
                              onClick={() => setSelectedHospital(hospital)}
                            >
                              <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                                  <FaUserMd className={`${selectedHospital && selectedHospital.id === hospital.id ? 'text-white' : 'text-primary'}`} size={20} />
                                </div>
                                <div>
                                  <h6 className="mb-1 fw-bold">{hospital.name || 'Unnamed Hospital'}</h6>
                                  <div className="small">
                                    <span className="me-2">Specialization: {hospital.specialization || 'General'}</span>
                                    <span>Exp: {hospital.experience || 'N/A'} years</span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      // If hospital user, they would see a list of patients to chat with
                      <p>Select patient to chat with (implementation needed)</p>
                    )}
                  </div>
                  <div className="modal-footer border-0">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => {
                        setShowNewChatModal(false);
                        setSelectedHospital(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      disabled={!selectedHospital}
                      onClick={createNewChat}
                    >
                      Start Conversation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default ChatBot;