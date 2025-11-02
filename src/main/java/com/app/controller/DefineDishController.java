package com.app.controller;

import org.springframework.web.bind.annotation.RestController;

import com.app.model.DishAdviceResponse;
import com.app.model.DishEvaluateRequest;
import com.app.model.DishEvaluateWrapper;
import com.app.model.DishFormRequest;
import com.app.model.DishRecommendation;
import com.app.model.DishUserRequest;
import com.app.model.RequestIngredientCondition;
import com.app.model.UserProfileDto;
import com.app.model.WeatherConditionRequest;
import com.app.service.IngredientAIService;
import com.app.service.IngredientService;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.query.Param;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;



@RestController
@RequestMapping("/getDish")
@CrossOrigin(origins = "http://localhost:3000")
public class DefineDishController {
	@Autowired
	private IngredientService ingredientService;
	@GetMapping
	private ResponseEntity<?> getDishs(@RequestParam("createDate")java.sql.Date date  ,@AuthenticationPrincipal Jwt jwt) {
		String email=jwt.getClaimAsString("email");
	List<DishAdviceResponse>l=	this.ingredientService.getDishByDate(email, date);
	
	return ResponseEntity.status(HttpStatus.OK).body(l);
	}
	@PostMapping("/defineIngredient")
	public ResponseEntity<?> defineIngredient(@RequestBody RequestIngredientCondition request) {
	  try {
		return ResponseEntity.status(HttpStatus.OK).body(ingredientService.getIngredients(request));
	} catch (Exception e) {
		// TODO Auto-generated catch block
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
	}
	}
	
@PostMapping("/defineDish")
public ResponseEntity<?> getDish(@RequestBody DishFormRequest entity) {
    //TODO: process POST request
    
    try {
    	System.out.print(entity);
		return ResponseEntity.status(HttpStatus.OK).body(this.ingredientService.getDishes(entity));
	} catch (Exception e) {
		// TODO Auto-generated catch block
		e.printStackTrace(); 
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
	}
}
@PostMapping("/evaluateByUser")
public ResponseEntity<?> postMethodName(@RequestBody DishEvaluateWrapper d, @AuthenticationPrincipal Jwt jwt ) {
	String email=jwt.getClaimAsString("email");
    //TODO: process POST request
   try {
	return ResponseEntity.status(HttpStatus.OK).body( this.ingredientService.evaluateDishes(d.dishes(),email,d.createDate(),d.users()));
} catch (Exception e) {
	// TODO Auto-generated catch block
	return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
}
   
    
}
@PostMapping("/dishforUser")
public ResponseEntity<?> defineDishByUserProfile(@RequestBody DishUserRequest dishU,@AuthenticationPrincipal Jwt jwt) throws Exception{
	  String eamail=jwt.getClaimAsString("email");
	List<DishRecommendation>ls  =this.ingredientService.defineDishByUser(eamail, dishU);
	return ResponseEntity.status(HttpStatus.OK).body(ls);
}





}
