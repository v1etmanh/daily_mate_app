package com.app.model;

import java.sql.Date;

public record DishUserRequest(
		Location location,
		Date createDate,
		WeatherConditionRequest weather,
		UserProfileDto user,
		 String mealType,
	 int numberOfDishes
		) {

}
