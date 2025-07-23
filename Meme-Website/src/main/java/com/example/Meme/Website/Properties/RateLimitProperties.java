package com.example.Meme.Website.Properties;

import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "rate-limiting")
public class RateLimitProperties {
    private Map<String, Map<String, Limit>> limits;

    public Map<String, Map<String, Limit>> getLimits() {
        return limits;
    }

    public void setLimits(Map<String, Map<String, Limit>> limits) {
        this.limits = limits;
    }

    public static class Limit {
        private int maxTokens;
        private int refillRatePerSec;

        public int getMaxTokens() {
            return maxTokens;
        }

        public void setMaxTokens(int maxTokens) {
            this.maxTokens = maxTokens;
        }

        public int getRefillRatePerSec() {
            return refillRatePerSec;
        }

        public void setRefillRatePerSec(int refillRatePerSec) {
            this.refillRatePerSec = refillRatePerSec;
        }
    }
}
