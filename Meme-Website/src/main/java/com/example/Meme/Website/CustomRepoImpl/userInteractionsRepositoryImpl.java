package com.example.Meme.Website.CustomRepoImpl;

import java.util.Collection;
import java.util.List;

import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import com.example.Meme.Website.DBO.MemeInteractionDBO;
import com.example.Meme.Website.models.ActionType;

@Repository
public class userInteractionsRepositoryImpl implements CustomUserInteractionRepository {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Override
    public Slice<MemeInteractionDBO> findUserInteractionMemeIdsByType(String userId, Collection<String> memeIds,
            Collection<ActionType> types, Pageable pageable) {
        Query query = new Query();
        query.addCriteria(Criteria.where("userId").is(userId));
        query.addCriteria(Criteria.where("memeId").in(memeIds));

        if (types != null && !types.isEmpty()) {
            query.addCriteria(Criteria.where("type").in(types));
        }

        query.fields().include("memeId").include("type");

        query.withHint(new Document("userId", 1).append("memeId", 1).append("type", 1));

        query.with(Sort.by(Sort.Direction.DESC, "timestamp"));

        query.with(pageable);

        System.out.println("🛠️  Query: " + query);
        System.out.println("📄 Collection: userInteractions");

        List<MemeInteractionDBO> results = mongoTemplate.find(query, MemeInteractionDBO.class, "userInteractions");

        System.out.println("✅ Fetched Interactions: ");
        for (MemeInteractionDBO result : results) {
            System.out.println("👉 MemeId: " + result.getMemeId() + " | Type: " + result.getType());
        }

        boolean hasNext = results.size() == pageable.getPageSize();

        return new SliceImpl<>(results, pageable, hasNext);
    }

}
