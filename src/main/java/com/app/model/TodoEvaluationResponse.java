package com.app.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class TodoEvaluationResponse {
	 private String evaluation;
	    private String warning;
	    private String priority;
	    private String healthImpact;
	    private String weatherSuitability;

	    private String preparationNeeded;
	    private String alternativeActivity;

	    
	   
}
