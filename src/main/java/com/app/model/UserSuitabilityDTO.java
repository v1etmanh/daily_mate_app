package com.app.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

@Data
@RequiredArgsConstructor
@AllArgsConstructor


public class UserSuitabilityDTO {
    private String userName;
    private String suitability;
    private int score;
    private String shortNote;
}
