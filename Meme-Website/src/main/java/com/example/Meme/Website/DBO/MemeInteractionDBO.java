package com.example.Meme.Website.DBO;

import com.example.Meme.Website.models.ActionType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemeInteractionDBO {
    private String memeId;
    private ActionType type;
}
