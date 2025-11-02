package com.app.model;

import java.util.List;

import org.springframework.web.bind.annotation.RequestMapping;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class EvaluateResult {
	  private String idx;
	 private String familySuitabilityLevel; // HIGH / MEDIUM / LOW
	    private String suggestionNote; // Gợi ý chỉnh món, thay thế
	    private  List<UserSuitabilityDTO> userSuitability;
}
