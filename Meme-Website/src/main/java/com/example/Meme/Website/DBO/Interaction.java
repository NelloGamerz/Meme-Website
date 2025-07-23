package com.example.Meme.Website.DBO;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Interaction {
    private String postID;
    private String type;
    private List<String> tags;
}
