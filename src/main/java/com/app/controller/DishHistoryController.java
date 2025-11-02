package com.app.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app.model.DishCreate;
import com.app.model.DishRecommendation;
import com.app.model.DishRecommendationUpdateRequest;
import com.app.model.DishUpdateRequest;
import com.app.service.DishHistoryService;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;



@RestController
@RequestMapping("/history")
@CrossOrigin(origins = "http://localhost:3000")
public class DishHistoryController {
@Autowired
private DishHistoryService disSer;
@GetMapping("/getAlldishs")
public ResponseEntity<?> getMethodName(@AuthenticationPrincipal Jwt jwt) {
    String email=jwt.getClaimAsString("email");
    List<DishCreate>dishs=this.disSer.retrieveALlDish(email);
    return ResponseEntity.status(HttpStatus.OK).body(dishs);
}
@PostMapping("/update")
public ResponseEntity<?> postMethodName(@RequestBody List<DishUpdateRequest> entity) {
    //TODO: process POST request
    this.disSer.UpdateDish(entity);
    return ResponseEntity.status(HttpStatus.OK).build();
}
@GetMapping("/dishOfUser")
public ResponseEntity<?> getMethodName(@RequestParam("id")long userId,@AuthenticationPrincipal Jwt jwt) {
	String email=jwt.getClaimAsString("email");
	
    return ResponseEntity.status(HttpStatus.OK).body(this.disSer.retrieveDishRecommendationByUserId(email, userId));
}

@PostMapping("/updateDishRecommendation")
public ResponseEntity<?> updateDishRe (@RequestBody List<DishRecommendationUpdateRequest> ds) {
	
	this.disSer.updateDishRe(ds);
    return ResponseEntity.status(HttpStatus.OK).build();
    
}

}
