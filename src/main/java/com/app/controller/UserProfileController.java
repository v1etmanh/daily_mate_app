package com.app.controller;

import com.app.model.UserProfile;
import com.app.model.UserProfileCreateRequest;
import com.app.service.UserProfileService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000" )

public class UserProfileController {

    @Autowired
    private UserProfileService userProfileService;

    @PostMapping("/profile")
    public ResponseEntity<?> createUserProfile(@RequestBody UserProfileCreateRequest request,@AuthenticationPrincipal Jwt jwt) {
       
    	try {
    		String email=jwt.getClaimAsString("email");
            UserProfile response = userProfileService.createUserProfile(request,email);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            // In chi tiết lỗi ra log/console
            e.printStackTrace(); // 👈 in ra lỗi ở backend
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi server: " + e.getMessage()); // 👈 trả về lỗi cụ thể
        }
    }
    @GetMapping("/getProfile")
    public ResponseEntity<?> getMethodName(@AuthenticationPrincipal Jwt jwt) {
        String email= jwt.getClaimAsString("email");
        return ResponseEntity.status(HttpStatus.OK).body(   this.userProfileService.retrieveAllUserProfileByEmail(email));
    }
    
}
