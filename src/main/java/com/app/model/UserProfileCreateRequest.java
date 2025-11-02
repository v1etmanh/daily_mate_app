package com.app.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileCreateRequest {
    
   
    private String name;
    
  
    private Integer age;
    
   
    private Gender gender;
    
 
    private Float heightCm;
    
  
    private Float weightKg;
    
   
    private String dietaryGoal;
    
   
    private String healthCondition;
    
   
    private String tastePreference;
}