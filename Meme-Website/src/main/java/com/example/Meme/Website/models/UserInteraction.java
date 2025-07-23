package com.example.Meme.Website.models;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "userInteractions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@CompoundIndexes({
    @CompoundIndex(name = "user_type_idx", def = "{'UserId': 1, 'type': 1}"),
    @CompoundIndex(name = "meme_type_idx", def = "{'memeId': 1, 'type': 1}"),
    @CompoundIndex(name = "user_meme_type_idx", def = "{'UserId': 1, 'memeId': 1, 'type': 1}", unique = true)
})
public class UserInteraction {
    @Id
    private String id;

    private String userId;
    private String memeId;
    private ActionType type;
    private Date timestamp;
}
