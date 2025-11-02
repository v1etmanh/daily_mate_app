package com.app.model;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class DishFormRequest {
private WeatherConditionRequest weather;
private List<IngredientResponse>ingredients;
private Location location;
}
