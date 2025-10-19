import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
  id: string;
  text: string;
  user: 'me' | 'other';
  timestamp: string;
}

const initialMessages: Message[] = [];

const formatDate = (date: Date) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = days[date.getDay()];
  const dayOfMonth = date.getDate();
  const month = months[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}, ${dayOfMonth} ${month} at ${hours}:${minutes}`;
};

const ChatScreen = () => {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const loadMessages = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem('chat_messages');
      if (savedMessages !== null) {
        setMessages(JSON.parse(savedMessages));
      }
    } catch (error) {
      console.error('Failed to load messages.', error);
    }
  };

  const saveMessages = async (messagesToSave: Message[]) => {
    try {
      await AsyncStorage.setItem('chat_messages', JSON.stringify(messagesToSave));
    } catch (error) {
      console.error('Failed to save messages.', error);
    }
  };

  const handleAddButtonPress = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedDateTime = `${day}.${month}.${year} ${hours}:${minutes}`;

    const newMessage: Message = {
      id: String(messages.length + 1),
      text: `Купивте билет за едно возење со цена од 40ден на ${formattedDateTime} часот.`,
      user: 'other',
      timestamp: formatDate(now),
    };
    setMessages([...messages, newMessage]);
  };

  const handleSendMessage = () => {
    if (inputText.trim() === '') {
      return;
    }

    const newMessage: Message = {
      id: String(messages.length + 1),
      text: inputText,
      user: 'me',
      timestamp: formatDate(new Date()),
    };

    setMessages([...messages, newMessage]);
    setInputText('');
  };

  const renderMessages = () => {
    let lastDate = '';
    return messages.map((message) => {
      const messageDate = message.timestamp.split(' at ')[0];
      const showDate = messageDate !== lastDate;
      lastDate = messageDate;

      return (
        <View key={message.id}>
          {showDate && (
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>{messageDate}</Text>
            </View>
          )}
          <View
            style={[
              styles.messageContainer,
              message.user === 'me'
                ? styles.myMessageContainer
                : styles.otherMessageContainer,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                message.user === 'me'
                  ? styles.myMessageBubble
                  : styles.otherMessageBubble,
              ]}
            >
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          </View>
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContentContainer}
        >
          {renderMessages()}
        </ScrollView>

        <LinearGradient
          colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.5)', 'transparent']}
          style={styles.headerGradient}
          pointerEvents="none"
        />

        <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity>
              <BlurView intensity={20} tint="dark" style={styles.headerIcon} />
            </TouchableOpacity>
          </View>
          <View style={styles.contactInfo}>
            <LinearGradient
              colors={['#6A5ACD', '#483D8B']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>J</Text>
            </LinearGradient>
            <View style={styles.nameplate}>
              <Text style={styles.contactName}>JSP</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.6)" />
            </View>
          </View>
        </View>

        <View style={[styles.inputArea, { paddingBottom: insets.bottom || 15 }]}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddButtonPress}>
            <Ionicons name="add" size={28} color="#8E8E93" />
          </TouchableOpacity>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Text Message • SMS"
              placeholderTextColor="#8E8E93"
              value={inputText}
              onChangeText={setInputText}
            />
            {inputText.length === 0 && (
              <TouchableOpacity style={styles.micButton}>
                <Ionicons name="mic" size={24} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
          {inputText.length > 0 && (
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
              <Ionicons name="arrow-up-circle" size={32} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    // backgroundColor is now handled by safeArea
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 5,
    alignItems: 'center',
    zIndex: 10,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 5,
  },
  backButton: {
    padding: 5,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  contactInfo: {
    alignItems: 'center',
    marginTop: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 'bold',
  },
  nameplate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    paddingVertical: 4.5,
    paddingLeft: 15,
    paddingRight: 5,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#333333',
    zIndex: 0,
    width: 80,
  },
  contactName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    paddingLeft: 10,
  },
  headerIcons: {
    flexDirection: 'row',
    position: 'absolute',
    top: '100%',
    transform: [{ translateY: -50 }],
    left: 0,
    right: 0,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    width: '100%',
  },
  headerIcon: {
    padding: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messagesContentContainer: {
    paddingTop: 160,
    paddingBottom: 100,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxWidth: '75%',
  },
  myMessageBubble: {
    backgroundColor: 'rgba(52, 199, 89, 0.3)',
  },
  otherMessageBubble: {
    backgroundColor: '#242426',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  inputArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  addButton: {
    marginRight: 10,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 17,
    paddingVertical: 8,
  },
  micButton: {
    paddingLeft: 10,
  },
  sendButton: {
    marginLeft: 10,
  },
});

export default ChatScreen;
