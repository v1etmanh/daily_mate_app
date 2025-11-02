package com.app.model;

public record UserProfileDto (
		    long id,
		     String name,
		     String gender,
		     int age,
			  double	  bmi,
				String  bmiCategory,
				double  weightKg,
				double  targetWeight,
				double  bmr,
				 double  tdee,
				 String  recommendedActivities,
				 String  warnings,
				 String tastePreference,
				 String healthCondition,
				 String dietAdvice
				 ,String allergies,
		      String dislikedIngredients
				 
				
	    )
{}
