package com.app.model;

import org.springframework.web.bind.annotation.RequestMapping;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class DishUpdateRequest {
private long dishAdviceId;
private int markFromUser;
private boolean isChossen;
private String userNote;
public boolean isChossen() {return isChossen;}
}
