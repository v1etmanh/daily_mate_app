package com.app.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app.model.Customer;
import com.app.model.HealthAssessmentResponse;
import com.app.model.UserProfile;
import com.app.repository.CustomerRepository;
import com.app.service.HealthAssessmentService;

import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/disease")
public class EvaluateDiseaseController {
	@Autowired
private HealthAssessmentService  healthSer;
	
	@Autowired
	private CustomerRepository cusRe;
	@GetMapping("/define")
	public ResponseEntity<?> define(
	    @AuthenticationPrincipal Jwt jwt,
	    @RequestParam("bodyPart") String bodyPart,
	    @RequestParam("symptom") String symptom,
	    @RequestParam("id") long id) {

	    String email = jwt.getClaimAsString("email");
	    Customer cus = this.cusRe.findCustomerByEmail(email);

	    // Tìm user profile theo id
	    UserProfile u = cus.getUserProfiles().stream()
	        .filter(row -> row.getUserId() == id)  // nếu userId là Long thì nên dùng .equals(id)
	        .findFirst()
	        .orElse(null);

	    if (u == null) {
	        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("UserProfile not found");
	    }

	    // Gọi service để đánh giá sức khỏe
	    return ResponseEntity.ok(this.healthSer.createHealthAssessment(id, bodyPart, symptom));
	}

	
/*private String bodyPart;                        // Vị trí bị đau
private String symptomDescription;*/
	
}
