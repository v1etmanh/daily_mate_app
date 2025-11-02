package com.app.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class DishRecommendationUpdateRequest {
private long dishID;
private int markFromUser;
private boolean isChossen;
private String userNote;
public boolean isChossen() {return isChossen;}
}
