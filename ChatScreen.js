import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export default function ChatScreen({ route }) {
  const { user } = route.params;
  const [messages, setMessages] = useState([
    { id: '1', text: `Hey there, I'm ${user.firstName}!`, from: 'them' },
  ]);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (inputText.trim() === '') return;

    setMessages([...messages, { id: Date.now().toString(), text: inputText, from: 'me' }]);
    setInputText('');
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.from === 'me' ? styles.myMessage : styles.theirMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.name}>{user.firstName}</Text>
        <Text style={{ color: user.isOnline ? 'limegreen' : 'gray' }}>
          {user.isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 10 }}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Text style={{ color: 'white' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F3F3' },
  header: {
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#6C63FF',
    paddingHorizontal: 20,
  },
  name: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  inputBar: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopColor: '#ccc',
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    backgroundColor: 'white',
    height: 40,
  },
  sendBtn: {
    marginLeft: 10,
    backgroundColor: '#6C63FF',
    paddingHorizontal: 15,
    borderRadius: 20,
    justifyContent: 'center',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 15,
    maxWidth: '70%',
    marginBottom: 8,
  },
  myMessage: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
  },
  theirMessage: {
    backgroundColor: '#E6E6E6',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
});
