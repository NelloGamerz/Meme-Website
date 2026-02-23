package com.example.Meme.Website.models;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document("chatRoomMembers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@CompoundIndex(name = "room_user", def = "{'chatRoomId':1,'userId':1}", unique = true)
public class ChatRoomMembership {
    @Id
    private String id;
    @Indexed
    private String chatRoomId;
    @Indexed
    private String userId;
    private boolean admin;
    private Date joinedAt;
    private Date lastDeliveredAt;
    private Date lastReadAt;
    private boolean muted;
}
