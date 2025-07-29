package com.example.Meme.Website.services;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.Meme.Website.dto.PresignResponse;

import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Service
public class S3PresignService {
    
    @Autowired
    private S3Presigner s3Presigner;

    // @Value("${aws.credentials.access-key}")
    // private String accessKey;
    // @Value("${aws.credentials.secret-key}")
    // private String secretKey;
    @Value("${aws.region}")
    private String region;
    @Value("${aws.s3.bucket}")
    private String bucket;

    public PresignResponse generatePresignedUrl(String filename, String folder, String userId, boolean includeMetadata){
        String uniqueFilename = System.currentTimeMillis() + "_" + filename;
        String objectKey = folder + "/" + (userId != null ? userId + "_" : "") + uniqueFilename;

        PutObjectRequest objectRequest = PutObjectRequest.builder()
            .bucket(bucket)
            .key(objectKey)
            .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
            .signatureDuration(Duration.ofMinutes(10))
            .putObjectRequest(objectRequest)
            .build();

        PresignedPutObjectRequest presignerRequest = s3Presigner.presignPutObject(presignRequest);

        if (includeMetadata) {
            String publicUrl = "https://" + bucket + ".s3." + region + ".amazonaws.com/" + objectKey;
            return new PresignResponse(presignerRequest.url().toString(), publicUrl, objectKey);
        }

        return new PresignResponse(presignerRequest.url().toString(), null, null);
    }
}
