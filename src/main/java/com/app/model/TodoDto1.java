package com.app.model;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class TodoDto1 {
    private long todoId;
    private String description;
    private LocalDateTime timeStart;
    private double estimateTime;
    private String location;

    private Long userId; // thay vì UserProfile userProfile

    private String evaluation;
    private String warning;

    private String priority;
    private String healthImpact;
    private String weatherSuitability;

    private String preparationNeeded;
    private String alternativeActivity;
}