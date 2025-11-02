package com.app.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class DishEvaluateRequest {
	 private String idx;
	    private String name;
	    private String reason;
	   
	    private String cookingMethod;
	    
	    private String url;
	  
}
