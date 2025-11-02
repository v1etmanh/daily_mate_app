package com.app.model;

import lombok.Data;

@Data
public class HealthAdviceResponse {
    private String healthDescription;
    private String recommendedActivities;
    private String warnings;
    private String dietAdvice;
    private Float targetWeight;
}