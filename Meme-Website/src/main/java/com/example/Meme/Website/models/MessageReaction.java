package com.example.Meme.Website.models;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "messageReactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageReaction {
    @Id
    private String id;
    @Indexed
    private String messageId;
    @Indexed
    private String userId;
    @Indexed
    private String reactionType;
    private Date timestamp;
}
