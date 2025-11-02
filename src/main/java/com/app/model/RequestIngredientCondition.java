package com.app.model;

import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class RequestIngredientCondition {
private Location location;
private WeatherConditionRequest weather;
private Date specificDate;
}
