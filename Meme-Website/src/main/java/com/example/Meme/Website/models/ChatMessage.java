package com.example.Meme.Website.models;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "chatMessages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@CompoundIndexes({
        @CompoundIndex(name = "room_time", def = "{'chatRoomId':1,'timestamp':1}"),
        @CompoundIndex(name = "sender_time", def = "{'senderId':1,'timestamp':1}")
})
public class ChatMessage {

    @Id
    private String id;
    @Indexed
    private String chatRoomId;
    @Indexed
    private String senderId;
    private String messageText;
    private MessageType messageType;
    private String mediaUrl;
    @Indexed
    private Date timestamp;
    private Date editedAt;
    private boolean isRead;
    private boolean deleted;
    private String repliedToMessageId;
    @Indexed
    private MessageStatus status;
}
